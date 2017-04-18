var chatSyllabus = require('../models/chatSyllabus'); //引入chatSyllabus数据模型
var chatGroup = require('../models/chatGroup'); //引入chatGroup数据模型
var chatSyllabusHis = require('../models/chatSyllabusHis'); //引入chatSyllabusHis数据模型
var boUser = require('../models/boUser'); //引入boUser数据模型
var ArticleService = require('../service/articleService'); //引入ArticleService服务类
var userService = require('../service/userService');
var chatPraiseService = require('../service/chatPraiseService');
var constant = require('../constant/constant');
var logger = require('../resources/logConf').getLogger('syllabusService'); //引入log4js
var APIUtil = require('../util/APIUtil'); //引入API工具类js
var Utils = require('../util/Utils'); //引入工具类js
var Common = require('../util/common'); //引入公共工具类js
var ApiResult = require('../util/ApiResult');
var errorMessage = require('../util/errorMessage.js');
var ObjectId = require('mongoose').Types.ObjectId;
var Async = require('async'); //引入async

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
    getSyllabus: function(groupType, groupId, callback) {
        groupId = groupId || "";
        let today = new Date();
        APIUtil.DBFindOne(chatSyllabus, {
            query: {
                groupType: groupType,
                groupId: groupId,
                isDeleted: 0,
                publishStart: { $lte: today },
                publishEnd: { $gt: today }
            }
        }, function(err, row) {
            if (err) {
                logger.error("查询聊天室课程安排失败!", err);
                callback(ApiResult.result("查询聊天室课程安排失败!", null));
                return;
            }
            callback(ApiResult.result(null, !row ? null : row.courses));
        });
    },
    /**
     * 通过参数提取课程信息,包括课程分析师的个人信息
     * @param params
     */
    getCourseInfo: function(params, outCallback) {
        var result = { remark: '', authors: [] };
        Async.parallel({
                courseRemark: function(callback) {
                    syllabusService.getSyllabus(params.groupType, params.groupId, function(rows) {
                        var remark = '';
                        if (rows) {
                            var courses = rows.courses;
                            if (courses) {
                                courses = JSON.parse(courses);
                                var days = courses.days,
                                    tmArr = courses.timeBuckets,
                                    tmObj = null;
                                for (var i in days) {
                                    if (days[i].day == params.day) {
                                        for (var k in tmArr) {
                                            tmObj = tmArr[k];
                                            if (tmObj.startTime == params.startTime && tmObj.endTime == params.endTime) {
                                                remark = tmObj.course[i].context;
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        callback(null, remark);
                    });
                },
                courseAuthors: function(callback) {
                    userService.getUserList(params.authorId, function(rows) {
                        callback(null, rows);
                    });
                },
                getPraise: function(callback) {
                    chatPraiseService.getPraiseNum(params.authorId, constant.chatPraiseType.user, params.groupType, function(rows) {
                        callback(null, rows);
                    });
                }
            },
            function(err, datas) {
                if (!err) {
                    result.remark = datas.courseRemark;
                    var crs = datas.courseAuthors;
                    var pre = datas.getPraise;
                    var crow = null,
                        praiseNum = 0;
                    if (crs) {
                        for (var i in crs) {
                            crow = crs[i];
                            if (pre) {
                                for (var k in pre) {
                                    if (pre[k].praiseId == crow.userNo) {
                                        praiseNum = pre[k].praiseNum;
                                        break;
                                    }
                                }
                            }
                            result.authors.push({ userId: crow.userNo, name: crow.userName, position: crow.position, avatar: crow.avatar, praiseNum: praiseNum });
                        }
                    }
                }
                outCallback(result);
            });
    },
    /**
     * 查询聊天室课程安排(指定日期课程安排)
     * @param groupType
     * @param groupId
     * @param today
     * @param flag
     * @param strategy
     * @param callback
     */
    getCourse: function(groupType, groupId, today, flag, strategy, callback) {
        groupId = groupId || "";
        APIUtil.DBFind(chatSyllabus, {
            query: {
                groupType: groupType,
                groupId: groupId,
                isDeleted: 0,
                //publishStart : {$lte : today},
                publishEnd: { $gt: today }
            },
            sortAsc: ["publishStart"]
        }, function(err, rows) {
            if (err) {
                logger.error("查询聊天室课程安排失败!", err);
                callback(ApiResult.result("查询聊天室课程安排失败!", null));
                return;
            }
            var loc_result = [];
            if (rows && rows.length > 0) {
                if (flag == 'S' || flag == 'SN') { //获取一次课程安排
                    var index = 0;
                    var isNext = false;
                    var loc_courses = null;
                    var rowTmp = null;
                    while ((!loc_result || loc_result.length == 0) && rows.length > index) {
                        rowTmp = rows[index];
                        loc_courses = JSON.parse(rowTmp.courses);
                        isNext = rowTmp.publishStart > today;
                        loc_result = syllabusService.getCourseSingle(loc_courses, rowTmp.publishEnd, isNext ? rowTmp.publishStart : today, isNext, flag == 'SN');
                        index++;
                    }
                    //补充课程表信息（分析师头像）
                    syllabusService.fillLecturerInfo(loc_result, function(courseArr) {
                        if (strategy) {
                            syllabusService.fillArticleIfo(groupId, courseArr, function(courseArr) {
                                callback(ApiResult.result(null, courseArr));
                            });
                        } else {
                            callback(ApiResult.result(null, courseArr));
                        }
                    });
                    return;
                } else if (rows[0].publishStart <= today) {
                    var loc_courses = JSON.parse(rows[0].courses);
                    if (flag == 'D') {
                        loc_result = syllabusService.getCourseByDay(loc_courses, today);
                    } else if (flag == 'W') {
                        loc_result = syllabusService.getCourseByWeek(rows[0], loc_courses);
                    }
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
    getCourseByDay: function(coursesObj, today) {
        var day = today.getDay();
        var loc_result = [];
        var loc_dayIndex = -1;
        if (coursesObj && coursesObj.days) {
            for (var i in coursesObj.days) {
                if (coursesObj.days[i].day == day) {
                    if (coursesObj.days[i].status == 1) {
                        loc_dayIndex = i;
                    }
                    break;
                }
            }
            if (loc_dayIndex != -1 && coursesObj.timeBuckets) {
                var loc_timeBucket, loc_course;
                var currTime = Utils.dateFormat(today, 'hh:mm');
                var loc_courseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                loc_courseDate = loc_courseDate.getTime() + (day - today.getDay()) * 86400000;

                for (var i in coursesObj.timeBuckets) {
                    loc_timeBucket = coursesObj.timeBuckets[i];
                    loc_course = loc_timeBucket.course[loc_dayIndex];
                    if (loc_course.status == 1 &&
                        loc_course.lecturer &&
                        loc_course.courseType != 2) {
                        loc_result.push({
                            date: loc_courseDate,
                            flag: currTime < loc_timeBucket.startTime ? 1 : (currTime >= loc_timeBucket.endTime ? -1 : 0),
                            startTime: loc_timeBucket.startTime,
                            endTime: loc_timeBucket.endTime,
                            lecturer: loc_course.lecturer,
                            lecturerId: loc_course.lecturerId,
                            courseType: loc_course.courseType,
                            title: loc_course.title
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
    getCourseByWeek: function(syllabusObj, coursesObj) {
        if (!coursesObj || !syllabusObj) {
            return null;
        }
        var tmArr = coursesObj.timeBuckets,
            courseTmp;
        for (var i in tmArr) {
            courseTmp = tmArr[i].course;
            for (var k in courseTmp) {
                delete courseTmp[k].context;
            }
        }
        return {
            groupType: syllabusObj.groupType,
            groupId: syllabusObj.groupId,
            courses: JSON.stringify(coursesObj),
            publishStart: syllabusObj.publishStart.getTime(),
            publishEnd: syllabusObj.publishEnd.getTime()
        };
    },

    /**
     * 提取下节课课程数据
     * @param coursesObj 课程表数据
     * @param publishEnd 发布结束时间
     * @param currDate   当前日期
     * @param isNext     是否下次课程
     * @param onlyNext   是否仅取下次课
     * @returns {*}
     */
    getCourseSingle: function(coursesObj, publishEnd, currDate, isNext, onlyNext) {
        if (!coursesObj || !coursesObj.days || !coursesObj.timeBuckets) {
            return [];
        }
        var days = coursesObj.days,
            timeBuckets = coursesObj.timeBuckets;
        var currDay = (currDate.getDay() + 6) % 7;
        var currTime = Utils.dateFormat(currDate, 'hh:mm');
        var tmBk = null;
        var courseObj = null;
        var i = 0,
            k = 0,
            tmpDay = 0;
        for (i = 0; i < days.length; i++) {
            if (days[i].status == 0) {
                continue;
            }
            tmpDay = (days[i].day + 6) % 7;
            if (tmpDay > currDay) {
                for (k in timeBuckets) {
                    tmBk = timeBuckets[k];
                    courseObj = syllabusService.getCourseObj(coursesObj, i, k, currDate, true);
                    if (courseObj) {
                        return [courseObj];
                    }
                }
            } else if (tmpDay == currDay) {
                for (k in timeBuckets) {
                    tmBk = timeBuckets[k];
                    if (tmBk.endTime <= currTime) {
                        continue;
                    } else if (tmBk.startTime <= currTime && tmBk.endTime > currTime) {
                        if (!onlyNext) {
                            courseObj = syllabusService.getCourseObj(coursesObj, i, k, currDate, isNext || false);
                        }
                    } else { //tmBk.startTime>currTime
                        courseObj = syllabusService.getCourseObj(coursesObj, i, k, currDate, true);
                    }
                    if (courseObj) {
                        return [courseObj];
                    }
                }
            }
        }
        //课程安排跨周，返回首次课程
        for (i = 0; i < days.length; i++) {
            if (days[i].status == 0) {
                continue;
            }
            tmpDay = (days[i].day + 6) % 7;
            for (k in timeBuckets) {
                tmBk = timeBuckets[k];
                courseObj = syllabusService.getCourseObj(coursesObj, i, k, currDate, true);
                if (courseObj) {
                    if (!publishEnd || publishEnd.getTime() >= courseObj.date) {
                        return [courseObj];
                    } else {
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
    getCourseObj: function(coursesObj, dayIndex, timeIndex, currDate, isNext) {
        var tmBkTmp = coursesObj.timeBuckets[timeIndex];
        var courseTmp = tmBkTmp.course;
        if (courseTmp && courseTmp.length > dayIndex) {
            var course = courseTmp[dayIndex];
            if (syllabusService.isValidCourse(course)) {
                var loc_day = (coursesObj.days[dayIndex].day + 6) % 7;
                var loc_currDay = (currDate.getDay() + 6) % 7;
                if (loc_day < loc_currDay) {
                    loc_day = loc_day + 7;
                }
                delete course["status"];
                var loc_courseDate = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate());
                course.date = loc_courseDate.getTime() + (loc_day - loc_currDay) * 86400000;
                course.startTime = tmBkTmp.startTime;
                course.endTime = tmBkTmp.endTime;
                course.isNext = isNext;
                return course;
            } else {
                return null;
            }
        } else {
            return null;
        }
    },
    /**
     * 判断是都有效的课程
     * @param course
     */
    isValidCourse: function(course) {
        return course &&
            course.status != 0 &&
            !Common.isBlank(course.lecturerId) &&
            course.courseType != 2;
    },
    /**
     * 填充讲师信息（只针对单一课程填充）
     * @param courseArr
     */
    fillLecturerInfo: function(courseArr, callback) {
        var userNoArr = [],
            courseTmp;
        for (var i = 0, lenI = !courseArr ? 0 : courseArr.length; i < lenI; i++) {
            courseTmp = courseArr[i];
            if (!courseTmp) {
                continue;
            }
            courseTmp.avatar = "";
            courseTmp.userNoArr = !courseTmp.lecturerId ? [] : courseTmp.lecturerId.split(/[,，]/);
            userNoArr = userNoArr.concat(courseTmp.userNoArr);
        }
        if (userNoArr.length == 0) {
            callback(courseArr);
            return;
        }
        syllabusService.getLecturerInfoMap(userNoArr, function(lecturerMap) {
            var lecturerTmp, avatarArr, courseTmp, userNameArr, positionArr, intaroductionArr, tagArr;
            for (var i = 0, lenI = !courseArr ? 0 : courseArr.length; i < lenI; i++) {
                courseTmp = courseArr[i];
                if (!courseTmp) {
                    continue;
                }
                avatarArr = [], userNameArr = [], positionArr = [], intaroductionArr = [], tagArr = [];
                for (var j = 0, lenJ = courseTmp.userNoArr.length; j < lenJ; j++) {
                    lecturerTmp = lecturerMap[courseTmp.userNoArr[j]];
                    avatarArr.push((lecturerTmp && lecturerTmp.avatar) ? lecturerTmp.avatar : "");
                    userNameArr.push((lecturerTmp && lecturerTmp.userName) ? lecturerTmp.userName : "");
                    positionArr.push((lecturerTmp && lecturerTmp.position) ? lecturerTmp.position : "");
                    intaroductionArr.push((lecturerTmp && lecturerTmp.introduction) ? lecturerTmp.introduction : "");
                    tagArr.push((lecturerTmp && lecturerTmp.tag) ? lecturerTmp.tag : "");
                }
                delete courseTmp["userNoArr"];
                courseTmp.avatar = avatarArr.join(",");
                courseTmp.userName = userNameArr.join(",");
                courseTmp.position = positionArr.join(",");
                courseTmp.introduction = intaroductionArr.join(",");
                courseTmp.tag = tagArr.join(",");
            }
            callback(courseArr);
        });
    },

    /**
     * 填充交易策略信息
     * @param groupId
     * @param courseArr 特别注意只会对单个课程信息填充策略
     * @param callback
     */
    fillArticleIfo: function(groupId, courseArr, callback) {
        if (!courseArr || courseArr.length == 0) {
            callback(courseArr);
            return;
        }
        var course = courseArr[0];
        var tagRegAll = /<[^>]+>|<\/[^>]+>/g;
        ArticleService.findArticle("class_note", groupId, "trading_strategy", false, function(article) {
            if (article && article.detailList && article.detailList.length > 0) {
                var articleDetail = article.detailList[0];
                course.strategyTitle = articleDetail.title || "";
                course.strategyContent = (articleDetail.content || "").replace(tagRegAll, "");
            } else {
                course.strategyTitle = "";
                course.strategyContent = "";
            }
            callback(courseArr);
        });
    },

    /**
     * 备份课程表
     * @param date
     * @param callback
     */
    bakSyllabus: function(date, callback) {
        APIUtil.DBFind(chatSyllabus, {
            query: {
                isDeleted: 0,
                publishStart: { $lte: date },
                publishEnd: { $gt: date }
            },
            sortAsc: ["publishStart"]
        }, function(err, rows) {
            if (err) {
                logger.error("查询聊天室课程安排失败!", err);
                callback(false);
                return;
            }
            var loc_courseHis = [],
                loc_groupMap = {};
            var row = null;
            if (rows) {
                for (var i = 0, lenI = rows.length; i < lenI; i++) {
                    row = rows[i];
                    if (loc_groupMap.hasOwnProperty(row.groupId)) {
                        continue;
                    }
                    loc_groupMap[row.groupId] = 1;
                    loc_courseHis = loc_courseHis.concat(syllabusService.convertSyllabus2His(row, date));
                }
            }
            syllabusService.saveSyllabusHis(loc_courseHis, date, function(isOK) {
                callback(isOK);
            });
        });
    },

    /**
     * 将课程表对象转化为课程历史记录（数组）
     * @param syllabus
     * @param date
     */
    convertSyllabus2His: function(syllabus, date) {
        var result = [];
        if (!syllabus || !syllabus.courses) {
            return result;
        }
        var loc_dayIndex = -1;
        var day = date.getDay();
        var loc_courseObj = JSON.parse(syllabus.courses);
        if (loc_courseObj && loc_courseObj.days) {
            for (var i in loc_courseObj.days) {
                if (loc_courseObj.days[i].day == day) {
                    if (loc_courseObj.days[i].status == 1) {
                        loc_dayIndex = i;
                    }
                    break;
                }
            }
            if (loc_dayIndex != -1 && loc_courseObj.timeBuckets) {
                var loc_timeBucket, loc_course;
                for (var i in loc_courseObj.timeBuckets) {
                    loc_timeBucket = loc_courseObj.timeBuckets[i];
                    loc_course = loc_timeBucket.course[loc_dayIndex];
                    if (loc_course.status == 1 &&
                        loc_course.lecturer) {
                        result.push({
                            _id: new ObjectId(),
                            groupType: syllabus.groupType,
                            groupId: syllabus.groupId,
                            date: date,
                            startTime: loc_timeBucket.startTime,
                            endTime: loc_timeBucket.endTime,
                            courseType: loc_course.courseType,
                            lecturerId: loc_course.lecturerId,
                            lecturer: loc_course.lecturer,
                            title: loc_course.title,
                            context: loc_course.context,
                            updateDate: new Date()
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
    saveSyllabusHis: function(courses, date, callback) {
        chatSyllabusHis.remove({ date: date }, function(err) {
            if (err) {
                logger.error("删除课程表历史失败!", err);
                callback(false);
                return;
            }
            chatSyllabusHis.create(courses, function(err) {
                if (err) {
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
    getSyllabusPlan: function(startTime, endTime, callback) {
        APIUtil.DBFind(chatSyllabus, {
            query: {
                isDeleted: 0,
                publishStart: { $lte: endTime },
                publishEnd: { $gt: endTime }
            },
            sortAsc: ["publishStart"]
        }, function(err, rows) {
            if (err) {
                logger.error("查询聊天室课程安排失败!", err);
                callback([]);
                return;
            }
            var loc_result = [],
                loc_course = null,
                loc_groupMap = {};
            var row = null;
            if (rows) {
                for (var i = 0, lenI = rows.length; i < lenI; i++) {
                    row = rows[i];
                    if (loc_groupMap.hasOwnProperty(row.groupId)) {
                        continue;
                    }
                    loc_groupMap[row.groupId] = 1;
                    loc_course = syllabusService.convertSyllabus2Plan(row, startTime, endTime);
                    if (loc_course != null) {
                        loc_result.push(loc_course);
                    }
                }
            }
            //查询房间名称信息
            APIUtil.DBFind(chatGroup, {
                query: {
                    valid: 1,
                    status: { $ne: "0" },
                    _id: { $in: Object.keys(loc_groupMap) }
                },
                fieldIn: ["_id", "groupType", "name"]
            }, function(err, rooms) {
                var roomsMap = {};
                if (err) {
                    logger.error("查询聊天室房间名称失败!", err);
                } else if (rooms) {
                    for (var i = 0, lenI = rooms.length; i < lenI; i++) {
                        roomsMap[rooms[i]._id] = rooms[i].name || "";
                    }
                }
                var courseTmp = null;
                for (var i = 0, lenI = loc_result.length; i < lenI; i++) {
                    courseTmp = loc_result[i];
                    courseTmp.groupName = roomsMap[courseTmp.groupId] || "";
                }
                callback(loc_result);
            });
        });
    },

    /**
     * 按时间区间提取即将开始的课程信息
     * @param syllabus
     * @param start
     * @param end
     */
    convertSyllabus2Plan: function(syllabus, start, end) {
        var result = null;
        if (!syllabus || !syllabus.courses) {
            return result;
        }
        var loc_dayIndex = -1;
        var day = end.getDay();
        var startTime = null,
            endTime = Utils.dateFormat(end, 'hh:mm');
        if (start.getDay() != day) { //跨天
            startTime = "00:00";
        } else {
            startTime = Utils.dateFormat(start, 'hh:mm');
        }
        var loc_courseObj = JSON.parse(syllabus.courses);
        if (loc_courseObj && loc_courseObj.days) {
            for (var i in loc_courseObj.days) {
                if (loc_courseObj.days[i].day == day) {
                    if (loc_courseObj.days[i].status == 1) {
                        loc_dayIndex = i;
                    }
                    break;
                }
            }
            if (loc_dayIndex != -1 && loc_courseObj.timeBuckets) {
                var loc_timeBucket, loc_course;
                for (var i in loc_courseObj.timeBuckets) {
                    loc_timeBucket = loc_courseObj.timeBuckets[i];
                    loc_course = loc_timeBucket.course[loc_dayIndex];
                    if (loc_course.status == 1 &&
                        loc_course.lecturer &&
                        loc_timeBucket.startTime >= startTime &&
                        loc_timeBucket.startTime < endTime) {
                        result = {
                            groupType: syllabus.groupType,
                            groupId: syllabus.groupId,
                            date: new Date(end.getFullYear(), end.getMonth(), end.getDate()),
                            startTime: loc_timeBucket.startTime,
                            endTime: loc_timeBucket.endTime,
                            courseType: loc_course.courseType,
                            lecturerId: loc_course.lecturerId,
                            lecturer: loc_course.lecturer,
                            title: loc_course.title,
                            context: loc_course.context
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
     * @param hasCurr
     * @param callback
     */
    getNextCources: function(date, groupType, groupId, lecturerIds, hasCurr, callback) {
        Async.parallel({
                lecturers: function(callbackTmp) {
                    syllabusService.getLecturerInfoMap(lecturerIds, function(analystMap) {
                        callbackTmp(null, analystMap);
                    });
                },
                courses: function(callbackTmp) {
                    APIUtil.DBFind(chatSyllabus, {
                        query: {
                            groupType: groupType,
                            groupId: groupId,
                            isDeleted: 0,
                            publishStart: { $lte: date },
                            publishEnd: { $gt: date }
                        },
                        sortAsc: ["publishStart"]
                    }, function(err, rows) {
                        var result = {};
                        if (err) {
                            logger.error("getNextCources<<查询聊天室课程安排失败!", err);
                            callbackTmp(null, result);
                            return;
                        }
                        if (!rows || rows.length == 0 || !rows[0]) {
                            callbackTmp(null, result);
                            return;
                        }
                        var row = rows[0];
                        try {
                            var courses = JSON.parse(row.courses);
                            result = syllabusService.getNextCourseMap(courses, date, hasCurr);
                        } catch (e) {}
                        callbackTmp(null, result);
                    });
                }
            },
            function(err, results) {
                var result = [],
                    resultTmp = null,
                    courseTmp = null,
                    lecturerIdTmp = null;
                var coursesMap = results.courses;
                var lecturerMap = results.lecturers;
                if (lecturerIds) {
                    for (var i = 0, lenI = lecturerIds.length; i < lenI; i++) {
                        lecturerIdTmp = lecturerIds[i];
                        resultTmp = {
                            date: 0,
                            startTime: "",
                            endTime: "",
                            lecturerId: lecturerIdTmp,
                            lecturer: "",
                            courseType: "",
                            title: "",
                            avatar: ""
                        };
                        if (coursesMap.hasOwnProperty(lecturerIdTmp)) {
                            courseTmp = coursesMap[lecturerIdTmp];
                            resultTmp.date = courseTmp.date;
                            resultTmp.startTime = courseTmp.startTime;
                            resultTmp.endTime = courseTmp.endTime;
                            resultTmp.lecturer = courseTmp.lecturer;
                            resultTmp.courseType = courseTmp.courseType;
                            resultTmp.title = courseTmp.title;
                            resultTmp.isNext = courseTmp.isNext;
                        }
                        if (lecturerMap.hasOwnProperty(lecturerIdTmp)) {
                            resultTmp.avatar = lecturerMap[lecturerIdTmp].avatar;
                            resultTmp.lecturer = lecturerMap[lecturerIdTmp].userName;
                            resultTmp.tag = lecturerMap[lecturerIdTmp].tag || '';
                            resultTmp.introduction = lecturerMap[lecturerIdTmp].introduction || '';
                            resultTmp.position = lecturerMap[lecturerIdTmp].position || '';
                        }
                        result.push(resultTmp);
                    }
                    callback(result);
                } else {
                    for (var lecturerId in coursesMap) {
                        result.push(coursesMap[lecturerId]);
                    }
                    //填充分析师头像
                    syllabusService.fillLecturerInfo(result, function(courseArr) {
                        callback(courseArr);
                    });
                }
            });
    },

    /**
     * 获取分析师信息Map
     */
    getLecturerInfoMap: function(lecturerIds, callback) {
        var result = {};
        if (!lecturerIds || lecturerIds.length == 0) {
            callback(result);
            return;
        }
        boUser.find({
            'userNo': { $in: lecturerIds },
            'status': 0,
            'valid': 1
        }, "_id userNo userName avatar tag introduction position", function(err, rows) {
            if (err || !rows || rows.length == 0) {
                callback(result);
                return;
            }
            var row;
            for (var i = 0, lenI = rows.length; i < lenI; i++) {
                row = rows[i];
                result[row.userNo] = row.toObject();
            }
            callback(result);
        });
    },

    /**
     * 将课程表转化为分析师为key，课程为val的map
     * @param coursesObj
     * @param date
     * @param hasCurr
     * @returns {*}
     */
    getNextCourseMap: function(coursesObj, date, hasCurr) {
        var result = {};
        if (!coursesObj || !coursesObj.days || !coursesObj.timeBuckets) {
            return result;
        }
        var days = coursesObj.days,
            timeBuckets = coursesObj.timeBuckets;
        var currDay = (date.getDay() + 6) % 7;
        var currTime = Utils.dateFormat(date, 'hh:mm');
        var tmBk = null;
        var courseObj = null;
        var i, k = 0,
            tmpDay = 0;
        var loc_courseDate = null;
        for (i = 0; i < days.length; i++) {
            tmpDay = (days[i].day + 6) % 7;
            if (days[i].status == 0 || tmpDay < currDay) {
                continue;
            }
            loc_courseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            loc_courseDate = loc_courseDate.getTime() + (tmpDay - currDay) * 86400000;
            for (k in timeBuckets) {
                tmBk = timeBuckets[k];
                if (tmpDay == currDay &&
                    (tmBk.endTime <= currTime ||
                        (tmBk.startTime <= currTime && !hasCurr))) {
                    continue;
                }
                courseObj = tmBk.course[i];
                if (courseObj.lecturerId) { //分析师为空的课程无效
                    var ids = courseObj.lecturerId.split(/[,，]/);
                    var names = courseObj.lecturer ? courseObj.lecturer.split(/[,，]/) : [];
                    var idTmp = null;
                    for (var j = 0, lenJ = ids.length; j < lenJ; j++) {
                        idTmp = ids[j];
                        if (result.hasOwnProperty(idTmp) == false) {
                            result[idTmp] = {
                                date: loc_courseDate,
                                startTime: tmBk.startTime,
                                endTime: tmBk.endTime,
                                lecturerId: idTmp,
                                lecturer: names[j],
                                courseType: courseObj.courseType,
                                title: courseObj.title,
                                isNext: tmpDay > currDay || tmBk.startTime > currTime
                            };
                        }
                    }
                }
            }
        }
        return result;
    },
    /**
     * 查询聊天室课程安排历史记录
     * @param groupType
     * @param groupId
     * @param date
     * @param callback
     */
    getSyllabusHis: function(groupType, groupId, date, callback) {
        groupId = groupId || "";
        var timezoneOffset = new Date().getTimezoneOffset() * 60000;
        date = date === "null" ? null : date;
        date = date === "false" ? null : date;
        date = date === "undefined" ? null : date;
        if (!date) {
            date = new Date().getTime();
            date = new Date(date - (date % 86400000) - 86400000 + timezoneOffset);
        } else {
            date = new Date(date);
            date = new Date(date - (date % 86400000) + timezoneOffset);
        }
        chatSyllabusHis.find({
            groupType: groupType,
            groupId: groupId,
            date: date
        }).sort({ startTime: 1 }).exec("find", function(err, rows) {
            if (err) {
                logger.error("查询聊天室课程安排历史记录失败!", err);
                callback(null);
            } else {
                callback(rows);
            }
        });
    }
};
//导出服务类
module.exports = syllabusService;