/**
 * 摘要：收藏Service服务类
 * author:Dick.guo
 * date:2015/8/4
 */
var logger = require('../resources/logConf').getLogger("CollectService");
var Topic = require('../models/topic');	                    //引入topic数据模型
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var CommonJS = require('../util/common.js');
var Config=require('../resources/config.js');
var FinanceUserService = require('../service/financeUserService.js');
var ArticleService = require('../service/articleService.js');
var TopicService = require('../service/topicService.js');
var ReplyService = require('../service/replyService.js');
var TopicStatisticalService = require('../service/topicStatisticalService.js');

/**
 * 定义收藏Service类
 */
var CollectService = {

    /**
     * 收藏帖子
     * @param memberId
     * @param topicId
     * @param type 1-帖子 2-文章
     * @param callback
     */
    doCollect : function(memberId, topicId, type, callback){
        FinanceUserService.getMemberByQuery(
            {
                valid : 1,
                status : 1,
                _id : memberId,
                "loginPlatform.financePlatForm.isDeleted" : 1,
                "loginPlatform.financePlatForm.status" : 1,
                "loginPlatform.financePlatForm.collects" : {
                    "$elemMatch" : {
                        topicId : topicId,
                        type : type
                    }
                }
            },
            function(err, member){
                if(err){
                    logger.error("查询会员信息失败！", err);
                    callback(APIUtil.APIResult("code_2010", null, null));
                    return;
                }
                if(member){
                    logger.error("收藏帖子信息失败，收藏信息已存在");
                    callback(APIUtil.APIResult("code_2023", null, null));
                    return;
                }
                FinanceUserService.modifyOne(
                    {
                        _id : memberId
                    },
                    {
                        $push : {"loginPlatform.financePlatForm.collects" : {
                            topicId : topicId,
                            type : type,
                            collectDate : new Date()
                        }}
                    },
                    function(err){
                        if(err){
                            logger.error("收藏帖子信息失败", err);
                            callback(APIUtil.APIResult("code_2023", null, null));
                            return;
                        }
                        callback(APIUtil.APIResult(null, null, null));
                    }
                );
            }
        );
    },

    /**
     * 取消收藏帖子
     * @param memberId
     * @param topicId
     * @param type
     * @param callback
     */
    undoCollect : function(memberId, topicId, type, callback){
        FinanceUserService.modifyOne(
            {
                _id : memberId,
                "loginPlatform.financePlatForm.collects" : {
                    "$elemMatch" : {
                        topicId : topicId,
                        type : type
                    }
                }
            },
            {
                $pull : {
                    "loginPlatform.financePlatForm.collects" : {
                        topicId : topicId,
                        type : type
                    }
                }
            },
            function(err, data){
                if(err){
                    logger.error("取消收藏帖子信息失败", err);
                    callback(APIUtil.APIResult("code_2024", null, null));
                    return;
                }
                if(data === null){
                    logger.error("取消收藏帖子信息失败，收藏信息不存在或用户信息不存在！");
                    callback(APIUtil.APIResult("code_2024", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, null, null));
            }
        );
    },

    /**
     * 查询收藏列表
     * @param memberId
     * @param pageLast
     * @param pageSize
     * @param callback
     */
    getCollects : function(memberId, pageLast, pageSize, callback){
        FinanceUserService.getMemberById(memberId, function(err, member) {
            if (err) {
                logger.error("查询用户信息失败！", err);
                callback(APIUtil.APIResult("code_2026", null, null));
                return;
            }
            var loc_collects = member.loginPlatform.financePlatForm.collects;
            var loc_page = APIUtil.getPageInfo(pageLast, pageSize);
            loc_collects = APIUtil.getPageListByArr(loc_collects, loc_page, true, function (item) {
                return item._id;
            });

            if(!loc_collects || loc_collects.length === 0){
                callback(APIUtil.APIResult(null, [], loc_page));
                return;
            }
            var loc_topicIds = [], loc_articleIds = [];
            var loc_collect = null;
            for(var i = 0, lenI = loc_collects.length; i < lenI; i++){
                loc_collect = loc_collects[i];
                if(loc_collect.type === 1){
                    loc_topicIds.push(loc_collect.topicId);
                }else if(loc_collect.type === 2){
                    loc_articleIds.push(loc_collect.topicId)
                }
            }

            //查询收藏帖子
            TopicService.getTopicByIds(loc_topicIds, function(err, topics){
                if(err){
                    logger.error("查询帖子信息失败！", err);
                    callback(APIUtil.APIResult("code_2026", null, null));
                    return;
                }
                //查询收藏文章
                ArticleService.getArticleByIds(loc_articleIds, 'finance', function(err, articles){
                    if(err){
                        callback(APIUtil.APIResult("code_2026", null, null));
                        return;
                    }
                    //有分页，需要保持原有数据的顺序
                    var lenJ = !topics ? 0 : topics.length;
                    var lenK = !articles ? 0 : articles.length;
                    var loc_result = [];
                    var loc_resultTmp = null;
                    for(var i = 0, lenI = loc_collects.length; i < lenI; i++){
                        loc_collect = loc_collects[i];
                        if(loc_collect.type === 1){
                            for(var j = 0; j < lenJ; j++){
                                if(topics[j]._id.toString() === loc_collect.topicId){
                                    loc_resultTmp = topics[j].toObject();
                                    loc_resultTmp.type = 1;
                                    loc_resultTmp.collectDate = loc_collect.collectDate ? loc_collect.collectDate.getTime() : 0;
                                    loc_result.push(loc_resultTmp);
                                    break;
                                }
                            }
                        }else if(loc_collect.type === 2){
                            for(var k = 0; k < lenK; k++){
                                if(articles[k]._id.toString() === loc_collect.topicId){
                                    loc_resultTmp = ArticleService.convertArticle(articles[k].toObject());
                                    loc_resultTmp.collectDate = loc_collect.collectDate ? loc_collect.collectDate.getTime() : 0;
                                    loc_result.push(loc_resultTmp);
                                    break;
                                }
                            }
                        }
                    }
                    CollectService.completeTopicInfo(loc_result, function(err, topics){
                        if(err){
                            callback(APIUtil.APIResult("code_2026", null, null));
                            return;
                        }
                        callback(APIUtil.APIResult(null, topics, loc_page));
                    });
                });
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
            loc_topic = topics[i];
            loc_topic.publishTime = loc_topic.publishTime.getTime();
            loc_topic.content = CommonJS.filterContentHTML(loc_topic.content);
            loc_topics.push(loc_topic);
        }

        if(loc_topics.length === 0){
            callback(null, []);
            return;
        }

        //查询帖子统计信息
        TopicStatisticalService.getStatisticals(loc_topics, function(err, topicStatisticals){
            if(err){
                logger.error("查询帖子统计信息失败!", err);
                callback(err, null);
                return;
            }

            //查询帖子首条回帖信息
            ReplyService.getFirstReplyByTopics(topicStatisticals, function(err, topicReplys){
                if(err){
                    logger.error("查询回帖信息失败!", err);
                    callback(err, null);
                    return;
                }
                var loc_memberIds = [];
                var loc_topic = null;
                for(var i = 0, lenI = topicReplys.length; i < lenI; i++){
                    loc_topic = topicReplys[i];
                    if(loc_topic.type === 1){
                        loc_memberIds.push(loc_topic.memberId);
                    }
                    if(loc_topic.reply){
                        loc_memberIds.push(loc_topic.reply.memberId);
                    }
                }
                //查询发帖人，回帖人信息
                FinanceUserService.getMemberInfoByMemberIds(loc_memberIds, function(err, members){
                    if(err){
                        logger.error("查询发帖人信息失败!", err);
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
    }
};

//导出服务类
module.exports = CollectService;
