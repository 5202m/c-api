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
            init:"init"
        }
    }
    send(data){
        this._go(data);
    }
    buildData(namespace,msgType,sendMsgType,ext,...msgData){
        namespace = this._buildNamespace(namespace);
        return {
            namespace: namespace,
            msg: {
                ext: ext,
                msgType: msgType,
                sendMsgType:sendMsgType,
                msgData: msgData
            }
        };
    }
    buildUserExt(socketId,uuid){
        let ext = {toUser:true};
        if(socketId){
            ext.socketId = socketId;
        }
        if(uuid){
            ext.uuid = uuid;
        }
        return ext;
    }
    _go(data) {
	let path = `${config.chatSocketUrl}/chat/msg`;
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
        let path = `${config.chatSocketUrl}/chat/isOnline`;
        request.get({
                url: path,
                form: {data:JSON.stringify(data)}
            }, (error, response, data)=>{
                if(error){
                    deferred.reject(error);
                }else{
                    data = JSON.parse(data);
                    if(data.code == 200){
                        deferred.resolve(data.data.online);
                    }else{
                        deferred.reject(data);
                    }
                }
            }
        );
        return deferred.promise;
    }

    getRoomUserCount(namespace,room){
        let deferred = new common.Deferred();
        namespace = this._buildNamespace(namespace);
        let path = `${config.chatSocketUrl}/chat/onlineCount`;
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
                    if(data.code == 200){
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