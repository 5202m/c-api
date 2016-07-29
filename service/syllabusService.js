var chatSyllabus = require('../models/chatSyllabus');//引入chatSyllabus数据模型
var boUser = require('../models/boUser');//引入boUser数据模型
var logger=require('../resources/logConf').getLogger('syllabusService');//引入log4js
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var Utils = require('../util/Utils'); 	 	            //引入工具类js
var Common = require('../util/common'); 	 	            //引入公共工具类js
var ApiResult = require('../util/ApiResult');
var errorMessage = require('../util/errorMessage.js');

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
     * 移除课程内容
     * @param coursesObj
     */
    removeContext:function(coursesObj){
        if(!coursesObj){
            return;
        }
        var tmArr=coursesObj.timeBuckets,courseTmp=null;
        for(var i in tmArr){
            courseTmp=tmArr[i].course;
            for(var k in courseTmp){
                delete courseTmp[k].context;
            }
        }
        return coursesObj;
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
                        loc_result = syllabusService.getCourseByDay(loc_courses, loc_day);
                    }
                }else if(flag=='W'){
                    loc_result=loc_courses;
                    syllabusService.removeContext(loc_result);
                }
            }
            callback(ApiResult.result(null, loc_result));
        });
    },
    /**
     * 按照星期获取全天课程安排
     * @param coursesObj
     * @param day
     * @returns {Array}
     */
    getCourseByDay : function(coursesObj, day){
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
                var loc_timeBucket;
                for(var i in coursesObj.timeBuckets){
                    loc_timeBucket = coursesObj.timeBuckets[i];
                    if(loc_timeBucket.course[loc_dayIndex].status == 1
                        && loc_timeBucket.course[loc_dayIndex].lecturer
                        && loc_timeBucket.course[loc_dayIndex].courseType != 2){
                        loc_result.push({
                            startTime : loc_timeBucket.startTime,
                            endTime : loc_timeBucket.endTime,
                            lecturer : loc_timeBucket.course[loc_dayIndex].lecturer,
                            title : loc_timeBucket.course[loc_dayIndex].title
                        });
                    }
                }
            }
        }
        return loc_dayIndex == -1 ? [] : loc_result;
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
    }
};
//导出服务类
module.exports =syllabusService;

