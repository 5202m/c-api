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
var EmailService = require('./emailService');
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
            console.log(courses);
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
                        console.log(subscribes);
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
     * @param type 订阅类型
     */
    doSendEmail : function(data, emails, type){
        if(!emails || emails.length == 0){
            return;
        }
        var emailKey = null;
        var emailData = null;
        switch (type){
            case subscribeService.subscribeType.syllabus :
                emailKey = "studioSubscribeSyllabus";
                emailData = data;
                break;

            case subscribeService.subscribeType.shoutTrade :
                emailKey = "studioSubscribeShoutTrade";
                emailData = data;
                break;

            case subscribeService.subscribeType.strategy :
                emailKey = "studioSubscribeStrategy";
                emailData = data;
                break;
        }
        if(emailKey){
            logger.info("<<doSendEmail:发送邮件通知：content=[%s], emails=[%s]", JSON.stringify(emailData), emails.join(","));
            for(var i = 0, lenI = !emails ? 0 : emails.length; i < lenI; i++){
                emailData.to = emails[i];
                EmailService.send(emailKey, emailData, function(result){
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
                    teacherName : data.authName,
                    shoutSingleContent : subscribeService.formatArticle4Sms(data, subscribeService.subscribeType.shoutTrade)
                };
                break;

            case subscribeService.subscribeType.strategy :
                templateCode = "TradingStrategy";
                templateParam = {
                    teacherName : data.authName,
                    policyContent : subscribeService.formatArticle4Sms(data, subscribeService.subscribeType.strategy)
                };
                break;
        }
        if(templateCode){
            var smsData = {
                timestamp : Common.formatDate(new Date(), "yyyyMMddHHmmss"),
                accountSid: Config.utmSms.pm.sid,
                sign: "",
                phones : mobiles.join(","),
                templateCode : templateCode,
                templateParam : JSON.stringify(templateParam)
            };
            smsData.sign = Common.getMD5(smsData.accountSid + Config.utmSms.pm.token + smsData.timestamp);

            logger.info("<<doSendSms:发送短信通知：content=[%s]", JSON.stringify(smsData));
            Request.post(Config.utmSms.url, function (error, response, data) {
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
     * 将文档格式化为短信
     * @param article
     * @param subscribeType
     */
    formatArticle4Sms : function(article, subscribeType){
        var result = [];
        switch (subscribeType){
            case subscribeService.subscribeType.strategy:
                var dataArr = article.remark || "", dataTmp;
                if(dataArr){
                    try{
                        dataArr = JSON.parse(dataArr);
                        //{"symbol":"USDJPY","name":"美元日元","support_level":"123456"}
                        var symbol = null;
                        for(var i = 0, lenI = !dataArr ? 0 : dataArr.length; i < lenI; i++){
                            dataTmp = dataArr[i];
                            if(symbol == dataTmp.symbol){
                                result.push(";");
                                result.push(dataTmp.support_level);
                            }else{
                                symbol = dataTmp.symbol;
                                result.push("\r\n");
                                result.push("品种:" + dataTmp.name);
                                result.push(" 支撑位:" + dataTmp.support_level);
                            }
                        }
                    }catch(e){

                    }
                }
                break;

            case subscribeService.subscribeType.shoutTrade:
                var dataArr = article.remark || "", dataTmp;
                if(dataArr){
                    try{
                        dataArr = JSON.parse(dataArr);
                        //{"symbol":"AUDUSD","name":"澳元美元","longshort":"long","point":"12","profit":"13","loss":"11"}
                        for(var i = 0, lenI = !dataArr ? 0 : dataArr.length; i < lenI; i++){
                            dataTmp = dataArr[i];
                            result.push("\r\n");
                            result.push("品种:" + dataTmp.name);
                            result.push(" 方向:" + (dataTmp.longshort == "long" ? "看涨" : "看跌"));
                            result.push(" 进场点位:" + dataTmp.point);
                            result.push(" 止盈:" + dataTmp.profit);
                            result.push(" 止损:" + dataTmp.loss);
                        }
                    }catch(e){

                    }
                }
                break;
            case subscribeService.subscribeType.dailyQuotation:
            case subscribeService.subscribeType.bigQuotation:
            case subscribeService.subscribeType.dailyReview:
            case subscribeService.subscribeType.weekReview:
                var content = article.content || "";
                if(content){
                    var tagRegAll = /<[^>]+>|<\/[^>]+>/g;
                    content = content.replace(tagRegAll, "");
                    if(content.length > 70){
                        content = content.substring(0,67) + "...";
                    }
                }
                result.push(content);
                break;
        }
        return result.join("");
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
                            subscribeService.doSendEmail(noticeObj, emails, noticeObj.subscribeType);
                        });
                        //发送短信
                        subscribeService.getNoticesMobiles(subscribes, function(mobiles){
                            subscribeService.doSendSms(noticeObj, mobiles, noticeObj.subscribeType);
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
        if(categoryId == "class_note"){
            var tag = null;
            if(article.detailList && article.detailList.length > 0 && article.detailList[0].tag){
                tag = article.detailList[0].tag;
            }
            switch (tag){
                case "trading_strategy":
                    result = subscribeService.subscribeType.strategy;
                    break;

                case "shout_single":
                    result = subscribeService.subscribeType.shoutTrade;
                    break;
            }
        }else if(categoryId == "info_dailyQuotation"){
            result = subscribeService.subscribeType.dailyQuotation;
        }else if(categoryId == "info_bigQuotation"){
            result = subscribeService.subscribeType.bigQuotation;
        }else if(categoryId == "info_dailyReview"){
            result = subscribeService.subscribeType.dailyReview;
        }else if(categoryId == "info_weekReview"){
            result = subscribeService.subscribeType.weekReview;
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
        result.authId = authId;
        result.authName = authName;
        result.remark = articleDetail.remark;
        result.content = articleDetail.content;
        return result;
    }
};

//导出服务类
module.exports = subscribeService;