var logger = require('../resources/logConf').getLogger("noticeService");
var Config = require('../resources/config');
var Common = require('../util/common');
var chatMessage = require("../message/ChatMessage");
/**
 * 财经日历信息推送服务类
 * author Alan.wu
 */
var noticeService ={
    socket:null,
    /**
     * 设置socket连接相关信息
     * @param server
     */
    init: function () {
        if(noticeService.socket==null) {
            try {
                /*noticeService.socket = require('socket.io-client')(Config.noticeSocketClient);
                noticeService.socket.on('disconnect', function (socket) {
                    logger.info('socket.io-client disconnect');
                    noticeService.socket = null;
                });*/
            }catch (e){
                logger.error('noticeService.socket:'+e);
            }
        }
    },
    /**
     * 推送消息
     * @param type
     * @param data
     */
    send:function(type, data){
        noticeService.init();
        try {
            logger.info('noticeService.send[API-notice]:', JSON.stringify({type: type, data: data}));
            //noticeService.socket.emit('API-notice', {type: type, data: data});
            //TODO 此处为临时写死使用fxFinance 应根据实际直播间 命名空间
            chatMessage.sendMsgByNamespace("/fxFinance",type,data);
        }catch(e){
            logger.error('noticeService.send error:'+e);
        }
    },

    /**
     * 推送消息到APP
     */
    pushToApps : function(platTypeKey, msgObj, callback){
        if(Config.gwApiOauthKeys.hasOwnProperty(platTypeKey) == false){
            logger.error("pushToApps << config is error." + platTypeKey);
            callback(false, null);
        }
        var params = {
            token : "",
            timeStamp : new Date().getTime(),
            platTypeKey : platTypeKey,
            platAccount : "",
            msg : JSON.stringify(msgObj)
        };
        params.token = Common.getMD5(params.platAccount + Config.gwApiOauthKeys[platTypeKey] + params.timestamp);

        request.post({strictSSL:false,url:(Config.gwApiUrl+'/restmsg/pushmsg.json'),form:params}, function(error,response,data){
            if(error){
                logger.error("pushToApps << has error:"+error);
                callback(false, null);
            }else{
                try {
                    callback(true, data ? JSON.parse(data) : null);
                }catch(e){
                    logger.error("pushToApps << has error:"+e);
                    callback(false, null);
                }
            }
        });
    }
};
//导出服务类
module.exports =noticeService;

