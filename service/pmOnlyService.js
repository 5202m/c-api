let chatGroup = require('../models/chatGroup'); //引入chatGroup数据模型
let signin = require('../models/signin'); //引入signin数据模型
let logger = require('../resources/logConf').getLogger('chatTeacherService'); //引入log4js
let common = require('../util/common'); //引入common类
let errorMessage = require('../util/errorMessage'); //引入errorMessage类
let clientTrainService = require('./clientTrainService'); //引入chatPointsService
let chatService = require("./chatService");
let Deferred = common.Deferred;
let async = require('async');

module.exports = {
    saveTrain: function(groupId, userId, nickname, isAuth, callback) {
        let deferred = new Deferred();
        var setObj = {
            $push: {
                "traninClient": {
                    "clientId": userId,
                    "nickname": nickname,
                    "isAuth": isAuth ? 1 : 0,
                    "dateTime": new Date()
                }
            }
        };
        chatGroup.findOneAndUpdate({ _id: groupId }, setObj, function(err, row) {
            if (err) {
                logger.error("保存培训报名数据失败! >>saveTrain:", err);
                deferred.reject(false);
            } else {
                deferred.resolve(true);
            }
        });
        return deferred.promise;
    },
    fillOpenTime: function(errorMsg, openDate) {
        openDate = common.parseJson(openDate);
        if (!errorMsg || !openDate || (errorMsg.errcode != "4002" && errorMsg.errcode != "4015" && errorMsg.errcode != "4019")) {
            return errorMsg;
        }
        var result = { 'errcode': errorMsg.errcode, 'errmsg': errorMsg.errmsg };
        var currDate = common.formatterDate(new Date(), '-'),
            currTime = common.getHHMMSS(new Date());
        if ((!openDate.beginDate || openDate.beginDate <= currDate) &&
            (!openDate.endDate || openDate.endDate >= currDate)) {
            var openTimeStr = [];
            var week = new Date().getDay();
            var weekTimeTmp = null;
            for (var i = 0, lenI = !openDate.weekTime ? 0 : openDate.weekTime.length; i < lenI; i++) {
                weekTimeTmp = openDate.weekTime[i];
                if (!weekTimeTmp.week || weekTimeTmp.week == week) {
                    if ((!weekTimeTmp.beginTime || weekTimeTmp.beginTime <= currTime) &&
                        (!weekTimeTmp.endTime || weekTimeTmp.endTime >= currTime)) {
                        openTimeStr = [];
                        break;
                    } else if (weekTimeTmp.beginTime && weekTimeTmp.beginTime > currTime) {
                        openTimeStr.push((weekTimeTmp.beginTime || "00:00").substring(0, 5) + "-" + (weekTimeTmp.endTime || "23:59").substring(0, 5));
                    }
                }
            }
            if (openTimeStr.length > 0) {
                openTimeStr = "：" + openTimeStr.join("、");
            } else {
                openTimeStr = "";
            }
            result.errmsg = result.errmsg.replace("{time}", openTimeStr);
        } else {
            result.errmsg = result.errmsg.replace("{time}", "");
        }
        return result;
    },
    addClientTrain: function(params, userInfo) {
        let deferred = new Deferred();
        let _this = this;
        chatGroup.findOne({ _id: params.groupId, valid: 1, status: { $in: [1, 2] } }, "openDate clientGroup traninClient", function(err, row) {
            var result = null;
            if (err) {
                logger.error("查询培训报名数据失败! >>addClientTrain:", err);
                result = errorMessage.code_4011;
            } else if (!row) {
                result = errorMessage.code_4012;
            } else if (!common.containSplitStr(row.clientGroup, userInfo.clientGroup)) {
                result = errorMessage.code_4013;
            } else {
                for (var i = 0, lenI = !row.traninClient ? 0 : row.traninClient.length; i < lenI; i++) {
                    if (row.traninClient[i].clientId == userInfo.userId) {
                        if (row.traninClient[i].isAuth != 1) {
                            result = errorMessage.code_4014;
                        } else {
                            //已授权
                            if (common.dateTimeWeekCheck(row.openDate, false)) {
                                result = errorMessage.code_4016;
                            } else {
                                result = errorMessage.code_4015;
                            }
                        }
                        break;
                    }
                }
                if (!result && !params.noApprove) { //报名不需要审批，则无报名时间限制，否则开放日期之前才是报名时间
                    var openDate = common.parseJson(row.openDate);
                    var currDate = common.formatterDate(new Date(), '-');
                    if (openDate && openDate.beginDate <= currDate) {
                        result = errorMessage.code_4017;
                    }
                }
            }
            if (!result) {
                _this.saveTrain(params.groupId, userInfo.userId, params.nickname, params.noApprove).then(function(isOK) {
                    var result = null;
                    if (!isOK) {
                        result = errorMessage.code_4018;
                    } else if (!common.dateTimeWeekCheck(row.openDate, false)) {
                        result = errorMessage.code_4019;
                    }
                    result = _this.fillOpenTime(result, row.openDate);
                    deferred.resolve({ code: result.errcode, message: result.errmsg });
                });
            } else {
                result = _this.fillOpenTime(result, row.openDate);
                deferred.reject({ code: result.errcode, message: result.errmsg });
            }
        });
        return deferred.promise;
    },
    getTrainList: function(groupType, teachId, isAll, userId) {
        let deferred = new Deferred();
        var searchObj = { "groupType": groupType, roomType: 'train', valid: 1 };
        var limit = 50,
            searchFields = "_id status defaultAnalyst point openDate clientGroup name traninClient trainConfig label remark";
        if (!isAll) {
            searchObj.status = { $in: [1, 2] };
        }
        if (teachId) {
            searchObj["defaultAnalyst.userNo"] = teachId;
            limit = 2;
        }
        chatGroup.find(searchObj).select(searchFields).limit(limit).sort({ 'createDate': 'desc' }).exec(function(err, rooms) {
            if (err) {
                logger.error("获取房间列表失败! >>getChatGroupList:", err);
                deferred.reject(err);
            } else {
                var tmList = [];
                var row = null;
                if (rooms && rooms.length > 0) {
                    for (var i = 0; i < rooms.length; i++) {
                        row = rooms[i].toObject();

                        row.trainAuth = -1;
                        if (userId) {
                            for (var j = 0, lenJ = !row.traninClient ? 0 : row.traninClient.length; j < lenJ; j++) {
                                if (row.traninClient[j].clientId == userId) {
                                    row.trainAuth = row.traninClient[j].isAuth;
                                    break;
                                }
                            }
                        }
                        row.clientSize = row.traninClient ? row.traninClient.length : 0;
                        delete row["traninClient"];
                        tmList.push(row);
                    }
                }
                deferred.resolve(tmList);
            }
        });
        return deferred.promise;
    },
    getSignin: function(userInfo) {
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
                        clientTrainService.checkSign(row, today, function(err, isSerial, isExist) {
                            var result = { signDays: 0 };
                            if (row && row.signinTime && (isSerial || isExist)) {
                                result.signDays = row.serialSigDays;
                            }
                            callback(null, result);
                        });
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
            })
        return deferred.promise;
    },
    /**
     * 检查房间权限
     * @param roomType 房间类型
     * @param groupId 房间编号
     * @param userId 用户编号
     * @param clientGroup 客户组
     * @param callback
     */
    checkGroupAuth: function(params) {
        let roomType = params.roomType,
            groupId = params.groupId,
            clientGroup = params.clientGroup,
            userId = params.userId;
        let deferred = new Deferred();
        let _this = this;
        var searchObj = {
            valid: 1
        };
        if (roomType) {
            searchObj.roomType = roomType;
        } else if (groupId) {
            searchObj._id = groupId;
        }
        chatGroup.findOne(searchObj, function(err, room) {
            if (err) {
                logger.warn("checkGroupAuth->not auth:" + err);
            }
            var result = null;
            if (!room) {
                result = errorMessage.code_4000;
            } else if (room.status == 0) {
                result = errorMessage.code_4001;
            } else if (room.status == 2) { //授权访问
                var authCode = -1;
                if (userId) {
                    for (var i = 0, lenI = room.traninClient ? room.traninClient.length : 0; i < lenI; i++) {
                        if (room.traninClient[i].clientId == userId) {
                            authCode = room.traninClient[i].isAuth || 0;
                            break;
                        }
                    }
                }
                if (authCode == -1) {
                    result = errorMessage.code_4007;
                } else if (authCode == 0) {
                    var openDate = common.parseJson(room.openDate);
                    var nowDate = new Date();
                    var nowTime = common.getHHMMSS(nowDate);
                    nowDate = common.formatterDate(nowDate);
                    var hasStarted = false;
                    if (!openDate) {
                        hasStarted = true;
                    } else if (!openDate.beginDate || nowDate == openDate.beginDate) {
                        if (!openDate.weekTime || !openDate.weekTime[0] || !openDate.weekTime[0] <= nowTime) {
                            hasStarted = true;
                        }
                    } else if (nowDate > openDate.beginDate) {
                        hasStarted = true;
                    }
                    if (hasStarted) {
                        result = errorMessage.code_4009;
                    } else {
                        result = errorMessage.code_4008;
                    }
                }
            }
            if (!result && room.status == 1 && !common.containSplitStr(room.clientGroup, clientGroup)) { //有效，授权访问的情况单独判定
                if (/^((,visitor)|(,register))+$/.test("," + room.clientGroup)) {
                    result = errorMessage.code_4004;
                } else if (room.clientGroup == "vip") {
                    result = errorMessage.code_4006;
                } else if (/^((,active)|(,vip))+$/.test("," + room.clientGroup)) {
                    result = errorMessage.code_4005;
                } else {
                    result = errorMessage.code_4003;
                }
            }
            if (!result && !common.dateTimeWeekCheck(room.openDate, true)) {
                result = errorMessage.code_4002;
            }
            if (room) {
                room = room.toObject();
                delete room["traninClient"];
                delete room["chatRules"];
            }
            if (result) {
                result = _this.fillOpenTime(result, room.openDate);
                room.checkState = {};
                room.checkState.code = result.errcode;
                room.checkState.message = result.errmsg;
                deferred.resolve(room);
            } else {
                chatService.getRoomOnlineTotalNum(room._id, function(onlineNum) {
                    if (room.maxCount <= onlineNum) {
                        result = errorMessage.code_4010;
                        room.checkState = {};
                        room.checkState.code = result.errcode;
                        room.checkState.message = result.errmsg;
                    }
                    deferred.resolve(room);
                });
            }
        });
        return deferred.promise;
    }
};