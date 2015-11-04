/**
 * 摘要：会员反馈Service服务类
 * author:Gavin.guo
 * date:2015/7/20
 */
var logger = require('../resources/logConf').getLogger("feedbackService");
var ObjectId = require('mongoose').Types.ObjectId;
var Feedback = require('../models/feedback');	       //引入feedback数据模型
var FeedbackAuto = require('../models/feedbackAuto.js');	       //引入feedbackAuto数据模型
var APIUtil = require('../util/APIUtil'); 	 	       //引入API工具类js
var Utils = require('../util/Utils'); 	 	           //引入Utils工具类js

/**
 * 定义会员反馈Service类
 */
var feedbackService = {
    /**
     * 功能：获取会员反馈列表
     * @param memberId  会员ID
     * @param pageLast
     * @param pageSize
     * @param callback
     */
    getFeedbackByMemberId : function(memberId, pageLast, pageSize, callback){
        feedbackService.findFeedbackByMemberId(memberId, function(err, feedback){
            if(err){
                logger.error("查询会员反馈信息失败!", err);
                callback(APIUtil.APIResult("code_2037", null, null));
                return;
            }
            var loc_page = APIUtil.getPageInfo(pageLast, pageSize);
            if(feedback && feedback.replyList){
                feedback = feedback.toObject();
                var loc_replyList = APIUtil.getPageListByArr(feedback.replyList, loc_page, true, function(item){
                    return item._id.toString();
                });
                var loc_reply = null;
                for(var i = 0, lenI = loc_replyList.length; i < lenI; i++){
                    loc_reply = loc_replyList[i];
                    loc_reply.feedBackDate = loc_reply.feedBackDate instanceof Date ? loc_reply.feedBackDate.getTime() : 0;
                    loc_reply.feedBackContent = loc_reply.feedBackContent.replace(/<p>/ig,'').replace(/<\/p>/ig,'');
                }
                callback(APIUtil.APIResult(null, loc_replyList, loc_page));
            }else{
                callback(APIUtil.APIResult(null, [], loc_page));
            }
        });
    },

    /**
     * 按照客户号查询反馈信息
     * @param memberId
     * @param callback
     */
    findFeedbackByMemberId : function(memberId, callback){
        APIUtil.DBFindOne(Feedback, {
            query : {
                isDeleted : 1,
                memberId : memberId
            }
        },callback);
    },

    /**
     * 功能：添加会员反馈内容
     * @param feedbackParam   会员反馈对象(需要设置memberId、content)
     * @param callback
     */
    addFeedback : function(feedbackParam, callback){
        var loc_page = APIUtil.getPageInfo(feedbackParam.pageLast, feedbackParam.pageSize);
        feedbackService.findFeedbackByMemberId(feedbackParam.memberId, function(err, Dbfeedback){
            if(err){
                logger.error("添加会员反馈——查询会员反馈信息失败!", err);
                callback(APIUtil.APIResult("code_2037", null, null));
                return;
            }
            feedbackService.getFeedbackAuto(feedbackParam.content, function(err, feedbackAuto){
                if(err) {
                    logger.error("添加会员反馈——查询自动回复信息失败!", err);
                    callback(APIUtil.APIResult("code_2038", null, null));
                    return;
                }
                var loc_isAddAuto = !!feedbackAuto && feedbackAuto.type === 1;
                //不存在会员反馈记录直接新增一条记录，否则仅添加一笔反馈回复
                //不存在自动回复记录直接添加一笔回复，否则同时添加客户回复和自动回复内容
                if(!Dbfeedback){
                    var lastTime = new Date();
                    var loc_feedbackObjTmp = null;
                    if(loc_isAddAuto){
                        loc_feedbackObjTmp = {
                            _id: new ObjectId(),
                            memberId : feedbackParam.memberId,
                            lastFeedbackDate : lastTime,
                            lastFeedbackContent : feedbackAuto.content,
                            isDeleted : 1,
                            replyList : [{
                                _id: new ObjectId(),
                                feedBackDate : lastTime,
                                feedBackContent : feedbackParam.content,
                                type : 1
                            },{
                                _id: new ObjectId(),
                                feedBackDate : Utils.dateAddSeconds(lastTime,0.001), //自动回复时间推迟1毫秒
                                feedBackContent : feedbackAuto.content,
                                type : 2//系统自动回复
                            }],
                            isReply : 1,
                            createUser : feedbackParam.memberId,
                            createIp : feedbackParam.ip,
                            createDate : lastTime,
                            updateUser : feedbackParam.memberId,
                            updateIp : feedbackParam.ip,
                            updateDate : lastTime
                        };
                    }else{
                        loc_feedbackObjTmp = {
                            _id: new ObjectId(),
                            memberId : feedbackParam.memberId,
                            lastFeedbackDate : lastTime,
                            lastFeedbackContent : feedbackParam.content,
                            isDeleted : 1,
                            replyList : [{
                                _id: new ObjectId(),
                                feedBackDate : lastTime,
                                feedBackContent : feedbackParam.content,
                                type : 1
                            }],
                            isReply : 0,
                            createUser : feedbackParam.memberId,
                            createIp : feedbackParam.ip,
                            createDate : lastTime,
                            updateUser : feedbackParam.memberId,
                            updateIp : feedbackParam.ip,
                            updateDate : lastTime
                        };
                    }
                    var feedbackObj = new Feedback(loc_feedbackObjTmp);
                    feedbackObj.save(function(err, feedback){
                        if(err){
                            logger.error("保存会员反馈信息失败！", err);
                            callback(APIUtil.APIResult("code_2038", null, null));
                            return;
                        }
                        logger.info("保存会员反馈信息成功！", feedback._id);

                        feedback = feedback.toObject();
                        var loc_replyList = APIUtil.getPageListByArr(feedback.replyList, loc_page, false, function(item){
                            return item._id.toString();
                        });
                        var loc_reply = null;
                        for(var i = 0, lenI = loc_replyList.length; i < lenI; i++){
                            loc_reply = loc_replyList[i];
                            loc_reply.feedBackDate = loc_reply.feedBackDate instanceof Date ? loc_reply.feedBackDate.getTime() : 0;
                            loc_reply.feedBackContent = loc_reply.feedBackContent.replace(/<p>/ig,'').replace(/<\/p>/ig,'');
                        }
                        callback(APIUtil.APIResult(null, loc_replyList, loc_page));
                    });
                }else{
                    var loc_timeNow = new Date();
                    var loc_updater = null;
                    if(loc_isAddAuto){
                        loc_updater = {
                            $push : {
                                "replyList": {
                                    $each : [
                                        {
                                            _id: new ObjectId(),
                                            feedBackDate:loc_timeNow,
                                            feedBackContent:feedbackParam.content,
                                            type : 1
                                        },{
                                            _id: new ObjectId(),
                                            feedBackDate:Utils.dateAddSeconds(loc_timeNow,0.001), //自动回复时间推迟1毫秒,
                                            feedBackContent:feedbackAuto.content,
                                            type : 2
                                        }
                                    ]
                                }
                            },
                            $set : {
                                lastFeedbackDate : loc_timeNow,
                                lastFeedbackContent : feedbackAuto.content,
                                isReply : 1,
                                updateUser : feedbackParam.memberId,
                                updateIp : feedbackParam.ip,
                                updateDate : loc_timeNow
                            }
                        };
                    }else{
                        loc_updater = {
                            $push : {"replyList": {
                                _id: new ObjectId(),
                                feedBackDate:loc_timeNow,
                                feedBackContent:feedbackParam.content,
                                type : 1}
                            },
                            $set : {
                                lastFeedbackDate : loc_timeNow,
                                lastFeedbackContent : feedbackParam.content,
                                isReply : 0,
                                updateUser : feedbackParam.memberId,
                                updateIp : feedbackParam.ip,
                                updateDate : loc_timeNow
                            }
                        };
                    }
                    Feedback.findOneAndUpdate({_id : Dbfeedback._id}, loc_updater, {"new" : true}, function(err, feedback){
                        if(err){
                            logger.error("保存会员反馈信息失败！", err);
                            callback(APIUtil.APIResult("code_2038", null, null));
                            return;
                        }

                        feedback = feedback.toObject();
                        var loc_replyList = APIUtil.getPageListByArr(feedback.replyList, loc_page, false, function(item){
                            return item._id.toString();
                        });
                        var loc_reply = null;
                        for(var i = 0, lenI = loc_replyList.length; i < lenI; i++){
                            loc_reply = loc_replyList[i];
                            loc_reply.feedBackDate = loc_reply.feedBackDate instanceof Date ? loc_reply.feedBackDate.getTime() : 0;
                            loc_reply.feedBackContent = loc_reply.feedBackContent.replace(/<p>/ig,'').replace(/<\/p>/ig,'');
                        }
                        callback(APIUtil.APIResult(null, loc_replyList, loc_page));
                    });
                }
            });
        });
    },

    /**
     * 获取自动回复
     * @param keywords
     * @param callback
     */
    getFeedbackAuto : function(keywords, callback){
        APIUtil.DBFindOne(FeedbackAuto, {
            query : {
                isDeleted : 1,
                antistop : {$regex: keywords}
            }
        },callback);
    }
};

//导出服务类
module.exports = feedbackService;

