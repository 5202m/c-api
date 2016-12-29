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
var ChatSubscribe = require('../models/chatSubscribe');
var SyllabusService = require('./syllabusService');
var ArticleService = require('./articleService');
var Request = require('request');

var subscribeService = {
    //订阅类型
    subscribeType : {
        syllabus : "live_reminder",
        shoutTrade : "shout_single_strategy",
        strategy : "trading_strategy",
        dailyQuotation : "daily_quotation",
        bigQuotation : "big_quotation",
        dailyReview : "daily_review",
        weekReview : "week_review"
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
        var searchObj = {
            groupType : groupType,
            //groupId : groupId,
            type : type,
            analyst : analystReg,
            startDate : {$lte: date},
            endDate : {$gte: date},
            valid : 1,
            status : 1
        };
        ChatSubscribe.find(searchObj, function(err, subscribes){
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
                        subscribeService.getNoticesEmails(subscribes, course.groupType, function(emails){
                            subscribeService.doSendEmail(course, emails, course.groupType, subscribeService.subscribeType.syllabus);
                        });
                        //发送短信
                        subscribeService.getNoticesMobiles(subscribes, function(mobiles){
                            subscribeService.doSendSms(course, mobiles, course.groupType, subscribeService.subscribeType.syllabus);
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
        for(var i = 0, lenI = subscribes.length; i < lenI; i++){
            subscribe = subscribes[i];
            if(subscribeService.noticeType.email.test(subscribe.noticeType)){
                userIds.push(subscribe.userId);
            }
        }
        Member.find({
            "mobilePhone" : {$in : userIds},
            "valid": 1,
            "status": 1,
            "loginPlatform.chatUserGroup._id" : groupType
        }, "loginPlatform.chatUserGroup.$.email", function(err, rows){
            if(err){
                logger.error("<<getNoticesEmails:提取用户邮箱失败，[errMessage:%s]", err);
                callback([]);
                return;
            }
            var result = [], row;
            for(var i = 0, lenI = !rows ? 0 : rows.length; i < lenI; i++){
                row = rows[i];
                if(row && row.loginPlatform && row.loginPlatform.chatUserGroup && row.loginPlatform.chatUserGroup.length > 0 && row.loginPlatform.chatUserGroup[0].email){
                    result.push(row.loginPlatform.chatUserGroup[0].email);
                }
            }
            callback(result);
        });
    },

    /**
     * 发送邮件
     * @param data
     * @param emails
     * @param groupType
     * @param type 订阅类型
     */
    doSendEmail : function(data, emails, groupType, type){
        if(!emails || emails.length == 0){
            return;
        }
        var templateCode = null;
        var templateParam = null;
        var attachDataArr = null, attachData = null;
        switch (type){
            case subscribeService.subscribeType.syllabus :
                templateCode = "LiveReminder";
                templateParam = {
                    time : Common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
                    courseTime : data.startTime,
                    teacherName : data.lecturer,
                    groupName : data.groupName,
                    title : data.title,
                    context : data.context
                };
                break;

            case subscribeService.subscribeType.shoutTrade :
            case subscribeService.subscribeType.strategy :
                attachDataArr = data.remark;
                if(attachDataArr){
                    try{
                        attachDataArr = JSON.parse(attachDataArr);
                    }catch(e){
                    }
                }
                if(attachDataArr){
                    templateCode = "TradingStrategy";
                    var tagMap = {"trading_strategy":"交易策略", "shout_single":"喊单", "resting_order":"挂单"};
                    templateParam = {
                        time : Common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
                        authId : data.authId,
                        authName : data.authName,
                        tag : data.tag,
                        tagLabel :  tagMap[data.tag] || "",
                        content : data.content,
                        dataList : []
                    };
                    //[{"symbol":"AUDUSD","name":"澳元美元","upordown":"up","open":"1","loss":"2","profit":"3","description":"test"}]
                    for(var i = 0, lenI = !attachDataArr ? 0 : attachDataArr.length; i < lenI; i++){
                        attachData = attachDataArr[i];
                        templateParam.dataList.push({
                            symbol         : attachData.symbol || "",
                            symbolLabel    : attachData.name || "",
                            direction      : attachData.upordown || "",
                            directionLabel : attachData.upordown == "down" ? "看跌" : "看涨",
                            open           : attachData.open || "",
                            profit         : attachData.profit || "",
                            loss           : attachData.loss || "",
                            description    : attachData.description || ""
                        });
                    }
                }
                break;
        }
        if(templateCode && Config.utm.hasOwnProperty(groupType)){
            var config = Config.utm[groupType];
            var emailData = {
                timestamp : Common.formatDate(new Date(), "yyyyMMddHHmmss"),
                accountSid: config.sid,
                sign: "",
                emails : emails.join(","),
                templateCode : templateCode,
                templateParam : JSON.stringify(templateParam)
            };
            emailData.sign = Common.getMD5(emailData.accountSid + config.token + emailData.timestamp);

            //logger.info("<<doSendSms:发送邮件通知：content=[%s]", JSON.stringify(emailData));
            Request.post(Config.utm.emailUrl, function (error, response, data) {
                if (error || response.statusCode != 200 || !data) {
                    logger.error("<<doSendSms:发送通知邮件异常，errMessage:", error);
                } else{
                    try{
                        data = JSON.parse(data);
                        if(data.respCode != "Success"){
                            logger.error("<<doSendSms:发送通知邮件失败，[errMessage:%s]", data.respMsg);
                        }
                    }catch(e){
                        logger.error("<<doSendSms:发送通知邮件出错，[response:%s]", data);
                    }
                }
            }).form(emailData);
        }
    },

    /**
     * 发送短信
     * @param data
     * @param mobiles
     * @param groupType
     * @param type 订阅类型
     */
    doSendSms : function(data, mobiles, groupType, type){
        if(!mobiles || mobiles.length == 0){
            return;
        }
        var templateCode = null;
        var templateParam = null;
        var attachDataArr = null, attachData = null;
        switch (type){
            case subscribeService.subscribeType.syllabus :
                templateCode = "LiveReminder";
                templateParam = {
                    time : Common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
                    teacherName : data.lecturer,
                    courseTime : data.startTime,
                    groupName : data.groupName,
                    title : data.title,
                    context : data.context
                };
                break;

            case subscribeService.subscribeType.shoutTrade :
            case subscribeService.subscribeType.strategy :
                attachDataArr = data.remark;
                if(attachDataArr){
                    try{
                        attachDataArr = JSON.parse(attachDataArr);
                    }catch(e){
                    }
                }
                if(attachDataArr){
                    templateCode = "TradingStrategy";
                    var tagMap = {"trading_strategy":"交易策略", "shout_single":"喊单", "resting_order":"挂单"};
                    templateParam = {
                        time : Common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
                        authId : data.authId,
                        authName : data.authName,
                        tag : data.tag,
                        tagLabel :  tagMap[data.tag] || "",
                        content : data.content,
                        dataList : []
                    };
                    //[{"symbol":"AUDUSD","name":"澳元美元","upordown":"up","open":"1","loss":"2","profit":"3","description":"test"}]
                    for(var i = 0, lenI = !attachDataArr ? 0 : attachDataArr.length; i < lenI; i++){
                        attachData = attachDataArr[i];
                        templateParam.dataList.push({
                            symbol         : attachData.symbol || "",
                            symbolLabel    : attachData.name || "",
                            direction      : attachData.upordown || "",
                            directionLabel : attachData.upordown == "down" ? "看跌" : "看涨",
                            open           : attachData.open || "",
                            profit         : attachData.profit || "",
                            loss           : attachData.loss || "",
                            description    : attachData.description || ""
                        });
                    }
                }
                break;
        }
        if(templateCode && Config.utm.hasOwnProperty(groupType)){
            var config = Config.utm[groupType];
            var smsData = {
                timestamp : Common.formatDate(new Date(), "yyyyMMddHHmmss"),
                accountSid: config.sid,
                sign: "",
                phones : mobiles.join(","),
                templateCode : templateCode,
                templateParam : JSON.stringify(templateParam)
            };
            smsData.sign = Common.getMD5(smsData.accountSid + config.token + smsData.timestamp);

            logger.info("<<doSendSms:发送短信通知：content=[%s]", JSON.stringify(smsData));
            Request.post(Config.utm.smsUrl, function (error, response, data) {
                if (error || response.statusCode != 200 || !data) {
                    logger.error("<<doSendSms:发送通知短信异常，errMessage:", error);
                } else{
                    try{
                        data = JSON.parse(data);
                        if(data.respCode != "Success"){
                            logger.error("<<doSendSms:发送通知短信失败，[errMessage:%s]", data.respMsg);
                        }
                    }catch(e){
                        logger.error("<<doSendSms:发送通知短信出错，[response:%s]", data);
                    }
                }
            }).form(smsData);
        }
    },

    /**
     * 订阅通知——文章发布（喊单策略、交易策略）
     * @param callback
     */
    noticeArticle : function(articleId, callback){
        if(!articleId){
            logger.warn("<<noticeArticle:文章编号无效：%s", articleId);
            callback(false);
            return;
        }
        ArticleService.getArticleInfo(articleId, function(article){
            if(!article){
                logger.warn("<<noticeArticle:文章信息不存在");
                callback(false);
                return;
            }
            var groupTypeArr = subscribeService.getGroupType(article);
            var subscribeType = subscribeService.getSubscribeType(article);
            var noticeTime = new Date();
            if(groupTypeArr.length == 0 || !subscribeType){
                logger.warn("<<noticeArticle:文章信息不需要发送订阅通知，房间组别：%s，订阅类型：%s", groupTypeArr.join(","), subscribeType);
                callback(false);
                return;
            }
            var noticeObj = null;
            for(var i = 0, lenI = groupTypeArr.length; i < lenI; i++){
                noticeObj = subscribeService.convertNoticeObj(article, groupTypeArr[i], subscribeType);
                subscribeService.getSubscribe(
                    noticeObj.groupType,
                    "",
                    noticeObj.subscribeType,
                    noticeObj.authId,
                    noticeTime,
                    noticeObj, function(noticeObj, subscribes){
                        //发送邮件
                        subscribeService.getNoticesEmails(subscribes, noticeObj.groupType, function(emails){
                            subscribeService.doSendEmail(noticeObj, emails, noticeObj.groupType, noticeObj.subscribeType);
                        });
                        //发送短信
                        subscribeService.getNoticesMobiles(subscribes, function(mobiles){
                            subscribeService.doSendSms(noticeObj, mobiles, noticeObj.groupType, noticeObj.subscribeType);
                        });
                    });
            }
            callback(true);
        });
    },

    /**
     * 提取房间组别（通过文章的应用位置）
     * @param article
     */
    getGroupType : function(article){
        var platforms = article && article.platform;
        var groupTypeMap = {};
        if(platforms){
            platforms = platforms.split(",");
            var platformTmp = null;
            var gtReg = /^((studio_)|(fxstudio_)|(hxstudio_))\w+/;
            for(var i = 0, lenI = !platforms ? 0 : platforms.length; i < lenI; i++){
                platformTmp = platforms[i];
                if(gtReg.test(platformTmp)){
                    platformTmp = platformTmp.replace(/_\w+$/g, "");
                    groupTypeMap[platformTmp] = 1;
                }
            }
        }
        return Object.keys(groupTypeMap);
    },

    /**
     * 提取通知类型（通过文章的栏目）
     * @param article
     */
    getSubscribeType : function(article){
        var categoryId = article && article.categoryId;
        var result = null;
        if(categoryId == "class_note") {
            var tag = null;
            if (article.detailList && article.detailList.length > 0 && article.detailList[0].tag) {
                tag = article.detailList[0].tag;
            }
            switch (tag) {
                case "trading_strategy":
                    result = subscribeService.subscribeType.strategy;
                    break;
                case "shout_single":
                case "resting_order":
                    result = subscribeService.subscribeType.shoutTrade;
                    break;
            }
        }
        return result;
    },

    /**
     * 转化为通知对象
     * @param article
     * @param groupType
     * @param subscribeType
     */
    convertNoticeObj : function(article, groupType, subscribeType){
        var result = {
            groupType : groupType,
            subscribeType : subscribeType
        };
        var articleDetail = article.detailList[0];
        var authId = "", authName = "";
        if(articleDetail && articleDetail.authorInfo){
            authId = articleDetail.authorInfo.userId;
            authName = articleDetail.authorInfo.name;
        }
        result.authId = authId || "";
        result.authName = authName || "";
        result.remark = articleDetail.remark || "";
        result.content = articleDetail.content || "";
        result.tag = articleDetail.tag || "";
        return result;
    }
};

//导出服务类
module.exports = subscribeService;