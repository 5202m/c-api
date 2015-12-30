var logger = require('../resources/logConf').getLogger("chatService");
var chatMessage = require('../models/chatMessage');//引入chatMessage数据模型
var chatSyllabus = require('../models/chatSyllabus');//引入chatMessage数据模型
var common = require('../util/common');//引入common类
var ApiResult = require('../util/ApiResult');
var APIUtil = require('../util/APIUtil');
var async = require('async');//引入async
/**
 * 聊天室相关信息服务类
 * author Alan.wu
 */
var chatService ={
    /**
     * 提取聊天信息
     */
    getMessagePage:function (params,callback){
        var roomCode=params.roomCode;
        if(common.isBlank(roomCode)){
            roomCode='wechat';
        }
        var searchObj = {'toUser.talkStyle':0, groupType:roomCode,status:1,valid:1,'content.msgType':'text',userType:{'$in':[0,2]}};
        var currDate=new Date();
        if(common.isValid(params.userType)){
            searchObj.userType=params.userType;
        }
        if(common.isValid(params.nickname)){
            searchObj.nickname=params.nickname;
        }
        var from = (params.pageNo-1) * params.pageSize;
        var orderByJsonObj={publishTime: -1 };
        if(common.isValid(params.orderByJsonStr)){
            orderByJsonObj=JSON.parse(params.orderByJsonStr);
        }
        async.parallel({
                list: function(callbackTmp){
                    chatMessage.find(searchObj).skip(from)
                        .limit(params.pageSize)
                        .sort(orderByJsonObj)
                        .select("avatar toUser userType nickname content.msgType content.value publishTime")
                        .exec('find',function (err,infos) {
                            if(err){
                                logger.error(err);
                                callbackTmp(null,null);
                            }else{
                                var dataList=[],row=null,newRow=null;
                                for(var i in infos){
                                    row=infos[i];
                                    newRow={avatar:row.avatar,userType:row.userType,nickname:row.nickname,content:row.content.value,publishTime:row.publishTime.replace(/_.+/,"")};
                                    if(common.isValid(row.toUser.userId) && common.isValid(row.toUser.question)){
                                        newRow.questionInfo={nickname:row.toUser.nickname,question:row.toUser.question};
                                    }
                                    dataList.push(newRow);
                                }
                                callbackTmp(null,dataList);
                            }
                        });
                },
                totalSize: function(callbackTmp){
                    chatMessage.find(searchObj).count(function(err,rowNum){
                        callbackTmp(null,rowNum);
                    });
                }
            },
            function(err, results) {
                callback(ApiResult.page(params.pageNo,params.pageSize,results.totalSize,results.list));
         });
    },
    /**
     * 检查客户是否已经点赞
     * 已点赞返回false，否则返回true
     */
    checkChatPraise:function(clientId,praiseId,fromPlatform,callback){
        var cacheClient=require('../cache/cacheClient');
        var key='chatPraise_'+fromPlatform+'_'+clientId+'_'+praiseId;
        cacheClient.hgetall(key,function(err,result){
            if(!err && result){
                callback(false);
            }else{
                cacheClient.hmset(key,'createTime',Date());
                cacheClient.expire(key,24*3600);
                callback(true);
            }
        });
    },

    /**
     * 查询聊天室课程安排
     * @param groupType
     * @param groupId
     * @param callback
     */
    getSyllabus : function(groupType, groupId, callback){
        groupId = groupId || "";
        APIUtil.DBFindOne(chatSyllabus, {
            query : {
                groupType : groupType,
                groupId : groupId
            }
        }, function(err, syllabus){
            if(err){
                logger.error("查询聊天室课程安排失败!", err);
                callback(APIUtil.APIResult("code_10", null, null));
                return;
            }
            callback(APIUtil.APIResult(null, syllabus, null));
        });
    }
};
//导出服务类
module.exports =chatService;

