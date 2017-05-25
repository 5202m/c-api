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
var common = require('../util/common');
var Config = require('../resources/config');
var Member = require('../models/member');
var ChatSubscribe = require('../models/chatSubscribe');
var chatSubscribeType = require('../models/chatSubscribeType'); //引入chatSubscribeType数据模型
var SyllabusService = require('./syllabusService');
var ArticleService = require('./articleService');
var Request = require('request');
var chatPointsService = require('../service/chatPointsService'); //引入chatPointsService

var subscribeService = {
    //订阅类型
    subscribeType: {
        syllabus: "live_reminder",
        shoutTrade: "shout_single_strategy",
        strategy: "trading_strategy",
        dailyQuotation: "daily_quotation",
        bigQuotation: "big_quotation",
        dailyReview: "daily_review",
        weekReview: "week_review"
    },
    //通知类型
    noticeType: {
        email: /(^|,)email(,|$)/,
        sms: /(^|,)sms(,|$)/
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
    getSubscribe: function(groupType, groupId, type, analyst, date, data, callback) {
        //"name3,name1,name4"
        //"name1,name2" /((^|,)name1(,|$))|((^|,)name2(,|$))/
        var analystReg = null;
        if (analyst.indexOf(",") == -1) {
            analystReg = new RegExp("(^|,)" + analyst + "(,|$)");
        } else {
            var ans = analyst.split(",");
            for (var i = 0, lenI = ans.length; i < lenI; i++) {
                ans[i] = "((^|,)" + ans[i] + "(,|$))";
            }
            analystReg = new RegExp(ans.join("|"));
        }
        var searchObj = {
            groupType: groupType,
            //groupId : groupId,
            type: type,
            analyst: analystReg,
            startDate: { $lte: date },
            endDate: { $gte: date },
            valid: 1,
            status: 1
        };
        ChatSubscribe.find(searchObj, function(err, subscribes) {
            if (err) {
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
    noticeSyllabus: function(callback) {
        //提取未来10分钟即将开播的课程
        var startTime = new Date();
        var endTime = new Date(startTime.getTime() + 600000);
        SyllabusService.getSyllabusPlan(startTime, endTime, function(courses) {
            var courseTmp = null;
            for (var i = 0, lenI = courses.length; i < lenI; i++) {
                courseTmp = courses[i];
                subscribeService.getSubscribe(
                    courseTmp.groupType,
                    courseTmp.groupId,
                    subscribeService.subscribeType.syllabus,
                    courseTmp.lecturerId,
                    endTime,
                    courseTmp,
                    function(course, subscribes) {
                        //发送邮件
                        subscribeService.getNoticesEmails(subscribes, course.groupType, function(emails) {
                            subscribeService.doSendEmail(course, emails, course.groupType, subscribeService.subscribeType.syllabus);
                        });
                        //发送短信
                        subscribeService.getNoticesMobiles(subscribes, function(mobiles) {
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
    getNoticesMobiles: function(subscribes, callback) {
        if (!subscribes || subscribes.length == 0) {
            callback([]);
            return;
        }
        var result = [];
        var subscribe = null;
        for (var i = 0, lenI = subscribes.length; i < lenI; i++) {
            subscribe = subscribes[i];
            if (subscribeService.noticeType.sms.test(subscribe.noticeType)) {
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
    getNoticesEmails: function(subscribes, groupType, callback) {
        if (!subscribes || subscribes.length == 0) {
            callback([]);
            return;
        }
        var userIds = [];
        var subscribe = null;
        for (var i = 0, lenI = subscribes.length; i < lenI; i++) {
            subscribe = subscribes[i];
            if (subscribeService.noticeType.email.test(subscribe.noticeType)) {
                userIds.push(subscribe.userId);
            }
        }
        Member.find({
            "mobilePhone": { $in: userIds },
            "valid": 1,
            "status": 1,
            "loginPlatform.chatUserGroup._id": groupType
        }, "loginPlatform.chatUserGroup.$.email", function(err, rows) {
            if (err) {
                logger.error("<<getNoticesEmails:提取用户邮箱失败，[errMessage:%s]", err);
                callback([]);
                return;
            }
            var result = [],
                row;
            for (var i = 0, lenI = !rows ? 0 : rows.length; i < lenI; i++) {
                row = rows[i];
                if (row && row.loginPlatform && row.loginPlatform.chatUserGroup && row.loginPlatform.chatUserGroup.length > 0 && row.loginPlatform.chatUserGroup[0].email) {
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
    doSendEmail: function(data, emails, groupType, type) {
        if (!emails || emails.length == 0) {
            return;
        }
        var templateCode = null;
        var templateParam = null;
        var attachDataArr = null,
            attachData = null;
        switch (type) {
            case subscribeService.subscribeType.syllabus:
                templateCode = "LiveReminder";
                templateParam = {
                    time : common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
                    courseTime : data.startTime,
                    teacherName : data.lecturer,
                    groupName : data.groupName,
                    title : data.title,
                    context : data.context
                };
                break;

            case subscribeService.subscribeType.shoutTrade:
            case subscribeService.subscribeType.strategy:
                attachDataArr = data.remark;
                if (attachDataArr) {
                    try {
                        attachDataArr = JSON.parse(attachDataArr);
                    } catch (e) {}
                }
                if (attachDataArr) {
                    templateCode = "TradingStrategy";
                    var tagMap = { "trading_strategy": "交易策略", "shout_single": "喊单", "resting_order": "挂单" };
                    templateParam = {
                        time: common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
                        authId: data.authId,
                        authName: data.authName,
                        tag: data.tag,
                        tagLabel: tagMap[data.tag] || "",
                        content: data.content,
                        dataList: []
                    };
                    //[{"symbol":"AUDUSD","name":"澳元美元","upordown":"up","open":"1","loss":"2","profit":"3","description":"test"}]
                    for (var i = 0, lenI = !attachDataArr ? 0 : attachDataArr.length; i < lenI; i++) {
                        attachData = attachDataArr[i];
                        templateParam.dataList.push({
                            symbol: attachData.symbol || "",
                            symbolLabel: attachData.name || "",
                            direction: attachData.upordown || "",
                            directionLabel: attachData.upordown == "down" ? "看跌" : "看涨",
                            open: attachData.open || "",
                            profit: attachData.profit || "",
                            loss: attachData.loss || "",
                            drag2: attachData.drag2 || "",
                            description: attachData.description || ""
                        });
                    }
                }
                break;
        }
        if (templateCode && Config.utm.hasOwnProperty(groupType)) {
            var config = Config.utm[groupType];
            var emailData = {
                timestamp: common.formatDate(new Date(), "yyyyMMddHHmmss"),
                accountSid: config.sid,
                sign: "",
                emails: emails.join(","),
                templateCode: templateCode,
                templateParam: JSON.stringify(templateParam)
            };
            emailData.sign = common.getMD5(emailData.accountSid + config.token + emailData.timestamp);

            //logger.info("<<doSendSms:发送邮件通知：content=[%s]", JSON.stringify(emailData));
            Request.post(Config.utm.emailUrl, function(error, response, data) {
                if (error || response.statusCode != 200 || !data) {
                    logger.error("<<doSendSms:发送通知邮件异常，errMessage:", error);
                } else {
                    try {
                        data = JSON.parse(data);
                        if (data.respCode != "Success") {
                            logger.error("<<doSendSms:发送通知邮件失败，[errMessage:%s]", data.respMsg);
                        }
                    } catch (e) {
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
    doSendSms: function(data, mobiles, groupType, type) {
        if (!mobiles || mobiles.length == 0) {
            return;
        }
        var templateCode = null;
        var templateParam = null;
        var attachDataArr = null,
            attachData = null;
        switch (type) {
            case subscribeService.subscribeType.syllabus:
                templateCode = "LiveReminder";
                templateParam = {
                    teacherName: data.lecturer,
                    courseTime: data.startTime
                };
                break;

            case subscribeService.subscribeType.shoutTrade:
            case subscribeService.subscribeType.strategy:
                attachDataArr = data.remark;
                if (attachDataArr) {
                    try {
                        attachDataArr = JSON.parse(attachDataArr);
                    } catch (e) {}
                }
                if (attachDataArr) {
                    templateCode = "TradingStrategy";
                    var tagMap = { "trading_strategy": "交易策略", "shout_single": "喊单", "resting_order": "挂单" };
                    templateParam = {
                        time: Common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
                        authId: data.authId,
                        authName: data.authName,
                        tag: data.tag,
                        tagLabel: tagMap[data.tag] || "",
                        content: data.content,
                        dataList: []
                    };
                    //[{"symbol":"AUDUSD","name":"澳元美元","upordown":"up","open":"1","loss":"2","profit":"3","description":"test"}]
                    for (var i = 0, lenI = !attachDataArr ? 0 : attachDataArr.length; i < lenI; i++) {
                        attachData = attachDataArr[i];
                        templateParam.dataList.push({
                            symbol: attachData.symbol || "",
                            symbolLabel: attachData.name || "",
                            direction: attachData.upordown || "",
                            directionLabel: attachData.upordown == "down" ? "看跌" : "看涨",
                            open: attachData.open || "",
                            profit: attachData.profit || "",
                            loss: attachData.loss || "",
                            drag2: attachData.drag2 || "",
                            description: attachData.description || ""
                        });
                    }
                }
                break;
        }
        if (templateCode && Config.utm.hasOwnProperty(groupType)) {
            var config = Config.utm[groupType];
            var smsData = {
                timestamp: common.formatDate(new Date(), "yyyyMMddHHmmss"),
                accountSid: config.sid,
                sign: "",
                phones: mobiles.join(","),
                templateCode: templateCode,
                templateParam: JSON.stringify(templateParam)
            };
            smsData.sign = common.getMD5(smsData.accountSid + config.token + smsData.timestamp);

            logger.info("<<doSendSms:发送短信通知：content=[%s]", JSON.stringify(smsData));
            Request.post(Config.utm.smsUrl, function(error, response, data) {
                if (error || response.statusCode != 200 || !data) {
                    logger.error("<<doSendSms:发送通知短信异常，errMessage:", error);
                } else {
                    try {
                        data = JSON.parse(data);
                        if (data.respCode != "Success") {
                            logger.error("<<doSendSms:发送通知短信失败，[errMessage:%s]", data.respMsg);
                        }
                    } catch (e) {
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
    noticeArticle: function(params, callback) {
        let articleId = params.dataId;
        params.id = articleId;
        if (!articleId) {
            logger.warn("<<noticeArticle:文章编号无效：%s", articleId);
            callback(false);
            return;
        }
        ArticleService.getArticleInfo(params, function(article) {
            if (!article) {
                logger.warn("<<noticeArticle:文章信息不存在");
                callback(false);
                return;
            }
            var groupTypeArr = subscribeService.getGroupType(article);
            var subscribeType = subscribeService.getSubscribeType(article);
            var noticeTime = new Date();
            if (groupTypeArr.length == 0 || !subscribeType) {
                logger.warn("<<noticeArticle:文章信息不需要发送订阅通知，房间组别：%s，订阅类型：%s", groupTypeArr.join(","), subscribeType);
                callback(false);
                return;
            }
            var noticeObj = null;
            for (var i = 0, lenI = groupTypeArr.length; i < lenI; i++) {
                noticeObj = subscribeService.convertNoticeObj(article, groupTypeArr[i], subscribeType);
                subscribeService.getSubscribe(
                    noticeObj.groupType,
                    "",
                    noticeObj.subscribeType,
                    noticeObj.authId,
                    noticeTime,
                    noticeObj,
                    function(noticeObj, subscribes) {
                        //发送邮件
                        subscribeService.getNoticesEmails(subscribes, noticeObj.groupType, function(emails) {
                            subscribeService.doSendEmail(noticeObj, emails, noticeObj.groupType, noticeObj.subscribeType);
                        });
                        //发送短信
                        subscribeService.getNoticesMobiles(subscribes, function(mobiles) {
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
    getGroupType: function(article) {
        var platforms = article && article.platform;
        var groupTypeMap = {};
        if (platforms) {
            platforms = platforms.split(",");
            var platformTmp = null;
            var gtReg = /^((studio_)|(fxstudio_)|(hxstudio_))\w+/;
            for (var i = 0, lenI = !platforms ? 0 : platforms.length; i < lenI; i++) {
                platformTmp = platforms[i];
                if (gtReg.test(platformTmp)) {
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
    getSubscribeType: function(article) {
        var categoryId = article && article.categoryId;
        var result = null;
        if (categoryId == "class_note") {
            var tag = null;
            if (article.detailList && article.detailList.length > 0 && article.detailList[0].tag) {
                tag = article.detailList[0].tag;
            }
            switch (tag) {
                case "trading_strategy":
                    result = subscribeService.subscribeType.strategy;
                    break;

                case "shout_single":
                    result = subscribeService.subscribeType.shoutTrade;
                    break;

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
    convertNoticeObj: function(article, groupType, subscribeType) {
        var result = {
            groupType: groupType,
            subscribeType: subscribeType
        };
        var articleDetail = article.detailList[0];
        var authId = "",
            authName = "";
        if (articleDetail && articleDetail.authorInfo) {
            authId = articleDetail.authorInfo.userId;
            authName = articleDetail.authorInfo.name;
        }
        result.authId = authId || "";
        result.authName = authName || "";
        result.remark = articleDetail.remark || "";
        result.content = articleDetail.content || "";
        result.tag = articleDetail.tag || "";
        return result;
    },
    /**
     * 获取订阅数据
     * @param params
     * @param callback
     */
    getSubscribeList: function(params, callback) {
        var now = new Date();
        var searchObj = {
            groupType: params.groupType,
            userId: params.userId,
            valid: 1,
            status: 1,
            analyst: { $ne: '' },
            noticeType: { $ne: '' },
            startDate: { $lte: now },
            endDate: { $gt: now }
        };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        ChatSubscribe.find(searchObj, "type analyst noticeType startDate endDate point createDate", function(err, result) {
            if (err) {
                logger.error("查询数据失败! >>getSubscribeList:", err);
                callback({ isOK: false, msg: '查询数据失败！' });
            } else {
                callback(result);
            }
        });
    },
    /**
     * 获取有效订阅服务类型数据
     * 
     * @param params
     * @param callback
     */
    getSubscribeTypeList: function(params, callback) {
        var searchObj = {
            groupType: params.groupType,
            valid: 1,
            status: 1,
            startDate: {
                $lte: new Date()
            },
            endDate: {
                $gte: new Date()
            }
        };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        chatSubscribeType.find(searchObj).select({
            name: 1,
            groupType: 1,
            code: 1,
            analysts: 1,
            noticeTypes: 1,
            noticeCycle: 1
        }).sort({
            'sequence': 'asc'
        }).exec(function(err, result) {
            if (err) {
                logger.error("查询数据失败! >>getSubscribeTypeList:", err);
                callback(null);
            } else {
                callback(result);
            }
        });
    },
    /**
     * 保存订阅
     * @param params
     * @param callback
     */
    saveSubscribe: function(params, callback) {
        var insertModel = {
            _id: null,
            groupType: params.groupType, //聊天室组别
            type: params.type, //订阅服务类型
            userId: params.userId, //用户ID
            analyst: params.analyst, //分析师
            noticeType: params.noticeType, //订阅方式
            startDate: params.startDate, //开始时间
            endDate: params.endDate, //结束时间
            point: params.point, //消费积分
            valid: 1, //是否删除 1-有效 0-无效
            updateDate: new Date(),
            createUser: params.userName,
            createIp: params.Ip,
            createDate: new Date(),
            status: 1, //状态：0 无效， 1 有效,
            systemCategory: params.systemCategory
        };
        if (params.point > 0) {
            var pointsParam = {
                clientGroup: params.clientGroup,
                groupType: params.groupType,
                userId: params.userId,
                item: 'prerogative_subscribe',
                val: -params.point,
                isGlobal: false,
                remark: params.pointsRemark,
                opUser: params.userName,
                opIp: params.Ip
            };
            chatPointsService.add(pointsParam, function(data) {
                if (data.result === 0) {
                    let result = data.data;
                    insertModel.pointsId = common.isBlank(result) ? '' : result._id;
                    new ChatSubscribe(insertModel).save(function(err) {
                        if (err) {
                            logger.error("保存订阅数据失败! >>saveSubscribe:", err);
                            callback({ isOK: false, msg: '订阅失败' });
                        } else {
                            subscribeService.saveSubscribe4UTM({
                                groupType: params.groupType,
                                userId: params.userId,
                                subscribeType: params.type,
                                isAdd: !!params.analyst
                            }, callback);
                        }
                    });
                } else {
                    callback({ isOK: false, msg: '订阅失败' });
                }
            });
        } else {
            new ChatSubscribe(insertModel).save(function(err) {
                if (err) {
                    logger.error("保存订阅数据失败! >>saveSubscribe:", err);
                    callback({ isOK: false, msg: '订阅失败' });
                } else {
                    subscribeService.saveSubscribe4UTM({
                        groupType: params.groupType,
                        userId: params.userId,
                        subscribeType: params.type,
                        isAdd: !!params.analyst
                    }, callback);
                }
            });
        }
    },

    /**
     * 更新订阅
     * @param params
     * @param callback
     */
    modifySubscribe: function(params, callback) {
        var searchObj = { _id: params.id };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        ChatSubscribe.findOne(searchObj, function(err, row) {
            if (err) {
                logger.error("查询数据失败! >>modifySubscribe:", err);
                callback({ isOK: false, msg: '修改订阅失败' });
            } else {
                if (params.noticeCycle == 'week') {
                    params.endDate = common.DateAdd('w', 1, new Date(row.startDate)); //结束时间，1周
                } else if (params.noticeCycle == 'month') {
                    params.endDate = common.DateAdd('M', 1, new Date(row.startDate)); //结束时间，1月
                } else if (params.noticeCycle == 'year') {
                    params.endDate = common.DateAdd('y', 1, new Date(row.startDate)); //结束时间，1年(暂时供手机版使用)
                }
                var setObj = { '$set': { 'analyst': params.analyst, 'noticeType': params.noticeType, endDate: params.endDate, point: params.point, updateDate: new Date() } };
                if (common.isBlank(params.analyst) || common.isBlank(params.noticeType)) {
                    setObj = { '$set': { 'analyst': params.analyst, 'noticeType': params.noticeType, endDate: params.endDate, point: params.point, valid: 0, updateDate: new Date() } };
                }
                if (params.point > 0 && row.point < params.point) {
                    var pointsParam = {
                        clientGroup: params.clientGroup,
                        groupType: params.groupType,
                        userId: params.userId,
                        item: 'prerogative_subscribe',
                        val: -(params.point - row.point),
                        isGlobal: false,
                        remark: params.pointsRemark,
                        opUser: params.userName,
                        opIp: params.Ip
                    };
                    common.wrapSystemCategory(pointsParam, params.systemCategory);
                    chatPointsService.add(pointsParam, function(json) {
                        if (json.result === 0) {
                            var result = json.data;
                            setObj.pointsId = common.isBlank(result) ? '' : result._id;
                            ChatSubscribe.findOneAndUpdate(searchObj, setObj, function(err1, row1) {
                                if (err1) {
                                    logger.error('modifySubscribe=>fail!' + err1);
                                    callback({ isOK: false, msg: '修改订阅失败' });
                                } else {
                                    subscribeService.saveSubscribe4UTM({
                                        groupType: params.groupType,
                                        userId: params.userId,
                                        subscribeType: row.type,
                                        isAdd: !!params.analyst
                                    }, callback);
                                }
                            });
                        } else if (json.result != 0) {
                            callback({ isOK: true, msg: '修改订阅成功' });
                        }
                    });
                } else {
                    ChatSubscribe.findOneAndUpdate(searchObj, setObj, function(err1, row1) {
                        if (err1) {
                            logger.error('modifySubscribe=>fail!' + err1);
                            callback({ isOK: false, msg: '修改订阅失败' });
                        } else {
                            subscribeService.saveSubscribe4UTM({
                                groupType: params.groupType,
                                userId: params.userId,
                                subscribeType: row.type,
                                isAdd: !!params.analyst
                            }, callback);
                        }
                    });
                }
            }
        });
    },


    /**
     * 保存客户分组到UTM
     * @param groupType
     * @param userId
     * @param subscribeType
     * @param isAdd
     * @param callback ({{isOK : boolean, msg : String}})
     */
    saveSubscribe4UTM: function(params, callback) {
        let groupType = params.groupType,
            userId = params.userId,
            subscribeType = params.subscribeType,
            isAdd = params.isAdd;
        var groupCodes = {
            "daily_quotation": "daily_quotation",
            "big_quotation": "big_quotation",
            "daily_review": "daily_review",
            "week_review": "week_review"
        };
        if (!groupCodes.hasOwnProperty(subscribeType)) {
            callback({ isOK: true, msg: "" });
            return;
        }
        if (!groupType || !Config.utm.hasOwnProperty(groupType) || !userId) {
            callback({ isOK: false, msg: "参数错误！" });
            return;
        }
        let queryObj = {
            "mobilePhone": userId,
            "valid": 1,
            "status": 1,
            "loginPlatform.chatUserGroup._id": groupType
        };
        common.wrapSystemCategory(queryObj, params.systemCategory);
        Member.findOne(queryObj, "loginPlatform.chatUserGroup.$.email", function(err, row) {
            if (err) {
                logger.error("<<saveSubscribe4UTM:提取用户邮箱失败，[errMessage:%s]", err);
                callback({ isOK: false, msg: "提取用户邮箱失败！" });
                return;
            }
            var config = Config.utm[groupType];
            var params = {
                timestamp: common.formatDate(new Date(), "yyyyMMddHHmmss"),
                accountSid: config.sid,
                sign: "",
                groupCode: groupCodes[subscribeType],
                type: isAdd ? "add" : "remove",
                phones: userId,
                emails: null
            };
            var email = row.loginPlatform.chatUserGroup[0].email;
            if (email) {
                params.emails = email;
            }
            params.sign = common.getMD5(params.accountSid + config.token + params.timestamp);
            logger.info(`Posting data to ${Config.utm.cstGroupUrl}...`);
            Request.post(Config.utm.cstGroupUrl, function(error, response, data) {
                if (error || response.statusCode != 200 || !data) {
                    logger.error("<<saveSubscribe4UTM:保存客户分组异常，errMessage:", error);
                    callback({ isOK: false, msg: "保存客户分组失败！" });
                } else {
                    try {
                        data = JSON.parse(data);
                        if (data.respCode != "Success") {
                            logger.error("<<saveSubscribe4UTM:保存客户分组失败，[errMessage:%s]", data.respMsg);
                            callback({ isOK: false, msg: "保存客户分组失败:" + data.respMsg + "！" });
                        } else {
                            callback({ isOK: true, msg: "保存客户分组成功" });
                        }
                    } catch (e) {
                        logger.error("<<saveSubscribe4UTM:发送通知邮件出错，[response:%s]", data);
                        callback({ isOK: false, msg: "保存客户分组失败！" });
                    }
                }
            }).form(params);
        });
    }
};

//导出服务类
module.exports = subscribeService;