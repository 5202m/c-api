"use strict";
const config = require("../resources/config");
const common = require('../util/common');
const logger=require('../resources/logConf').getLogger('MessageApi');//引入log4js
const request = require("request");
class MessageApi {
    constructor() {
        this.msgType =  {
            sendMsg:"sendMsg",
            join:"join",
            leave:"leave",
            setUUID:"setUUID",
            init:"init",
            onlineList:"onlineList"
        }
    }
    send(data){
        this._go(data);
    }
    buildData(namespace,eventType,msgType,ext,...msgData){
        namespace = this._buildNamespace(namespace);
        ext.msgType = msgType;
        ext.msgData = msgData;
        return {
            namespace: namespace,
            msg: {
                eventType:eventType,
                ext:ext
            }
        };
    }
    buildUserExt(socketId,uuid){
        let ext = {toUser:{}};
        if(socketId){
            ext.toUser.socketId = socketId;
        }
        if(uuid){
            ext.toUser.uuid = uuid;
        }
        return ext;
    }
    buildFormUserExt(socketId,uuid){
        let ext = {form:{}};
        if(socketId){
            ext.form.socketId = socketId;
        }
        if(uuid){
            ext.form.uuid = uuid;
        }
        return ext;
    }
    buildRoomExt(room){
        return {toRoom:{room:room}};
    }

    buildNamespaceExt(namespace){
        return {toNamespace:{namespace:namespace}};
    }

    _go(data) {
        let path = `${config.chatSocketUrl}/api/chat/msg`;
        request.post({
                    url: path,
                    form: {data:JSON.stringify(data)}
                }, (error, response, data)=>{
                    if (error) {
                        logger.error("消息发送失败, ", path);
                    } else {
                        logger.info(data);
                    }
                }
            );
    }

    checkUserIsOnline(namespace,room,uuid){
        let deferred = new common.Deferred();
        namespace = this._buildNamespace(namespace);
        let data = {
            namespace:namespace,
            room:room,
            uuid:uuid
        }
        let path = `${config.chatSocketUrl}/api/chat/isOnline?data=`+JSON.stringify(data);
        request.get({
                url: path
            }, (error, response, data)=>{
                if(error){
                    deferred.reject(error);
                }else{
                    //TODO socket获取在线暂有问题
                    /* data = JSON.parse(data);
                   if(data.result == 0){
                        deferred.resolve(data.data.online);
                    }else{
                        deferred.reject(data);
                    }*/
                    deferred.resolve(true);
                }
            }
        );
        return deferred.promise;
    }

    getRoomUserCount(namespace,room){
        let deferred = new common.Deferred();
        namespace = this._buildNamespace(namespace);
        let path = `${config.chatSocketUrl}/api/chat/onlineCount`;
        let data = {
            namespace:namespace,
            room:room
        }
        logger.info("Getting data from ", path, JSON.stringify(data));
        request.get({
                url: path + "?data=" + JSON.stringify(data)
            }, (error, response, data)=>{
                if(error){
                    deferred.reject(error);
                }else{
                    data = JSON.parse(data);
                    if(data.result == 0){
                        deferred.resolve(data.data.count);
                    }else{
                        deferred.reject(data);
                    }
                }
            }
        );
        return deferred.promise;
    }
    _buildNamespace(namespace){
        if(namespace.indexOf("/") <0){
            namespace="/"+namespace;
        }
        return namespace;
    }
}
module.exports = new MessageApi();