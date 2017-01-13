'use static';
const messageApi = require("./MessageApi");
class ChatMessage{
    constructor(){}

    /***
     * 加载私聊信息
     * @param namespace
     * @param ext
     * @param data
     */
    loadWhMsg(namespace,socketId,uuid,data){
        messageApi.send(this.buildLoadWhMsg(namespace,socketId,uuid,data));
    }

    /****
     * 加载私聊消息   消息体构造
     * @param socketId
     * @param uuid
     * @param data
     */
    buildLoadWhMsg(namespace,socketId,uuid,data){
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "loadWhMsg",
                                    messageApi.buildUserExt(socketId,uuid),
                                    data
        );
    }


    /****
     * 加载公聊区域聊天记录
     * @param namespace
     * @param ext
     * @param data
     */
    loadMsg(namespace,socketId,uuid,data){
        messageApi.send(this.buildLoadMsg(namespace,socketId,uuid,data));
    }

    /****
     * 加载公聊区域聊天记录  消息体构造
     * @param socketId
     * @param uuid
     * @param data
     */
    buildLoadMsg(namespace,socketId,uuid,data){
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "loadMsg",
                                    messageApi.buildUserExt(socketId,uuid),
                                    data
        );
    }
    /****
     * 发送消息 私聊
     * @param namespace
     * @param data
     */
    sendMsg(namespace,socketId,uuid,data){
        messageApi.send(this.buildSendMsg(namespace,socketId,uuid,data));
    }

    /****
     * 发送消息 私聊  消息体构造
     * @param socketId
     * @param uuid
     * @param data
     * @returns {{msgType: string, ext: *, msgData: *}}
     */
    buildSendMsg(namespace,socketId,uuid,data){
        return messageApi.buildData(
                                    namespace,
                                    messageApi.msgType.sendMsg,
                                    "sendMsg",
                                    messageApi.buildUserExt(socketId,uuid),
                                    data
        );
    }

    /****
     * 发送消息 群聊
     * @param namespace
     * @param data
     */
    sendMsgByRoom(namespace,room,data){
        messageApi.send(this.buildSendMsgByRoom(namespace,room,data));
    }

    /****
     * 发送消息 群聊  消息体构造
     * @param socketId
     * @param uuid
     * @param data
     */
    buildSendMsgByRoom(namespace,room,data){
        return messageApi.buildData(
            namespace,
            messageApi.msgType.sendMsg,
            "sendMsg",
            messageApi.buildRoomExt(room),
            data
        );
    }
    send(namespace,event,ext,data){
        messageApi.send(messageApi.buildData(namespace,'sendMsg',event,ext,data));
    }
}

module.exports = new ChatMessage();