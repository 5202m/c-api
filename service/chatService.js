var chatMessage = require('../models/chatMessage');//引入chatMessage数据模型
var common = require('../util/common');//引入common类
var ApiResult = require('../util/ApiResult');
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
        var searchObj = {groupId:'wechat',status:1,valid:1,'content.msgType':'text',userType:{'$in':[0,2]}};
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
                        .select("userType nickname content.msgType content.value publishTime")
                        .exec('find',function (err,infos) {
                            if(err){
                                console.error(err);
                                callbackTmp(null,null);
                            }else{
                                var dataList=[],row=null;
                                for(var i in infos){
                                    row=infos[i];
                                    dataList.push({userType:row.userType,nickname:row.nickname,content:row.content.value,publishTime:row.publishTime.replace(/_.+/,"")});
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
    }
};
//导出服务类
module.exports =chatService;

