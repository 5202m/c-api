/** 用户服务类
 * Created by Alan.wu on 2015/3/4.
 */
var logger = require('../resources/logConf').getLogger("userService");
var member = require('../models/member');//引入member数据模型

/**
 * 定义用户服务类
 */
var userService = {
    /**
     * 提取会员信息
     */
    getMemberList:function(id,callback){
        member.findById(id,function (err,members) {
            if(err!=null){
                callback(null);
            }
            callback(members);
        });
    },

    /**
     * 按照手机号查询用户信息
     * @param params  {{mobilePhone:String, groupType:String}}
     * @param callback
     */
    getMemberByMobile: function(params, callback){
        member.findOne({
            valid:1,
            status:1,
            mobilePhone:params.mobilePhone,
            "loginPlatform.chatUserGroup._id":params.groupType
        }, {
            "mobilePhone": 1,
            "loginPlatform.chatUserGroup.$": 1
        }, function(err, data){
            if(err || !data){
                if(err){
                    logger.error("getMemberByMobile>>get momber info error:"+ err);
                }
                callback(err, null);
                return;
            }
            var result = {
                mobilePhone : data.mobilePhone
            };
            if(data.loginPlatform && data.loginPlatform.chatUserGroup && data.loginPlatform.chatUserGroup.length > 0){
                var chatUserGroup = data.loginPlatform.chatUserGroup[0];
                result.groupType = chatUserGroup._id;
                result.userId = chatUserGroup.userId;
                result.avatar = chatUserGroup.avatar;
                result.nickname = chatUserGroup.nickname;
                result.userType = chatUserGroup.userType;
                result.vipUser = chatUserGroup.vipUser;
                result.clientGroup = chatUserGroup.clientGroup;
                result.createDate = (chatUserGroup.createDate instanceof Date ? chatUserGroup.createDate.getTime() : 0);
                var rooms = [], room;
                for(var i = 0, lenI = chatUserGroup.rooms ? chatUserGroup.rooms.length : 0; i < lenI; i++){
                    room = chatUserGroup.rooms[i];
                    rooms.push({
                        roomId : room._id,
                        onlineStatus : room.onlineStatus,
                        sendMsgCount : room.sendMsgCount,
                        onlineDate : (room.onlineDate instanceof Date ? room.onlineDate.getTime() : 0),
                        offlineDate : (room.offlineDate instanceof Date ? room.offlineDate.getTime() : 0)
                    });
                }
                result.rooms = rooms;
            }
            callback(null, result);
        });
    }
};

//导出服务类
module.exports =userService;

