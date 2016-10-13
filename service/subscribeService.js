/**
 * 订阅管理<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年10月9日 <BR>
 * Description :<BR>
 * <p>
 *
 * </p>
 */
var logger = require('../resources/logConf').getLogger("subscribeService");
var Common = require('../util/common');
var Config = require('../resources/config');
var Member = require('../models/member');
var ChatSubscribe = require('../models/ChatSubscribe');
var SyllabusService = require('./SyllabusService');
var EmailService = require('./emailService');
var Request = require('request');

var subscribeService = {
    //订阅类型
    subscribeType : {
        syllabus : "live_reminder",
        shoutTrade : "shout_single_strategy",
        strategy : "trading_strategy"
    },
    //通知类型
    noticeType :{
        email:/(^|,)email(,|$)/,
        sms:/(^|,)sms(,|$)/
    },

    /**
     * 提取订阅信息
     * @param groupType
     * @param groupId
     * @param type 订阅服务类型
     * @param analyst 分析师编号（多个以,分隔）
     * @param date 时间
     * @param data 数据对象（课程、喊单策略、交易策略）
     * @param callback
     */
    getSubscribe : function(groupType, groupId, type, analyst, date, data, callback){
        //"name3,name1,name4"
        //"name1,name2" /((^|,)name1(,|$))|((^|,)name2(,|$))/
        var analystReg = null;
        if(analyst.indexOf(",") == -1){
            analystReg = new RegExp("(^|,)" + analyst + "(,|$)");
        }else{
            var ans = analyst.split(",");
            for(var i = 0, lenI = ans.length; i < lenI; i++){
                ans[i] = "((^|,)" + ans[i] + "(,|$))";
            }
            analystReg = new RegExp(ans.join("|"));
        }
        ChatSubscribe.find({
            groupType : groupType,
            //groupId : groupId,
            type : type,
            analyst : analystReg,
            startDate : {$lte: date},
            endDate : {$gte: date}
        }, function(err, subscribes){
            if(err){
                logger.error("<<getSubscribe:提取订阅信息出错，[errMessage:%s]", err);
                callback(data, []);
                return;
            }
            callback(data, subscribes ? subscribes : []);
        });
    },

    /**
     * 订阅通知——课程安排
     * @param callback
     */
    noticeSyllabus : function(callback){
        //提取未来10分钟即将开播的课程
        var startTime = new Date();
        var endTime = new Date(startTime.getTime() + 600000);
        SyllabusService.getSyllabusPlan(startTime, endTime, function(courses){
            var courseTmp = null;
            for(var i = 0, lenI = courses.length; i < lenI; i++){
                courseTmp = courses[i];
                subscribeService.getSubscribe(
                    courseTmp.groupType,
                    courseTmp.groupId,
                    subscribeService.subscribeType.syllabus,
                    courseTmp.lecturerId,
                    endTime,
                    courseTmp, function(course, subscribes){
                        //发送邮件
                        subscribeService.getNoticesEmails(subscribes, courseTmp.groupType, function(emails){
                            subscribeService.doSendEmail(course, emails, subscribeService.subscribeType.syllabus);
                        });
                        //发送短信
                        subscribeService.getNoticesMobiles(subscribes, function(mobiles){
                            subscribeService.doSendSms(course, mobiles, subscribeService.subscribeType.syllabus);
                        });
                });
            }
            callback(true);
        });
    },

    /**
     * 获取需要通知的手机号
     * @param subscribes
     * @param callback (mobiles)
     */
    getNoticesMobiles : function(subscribes, callback){
        if(!subscribes || subscribes.length == 0){
            callback([]);
            return;
        }
        var result = [];
        var subscribe = null;
        for(var i = 0, lenI = subscribes.length; i < lenI; i++){
            subscribe = subscribes[i];
            if(subscribeService.noticeType.sms.test(subscribe.noticeType)){
                result.push(subscribe.userId);
            }
        }
        callback(result);
    },

    /**
     * 获取需要通知的邮件地址
     * @param subscribes
     * @param groupType
     * @param callback (emails)
     */
    getNoticesEmails : function(subscribes, groupType, callback){
        if(!subscribes || subscribes.length == 0){
            callback([]);
            return;
        }
        var userIds = [];
        var subscribe = null;
        console.log(subscribes);
        for(var i = 0, lenI = subscribes.length; i < lenI; i++){
            subscribe = subscribes[i];
            if(subscribeService.noticeType.email.test(subscribe.noticeType)){
                userIds.push(subscribe.userId);
            }
        }
        console.log({
            "mobilePhone" : {$in : userIds},
            "valid": 1,
            "status": 1,
            "loginPlatform.chatUserGroup._id" : groupType
        });
        Member.find({
            "mobilePhone" : {$in : userIds},
            "valid": 1,
            "status": 1,
            "loginPlatform.chatUserGroup._id" : groupType
        }, "loginPlatform.chatUserGroup.$.email", function(err, rows){
            console.log(rows);
            if(err){
                logger.error("<<getNoticesEmails:提取用户邮箱失败，[errMessage:%s]", err);
                callback([]);
                return;
            }
            var result = [], row;
            for(var i = 0, lenI = !rows ? 0 : rows.length; i < lenI; i++){
                if(row && row.loginPlatform && row.loginPlatform.chatUserGroup && row.loginPlatform.chatUserGroup.email){
                    result.push(row.loginPlatform.chatUserGroup.email);
                }
            }
            callback(result);
        });
    },

    /**
     * 执行订阅通知——课程安排
     * @param course
     * @param subscribes
     */
    doNoticeSyllabus : function(course, subscribes){
        if(!course || !subscribes || subscribes.length == 0){
            return;
        }
        var subscribe = null, smsUser = [], emailUser = [];
        for(var i = 0, lenI = subscribes.length; i < lenI; i++){
            subscribe = subscribes[i];

        }
    },

    /**
     * 发送邮件
     * @param data
     * @param emails
     * @param type 订阅类型
     */
    doSendEmail : function(data, emails, type){
        if(!emails || emails.length == 0){
            return;
        }
        var emailKey = null;
        var data = null;
        switch (type){
            case subscribeService.subscribeType.syllabus :
                emailKey = "studioSubscribeSyllabus";
                data = data;
                break;

            case subscribeService.subscribeType.shoutTrade :
                emailKey = "studioSubscribeShoutTrade";
                data = data;
                break;

            case subscribeService.subscribeType.strategy :
                emailKey = "studioSubscribeStrategy";
                data = data;
                break;
        }
        if(emailKey){
            for(var i = 0, lenI = !emails ? 0 : emails.length; i < lenI; i++){
                data.to = emails[i];
                logger.info(emailKey, data);
                EmailService.send(emailKey, data, function(result){
                    if(result.result != 0){
                        logger.error("<<doSendEmail:发送通知邮件失败，[errMessage:%s]", result.msg);
                    }
                });
            }
        }
    },

    /**
     * 发送短信
     * @param data
     * @param mobiles
     * @param type 订阅类型
     */
    doSendSms : function(data, mobiles, type){
        if(!mobiles || mobiles.length == 0){
            return;
        }
        var templateCode = null;
        var templateParam = null;
        switch (type){
            case subscribeService.subscribeType.syllabus :
                templateCode = "LiveReminder";
                templateParam = {
                    userName : "",
                    teacherName : data.lecturer,
                    courseTime : data.startTime
                };
                break;

            case subscribeService.subscribeType.shoutTrade :
                templateCode = "ShoutSingleStrategy";
                templateParam = {
                    teacherName : "",
                    shoutSingleContent : ""
                };
                break;

            case subscribeService.subscribeType.strategy :
                templateCode = "TradingStrategy";
                templateParam = {
                    teacherName : "",
                    policyContent : ""
                };
                break;
        }
        if(templateCode){
            var smsData = {
                timestamp : Common.formatterDateTime(new Date(), "-"),
                accountSid: Config.utmSms.pm.sid,
                sign: Config.utmSms.pm.token,
                phones : mobiles.join(","),
                templateCode : templateCode,
                templateParam : JSON.stringify(templateParam)
            };
            Request.post(Config.utmSms.url, smsData, function (error, response, data) {
                if (error || response.statusCode != 200 || !data) {
                    logger.error("<<doSendSms:发送通知短信失败，[errMessage:%s]", error);
                } else if(data.respCode == "Success"){
                    logger.info("<<doSendSms:发送通知短信成功！");
                }else{
                    logger.error("<<doSendSms:发送通知短信失败，[errMessage:%s]", data.respMsg);
                }
            });
        }
    }
};

//导出服务类
module.exports = subscribeService;