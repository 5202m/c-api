var logger = require('../resources/logConf').getLogger("noticeService");
var Config = require('../resources/config');
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
                noticeService.socket = require('socket.io-client')(Config.noticeSocketClient);
                noticeService.socket.on('disconnect', function (socket) {
                    logger.info('socket.io-client disconnect');
                    noticeService.socket = null;
                });
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
            noticeService.socket.emit('API-notice', {type: type, data: data});
        }catch(e){
            logger.error('noticeService.send error:'+e);
        }
    }
};
//导出服务类
module.exports =noticeService;

