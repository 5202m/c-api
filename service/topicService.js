/**
 * 摘要：帖子Service服务类
 * author:Gavin.guo
 * date:2015/7/1
 */
var Topic = require('../models/topic');	                    //引入topic数据模型
var commonJs = require('../util/common'); 	 	            //引入公共的js
var IdSeqManager = require('../constant/IdSeqManager.js');  //引入序号生成器js
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var Config=require('../resources/config.js');
var FinanceUserService = require('../service/financeUserService.js');
var ReplyService = require('../service/replyService.js');
var TopicStatisticalService = require('../service/topicStatisticalService.js');
var pushService = require('../service/pushService.js');     //推送消息接口

/**
 * 定义帖子Service类
 */
var TopicService = {
    /**
     * 功能：获取帖子列表
     * @param  params {{subjectType : "主题类别", memberId: "发帖人", prodCode:"产品Id"}}
     * @param  pageLast
     * @param  pageSize    每页显示条数
     * @param  callback
     */
    getTopicList : function(params, pageLast, pageSize, callback){
        var searchObj = {infoStatus:1,isDeleted:1};
        if(!commonJs.isBlank(params.subjectType)){
            searchObj.subjectType = params.subjectType;
        }
        if(!commonJs.isBlank(params.memberId)){
            searchObj.memberId = params.memberId;
        }
        if(!commonJs.isBlank(params.prodCode)){
            searchObj["expandAttr.productCode"] = params.prodCode;
        }

        APIUtil.DBPage(Topic, {
            pageLast : pageLast,
            pageSize : pageSize,
            pageId : "_id",
            pageDesc : true,
            query : searchObj
        },function(err, topics, page){
            if(err){
                console.error("查询帖子列表失败!", err);
                callback(APIUtil.APIResult("code_2021", null, null));
                return;
            }

            TopicService.completeTopicInfo(topics, function(err, topics){
                if(err){
                    callback(APIUtil.APIResult("code_2021", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, topics, page));
            });
        });
    },

    /**
     * 完善帖子信息： 帖子统计信息 + 发帖人信息 + 回帖信息(首条) + 回帖人信息
     * @param topics
     * @param callback
     */
    completeTopicInfo : function(topics, callback){
        var loc_topics = [];
        var loc_topic = null;
        for(var i = 0, lenI = !topics ? 0 : topics.length; i < lenI; i++){
            loc_topic = topics[i].toObject();
            loc_topic.publishTime = loc_topic.publishTime.getTime();
            loc_topic.type = 1;
            loc_topic.content = commonJs.filterContentHTML(loc_topic.content);
            loc_topics.push(loc_topic);
        }

        if(loc_topics.length === 0){
            callback(null, []);
            return;
        }

        //查询帖子统计信息
        TopicStatisticalService.getStatisticals(loc_topics, function(err, topicStatisticals){
            if(err){
                console.error("查询帖子统计信息失败!", err);
                callback(err, null);
                return;
            }

            //查询帖子首条回帖信息
            ReplyService.getFirstReplyByTopics(topicStatisticals, function(err, topicReplys){
                if(err){
                    console.error("查询回帖信息失败!", err);
                    callback(err, null);
                    return;
                }
                var loc_memberIds = [];
                var loc_topic = null;
                for(var i = 0, lenI = topicReplys.length; i < lenI; i++){
                    loc_topic = topicReplys[i];
                    loc_memberIds.push(loc_topic.memberId);
                    if(loc_topic.reply){
                        loc_memberIds.push(loc_topic.reply.memberId);
                    }
                }
                //查询发帖人，回帖人信息
                FinanceUserService.getMemberInfoByMemberIds(loc_memberIds, function(err, members){
                    if(err){
                        console.error("查询发帖人信息失败!", err);
                        callback(err, null);
                        return;
                    }

                    var loc_topic = null;
                    var lenJ = !members ? 0 : members.length;
                    var j, flags = null, loc_member = null;
                    for(var i = 0, lenI = topicReplys.length; i < lenI; i++){
                        loc_topic = topicReplys[i];
                        flags = [true, loc_topic.reply !== null];
                        for(j = 0; j < lenJ; j++){
                            loc_member = members[j];

                            if(flags[0] && loc_topic.memberId === loc_member._id.toString()){
                                loc_topic.memberAvatar = loc_member.loginPlatform.financePlatForm.avatar;
                                loc_topic.memberName = loc_member.loginPlatform.financePlatForm.nickName;
                                loc_topic.introduce = loc_member.loginPlatform.financePlatForm.introduce;
                                loc_topic.memberAttentionCnt = loc_member.loginPlatform.financePlatForm.beAttentions.length;
                                flags[0] = false;
                            }
                            if(flags[1] && loc_topic.reply.memberId === loc_member._id.toString()){
                                loc_topic.reply.memberAvatar = loc_member.loginPlatform.financePlatForm.avatar;
                                loc_topic.reply.memberName = loc_member.loginPlatform.financePlatForm.nickName;
                                loc_topic.reply.introduce = loc_member.loginPlatform.financePlatForm.introduce;
                                loc_topic.reply.memberAttentionCnt = loc_member.loginPlatform.financePlatForm.beAttentions.length;
                                flags[1] = false;
                            }
                            if(flags[0] === false && flags[1] === false){
                                break;
                            }
                        }
                        if(flags[0]){
                            loc_topic.memberAvatar = "";
                            loc_topic.memberName = "";
                            loc_topic.introduce = "";
                            loc_topic.memberAttentionCnt = 0;
                        }
                        if(flags[1]){
                            loc_topic.reply.memberAvatar = "";
                            loc_topic.reply.memberName = "";
                            loc_topic.reply.introduce = "";
                            loc_topic.reply.memberAttentionCnt = 0;
                        }
                    }
                    callback(null, topicReplys);
                });
            });
        });
    },

    /**
     * 按照帖子编号获取帖子列表
     * @param topicIds
     * @param callback
     */
    getTopicByIds : function(topicIds, callback){
        if(!topicIds || topicIds.length === 0){
            callback(null, []);
            return;
        }
        APIUtil.DBFind(Topic, {
            query : {
                infoStatus:1,
                isDeleted:1,
                _id : {$in : topicIds}
            }
        },callback)
    },

    /**
     * 获取帖子详情 :分页信息用于帖子的回复列表
     * @param opType 1-查询帖子详情，以及最新指定数量的回帖信息，2-仅按照分页信息查询回帖
     * @param topicId
     * @param pageLast
     * @param pageSize
     * @param callback
     */
    getTopicDetail : function(opType, topicId, pageLast, pageSize, callback){
        if(opType === 2){
            ReplyService.getReplysWithMember(topicId, 1, pageLast, pageSize, function(err, replys, page){
                if(err){
                    console.error("查询帖子回帖信息失败！", err);
                    callback(APIUtil.APIResult("code_2033", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, {"_id" : topicId, "replys" : replys}, page));
            });
        }
        else if(opType === 1){
            APIUtil.DBFindOne(Topic,
                {
                    query : {
                        infoStatus : 1,
                        isDeleted  : 1,
                        "_id"  : topicId
                    }
                },
                function(err, topic){
                    if(err){
                        console.error("查询帖子详情失败！", err);
                        callback(APIUtil.APIResult("code_2033", null, null));
                        return;
                    }
                    if(!topic){
                        callback(APIUtil.APIResult(null, null, null));
                        return;
                    }
                    var loc_topic = topic.toObject();
                    loc_topic.publishTime = loc_topic.publishTime instanceof Date ? loc_topic.publishTime.getTime() : 0;
                    loc_topic.type = 1;
                    TopicStatisticalService.getStatistical(loc_topic._id, 1, function(err, statistical){
                        if(err){
                            console.error("查询帖子详情--帖子统计信息失败！", err);
                            callback(APIUtil.APIResult("code_2033", null, null));
                            return;
                        }
                        if(statistical){
                            loc_topic.praiseCounts = statistical.praiseCounts;
                            loc_topic.replyCounts = statistical.replyCounts;
                        }else{
                            loc_topic.praiseCounts = 0;
                            loc_topic.replyCounts = 0;
                        }
                        FinanceUserService.getMemberById(loc_topic.memberId, function(err, member){
                            if(err){
                                console.error("查询帖子详情--发帖人信息失败！", err);
                                callback(APIUtil.APIResult("code_2033", null, null));
                                return;
                            }
                            if(member){
                                var loc_member = member.toObject();
                                loc_topic.memberAvatar = loc_member.loginPlatform.financePlatForm.avatar;
                                loc_topic.memberName = loc_member.loginPlatform.financePlatForm.nickName;
                            }else{
                                loc_topic.memberAvatar = "";
                                loc_topic.memberName = "";
                            }

                            //获取回复列表
                            ReplyService.getReplysWithMember(topicId, 1, pageLast, pageSize, function(err, replys, page){
                                if(err){
                                    console.error("查询帖子回帖信息失败！", err);
                                    callback(APIUtil.APIResult("code_2033", null, null));
                                    return;
                                }
                                loc_topic.replys = replys;
                                callback(APIUtil.APIResult(null, loc_topic, page));
                            });
                        });
                    });
                });
        }
    },

    /**
     * 关注/粉丝列表
     * @param opType 1-关注列表、2-粉丝列表
     * @param memberId
     * @param pageLast
     * @param pageSize
     * @param callback
     */
    attentionList : function(opType, memberId, pageLast, pageSize, callback){
        FinanceUserService.getAttentionList(opType, memberId, pageLast, pageSize, function(err, members, page){
            if(err){
                callback(APIUtil.APIResult(err, null, null));
                return;
            }
            if(opType === 2){
                //粉丝列表不查询发帖信息
                callback(APIUtil.APIResult(null, members, page));
                return;
            }
            //查询发帖信息
            var loc_memberIds = [];
            for(var i = 0, lenI = members.length; i < lenI; i++){
                loc_memberIds.push(members[i].memberId);
            }
            TopicService.getFirstTopicByMemberIds(loc_memberIds, function(err, topics){
                if(err){
                    console.error("查询关注人发帖信息失败！", err);
                    callback("code_2021", null, null);
                    return;
                }
                var loc_memberId = null;
                var loc_topics = [];
                for(var i = 0, lenI = members.length; i < lenI; i++){
                    loc_memberId = members[i].memberId;
                    for(var j = 0, lenJ = topics.length; j < lenJ; j++){
                        if(loc_memberId === topics[j].memberId){
                            members[i].topic = topics[j];
                            loc_topics.push(members[i].topic);
                            break;
                        }
                    }
                }

                TopicStatisticalService.getStatisticals(loc_topics, function(err) {
                    if (err) {
                        console.error("查询帖子统计信息失败!", err);
                        callback(err, null);
                        return;
                    }
                    callback(APIUtil.APIResult(null, members, page));
                });
            });
        });
    },

    /**
     * 功能：删除帖子
     * @param topicId 帖子ID
     * @param callback
     */
    deleteTopic : function(topicId, callback){
        ReplyService.modifyByUpdater({topicId : topicId}, {$set : {isDeleted : 0}}, function(err){
            if(err){
                console.error("删除回帖信息失败", err);
                callback(APIUtil.APIResult("code_2022", null, null));
                return;
            }
            TopicService.modifyById(topicId, {$set : {isDeleted : 0}}, function(err, topic){
                if(err){
                    console.error("删除帖子信息失败", err);
                    callback(APIUtil.APIResult("code_2022", null, null));
                    return;
                }
                FinanceUserService.modifyById(topic.memberId, {$inc : {"loginPlatform.financePlatForm.topicCount" : -1}}, function(err){
                    if(err){
                        console.error("更新用户发帖数失败！", err);
                        callback(APIUtil.APIResult("code_2022", null, null));
                        return;
                    }
                    FinanceUserService.modifyByUpdater(
                        {"loginPlatform.financePlatForm.collects" : {
                            "$elemMatch" : {
                                topicId : topic._id,
                                type : 1
                            }
                        }},
                        { $pull: {"loginPlatform.financePlatForm.collects": {
                            "$elemMatch" : {
                                topicId : topic._id,
                                type : 1
                            }
                        }}},
                        function(err){
                            if(err){
                                console.error("更新用户收藏信息失败！", err);
                                callback(APIUtil.APIResult("code_2022", null, null));
                                return;
                            }
                            callback(APIUtil.APIResult(null, null, null));
                        });
                });
            });
        });
    },

    /**
     *  发帖
     * @param topic
     *          ip String ip地址
     *          memberId String 会员Id
     *          subjectType String 主题类型
     *          expandAttr String 扩展属性
     *          publishLocation Number 发布位置
     *          device String 发帖设备
     *          title String 标题
     *          content String 发帖内容
     * @param callback
     */
    doAddTopic : function(topic, callback){
        IdSeqManager.Topic.getNextSeqId(function(err, topicId){
            if(err){
                console.error("发帖失败--获取帖子编号失败！", err);
                callback("code_2005", null);
                return;
            }
            var loc_timeNow = new Date();
            var loc_topic = new Topic({
                _id: topicId,
                memberId : topic.memberId,
                publishTime : loc_timeNow,
                topicAuthority : 0,
                isRecommend : 0,
                device : topic.device,
                subjectType : topic.subjectType,
                expandAttr : topic.expandAttr,
                infoStatus : 1,
                publishLocation : topic.publishLocation,
                title : topic.title,
                content : topic.content,
                isTop : 0,
                isDeleted : 1,
                createUser : topic.memberId,
                createIp : topic.ip,
                createDate : loc_timeNow,
                updateUser : topic.memberId,
                updateIp : topic.ip,
                updateDate : loc_timeNow
            });
            loc_topic.save(function(err, topic){
                if(err){
                    console.error("保存帖子信息失败！", err);
                    callback("code_2034", null);
                    return;
                }
                console.info("保存帖子信息成功！", topic._id);

                //发帖子时向自己的粉丝推送消息
                TopicService.sendTopicPushMessage(topicId,topic.title,topic.memberId);

                FinanceUserService.modifyById(topic.memberId, {$inc : {"loginPlatform.financePlatForm.topicCount" : 1}}, function(err){
                    if(err){
                        console.error("更新用户发帖数失败！", err);
                        callback("code_2030", null);
                        return;
                    }

                    topic = topic.toObject();
                    topic.publishTime = topic.publishTime.getTime();
                    topic.praiseCounts = 0;
                    topic.replyCounts = 0;
                    callback(null, topic);
                });
            });
        });
    },

    /**
     * 发帖
     * @param topic
     * @param callback
     */
    addTopic : function(topic, callback){
        FinanceUserService.getMemberById(topic.memberId, function(err, member){
            if(err){
                console.error("发帖失败--查询用户信息失败！", err);
                callback(APIUtil.APIResult("code_2010", null, null));
                return;
            }
            //用户非禁言状态才可发帖
            if(member && member.loginPlatform && member.loginPlatform.financePlatForm && member.loginPlatform.financePlatForm.isGag === 0){
                TopicService.doAddTopic(topic, function(err, topic){
                    if(err){
                        callback(APIUtil.APIResult(err, null, null));
                        return;
                    }
                    callback(APIUtil.APIResult(null, topic, null));
                });
            }else{
                console.error("发帖失败--用户被禁言！", err);
                callback(APIUtil.APIResult("code_2015", null, null));
            }
        });
    },

    /**
     * 修改帖子
     * 应用场景，喊单--顺便说点什么
     * @param topic
     * @param callback
     */
    modifyTopic : function(topic, callback){
        var loc_updater = {
            $set : {
                updateIp : topic.ip,
                updateDate : new Date()
            }
        };
        if(topic.content){
            loc_updater.$set.content = topic.content;
        }
        if(topic.title){
            loc_updater.$set.title = topic.title;
        }
        TopicService.modifyById(topic.topicId, loc_updater, function(err){
            if(err){
                console.error("修改帖子失败！", err);
                callback(APIUtil.APIResult("code_2043", null, null));
                return;
            }
            callback(APIUtil.APIResult(null, null, null));
        });
    },

    /**
     * 按照Id修改帖子
     * @param topicId
     * @param updater
     * @param callback
     */
    modifyById : function(topicId, updater, callback){
        Topic.findOneAndUpdate({_id : topicId}, updater, {'new' : true}, callback);
    },

    /**
     * 按照账户号列表，查询每个账户发的最新帖
     * @param memberIds
     * @param callback
     */
    getFirstTopicByMemberIds : function(memberIds, callback){
        if((memberIds instanceof Array) === false || memberIds.length === 0){
            callback(null, []);
            return;
        }
        Topic.aggregate()
            .match({'isDeleted' : 1, 'memberId' : {$in : memberIds}})
            .sort({'publishTime':'desc'})
            .group({
                _id:"$memberId",
                topicId : {$first : "$_id"},
                publishTime : {$first : "$publishTime"},
                topicAuthority : {$first : "$topicAuthority"},
                isRecommend : {$first : "$isRecommend"},
                device : {$first : "$device"},
                subjectType : {$first : "$subjectType"},
                expandAttr : {$first : "$expandAttr"},
                infoStatus : {$first : "$infoStatus"},
                publishLocation : {$first : "$publishLocation"},
                title : {$first : "$title"},
                content : {$first : "$content"},
                isTop : {$first : "$isTop"}
            })
            .exec(function(err, topics){
                if(err){
                    callback(err, null);
                    return;
                }
                var loc_topics = [];
                var loc_topic = null;
                for(var i = 0, lenI = topics ? topics.length : 0; i < lenI; i++){
                    loc_topic = topics[i];
                    loc_topic.publishTime = loc_topic.publishTime instanceof Date ? loc_topic.publishTime.getTime() : 0;
                    loc_topic.memberId = loc_topic._id;
                    loc_topic._id = loc_topic.topicId;
                    delete loc_topic["topicId"];
                    loc_topic.content = commonJs.filterContentHTML(loc_topic.content);
                    loc_topics.push(loc_topic);
                }

                callback(null, loc_topics);
            });
    },

    /**
     * 功能：发送帖子时向粉丝推送消息
     * @param title          帖子标题
     * @param sendUserId     发帖人Id
     */
    sendTopicPushMessage : function(topicId,topicTitle,sendUserId){
        FinanceUserService.getMemberById(sendUserId, function(err, member) {
            if (err) {
                console.error("回帖失败--查询用户信息失败！", err);
                callback(APIUtil.APIResult("code_2010", null, null));
                return;
            }
            var content = member.loginPlatform.financePlatForm.nickName +"发表了新帖 "+topicTitle,tag = member.loginPlatform.financePlatForm.beAttentions;
            var extra = {
                "dataid": topicId ,        //帖子Id
                "lang": 'zh',              //语言
                "tipType" : '2' ,            //显示方式  (1、系统通知中心 2、小秘书 3、首次登陆时弹窗)
                "messageType" : 3              //显示方式为小秘书的Tab类型 (1:自定义 2：文章资讯 3：关注订阅 4：评论提醒  5:公告 6:反馈)
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
                    messageType : 3 ,                  //关注订阅
                    publishStartDate : curTime,       //发布开始时间
                    publishEndDate : curTime,         //发布结束时间
                    pushDate : curTime,               //推送时间
                    pushStatus : 0 ,                   //推送状态默认为未推送
                    pushMember : member.loginPlatform.financePlatForm.beAttentions.join("#"), //推送人,多个推送人之间用#
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
        })
    }
};

//导出服务类
module.exports = TopicService;
