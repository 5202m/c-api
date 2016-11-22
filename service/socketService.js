var logger = require('../resources/logConf').getLogger("socketService");
/**
 * 财经日历信息推送服务类
 * author Alan.wu
 */
var socketService ={
    socket:null,
    /**
     * 设置socket连接相关信息
     * @param server
     */
    setSocket: function (server) {
        console.log('socket starting');
        socketService.socket=require('socket.io')(server);
        socketService.socket.on('connection', function(socket){
            //断开连接
            socket.on('disconnect',function(data){
            });
            socket.on('API-notice',function(data){
                socket.broadcast.emit('notice',data);
            });
        });
    }
};
//导出服务类
module.exports =socketService;
