"use strict";
const messageApi = require("./MessageApi");
class BaseMessage{
    constructor(){}
    join(namespace,socketId,uuid,room){
        messageApi.send(this.buildJoin(namespace,socketId,uuid,room));
    }

    buildJoin(namespace,socketId,uuid,room){
        let ext = messageApi.buildFormUserExt(socketId,uuid);
        ext.room = room;
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.join,
                                    undefined,
                                    ext,
                                    undefined
        );
    }
    leave(namespace,socketId,uuid,room){
        messageApi.send(this.buildLeave(namespace,socketId,uuid,room));
    }
    buildLeave(namespace,socketId,uuid,room){
        let ext = messageApi.buildFormUserExt(socketId,uuid);
        ext.room = room;
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.leave,
                                    undefined,
                                    ext,
                                    undefined
        );
    }
    setUUID(namespace,socketId,uuid){
        messageApi.send(this.buildSetUUID(namespace,socketId,uuid));
    }

    buildSetUUID(namespace,socketId,uuid){
        let ext = messageApi.buildFormUserExt(socketId,uuid);
        return messageApi.buildData(
            namespace,
            messageApi.msgType.setUUID,
            undefined,
            ext,
            undefined
        );
    }

    initSocket(namespace,socketId,uuid,event,user){
        messageApi.send(this.buildInitSocket(namespace,socketId,uuid,event,user));
    }

    buildInitSocket(namespace,socketId,uuid,event,user){
        let ext = messageApi.buildFormUserExt(socketId);
        ext.uuid = uuid;
        ext.user = user;
        ext.event = event;
        return messageApi.buildData(namespace,messageApi.msgType.init,undefined,ext);
    }

    onlineList(namespace,room,socketId,uuid){

        messageApi.send(this.buildOnlineList(namespace,room,socketId,uuid));
    }
    buildOnlineList(namespace,room,socketId,uuid){
        let ext = messageApi.buildUserExt(socketId,uuid);
        ext.key = "onlineUserList";
        ext.room = room;
        return messageApi.buildData(namespace,messageApi.msgType.onlineList,undefined,ext);
    }


    checkUserIsOnline(namespace,room,uuid){
        return messageApi.checkUserIsOnline(namespace,room,uuid);
    }

    getRoomUserCount(namespace,room){
       return  messageApi.getRoomUserCount(namespace,room)
    }
}

module.exports = new BaseMessage();