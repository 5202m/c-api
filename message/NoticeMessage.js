'use static';
const messageApi = require("./MessageApi");
const constant = require('../constant/constant');//引入constant
/*****
 * 处理通知类消息，通知用户离开房间，消息删除通知，字符删除通知.......
 */
class NoticeMessage{
    constructor(){
        this.noticeType = {//通知客户端类型
            pushInfo: 'pushInfo',//推送信息
            removeMsg: 'removeMsg',//移除信息
            onlineNum: 'onlineNum',//在线人数
            leaveRoom: 'leaveRoom',//离开房间
            serverTime: 'serverTime',//服务器时间
            articleInfo: 'articleInfo',//文档信息
            showTrade: 'showTrade',//推送晒单信息
            modifyRule:'modifyRule' //规则改变
        }
        this.leaveRoomFlag = {//离开房间标志
            roomClose: 'roomClose',//房间关闭或禁用或开放时间结束
            otherLogin: 'otherLogin',//被相同账号登陆
            forcedOut: 'forcedOut'//被管理员强制下线
        }
    }

    /****
     * 删除消息
     * @param groupType
     * @param groupId
     * @param msgIds
     */
    removeMsg(groupType, groupId, msgIds) {
        let msg = this.buildRemoveMsg(groupType,groupId,msgIds);
        messageApi.send(msg);
    }

    /****
     * 删除消息 消息体构造
     * @param room
     * @param msgIds
     */
    buildRemoveMsg(namespace,room, msgIds){
        return messageApi.buildData(
                                        namespace,
                                        messageApi.msgType.sendMsg,
                                        "notice",
                                        messageApi.buildRoomExt(room),
                                        {type: this.noticeType.removeMsg, data: msgIds}
        );
    }
    /**
     * 删除字幕推送信息
     */
    removePushInfo(groupType, groupId,position, ids) {
        messageApi.send(this.buildRemovePushInfo(groupType,groupId,position,ids));
    }

    /****
     * 删除字幕推送消息 消息体构造
     * @param room
     * @param position
     * @param ids
     */
    buildRemovePushInfo(namespace,room,position, ids){
        return messageApi.buildData(
                                        namespace,
                                        messageApi.msgType.sendMsg,
                                        "notice",
                                        messageApi.buildRoomExt(room),
                                        {type: this.noticeType.pushInfo, data: {position:position, ids:ids, delete:true}}
        );
    }
    /**
     * 新增或修改字幕,需要查询数据
     * @param ids
     */
    submitPushInfo(groupType, groupId, data) {
        messageApi.send(this.buildSubmitPushInfo(groupType,groupId,data));
    }

    /****
     * 新增或修改字幕,需要查询数据  消息体构造
     * @param room
     * @param data
     */
    buildSubmitPushInfo(namespace,room, data){
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "notice",
                                    messageApi.buildRoomExt(room),
                                    {type: this.noticeType.pushInfo, data:data}
        );
    }
    /**
     * 通知文档数据
     * @param articleJSON
     * @param opType
     */
    noticeArticle(groupType, groupId, data) {
        messageApi.send(this.buildNoticeArticle(groupType,groupId,data));
    }

    /****
     * 通知文档数据 消息体构造
     * @param room
     * @param data
     */
    buildNoticeArticle(namespace,room, data){
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "notice",
                                    messageApi.buildRoomExt(room),
                                    {type: this.noticeType.articleInfo, data:data}
        );
    }
    /***
     * 离开房间
     * @param groupType
     * @param groupIds
     * @param flag
     */
    leaveRoom(groupType,groupId) {
        messageApi.send(this.buildLeaveRoom(groupType,groupId,this.leaveRoomFlag.roomClose));
    }

    /****
     * 离开房间 消息体构造
     * @param room
     * @param flag
     */
    buildLeaveRoom(namespace,room,flag){
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "notice",
                                    messageApi.buildRoomExt(room),
                                    {type: this.noticeType.leaveRoom, flag:flag}
        );
    }

    /**
     * 根据uuid离开房间
     * @param groupType
     * @param uuid
     * @param flag
     */
    leaveRoomByUserId(groupType,uuid) {
       messageApi.send(this.buildLeaveRoomByUserId(groupType,uuid,this.leaveRoomFlag.forcedOut));
    }

    /****
     * 根据uuid离开房间 消息体构造
     * @param uuid
     * @param flag
     */
    buildLeaveRoomByUserId(namespace,uuid, flag){
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "notice",
                                    messageApi.buildUserExt(null,uuid),
                                    {type: this.noticeType.leaveRoom, flag:flag}
        );
    }
    /**
     * 重复登录退出房间
     * @param groupType
     * @param uuid
     * @param flag
     */
    leaveRoomByOtherLogin(groupType,socketId) {
        messageApi.send(this.buildLeaveRoomByOtherLogin(groupType,socketId,this.leaveRoomFlag.otherLogin));
    }

    /****
     * 重复登录退出房间 消息体构造
     * @param uuid
     * @param flag
     */
    buildLeaveRoomByOtherLogin(namespace,socketId, flag){
        return messageApi.buildData(
            namespace,
            messageApi.msgType.sendMsg,
            "notice",
            messageApi.buildUserExt(socketId,null),
            {type: this.noticeType.leaveRoom, flag:flag}
        );
    }
    /****
     * 发送在线人数消息
     * @param baseData
     * @param userInfo
     */
    sendOnlineNum(namespace,room,userInfo,online){
        messageApi.send(this.buildSendOnlineNum(namespace,room,userInfo,online));
    }

    /****
     * 发送在线通知 消息体构建
     * @param room
     * @param userInfo
     * @param online
     */
    buildSendOnlineNum(namespace,room,userInfo,online){
        return messageApi.buildData(
                            namespace,
                            messageApi.msgType.sendMsg,
                            "notice",
                            messageApi.buildRoomExt(room),
                            {type: this.noticeType.onlineNum, data: {onlineUserInfo: userInfo, online: online}}
        );
    }

    /****
     * 私聊区域消息推送
     * @param namespace
     * @param room
     * @param info
     */
    whChatPushInfo(namespace,to,info){
        messageApi.send(this.buildWhChatPushInfo(namespace,to,info));
    }

    /****
     * 私聊区域消息推送 消息体构建
     * @param room
     * @param info
     */
    buildWhChatPushInfo(namespace,to,info){
        let ext = {};
        if(to.room){
            ext = messageApi.buildRoomExt(to.room)
        }else{
            ext = messageApi.buildUserExt(to.socketId,to.uuid);
        }
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "notice",
                                    ext,
                                    {type: this.noticeType.pushInfo, data: {position: constant.pushInfoPosition.whBox, infos: info}}
        );

    }
    /****
     * 公聊消息推送
     * @param namespace
     * @param to
     * @param info
     */
    chatPushInfo(namespace,to,info){
        messageApi.send(this.buildChatPushInfo(namespace,to,info));
    }

    /****
     * 公聊消息推送消息体构建
     * @param to
     * @param info
     */
    buildChatPushInfo(namespace,to,info){
        let ext = {};
        if(to.room){
            ext = messageApi.buildRoomExt(to.room)
        }else{
            ext = messageApi.buildUserExt(to.socketId,to.uuid);
        }
        let pushData =  messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "notice",
                                    ext,
                                    {type: this.noticeType.pushInfo, data: {position: constant.pushInfoPosition.talkBox, infos: info}}
        );
        return pushData;
    }


    /****
     * 视频框消息推送
     * @param namespace
     * @param to
     * @param info
     */
    videoPushInfo(namespace,to,info){
        messageApi.send(this.buildVideoPushInfo(namespace,to,info));
    }

    /****
     * 视频框消息推送消息体构建
     * @param to
     * @param info
     */
    buildVideoPushInfo(namespace,to,info){
        let ext = {};
        if(to.room){
            ext = messageApi.buildRoomExt(to.room)
        }else{
            ext = messageApi.buildUserExt(to.socketId,to.uuid);
        }
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "notice",
                                    ext,
                                    {type: this.noticeType.pushInfo, data: {position: constant.pushInfoPosition.videoBox, infos: info}}
        );
    }

    /*****
     * 服务器时间推送
     * @param namespace
     * @param room
     */
    serverTimePushInfo(namespace,socketId,uuid){
        messageApi.send(this.buildServerTimePushInfo(namespace,socketId,uuid));
    }

    /****
     * 服务器时间推送消息体构建
     * @param room
     */
    buildServerTimePushInfo(namespace,socketId,uuid){
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "notice",
                                    messageApi.buildUserExt(socketId,uuid),
                                    {type: this.noticeType.serverTime, data: new Date().getTime()}
        );
    }

    modifyRulePushInfo(namespace,room,ruleInfo){
        messageApi.send(messageApi.buildData(namespace,messageApi.msgType.sendMsg,"notice",
            messageApi.buildRoomExt(room),{type: this.noticeType.modifyRule, data:ruleInfo}));
    }

    showTradePushInfo(namespace,tradeInfoResult){
        messageApi.send(messageApi.buildData(namespace,messageApi.msgType.sendMsg,"notice",
            messageApi.buildNamespaceExt(namespace),{type: this.noticeType.showTrade,data:tradeInfoResult}));
    }
}
module.exports = new NoticeMessage();