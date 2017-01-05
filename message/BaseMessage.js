"use strict";
const messageApi = require("./MessageApi");
class BaseMessage{
    constructor(){}
    join(namespace,socketId,uuid,room){
        messageApi.send(this.buildJoin(namespace,socketId,uuid,room));
    }

    buildJoin(namespace,socketId,uuid,room){
        let ext = {room:room};
        if(socketId){
            ext.socketId = socketId;
        }
        if(uuid){
            ext.uuid = uuid;
        }
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
        let ext = {room:room};
        if(socketId){
            ext.socketId = socketId;
        }
        if(uuid){
            ext.uuid = uuid;
        }
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
        return messageApi.buildData(
            namespace,
            messageApi.msgType.setUUID,
            undefined,
            {socketId:socketId,uuid:uuid},
            undefined
        );
    }

    initSocket(namespace,socketId,uuid,online,event){
        messageApi.send(this.buildInitSocket(namespace,socketId,uuid,online,event));
    }

    buildInitSocket(namespace,socketId,uuid,online,event){
        return messageApi.buildData(namespace,messageApi.msgType.init,undefined,{socketId:socketId},{
            uuid:uuid,
            online:online,
            event:event
        });
    }

    checkUserIsOnline(namespace,room,uuid){
        return messageApi.checkUserIsOnline(namespace,room,uuid);
    }

    getRoomUserCount(namespace,room){
       return  messageApi.getRoomUserCount(namespace,room)
    }
}

module.exports = new BaseMessage();