/**
 * 摘要：回帖Service服务类
 * author:Dick.guo
 * date:2015/8/3
 */
var Reply = require('../models/reply');	                    //引入reply数据模型
var IdSeqManager = require('../constant/IdSeqManager.js');  //引入序号生成器js
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var Utils = require('../util/Utils');
var FinanceUserService = require('../service/financeUserService.js');
var TopicStatisticalService = require('../service/topicStatisticalService.js');
var pushService = require('../service/pushService.js');     //推送消息接口


/**
 * 定义回帖Service类
 */
var ReplyService = {

    /**
     * 按照主帖编号获取最新回帖信息
     * @param topics
     * @param callback
     */
    getFirstReplyByTopics : function(topics, callback){
        if((topics instanceof Array) === false || topics.length === 0){
            callback(null, []);
            return;
        }
        var loc_topicIds = [];
        for(var i = 0, lenI = topics.length; i < lenI; i++){
            loc_topicIds.push(topics[i]._id);
        }
        //db.reply.aggregate([{$sort:{replyDate : -1}}, {$group:{_id:"$topicId", replyId : {$first : "$_id"}, content : {$first : "$content"}, replyDate : {$first : "$replyDate"}}}])
        Reply.aggregate()
            .match({isDeleted : 1,topicId : {$in : loc_topicIds}})
            .sort({'replyDate':'desc'})
            .group({
                _id:"$topicId",
                replyId : {$first : "$_id"},
                content : {$first : "$content"},
                replyDate : {$first : "$replyDate"},
                memberId : {$first : "$createUser"},
                device : {$first : "$device"},
                type : {$first : "$type"}
            })
            .exec(function(err, replys){
                var loc_topic = null;
                var lenJ = !replys ? 0 : replys.length;
                var j;
                for(var i = 0, lenI = topics.length; i < lenI; i++){
                    loc_topic = topics[i];
                    for(j = 0; j < lenJ; j++){
                        if(loc_topic._id === replys[j]._id && loc_topic.type === replys[j].type){
                            loc_topic.reply = {
                                _id : replys[j].replyId,
                                content : replys[j].content,
                                replyDate : replys[j].replyDate.getTime(),
                                memberId : replys[j].memberId,
                                device : replys[j].device
                            };
                            break;
                        }
                    }
                    if(j === lenJ){
                        loc_topic.reply = null;
                    }
                }
                callback(null, topics);
            });
    },

    /**
     * 分页查询回帖信息列表，并查询回帖人信息
     * @param topicId
     * @param type
     * @param pageLast
     * @param pageSize
     * @param callback (err, replys, page)
     */
    getReplys : function(topicId, type, pageLast, pageSize, callback){
        APIUtil.DBPage(Reply, {
                query : {
                    topicId   : topicId,
                    type   : type,
                    isDeleted : 1
                },
                pageLast : pageLast,
                pageSize : pageSize,
                pageId : "_id",
                pageDesc : true
            },
            function(err, replys, page){
                if(err){
                    console.error("查询帖子回帖列表失败！", err);
                    callback(err, null, null);
                    return;
                }
                var loc_replys = [];
                var loc_replyTmp1 = null;
                var loc_replyTmp2 = null;
                var loc_reply = null;
                for(var i = 0, lenI = !replys ? 0 : replys.length; i < lenI; i++){
                    loc_replyTmp1 = replys[i].toObject();
                    loc_reply = {
                        _id : loc_replyTmp1._id,
                        content : loc_replyTmp1.content,
                        replyDate : loc_replyTmp1.replyDate instanceof Date ? loc_replyTmp1.replyDate.getTime() : 0,
                        memberId : loc_replyTmp1.createUser,
                        device : loc_replyTmp1.device,
                        replyList : []
                    };
                    for(var j = 0, lenJ = !loc_replyTmp1.replyList ? 0 : loc_replyTmp1.replyList.length; j < lenJ; j++){
                        loc_replyTmp2 = loc_replyTmp1.replyList[j];
                        loc_reply.replyList.push({
                            _id : loc_replyTmp2._id,
                            content : loc_replyTmp2.content,
                            replyDate : loc_replyTmp2.replyDate instanceof Date ? loc_replyTmp2.replyDate.getTime() : 0,
                            memberId : loc_replyTmp2.createUser,
                            device : loc_replyTmp1.device
                        });
                    }
                    loc_replys.push(loc_reply);
                }
                callback(null, loc_replys, page);
            });
    },

    /**
     * 查询回复信息，包含回复人信息
     * @param topicId
     * @param type
     * @param pageLast
     * @param pageSize
     * @param callback
     */
    getReplysWithMember : function(topicId, type, pageLast, pageSize, callback){
        ReplyService.getReplys(topicId, type, pageLast, pageSize,
            function(err, replys, page){
                if(err){
                    console.error("查询帖子回帖列表失败！", err);
                    callback(err, null, null);
                    return;
                }
                var loc_memberIds = [];
                var loc_replyTmp1 = null;
                var loc_replyTmp2 = null;
                for(var i = 0, lenI = !replys ? 0 : replys.length; i < lenI; i++){
                    loc_replyTmp1 = replys[i];
                    loc_memberIds.push(loc_replyTmp1.memberId);
                    for(var j = 0, lenJ = !loc_replyTmp1.replyList ? 0 : loc_replyTmp1.replyList.length; j < lenJ; j++){
                        loc_replyTmp2 = loc_replyTmp1.replyList[j];
                        loc_memberIds.push(loc_replyTmp2.memberId);
                    }
                }

                //完善回帖人信息
                FinanceUserService.getMemberInfoByMemberIds(loc_memberIds, function(err, members){
                    if(err){
                        console.error("查询发帖人或回帖人信息失败!", err);
                        callback(err, null, null);
                        return;
                    }

                    var lenJ = !members ? 0 : members.length;
                    var j, loc_member = null, loc_replyTmp1 = null, loc_replyTmp2 = null;

                    for(var i = 0, lenI = replys.length; i < lenI; i++){
                        loc_replyTmp1 = replys[i];
                        for(j = 0; j < lenJ; j++){
                            loc_member = members[j];
                            if(loc_replyTmp1.memberId === loc_member._id.toString()){
                                loc_replyTmp1.memberAvatar = loc_member.loginPlatform.financePlatForm.avatar;
                                loc_replyTmp1.memberName = loc_member.loginPlatform.financePlatForm.nickName;
                                break;
                            }
                        }
                        if(j === lenJ){
                            loc_replyTmp1.memberAvatar = "";
                            loc_replyTmp1.memberName = "";
                        }
                        for(var k = 0, lenK = loc_replyTmp1.replyList.length; k < lenK; k++){
                            loc_replyTmp2 = loc_replyTmp1.replyList[k];
                            for(j = 0; j < lenJ; j++){
                                loc_member = members[j];
                                if(loc_replyTmp2.memberId === loc_member._id.toString()){
                                    loc_replyTmp2.memberAvatar = loc_member.loginPlatform.financePlatForm.avatar;
                                    loc_replyTmp2.memberName = loc_member.loginPlatform.financePlatForm.nickName;
                                    break;
                                }
                            }
                            if(j === lenJ){
                                loc_replyTmp2.memberAvatar = "";
                                loc_replyTmp2.memberName = "";
                            }
                        }
                    }
                    callback(null, replys, page);
                });
            }
        );
    },

    /**
     * 修改
     * @param query
     * @param updater
     * @param callback
     */
    modifyByUpdater : function(query, updater, callback){
        Reply.findOneAndUpdate(
            query,
            updater,
            {'new' : true, multi : true},
            callback
        );
    },

    /**
     * 回帖——已经判断禁言状态
     * @param opType 1-主帖回复，2-回帖回复(需要回帖id)
     * @param reply
     * @param callback
     */
    doAdd : function(opType, reply, callback){
        IdSeqManager.Reply.getNextSeqId(function(err, replyId){
            var loc_timeNow = new Date();
            var loc_reply = null;
            if(opType === 1){
                loc_reply = new Reply({
                    _id: replyId,
                    topicId : reply.topicId,
                    type : reply.type,
                    content : reply.content,
                    device : reply.device,
                    replyDate : loc_timeNow,
                    replyList : [],
                    isDeleted : 1,
                    createUser : reply.memberId,
                    createIp : reply.ip,
                    createDate : loc_timeNow,
                    updateUser : reply.memberId,
                    updateIp : reply.ip,
                    updateDate : loc_timeNow
                });

                loc_reply.save(function(err, reply){
                    if(err){
                        console.error("保存回帖信息失败！", err);
                        callback(err, null);
                        return;
                    }
                    callback(null, {
                        _id: reply._id,
                        content: reply.content,
                        replyDate: reply.replyDate.getTime(),
                        device: reply.device,
                        memberId: reply.createUser
                    });
                });
            }else{
                loc_reply = {
                    _id: replyId,
                    topicId: reply.topicId,
                    type : reply.type,
                    content: reply.content,
                    device: reply.device,
                    replyDate: loc_timeNow,
                    isDeleted: 1,
                    createUser: reply.memberId,
                    createIp: reply.ip,
                    createDate: loc_timeNow,
                    updateUser: reply.memberId,
                    updateIp: reply.ip,
                    updateDate: loc_timeNow
                };
                Reply.findOneAndUpdate({_id : reply.replyId},{$push : {"replyList": loc_reply}}, {"new" : true}, function(err, reply){
                    if(err || !reply || !reply.replyList || reply.replyList.length < 1){
                        console.error("回帖失败--保存回帖信息失败！", err);
                        callback(err, null);
                        return;
                    }
                    reply = reply.replyList.pop();
                    callback(null, {
                        _id: reply._id,
                        content: reply.content,
                        replyDate: reply.replyDate.getTime(),
                        device: reply.device,
                        memberId: reply.createUser
                    });
                });
            }
        });
    },

    /**
     * 回帖
     * @param opType 1-主帖回复，2-回帖回复(需要回帖id)
     * @param reply
     * @param callback
     */
    addReply : function(opType, reply, callback){
        FinanceUserService.getMemberById(reply.memberId, function(err, member){
            if(err){
                console.error("回帖失败--查询用户信息失败！", err);
                callback(APIUtil.APIResult("code_2010", null, null));
                return;
            }
            //用户非禁言状态才可发帖
            if(member && member.loginPlatform && member.loginPlatform.financePlatForm && member.loginPlatform.financePlatForm.isGag === 0){
                ReplyService.doAdd(opType, reply, function(err, replyResult){
                    if(err){
                        callback(APIUtil.APIResult("code_2035", null, null));
                        return;
                    }
                    if(reply.type == 1){  //只有帖子才会推送回复消息，文章不推送
                        if(reply.memberId != reply.sMemberId){   //发帖与回帖同一个人，不推送消息
                            ReplyService.replyTopicPushMessage(reply.topicId,member.loginPlatform.financePlatForm.nickName,reply.sMemberId);
                        }
                    }
                    FinanceUserService.modifyById(reply.memberId, {$inc : {"loginPlatform.financePlatForm.replyCount" : 1}}, function(err){
                        if(err){
                            console.error("更新用户回帖数失败！", err);
                            callback("code_2053", null);
                            return;
                        }
                        //回复主贴
                        if(opType === 1){
                            TopicStatisticalService.reply(reply.topicId, reply.type, reply.ip, function(err){
                                if(err){
                                    console.error("回帖失败--更新帖子统计信息失败！", err);
                                    callback(APIUtil.APIResult("code_2035", null, null));
                                    return;
                                }
                                callback(APIUtil.APIResult(null, replyResult, null));
                            });
                        }else{
                            callback(APIUtil.APIResult(null, replyResult, null));
                        }
                    });
                });
            }else{
                console.error("回帖失败--用户被禁言！", err);
                callback(APIUtil.APIResult("code_2015", null, null));
            }
        });
    },

    /**
     * 功能：回复帖子时推送消息
     * @param topicId 帖子Id
     * @param replyUserName 回帖人昵称
     * @param sendTopicUser  发帖人Id
     */
    replyTopicPushMessage : function(topicId,replyUserName,sendTopicUserId){
        var content = replyUserName+"评论了您的发帖       "+Utils.formatTime(new Date().getTime()),tag = [sendTopicUserId];
        var extra = {
            "dataid": topicId ,        //帖子Id
            "lang": 'zh',              //语言
            "tipType" : '2' ,            //显示方式  (1、系统通知中心 2、小秘书 3、首次登陆时弹窗)
            "messageType" : 4              //显示方式为小秘书的Tab类型 (1:自定义 2：文章资讯 3：关注订阅 4：评论提醒  5:公告 6:反馈)
        };
        pushService.doPushMessage(2,'蜘蛛投资',content,tag,extra,function(apiResult) {
            console.info(apiResult);
            var curTime = new Date();
            var pushMessage = {
                dataid : topicId,                  //数据Id
                title : content,                   //标题
                lang: 'zh',                        //语言
                platform : 'finance',             //应用平台
                tipType : '2' ,                    //小秘书
                messageType : 4 ,                  //评论提醒
                publishStartDate : curTime,       //发布开始时间
                publishEndDate : curTime,         //发布结束时间
                pushDate : curTime,               //推送时间
                pushMember : sendTopicUserId,     //推送人
                pushStatus : 0 ,                   //推送状态默认为未推送
                valid : 1,
                isDeleted : 1,
                msgId : apiResult.data.msgId,       //推送平台返回的Id
                createDate : curTime,
                updateDate : curTime
            };
            if(apiResult.result == 0){  //推送成功
                pushMessage.pushStatus = 2;
            }else if(apiResult.result == 1){  //推送失败
                pushMessage.pushStatus = 3;
            }
            pushService.savePushMessage(pushMessage,function(err, curPushMessage){
                console.info(curPushMessage);
            })
        });
    }
};

//导出服务类
module.exports = ReplyService;

