var chatGroup = require('../models/chatGroup'); //引入chatGroup数据模型
var logger = require('../resources/logConf').getLogger('chatTeacherService'); //引入log4js
var common = require('../util/common'); //引入common类
var errorMessage = require('../util/errorMessage'); //引入errorMessage类
var signin = require('../models/signin'); //引入signin数据模型
var chatSyllabusHis = require('../models/chatSyllabusHis'); //引入chatSyllabusHis数据模型
var chatPointsService = require('./chatPointsService'); //引入chatPointsService
var async = require('async');
let Deferred = common.Deferred;
/**
 * 客户学员服务类型服务类
 *
 */
var clientTrainService = {
    /**
     * 保存培训班
     * @param groupId
     * @param userId
     * @param nickname
     */
    saveTrain: function(groupId, userId, nickname) {
        let deferred = new Deferred();
        var setObj = { $push: { "traninClient": { "clientId": userId, "nickname": nickname } } };
        chatGroup.findOneAndUpdate({ _id: groupId }, setObj, function(err, row) {
            if (err) {
                logger.error("保存培训报名数据失败! >>saveTrain:", err);
                deferred.reject({ isOK: false, msg: '培训报名失败' });
            } else {
                deferred.resolve({ isOK: true, msg: '恭喜您！报名成功。' });
            }
        });
        return deferred.promise;
    },
    /**
     * 客户学员报名
     * @param params
     */
    addClientTrain: function(params, userInfo) {
        let deferred = new Deferred();
        chatGroup.findOne({ _id: params.groupId, valid: 1, status: { $in: [1, 2] } }, "openDate clientGroup traninClient", function(err, row) {
            if (err) {
                logger.error("查询培训报名数据失败! >>addClientTrain:", err);
                deferred.reject({ isOK: false, msg: '查询培训报名数据失败！' });
            } else {
                var retInfo = {};
                if (row) {
                    var openDate = JSON.parse(row.openDate);
                    var currDate = common.formatterDate(new Date(), '-'),
                        currTime = common.getHHMMSS(new Date());
                    var week = new Date().getDay();
                    var isTraining = openDate.beginDate <= currDate && openDate.endDate >= currDate;
                    var isAuthTime = false;
                    var isOpening = false;
                    var openTimeStr = [];
                    var weekTimeTmp = null;
                    for (var i = 0, lenI = !openDate.weekTime ? 0 : openDate.weekTime.length; i < lenI; i++) {
                        weekTimeTmp = openDate.weekTime[i];
                        if (isTraining) {
                            if (!weekTimeTmp.week || weekTimeTmp.week == week) {
                                if ((!weekTimeTmp.beginTime || weekTimeTmp.beginTime <= currTime) &&
                                    (!weekTimeTmp.endTime || weekTimeTmp.endTime >= currTime)) {
                                    isOpening = true;
                                    openTimeStr = [];
                                    break;
                                } else if (weekTimeTmp.beginTime && weekTimeTmp.beginTime > currTime) {
                                    if (openDate.beginDate == currDate) {
                                        isAuthTime = true;
                                    } else {
                                        openTimeStr.push((weekTimeTmp.beginTime || "00:00:00") + "到" + (weekTimeTmp.endTime || "23:59:59"));
                                    }
                                }
                            }
                        }
                    }
                    openTimeStr = openTimeStr.join("、");

                    if (!common.containSplitStr(row.clientGroup, userInfo.clientGroup)) {
                        retInfo = errorMessage.code_3005;
                        deferred.resolve(retInfo);
                    } else if (row.traninClient) {
                        var trRow = null,
                            isOpen = false,
                            isEntered = false;
                        for (var i = 0; i < row.traninClient.length; i++) {
                            trRow = row.traninClient[i];
                            if (trRow.clientId == userInfo.userId) {
                                isEntered = true;
                                if (isAuthTime) {
                                    retInfo = errorMessage.code_3009;
                                } else {
                                    isOpen = common.dateTimeWeekCheck(row.openDate, false);
                                    if (trRow.isAuth == 1) {
                                        if (isTraining && !isOpening) {
                                            if (openTimeStr) {
                                                retInfo = {
                                                    'errcode': errorMessage.code_3011.errcode,
                                                    'errmsg': errorMessage.code_3011.errmsg.replace("{time}", openTimeStr)
                                                };
                                            } else {
                                                retInfo = {
                                                    'errcode': -1,
                                                    'errmsg': "今天课程已结束，请关注明天课程安排。"
                                                };
                                            }
                                        } else if (openDate.beginDate > currDate) {
                                            retInfo = {
                                                'errcode': -1,
                                                'errmsg': "培训班未开始，开始日期：" + openDate.beginDate
                                            };
                                        } else {
                                            retInfo = isOpen ? { awInto: true } : errorMessage.code_3006;
                                        }
                                    } else {
                                        if (isTraining) {
                                            retInfo = errorMessage.code_3007;
                                        } else {
                                            retInfo = isOpen ? errorMessage.code_3007 : errorMessage.code_3003;
                                        }
                                    }
                                }
                                break;
                            }
                        }
                        if (isTraining && !isEntered) {
                            retInfo = errorMessage.code_3010;
                        }
                        if (retInfo.errcode || retInfo.awInto) {
                            deferred.resolve(retInfo);
                        } else {
                            isOpen = common.dateTimeWeekCheck(row.openDate, false);
                            if (isOpen) {
                                retInfo = errorMessage.code_3008;
                                deferred.resolve(retInfo);
                            } else {
                                clientTrainService.saveTrain(params.groupId, userInfo.userId, params.nickname).then(function(saveRet) {
                                    deferred.resolve(saveRet);
                                });
                            }
                        }
                    } else {
                        clientTrainService.saveTrain(params.groupId, userInfo.userId, params.nickname).then(function(saveRet) {
                            deferred.resolve(saveRet);
                        });
                    }
                } else {
                    deferred.reject({ isOK: false, msg: '查询培训报名数据失败！' });
                }
            }
        });
        return deferred.promise;
    },
    /**
     * 提取培训班数及人数
     * @param groupType
     * @param teachId
     * @param dataCallback
     */
    getTrainAndClientNum: function(groupType, teachId, dataCallback) {
        async.parallel({
                trainNum: function(callback) {
                    chatGroup.find({ "groupType": groupType, roomType: 'train', "defaultAnalyst.userNo": teachId, status: 0 }).count(function(err, num) {
                        callback(null, num);
                    });
                },
                clientNum: function(callback) {
                    chatGroup.find({ "groupType": groupType, roomType: 'train', "defaultAnalyst.userNo": teachId }, function(err, rooms) {
                        var num = 0;
                        if (rooms && rooms.length > 0) {
                            rooms.forEach(function(item) {
                                num += item.traninClient ? item.traninClient.length : 0;
                            });
                        }
                        callback(null, num);
                    });
                }
            },
            function(error, result) {
                dataCallback(result);
            }
        );
    },
    /**
     * 提取培训班列表
     * @param groupType
     * @param teachId
     * @param isAll
     * @param callback
     */
    getTrainList: function(groupType, teachId, isAll, userId) {
        let deferred = new Deferred();
        var searchObj={"groupType":groupType,roomType:'train',valid:1};
        var limit=50,searchFields="_id status defaultAnalyst point openDate clientGroup name traninClient trainConfig label remark";
        if(!isAll){
            searchObj.status={$in:[1,2]};
        }
        if(teachId){
            searchObj["defaultAnalyst.userNo"]=teachId;
            limit=2;
        }
        chatGroup.find(searchObj).select(searchFields).limit(limit).sort({'createDate':'desc'}).exec(function(err,rooms){
            if(err){
                logger.error("获取房间列表失败! >>getChatGroupList:", err);
                callback(null);
            }else{
                var tmList = [];
                var row = null,
                    currDate = common.formatterDate(new Date(), '-');
                if (rooms && rooms.length > 0) {
                    for (var i = 0; i < rooms.length; i++) {
                        row = rooms[i];
                        var openDate = JSON.parse(row.openDate) || {};
                        var isEnd = (openDate.endDate < currDate) || false;
                        tmList.push({
                            "_id": row._id,
                            name: row.name,
                            clientSize: (row.traninClient ? row.traninClient.length : 0),
                            allowInto: common.dateTimeWeekCheck(row.openDate, false, true),
                            clientGroup: row.clientGroup,
                            defaultAnalyst: row.defaultAnalyst,
                            status: row.status,
                            isEnd: isEnd,
                            label: row.label,
                            remark: row.remark,
                            sequence: row.sequence,
                            openDate: JSON.parse(row.openDate)
                        });
                    }
                }
                deferred.resolve(tmList);
            }
        });
        return deferred.promise;
    },

    /**
     * 添加签到
     * @param userInfo
     * @param clientip
     * @param callback
     */
    addSignin: function(userInfo, clientip, callback) {
        var searchObj = { userId: userInfo.mobilePhone, groupType: userInfo.groupType };
        signin.findOne(searchObj, function(err, signinInfo) {
            if (err) {
                logger.error("查询签到数据失败!:", err);
                callback({ isOK: false, msg: '客户签到失败' });
            } else {
                if (signinInfo == null) {
                    signinInfo = new signin({
                        userId: userInfo.mobilePhone,
                        groupType: userInfo.groupType,
                        avatar: userInfo.avatar,
                        signinTime: null,
                        historySignTime: [],
                        signinDays: 0,
                        serialSigDays: 0
                    });
                }
                var today = new Date();
                clientTrainService.checkSign(signinInfo, today, function(err, isSerial, isExist) {
                    if (err) {
                        callback({ isOK: false, msg: '客户签到失败' });
                        return;
                    } else if (isExist) {
                        callback({ isOK: false, msg: errorMessage.code_3002.errmsg });
                        return;
                    } else {
                        if (isSerial) {
                            signinInfo.serialSigDays += 1;
                        } else {
                            signinInfo.serialSigDays = 1;
                        }
                        signinInfo.signinDays += 1;
                        signinInfo.signinTime = today;
                        signinInfo.historySignTime.push(today);
                        signinInfo.save(function(err) {
                            if (err) {
                                logger.error("客户签到数据失败! >>addSignin:", err);
                                callback({ isOK: false, msg: '客户签到失败' });
                            } else {
                                callback({ isOK: true, msg: '客户签到成功', signDays: signinInfo.serialSigDays });
                                clientTrainService.addSignPoints(userInfo, clientip, signinInfo.serialSigDays);
                            }
                        });
                    }
                });
            }
        });
    },

    /**
     * 是否连续签到
     * @param signInfo
     * @param today
     * @param callback (err, isSerial, isExist)
     */
    checkSign: function(signInfo, today, callback) {
        if (!signInfo || !signInfo.signinTime) {
            callback(null, true, false); //从未签到
        } else {
            var lastSignDate = signInfo.signinTime;
            lastSignDate = new Date(lastSignDate.getFullYear(), lastSignDate.getMonth(), lastSignDate.getDate());
            today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            if (lastSignDate.getTime() == today.getTime()) {
                callback(null, false, true); //重复
            } else if (lastSignDate.getMonth() != today.getMonth()) { //跨月
                callback(null, false, false); //月初
            } else {
                chatSyllabusHis.count({
                    groupType: signInfo.groupType,
                    date: { $gt: lastSignDate, $lt: today }
                }, function(err, cnt) {
                    if (err) {
                        logger.error("验证签到连续性，查询课程历史信息出错! >>isSerial:", err);
                        //从未签到
                        callback(err, false, false);
                    } else {
                        callback(null, cnt <= 0, false);
                    }
                });
            }
        }
    },

    /**
     * 添加签到积分
     */
    addSignPoints: function(userInfo, clientip, days) {
        var signParam = {
            userId: userInfo.mobilePhone,
            groupType: userInfo.groupType,
            clientGroup: userInfo.clientGroup,
            type: 'daily',
            item: 'daily_sign',
            tag: 'sign',
            isGlobal: false,
            opUser: userInfo.userId,
            opIp: clientip,
            remark: "每日签到"
        };
        chatPointsService.add(signParam, function(error, result) {
            if (days == 3) {
                signParam.item = 'daily_sign3';
                signParam.remark = "连续签到3天";
                chatPointsService.add(signParam, function(error, result) {});
            } else if (days == 7) {
                signParam.item = 'daily_sign7';
                signParam.remark = "连续签到7天";
                chatPointsService.add(signParam, function(error, result) {});
            } else if (days == 10) {
                signParam.item = 'daily_sign10';
                signParam.remark = "连续签到10天";
                chatPointsService.add(signParam, function(error, result) {});
            } else if (days == 30) {
                signParam.item = 'daily_sign30';
                signParam.remark = "连续签到30天";
                chatPointsService.add(signParam, function(error, result) {});
            }
        });
    },

    /**
     * 查询签到
     * @param params
     */
    getSignin: function(userInfo, dataCallback) {
        let deferred = new Deferred();
        var today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        async.parallel({
                signinInfo: function(callback) {
                    signin.findOne({
                        userId: userInfo.mobilePhone,
                        groupType: userInfo.groupType
                    }, function(err, row) {
                        if (err) {
                            logger.error("查询客户签到数据失败!:", err);
                        }
                        var signObj = { signDays: 0 };
                        if (row) {
                            if (row.signinTime && today.getMonth() != row.signinTime.getMonth()) { //首日
                                signObj.signDays = 0;
                            } else {
                                signObj.signDays = row.serialSigDays;
                            }
                        }
                        callback(null, signObj);
                    });
                },
                signinUser: function(callback) { //当天最近10条签到用户
                    signin.find({
                        "userId": { $ne: userInfo.mobilePhone },
                        signinTime: {
                            '$gte': today
                        }
                    }).sort({ "signinTime": -1 }).limit(10).exec("find", function(err, data) {
                        if (err) {
                            logger.error("查询最近签到客户数据失败!:", err);
                        }
                        callback(null, data);
                    });
                }
            },
            function(error, result) {
                deferred.resolve(result);
            });
        return deferred.promise;
    },
    /**
     * 查询客户当天是否签到
     */
    checkTodaySignin: function(userInfo, clientip, callback) {
        var searchObj = { userId: userInfo.mobilePhone, groupType: userInfo.groupType };
        signin.findOne(searchObj, function(err, signinInfo) {
            if (err) {
                logger.error("查询签到数据失败!:", err);
                callback({ isOK: false, msg: '查询客户签到数据失败' });
            } else {
                if (signinInfo == null) {
                    signinInfo = new signin({
                        userId: userInfo.mobilePhone,
                        groupType: userInfo.groupType,
                        avatar: userInfo.avatar,
                        signinTime: null,
                        historySignTime: [],
                        signinDays: 0,
                        serialSigDays: 0
                    });
                }
                var today = new Date();
                clientTrainService.checkSign(signinInfo, today, function(err, isSerial, isExist) {
                    if (err) {
                        callback({ isOK: false, msg: '客户未签到' });
                        return;
                    } else if (isExist) {
                        callback({ isOK: true, msg: errorMessage.code_3002.errmsg });
                        return;
                    } else {
                        callback({ isOK: false, msg: '客户未签到' });
                    }
                });
            }
        });
    }
};
//导出服务类
module.exports = clientTrainService;