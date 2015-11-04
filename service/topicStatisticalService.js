/**
 * 摘要：帖子统计Service服务类
 * author:Dick.guo
 * date:2015/8/3
 */
var logger = require('../resources/logConf').getLogger("TopicStatisticalService");
var TopicStatistical = require('../models/topicStatistical.js');	                    //引入reply数据模型
var APIUtil = require('../util/APIUtil.js');
var ObjectId = require('mongoose').Types.ObjectId;

/**
 * 定义回帖Service类
 */
var TopicStatisticalService = {
    /**
     * 点赞
     * @param topicId
     * @param type
     * @param ip
     * @param callback
     */
    praise : function(topicId, type, ip, callback){
        var loc_timeNow = new Date();
        TopicStatisticalService.modifyOrInsert(
            {
                topicId : topicId,
                type : type,
                praiseCounts : 1,
                replyCounts : 0,
                reportCounts : 0,
                readCounts : 0,
                isDeleted : 1,
                createUser : 'admin',
                createIp : ip,
                createDate : loc_timeNow,
                updateUser : 'admin',
                updateIp : ip,
                updateDate : loc_timeNow
            },
            {
                $inc : {praiseCounts : 1},
                $set : {
                    updateUser : 'admin',
                    updateIp : ip,
                    updateDate : loc_timeNow
                }
            },callback);
    },

    /**
     * 举报
     * @param topicId
     * @param type
     * @param ip
     * @param callback
     */
    report : function(topicId, type, ip, callback){
        var loc_timeNow = new Date();
        TopicStatisticalService.modifyOrInsert(
            {
                topicId : topicId,
                type : type,
                praiseCounts : 0,
                replyCounts : 0,
                readCounts : 0,
                reportCounts : 1,
                isDeleted : 1,
                createUser : 'admin',
                createIp : ip,
                createDate : loc_timeNow,
                updateUser : 'admin',
                updateIp : ip,
                updateDate : loc_timeNow
            },
            {
                $inc : {reportCounts : 1},
                $set : {
                    updateUser : 'admin',
                    updateIp : ip,
                    updateDate : loc_timeNow
                }
            },
            function(error,topicStatistical){
                if(error){
                    logger.error("举报失败！", err);
                    callback(APIUtil.APIResult("code_2048", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, topicStatistical, null));
            });
    },

    /**
     * 阅读
     * @param topicId
     * @param type
     * @param ip
     * @param callback
     */
    read : function(topicId, type, ip, callback){
        var loc_timeNow = new Date();
        TopicStatisticalService.modifyOrInsert(
            {
                topicId : topicId,
                type : type,
                praiseCounts : 0,
                replyCounts : 0,
                reportCounts : 0,
                readCounts : 1,
                isDeleted : 1,
                createUser : 'admin',
                createIp : ip,
                createDate : loc_timeNow,
                updateUser : 'admin',
                updateIp : ip,
                updateDate : loc_timeNow
            },
            {
                $inc : {readCounts : 1},
                $set : {
                    updateUser : 'admin',
                    updateIp : ip,
                    updateDate : loc_timeNow
                }
            },
            function(error,topicStatistical){
                if(error){
                    logger.error("阅读失败！", err);
                    callback(APIUtil.APIResult("code_2049", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, topicStatistical, null));
            });
    },

    /**
     * 回复
     * @param topicId
     * @param type
     * @param ip
     * @param callback
     */
    reply : function(topicId, type, ip, callback){
        var loc_timeNow = new Date();
        TopicStatisticalService.modifyOrInsert(
            {
                topicId : topicId,
                type : type,
                praiseCounts : 0,
                replyCounts : 1,
                reportCounts : 0,
                readCounts : 0,
                isDeleted : 1,
                createUser : 'admin',
                createIp : ip,
                createDate : loc_timeNow,
                updateUser : 'admin',
                updateIp : ip,
                updateDate : loc_timeNow
            },
            {
                $inc : {replyCounts : 1},
                $set : {
                    updateUser : 'admin',
                    updateIp : ip,
                    updateDate : loc_timeNow
                }
            },callback);
    },

    /**
     * 修改或者添加
     * @param topicStatistical
     * @param updater
     * @param callback
     */
    modifyOrInsert : function(topicStatistical, updater, callback){
        TopicStatistical.findOneAndUpdate(
            {
                'topicId' : topicStatistical.topicId,
                'type' : topicStatistical.type,
                'isDeleted' : 1
            },
            updater,
            {'new' : true},
            function(err, topicStatisticalTmp){
                if(err){
                    logger.error("修改帖子统计信息失败！", err);
                    callback(err, null);
                    return;
                }
                //不存在，修改失败，直接添加一个新的
                if(!topicStatisticalTmp){
                    topicStatistical._id = new ObjectId();
                    new TopicStatistical(topicStatistical).save(function(err, topicStatistical){
                        if(err){
                            logger.error("保存帖子统计信息失败！", err);
                            callback(err, null);
                            return;
                        }
                        callback(null, topicStatistical);
                    });
                    return;
                }
                callback(null, topicStatisticalTmp);
        });
    },

    /**
     * 查找单个帖子统计信息
     * @param topicId
     * @param type
     * @param callback
     */
    getStatistical : function(topicId, type, callback){
        APIUtil.DBFindOne(TopicStatistical,{
            query : {
                isDeleted : 1,
                topicId : topicId,
                type : type
            }
        }, callback);
    },

    /**
     * 获取帖子统计信息
     * @param topics
     * @param callback
     */
    getStatisticals : function(topics, callback){
        if((topics instanceof Array) === false || topics.length === 0){
            callback(null, []);
            return;
        }
        var loc_topicIds = [];
        for(var i = 0, lenI = topics.length; i < lenI; i++){
            loc_topicIds.push(topics[i]._id);
        }
        APIUtil.DBFind(TopicStatistical,{
            query : {
                isDeleted : 1,
                topicId : {$in : loc_topicIds}
            }
        }, function(err, statisticals){
            if(err){
                logger.error("查询帖子统计信息失败!", err);
                callback(err, null);
                return;
            }

            var loc_topic = null;
            var lenJ = !statisticals ? 0 : statisticals.length;
            for(var i = 0, lenI = topics.length; i < lenI; i++){
                loc_topic = topics[i];
                for(var j = 0; j < lenJ; j++){
                    //id相同，并且统计类型相同
                    if(loc_topic._id === statisticals[j].topicId && statisticals[j].type === loc_topic.type){
                        loc_topic.praiseCounts = statisticals[j].praiseCounts;
                        loc_topic.replyCounts = statisticals[j].replyCounts;
                        loc_topic.reportCounts = statisticals[j].reportCounts;
                        loc_topic.readCounts = statisticals[j].readCounts;
                        break;
                    }
                }
                if(j === lenJ){
                    loc_topic.praiseCounts = 0;
                    loc_topic.replyCounts = 0;
                    loc_topic.reportCounts = 0;
                    loc_topic.readCounts = 0;
                }
            }
            callback(err, topics);
        });
    }
};

//导出服务类
module.exports = TopicStatisticalService;

