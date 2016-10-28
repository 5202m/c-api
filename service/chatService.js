var logger = require('../resources/logConf').getLogger("chatService");
var chatMessage = require('../models/chatMessage');//引入chatMessage数据模型
var BoUser = require('../models/boUser');//引入boUser数据模型
var ChatPraise = require('../models/chatPraise');//引入chatPraise数据模型
var common = require('../util/common');//引入common类
var ApiResult = require('../util/ApiResult');
var async = require('async');//引入async
var config = require('../resources/config');
var constant = require('../constant/constant');
var ObjectId = require('mongoose').Types.ObjectId;
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
        var isNullCode=common.isBlank(roomCode);
        if(isNullCode){
            roomCode = constant.studioGroupType.studio;
        }
        var searchObj = {'toUser.talkStyle':0, groupType:roomCode,status:1,valid:1,'content.msgType':'text'};
        var isStudio = (roomCode==constant.studioGroupType.studio || roomCode==constant.studioGroupType.fxstudio);
        if(isStudio){
            searchObj.groupId=constant.studioDefRoom[roomCode];
            var lastTm=params.lastPublishTime;
            if(common.isValid(lastTm)){
                params.pageNo=1;
                params.pageSize=10000;
                searchObj.publishTime = { "$gt":lastTm};
            }
        }else{
            searchObj.userType={'$in':[0,2]};
        }
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
                                    newRow={avatar:row.avatar,userType:row.userType,nickname:row.nickname,content:row.content.value};
                                    if(isStudio && !isNullCode){
                                        newRow.toUser=row.toUser;
                                        newRow.publishTime=row.publishTime;
                                    }else{
                                        newRow.publishTime=row.publishTime.replace(/_.+/,"");
                                        if(common.isValid(row.toUser.userId) && common.isValid(row.toUser.question)){
                                            newRow.questionInfo={nickname:row.toUser.nickname,question:row.toUser.question};
                                        }
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
     * 提取分析师信息
     * @param platform
     * @param analystIds
     * @param callback
     */
    getAnalystInfo : function(platform, analystIds, callback){
        var ids = analystIds.split(/\s*[,，]\s*/);
        if(!ids || ids.length == 0){
            callback(null);
            return;
        }
        async.parallel({
            userInfo: function(callbackTmp){
                BoUser.find({
                    userNo: {"$in": ids}
                },callbackTmp);
            },
            praise: function(callbackTmp){
                ChatPraise.find({
                    fromPlatform : platform,
                    praiseType : "user",
                    praiseId :{$in : ids}
                }, callbackTmp);
            }
        }, function(err, results) {
            var userMap = {}, praiseMap = {};
            var i, lenI;
            for(i = 0, lenI = !results.userInfo ? 0 : results.userInfo.length; i < lenI; i++){
                userMap[results.userInfo[i].userNo] = results.userInfo[i];
            }
            for(i = 0, lenI = !results.praise ? 0 : results.praise.length; i < lenI; i++){
                praiseMap[results.praise[i].praiseId] = results.praise[i];
            }
            var result = [], analyst,user;
            for(i = 0, lenI = ids.length; i < lenI; i++){
                analyst = {
                    userNo : ids[i],
                    userName : "",
                    position : "",
                    avatar : "",
                    introduction : "",
                    wechatCode : "",
                    tag : "",
                    winRate : "",
                    earningsM : "",
                    praise : 0
                };
                if(userMap.hasOwnProperty(analyst.userNo)){
                    user = userMap[analyst.userNo];
                    analyst.userName = user.userName;
                    analyst.position = user.position;
                    analyst.avatar = user.avatar;
                    analyst.introduction = user.introduction;
                    analyst.wechatCode = user.wechatCode;
                    analyst.tag = user.tag;
                    analyst.winRate = user.winRate;
                    analyst.earningsM = user.earningsM;
                }
                if(praiseMap.hasOwnProperty(analyst.userNo)){
                    analyst.praise = praiseMap[analyst.userNo].praiseNum;
                }
                result.push(analyst);
            }
            callback(result);
        });
    },

    /**
     * 分析师点赞
     */
    praiseAnalyst : function(platform, analystId, callback){
        ChatPraise.findOne({
            fromPlatform : platform,
            praiseType : "user",
            praiseId : analystId
        }, function(err, row){
            if(err){
                logger.error("praiseAnalyst->find fail!:"+err);
                callback({isOK:false, msg:'更新失败', num : 0});
                return;
            }
            if(row){
                if(!row.praiseNum){
                    row.praiseNum = 1;
                }else {
                    row.praiseNum += 1;
                }
            }else{
                row = new ChatPraise({
                    _id: new ObjectId(),
                    praiseId: analystId,
                    praiseType: "user",
                    fromPlatform: platform,
                    praiseNum: 1,
                    remark: ""
                });
            }
            row.save(function(err1, rowTmp){
                if (err1) {
                    logger.error('praiseAnalyst=>save fail!' + err1);
                    callback({isOK: false, msg: '更新失败', num : 0});
                    return;
                }
                callback({isOK:true, msg:'', num: rowTmp.praiseNum});
            });
        });
    }
};
//导出服务类
module.exports =chatService;

