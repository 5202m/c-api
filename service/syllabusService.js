var chatSyllabus = require('../models/chatSyllabus');//引入chatSyllabus数据模型
var logger=require('../resources/logConf').getLogger('syllabusService');//引入log4js
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
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
     * 查询聊天室课程安排(指定日期课程安排)
     * @param groupType
     * @param groupId
     * @param today
     * @param callback
     */
    getCourse : function(groupType, groupId, today, callback){
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
            var loc_courseJSON = !row ? null : row.courses;
            var loc_courses = JSON.parse(loc_courseJSON);
            var loc_day = today.getDay();
            var loc_result = [];
            var loc_dayIndex = -1;
            if(loc_courses && loc_courses.days){
                for(var i in loc_courses.days){
                    if(loc_courses.days[i].day == loc_day){
                        if(loc_courses.days[i].status == 1){
                            loc_dayIndex = i;
                        }
                        break;
                    }
                }
                if(loc_dayIndex != -1 && loc_courses.timeBuckets){
                    var loc_timeBucket;
                    for(var i in loc_courses.timeBuckets){
                        loc_timeBucket = loc_courses.timeBuckets[i];
                        if(loc_timeBucket.course[loc_dayIndex].status == 1
                            && loc_timeBucket.course[loc_dayIndex].lecturer){
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
            callback(ApiResult.result(null, loc_dayIndex == -1 ? null : loc_result));
        });
    }
};
//导出服务类
module.exports =syllabusService;

