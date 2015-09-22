/**
 * 摘要：向Android或IOS推送消息Service服务类
 * author:Gavin.guo
 * date:2015/8/28
 */
var JPush = require("jpush-sdk");
var IdSeqManager = require('../constant/IdSeqManager.js');  //引入序号生成器js
var commonJs = require('../util/common'); 	 	            //引入公共的js
var APIUtil = require('../util/APIUtil'); 	 	   //引入API工具类js
var config = require('../resources/config'); 	   //引入配置类js
var PushMessage = require('../models/pushMessage');
/**
 * 定义消息推送Service类
 */
var pushService = {
    /**
     * 功能：推送消息到Android或IOS
     * @param   type     消息类型(1:通知消息或2:自定义消息 3:两种消息都推送)
     * @param   title    推送标题
     * @param   content  推送内容
     * @param   tag      推送设备别名(以数组的方式)
     * @param   extra    推送数据(以对象的方式)
     */
    doPushMessage : function(type,title,content,tag,extra,callback){
        console.info("pushMessage->[title:%s,content:%s,tag:%s,extra:%s]",title,content,tag,extra);
        var client = JPush.buildClient(config.messagePush.appKey,config.messagePush.masterSecret);
        var pd = client.push().setPlatform('android').setAudience(JPush.alias(tag));
        if(type == 1){   //通知消息
            pd = pd.setNotification('蜘蛛投资', JPush.android(content ,title, 1,extra));
        }else if(type == 2){   //自定义消息
            pd = pd.setMessage(content , title , '' ,extra);
        }else if(type == 3){   //两种消息都推送
            pd = pd.setNotification('蜘蛛投资', JPush.android(content ,title, 1,extra)).setMessage(content, title,'',extra);
        }
        pd .setOptions(null, 60).send(function(err, res) {
                if (err) {
                    if (err instanceof JPush.APIConnectionError) {
                        console.error("<<push fail:[errMessage:%s,isResponseTimeout:%s]",err.message,err.isResponseTimeout);
                    } else if (err instanceof  JPush.APIRequestError) {
                        console.error("<<push fail:[errMessage:%s]",err.message);
                    }
                    callback({result : 1 ,data : {sendNo : '',msgId : ''}});
                } else {
                    console.log('pushMessage<-push success : [Sendno: %s,Msg_id:%s]',res.sendno,res.msg_id);
                    callback({result : 0 ,data : {sendNo : res.sendno,msgId : res.msg_id}});
                }
        });
    },

    /**
     * 保存推送消息到数据库
     * @private
     */
    savePushMessage : function(pushMsg,callback){
        IdSeqManager.PushMessage.getNextSeqId(function(err, pushMessageId) {
            if (err) {
                console.error("保存推送消息到数据库失败！", err);
                callback("code_2051", null);
                return;
            }
            pushMsg._id = pushMessageId;
            var pMessage = new PushMessage(pushMsg);
            pMessage.save(function(err, curPushMessage) {
                if (err) {
                    console.error("保存推送消息到数据库失败！", err);
                    callback("code_2051", null);
                    return;
                }
                console.info("保存推送消息到数据库成功！", pushMessageId);
                callback(null, curPushMessage);
            })
        })
    },

    /**
     * 查询推送消息列表
     * @param  pushMsg (需要传入lang：语言,platform：应用平台,tipType：通知方式,messageType：消息类型)
     */
    getPushMessageList : function(pushMsg , pageLast, pageSize, callback){
        var searchObj = {
            lang : pushMsg.lang ,
            platform : pushMsg.platform,
            tipType : pushMsg.tipType,
            messageType : pushMsg.messageType,
            valid : 1,
            isDeleted : 1,
            pushStatus : 2
        };
        if(pushMsg.pushMember){
            searchObj.pushMember = {$regex : pushMsg.pushMember};
        }
        APIUtil.DBPage(PushMessage , {
            pageLast : pageLast,
            pageSize : pageSize,
            pageId : "_id",
            pageDesc : true,
            query : searchObj
        },function(err, pushMessages, page){
            if(err){
                console.error("查询推送消息列表失败!", err);
                callback(APIUtil.APIResult("code_2052", null, null));
                return;
            }
            var pushMessagesNew = [];
            var tempPushMessage = null;
            for(var i = 0, lenI = pushMessages ? pushMessages.length : 0; i < lenI; i++){
                tempPushMessage = pushMessages[i].toObject();
                tempPushMessage.pushDate = tempPushMessage.createDate && tempPushMessage.createDate instanceof Date ? tempPushMessage.createDate.getTime() : 0;
                if(tempPushMessage.content){
                    tempPushMessage.content = commonJs.filterContentHTML(tempPushMessage.content);
                }
                pushMessagesNew.push(tempPushMessage);
            }
            callback(APIUtil.APIResult(null, pushMessagesNew, page));
        });
    }
}

//导出服务类
module.exports = pushService;

