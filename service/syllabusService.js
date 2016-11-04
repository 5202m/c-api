var chatSyllabus = require('../models/chatSyllabus');//引入chatSyllabus数据模型
var chatSyllabusHis = require('../models/chatSyllabusHis');//引入chatSyllabusHis数据模型
var boUser = require('../models/boUser');//引入boUser数据模型
var logger=require('../resources/logConf').getLogger('syllabusService');//引入log4js
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var Utils = require('../util/Utils'); 	 	            //引入工具类js
var Common = require('../util/common'); 	 	            //引入公共工具类js
var ApiResult = require('../util/ApiResult');
var errorMessage = require('../util/errorMessage.js');
var ObjectId = require('mongoose').Types.ObjectId;

/**
 * 课程安排服务类
 * 备注：查询各聊天室的课程安排
 * author Dick.guo
 */
var syllabusService = {

    /**
     * 查询聊天室课程安排(一周完整课表安排)
     * @param groupType
     * @param groupId
     * @param today
     * @param callback
     */
    getSyllabus : function(groupType, groupId, today, callback){
        groupId = groupId || "";
        APIUtil.DBFindOne(chatSyllabus, {
            query : {
                groupType : groupType,
                groupId : groupId,
                isDeleted : 0,
                publishStart : {$lte : today},
                publishEnd : {$gt : today}
            }
        }, function(err, row){
            if(err){
                logger.error("查询聊天室课程安排失败!", err);
                callback(ApiResult.result("查询聊天室课程安排失败!", null));
                return;
            }
            callback(ApiResult.result(null, !row ? null : row.courses));
        });
    },
    /**
     * 查询聊天室课程安排(指定日期课程安排)
     * @param groupType
     * @param groupId
     * @param today
     * @param single
     * @param callback
     */
    getCourse : function(groupType, groupId, today, flag, callback){
        groupId = groupId || "";
        APIUtil.DBFind(chatSyllabus, {
            query : {
                groupType : groupType,
                groupId : groupId,
                isDeleted : 0,
                //publishStart : {$lte : today},
                publishEnd : {$gt : today}
            },
            sortAsc : ["publishStart"]
        }, function(err, rows){
            if(err){
                logger.error("查询聊天室课程安排失败!", err);
                callback(ApiResult.result("查询聊天室课程安排失败!", null));
                return;
            }
            var loc_result = [];
            var rowTmp = rows ? rows[0] : null;
            if(rowTmp){
                var loc_courses = JSON.parse(rowTmp.courses);
                var loc_day = today.getDay();
                if(flag=='S'){//获取下次课程安排
                    loc_result = syllabusService.getCourseSingle(loc_courses, rowTmp.publishEnd, today, false);
                    if((!loc_result || loc_result.length == 0) && rows.length > 1){
                        rowTmp = rows[1];
                        loc_courses = JSON.parse(rowTmp.courses);
                        loc_result = syllabusService.getCourseSingle(loc_courses, rowTmp.publishEnd, rowTmp.publishStart, true);
                    }
                    //补充课程表信息（分析师头像）
                    syllabusService.fillLecturerInfo(loc_result, function(courseArr){
                        callback(ApiResult.result(null, courseArr));
                    });
                    return;
                }else if(flag=='D'){
                    if(rowTmp.publishStart.getTime() <= today.getTime()){//获取全天课程安排
                        loc_result = syllabusService.getCourseByDay(loc_courses, today);
                    }
                }else if(flag=='W'){
                    loc_result = syllabusService.getCourseByWeek(rowTmp, loc_courses);
                }
            }
            callback(ApiResult.result(null, loc_result));
        });
    },
    /**
     * 按照星期获取全天课程安排
     * @param coursesObj
     * @param today
     * @returns {Array}
     */
    getCourseByDay : function(coursesObj, today){
        var day = today.getDay();
        var loc_result = [];
        var loc_dayIndex = -1;
        if(coursesObj && coursesObj.days){
            for(var i in coursesObj.days){
                if(coursesObj.days[i].day == day){
                    if(coursesObj.days[i].status == 1){
                        loc_dayIndex = i;
                    }
                    break;
                }
            }
            if(loc_dayIndex != -1 && coursesObj.timeBuckets){
                var loc_timeBucket, loc_course;
                var currTime = Utils.dateFormat(today, 'hh:mm');
                var loc_courseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                loc_courseDate = loc_courseDate.getTime() + (day - today.getDay()) * 86400000;

                for(var i in coursesObj.timeBuckets){
                    loc_timeBucket = coursesObj.timeBuckets[i];
                    loc_course = loc_timeBucket.course[loc_dayIndex];
                    if(loc_course.status == 1
                        && loc_course.lecturer
                        && loc_course.courseType != 2){
                        loc_result.push({
                            date : loc_courseDate,
                            flag : currTime < loc_timeBucket.startTime ? 1 : (currTime >= loc_timeBucket.endTime ? -1 : 0),
                            startTime : loc_timeBucket.startTime,
                            endTime : loc_timeBucket.endTime,
                            lecturer : loc_course.lecturer,
                            lecturerId : loc_course.lecturerId,
                            courseType : loc_course.courseType,
                            title : loc_course.title
                        });
                    }
                }
            }
        }
        return loc_dayIndex == -1 ? [] : loc_result;
    },

    /**
     * 按照星期获取全周课程安排 不包含课程说明
     * @param syllabusObj
     * @param coursesObj
     * @returns {*}
     */
    getCourseByWeek:function(syllabusObj, coursesObj){
        if(!coursesObj || !syllabusObj){
            return null;
        }
        var tmArr=coursesObj.timeBuckets,courseTmp;
        for(var i in tmArr){
            courseTmp=tmArr[i].course;
            for(var k in courseTmp){
                delete courseTmp[k].context;
            }
        }
        return {
            groupType : syllabusObj.groupType,
            groupId : syllabusObj.groupId,
            courses : JSON.stringify(coursesObj),
            publishStart : syllabusObj.publishStart.getTime(),
            publishEnd : syllabusObj.publishEnd.getTime()
        };
    },

    /**
     * 提取下节课课程数据
     * @param coursesObj 课程表数据
     * @param publishEnd 发布结束时间
     * @param currDate   当前日期
     * @param isNext     是否下次课程
     * @returns {*}
     */
    getCourseSingle:function(coursesObj, publishEnd, currDate, isNext){
        if(!coursesObj||!coursesObj.days||!coursesObj.timeBuckets){
            return [];
        }
        var days=coursesObj.days,timeBuckets=coursesObj.timeBuckets;
        var currDay = (currDate.getDay() + 6) % 7;
        var currTime = Utils.dateFormat(currDate, 'hh:mm');
        var tmBk=null;
        var courseObj=null;
        var i = 0, k = 0, tmpDay = 0;
        for(i = 0; i < days.length; i++){
            if(days[i].status==0){
                continue;
            }
            tmpDay = (days[i].day + 6) % 7;
            if(tmpDay > currDay){
                for(k in timeBuckets){
                    tmBk=timeBuckets[k];
                    courseObj=syllabusService.getCourseObj(coursesObj, i, k, currDate, true);
                    if(courseObj){
                        return [courseObj];
                    }
                }
            }else if(tmpDay == currDay){
                for(k in timeBuckets){
                    tmBk=timeBuckets[k];
                    if(tmBk.endTime <= currTime){
                        continue;
                    }else if(tmBk.startTime<=currTime && tmBk.endTime>currTime){
                        courseObj = syllabusService.getCourseObj(coursesObj, i, k, currDate, isNext || false);
                    }else{ //tmBk.startTime>currTime
                        courseObj = syllabusService.getCourseObj(coursesObj, i, k, currDate, true);
                    }
                    if(courseObj){
                        return [courseObj];
                    }
                }
            }
        }
        //课程安排跨周，返回首次课程
        for(i=0; i < days.length; i++){
            if(days[i].status==0){
                continue;
            }
            tmpDay = (days[i].day + 6) % 7;
            for(k in timeBuckets){
                tmBk=timeBuckets[k];
                courseObj = syllabusService.getCourseObj(coursesObj, i, k, currDate, true);
                if(courseObj){
                    if(!publishEnd || publishEnd.getTime() >= courseObj.date){
                        return [courseObj];
                    }else{
                        return [];
                    }
                }
            }
        }
        return [];
    },

    /**
     * 提取课程对象
     * @param coursesObj 课程表对象
     * @param dayIndex   星期索引
     * @param timeIndex  时间段索引
     * @param currDate   当前时间
     * @param isNext   是否下次课程
     * @returns {*}
     */
    getCourseObj : function(coursesObj, dayIndex, timeIndex, currDate, isNext){
        var tmBkTmp = coursesObj.timeBuckets[timeIndex];
        var courseTmp = tmBkTmp.course;
        if(courseTmp && courseTmp.length>dayIndex){
            var course = courseTmp[dayIndex];
            if(syllabusService.isValidCourse(course)){
                var loc_day = (coursesObj.days[dayIndex].day + 6) % 7;
                var loc_currDay = (currDate.getDay() + 6) % 7;
                if(loc_day < loc_currDay){
                    loc_day = loc_day + 7;
                }
                delete course["status"];
                var loc_courseDate = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate());
                course.date = loc_courseDate.getTime() + (loc_day - loc_currDay) * 86400000;
                course.startTime = tmBkTmp.startTime;
                course.endTime = tmBkTmp.endTime;
                course.isNext = isNext;
                return course;
            }else{
                return null;
            }
        }else{
            return null;
        }
    },
    /**
     * 判断是都有效的课程
     * @param course
     */
    isValidCourse : function(course){
        return course
            && course.status!=0
            && !Common.isBlank(course.lecturerId)
            && course.courseType != 2;
    },
    /**
     * 填充讲师信息（只针对单一课程填充）
     * @param courseArr
     */
    fillLecturerInfo : function(courseArr, callback){
        if(!courseArr || courseArr.length != 1 || !courseArr[0].lecturerId){
            callback(courseArr);
            return;
        }
        var userNoArr = courseArr[0].lecturerId.split(",");
        boUser.find({
            'userNo':{$in : userNoArr},
            'status':0,
            'valid':1
        }, "_id userNo userName avatar" , function(err, rows){
            if(err || !rows || rows.length == 0){
                courseArr[0].avatar = "";
                callback(courseArr);
                return;
            }
            var lecturerMap = {}, row, i, lenI;
            for(i = 0,lenI = rows.length; i < lenI; i++){
                row = rows[i];
                lecturerMap[row.userNo] = row.toObject();
            }
            var avatarArr = [];
            for(i = 0,lenI = userNoArr.length; i < lenI; i++){
                row = lecturerMap[userNoArr[i]];
                avatarArr.push((row && row.avatar) ? row.avatar : "");
            }
            courseArr[0].avatar = avatarArr.join(",");
            callback(courseArr);
        });
    },

    /**
     * 备份课程表
     * @param date
     * @param callback
     */
    bakSyllabus : function(date, callback){
        APIUtil.DBFind(chatSyllabus, {
            query : {
                isDeleted : 0,
                publishStart : {$lte : date},
                publishEnd : {$gt : date}
            },
            sortAsc : ["publishStart"]
        }, function(err, rows){
            if(err){
                logger.error("查询聊天室课程安排失败!", err);
                callback(false);
                return;
            }
            var loc_courseHis = [], loc_groupMap = {};
            var row = null;
            if(rows){
                for(var i = 0, lenI = rows.length; i < lenI; i++){
                    row = rows[i];
                    if(loc_groupMap.hasOwnProperty(row.groupId)){
                        continue;
                    }
                    loc_groupMap[row.groupId] = 1;
                    loc_courseHis = loc_courseHis.concat(syllabusService.convertSyllabus2His(row, date));
                }
            }
            syllabusService.saveSyllabusHis(loc_courseHis, date, function(isOK){
                callback(isOK);
            });
        });
    },

    /**
     * 将课程表对象转化为课程历史记录（数组）
     * @param syllabus
     * @param date
     */
    convertSyllabus2His : function(syllabus, date){
        var result = [];
        if(!syllabus || !syllabus.courses){
            return result;
        }
        var loc_dayIndex = -1;
        var day = date.getDay();
        var loc_courseObj = JSON.parse(syllabus.courses);
        if(loc_courseObj && loc_courseObj.days){
            for(var i in loc_courseObj.days){
                if(loc_courseObj.days[i].day == day){
                    if(loc_courseObj.days[i].status == 1){
                        loc_dayIndex = i;
                    }
                    break;
                }
            }
            if(loc_dayIndex != -1 && loc_courseObj.timeBuckets){
                var loc_timeBucket, loc_course;
                for(var i in loc_courseObj.timeBuckets){
                    loc_timeBucket = loc_courseObj.timeBuckets[i];
                    loc_course = loc_timeBucket.course[loc_dayIndex];
                    if(loc_course.status == 1
                        && loc_course.lecturer){
                        result.push({
                            _id : new ObjectId(),
                            groupType : syllabus.groupType,
                            groupId : syllabus.groupId,
                            date : date,
                            startTime : loc_timeBucket.startTime,
                            endTime : loc_timeBucket.endTime,
                            courseType : loc_course.courseType,
                            lecturerId : loc_course.lecturerId,
                            lecturer : loc_course.lecturer,
                            title : loc_course.title,
                            context : loc_course.context,
                            updateDate : new Date()
                        });
                    }
                }
            }
        }
        return result;
    },

    /**
     * 保存课程表历史
     * @param courses
     * @param date
     * @param callback
     */
    saveSyllabusHis : function(courses, date, callback){
        chatSyllabusHis.remove({date : date}, function(err){
            if(err){
                logger.error("删除课程表历史失败!", err);
                callback(false);
                return;
            }
            chatSyllabusHis.create(courses, function(err){
                if(err){
                    logger.error("保存课程表历史失败!", err);
                    callback(false);
                    return;
                }
                callback(true);
            });
        });
    },

    /**
     * 提取即将开始的课程（10分钟内开始的课程信息）
     * @param startTime
     * @param endTime
     * @param callback
     */
    getSyllabusPlan : function(startTime, endTime, callback){
        APIUtil.DBFind(chatSyllabus, {
            query : {
                isDeleted : 0,
                publishStart : {$lte : endTime},
                publishEnd : {$gt : endTime}
            },
            sortAsc : ["publishStart"]
        }, function(err, rows){
            if(err){
                logger.error("查询聊天室课程安排失败!", err);
                callback([]);
                return;
            }
            var loc_result = [], loc_course = null, loc_groupMap = {};
            var row = null;
            if(rows){
                for(var i = 0, lenI = rows.length; i < lenI; i++){
                    row = rows[i];
                    if(loc_groupMap.hasOwnProperty(row.groupId)){
                        continue;
                    }
                    loc_groupMap[row.groupId] = 1;
                    loc_course = syllabusService.convertSyllabus2Plan(row, startTime, endTime);
                    if(loc_course != null){
                        loc_result.push(loc_course);
                    }
                }
            }
            callback(loc_result);
        });
    },

    /**
     * 按时间区间提取即将开始的课程信息
     * @param syllabus
     * @param start
     * @param end
     */
    convertSyllabus2Plan : function(syllabus, start, end){
        var result = null;
        if(!syllabus || !syllabus.courses){
            return result;
        }
        var loc_dayIndex = -1;
        var day = end.getDay();
        var startTime = null, endTime = Utils.dateFormat(end, 'hh:mm');
        if(start.getDay() != day){//跨天
            startTime = "00:00";
        }else{
            startTime = Utils.dateFormat(start, 'hh:mm');
        }
        var loc_courseObj = JSON.parse(syllabus.courses);
        if(loc_courseObj && loc_courseObj.days){
            for(var i in loc_courseObj.days){
                if(loc_courseObj.days[i].day == day){
                    if(loc_courseObj.days[i].status == 1){
                        loc_dayIndex = i;
                    }
                    break;
                }
            }
            if(loc_dayIndex != -1 && loc_courseObj.timeBuckets){
                var loc_timeBucket, loc_course;
                for(var i in loc_courseObj.timeBuckets){
                    loc_timeBucket = loc_courseObj.timeBuckets[i];
                    loc_course = loc_timeBucket.course[loc_dayIndex];
                    if(loc_course.status == 1
                        && loc_course.lecturer
                        && loc_timeBucket.startTime >= startTime
                        && loc_timeBucket.startTime < endTime){
                        result={
                            groupType : syllabus.groupType,
                            groupId : syllabus.groupId,
                            date : new Date(end.getFullYear(), end.getMonth(), end.getDate()),
                            startTime : loc_timeBucket.startTime,
                            endTime : loc_timeBucket.endTime,
                            courseType : loc_course.courseType,
                            lecturerId : loc_course.lecturerId,
                            lecturer : loc_course.lecturer,
                            title : loc_course.title,
                            context : loc_course.context
                        };
                        break;
                    }
                }
            }
        }
        return result;
    },

    /**
     * 按照分析师编号，提取下此课程信息
     * @param date
     * @param groupType
     * @param groupId
     * @param lecturerIds
     * @param callback
     */
    getNextCources : function(date, groupType, groupId, lecturerIds, callback){
        APIUtil.DBFind(chatSyllabus, {
            query : {
                groupType : groupType,
                groupId : groupId,
                isDeleted : 0,
                publishStart : {$lte : date},
                publishEnd : {$gt : date}
            },
            sortAsc : ["publishStart"]
        }, function(err, rows){
            if(err){
                logger.error("getNextCources<<查询聊天室课程安排失败!", err);
                callback(ApiResult.result("getNextCources<<查询聊天室课程安排失败!", null));
                return;
            }
            if(!rows || rows.length == 0){
                callback(ApiResult.result(null, []));
                return;
            }
            var row = rows[0];

            callback(ApiResult.result(null, !row ? null : row.courses));
        });
    }
};
//导出服务类
module.exports =syllabusService;

