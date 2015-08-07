var chatMessage = require('../models/chatMessage');//引入chatMessage数据模型
var common = require('../util/common');//引入common类
/**
 * 聊天室相关信息服务类
 * author Alan.wu
 */
var chatService ={
    /**
     * 提取聊天信息
     */
    getMessageList:function (params,callback){
        var searchObj = {groupId:'wechat',status:1,valid:1,'content.msgType':'text'};
        var currDate=new Date();
        if(common.isValid(params.userType)){
            searchObj.userType=params.userType;
        }
        if(common.isValid(params.nickname)){
            searchObj.nickname=params.nickname;
        }
        var from = (params.curPageNo-1) * params.pageSize;
        var query = chatMessage.find(searchObj);
        var orderByJsonObj={publishTime: -1 };
        if(common.isValid(params.orderByJsonStr)){
            orderByJsonObj=JSON.parse(params.orderByJsonStr);
        }
        query.skip(from)
            .limit(params.pageSize)
            .sort(orderByJsonObj)
            .select("userType nickname content.msgType content.value publishTime")
            .exec('find',function (err,infos) {
                if(err){
                    console.error(err);
                    callback(null);
                }else{
                    callback(infos);
                }
            });
    }
};
//导出服务类
module.exports =chatService;

