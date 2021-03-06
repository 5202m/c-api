/** 直播服务类
 * Created by Alan.wu on 2015/7/8.
 */
var http = require('http'); //引入http
var async = require('async'); //引入async
var constant = require('../constant/constant'); //引入constant
var chatGroup = require('../models/chatGroup'); //引入chatGroup数据模型
var member = require('../models/member'); //引入member数据模型
var chatClientGroup = require('../models/chatClientGroup'); //引入chatClientGroup数据模型
var common = require('../util/common'); //引入common类
var errorMessage = require('../util/errorMessage'); //引入errorMessage类
var logger = require('../resources/logConf').getLogger('studioService'); //引入log4js
var userService = require('./userService'); //引入userService
var syllabusService = require('./syllabusService'); //引入syllabusService
var chatPointsService = require('./chatPointsService'); //引入chatPointsService
var boUser = require('../models/boUser'); //引入boUser数据模型
var baseApiService = require('./baseApiService'); //引入baseApiService
var chatPraiseService = require('./chatPraiseService'); //引入chatPraiseService
var clientTrainService = require('./clientTrainService'); //引入clientTrainService
var showTradeService = require('./showTradeService'); //引入showTradeService
let Deferred = common.Deferred;
/**
 * 定义直播服务类
 * @type {{}}
 */
var studioService = {
    /**
     * 提取主页需要加载的数据
     * @param userInfo
     * @param groupId
     * @param isGetRoomList 是否加载房间
     * @param isGetSyllabus 是否加载课程表数据
     * @param isGetMember   是否客户信息
     * @param dataCallback
     */
    getIndexLoadData: function(userId, groupType, groupId, isGetRoomList, isGetSyllabus, isGetMember, dataCallback) {
        var userInfo = {
            userId: userId,
            groupType: groupType,
            isLogin: isGetMember
        };
        async.parallel({
                studioList: function(callback) {
                    if (isGetRoomList) {
                        studioService.getRoomList(userInfo.groupType, function(rows) {
                            callback(null, rows);
                        });
                    } else {
                        callback(null, null);
                    }
                },
                syllabusResult: function(callback) {
                    if (isGetSyllabus) {
                        syllabusService.getSyllabus(userInfo.groupType, groupId, function(data) {
                            callback(null, data);
                        });
                    } else {
                        callback(null, null);
                    }
                },
                memberInfo: function(callback) {
                    if (isGetMember && userInfo.userId) {
                        member.findOne({
                            valid: 1,
                            'loginPlatform.chatUserGroup': {
                                $elemMatch: {
                                    _id: userInfo.groupType,
                                    userId: userInfo.userId
                                }
                            }
                        }, function(err, row) {
                            if (!err && row && common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                                var group = row.loginPlatform.chatUserGroup.id(userInfo.groupType);
                                if (group) {
                                    userInfo.userId = group.userId;
                                    userInfo.avatar = group.avatar;
                                    userInfo.userType = group.userType;
                                    userInfo.vipUser = group.vipUser;
                                    userInfo.clientGroup = group.vipUser ? constant.clientGroup.vip : group.clientGroup;
                                    userInfo.nickname = group.nickname;
                                    userInfo.userName = group.userName;
                                    userInfo.email = group.email;
                                    userInfo.accountNo = group.accountNo;
                                    userInfo.mobilePhone = row.mobilePhone;
                                }
                            } else {
                                logger.warn("memberInfo error", err, row, JSON.stringify({
                                    valid: 1,
                                    'loginPlatform.chatUserGroup': {
                                        $elemMatch: {
                                            _id: userInfo.groupType,
                                            userId: userInfo.userId
                                        }
                                    }
                                }));
                            }
                            callback(null, userInfo);
                        });
                        return;
                    }
                    callback(null, userInfo);
                },
                pointsGlobal: function(callback) {
                    chatPointsService.getPointsInfo(userInfo.groupType, userInfo.mobilePhone, true, function(r) {
                        var point = 0;
                        if (r && r.pointsGlobal) {
                            point = r.pointsGlobal
                        }
                        callback(null, point);
                    });
                }
            },
            function(err, results) {
                dataCallback(results);
            });
    },
    /**
     * 提取房间列表
     * @param callback
     */
    getRoomList: function(groupType, callback) {
        chatGroup.find({
                valid: 1,
                status: {
                    $in: [1, 2]
                },
                groupType: groupType
            })
            .select({
                traninClient: 1,
                status: 1,
                clientGroup: 1,
                remark: 1,
                name: 1,
                level: 1,
                groupType: 1,
                talkStyle: 1,
                whisperRoles: 1,
                chatRules: 1,
                openDate: 1,
                defTemplate: 1,
                roomType: 1,
                defaultAnalyst: 1,
                defaultCS: 1,
                logo: 1
            })
            .sort({
                'sequence': 'asc'
            })
            .exec(function(err, rows) {
                if (err) {
                    logger.error("getStudioList fail:" + err);
                }
                callback(rows);
            });
    },
    /**
     * 提取客户组列表
     * @param callback
     */
    getClientGroupList: function(groupType, callback) {
        chatClientGroup.find({ valid: 1, groupType: groupType }).sort({ 'sequence': 'asc' }).exec(function(err, rows) {
            if (err) {
                logger.error("getClientGroupList fail:" + err);
            }
            callback(rows);
        });
    },
    /**
     * 重置密码
     */
    resetPwd: function(groupType, mobilePhone, newPwd, oldPwd, callback) {
        var searchObj = null;
        if (common.isValid(oldPwd)) {
            searchObj = { valid: 1, 'mobilePhone': mobilePhone, 'loginPlatform.chatUserGroup': { $elemMatch: { _id: groupType, pwd: common.getMD5(constant.pwdKey + oldPwd) } } };
        } else {
            searchObj = { valid: 1, 'mobilePhone': mobilePhone, 'loginPlatform.chatUserGroup._id': groupType };
        }
        member.findOneAndUpdate(searchObj, { '$set': { 'loginPlatform.chatUserGroup.$.pwd': common.getMD5(constant.pwdKey + newPwd) } }, function(err, row) {
            if (err || !row) {
                logger.error("resetPwd fail:" + err);
                callback({ isOK: false, error: errorMessage.code_1008 });
            } else {
                callback({ isOK: true, msg: "Reset password Success!" });
            }
        });
    },

    /**
     * 提取直播间
     */
    getStudioByGroupId: function(groupId, callback) {
        chatGroup.findById(groupId).select({ clientGroup: 1, name: 1, talkStyle: 1, whisperRoles: 1, point: 1, traninClient: 1 }).exec(function(err, row) {
            if (err) {
                logger.error("getStudioList fail:" + err);
            }
            callback(row);
        });
    },
    /**
     * 检查用户组权限
     */
    checkGroupAuth: function(params) {
        let roomType = params.roomType,
            groupId = params.groupId,
            clientGroup = params.clientGroup,
            userId = params.userId;
        let deferred = new Deferred();
        var searchObj = { valid: 1 };
        if (roomType) {
            searchObj.roomType = roomType;
        } else if (groupId) {
            searchObj._id = groupId;
        }
        if (userId) {
            searchObj.$or = [
                { 'clientGroup': common.getSplitMatchReg(clientGroup), status: 1 },
                { 'clientGroup': common.getSplitMatchReg(clientGroup), status: 2, traninClient: { $elemMatch: { isAuth: 1, clientId: userId } } } //授权访问
            ];
        } else {
            searchObj.clientGroup = common.getSplitMatchReg(clientGroup);
            searchObj.status = 1; //有效
        }
        if (common.isBlank(clientGroup) && searchObj.clientGroup) {
            delete searchObj.clientGroup;
        }
        chatGroup.findOne(searchObj, function(err, group) {
            if (err) {
                logger.warn("checkGroupAuth->not auth:" + err);
                deferred.reject(group, err);
            }
            deferred.resolve(group);
        });
        return deferred.promise;
    },

    /**
     * 通过客户组提取默认房间
     * @param clientGroup
     */
    getDefaultRoom: function(groupType, clientGroup, callback) {
        chatClientGroup.findOne({ groupType: groupType, clientGroupId: clientGroup }, function(err, row) {
            if (err) {
                logger.error("getDefaultRoom fail: ", "groupType=" + groupType, "clientGroup=" + clientGroup, err);
            }
            if (row) {
                callback(row.defChatGroupId);
            } else {
                logger.warn("getDefaultRoom empty: ", "groupType=" + groupType, "clientGroup=" + clientGroup);
                callback("");
            }
        });
    },
    /**
     * 直播间注册
     * @param callback
     */
    studioRegister: function(userInfo, clientGroup, callback) {
        var result = { isOK: false, error: errorMessage.code_10 };
        if (userInfo.nickname) {
            //判断昵称唯一
            studioService.checkNickName(userInfo, function(err, isValid) {
                if (err) {
                    logger.error(err);
                    callback(result);
                } else if (isValid) {
                    studioService.studioRegisterSave(userInfo, clientGroup, callback);
                } else { //重复
                    logger.warn("Nickname exists, please choose another one.");
                    result.error = errorMessage.code_1012;
                    callback(result);
                }
            });
        } else {
            studioService.studioRegisterSave(userInfo, clientGroup, callback);
        }
    },
    /**
     * 直播间注册保存
     */
    studioRegisterSave: function(userInfo, clientGroup, callback) {
        var result = { isOK: false, error: errorMessage.code_10 };
        member.findOne({ mobilePhone: userInfo.mobilePhone, valid: 1 }, "loginPlatform.chatUserGroup", function(err, row) {
            if (err) {
                logger.error("studioRegister fail:" + err);
                callback(result);
                return;
            }
            userInfo.clientGroup = clientGroup;
            if (row) {
                if (row.loginPlatform && common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                    var userGroup = row.loginPlatform.chatUserGroup;
                    var currRow = null;
                    for (var i = 0; i < userGroup.length; i++) {
                        currRow = userGroup[i];
                        if (currRow._id === userInfo.groupType) {
                            result.error = errorMessage.code_1018;
                            userInfo.nickname = currRow.nickname;
                            userInfo.userId = currRow.userId;
                            result.nickname = currRow.nickname;
                            result.userId = currRow.userId;
                            callback(result);
                            return;
                        }
                    }
                }
            }
            studioService.setClientInfo(row, userInfo, function(resultTmp) {
                resultTmp.groupId = userInfo.groupId;
                callback(resultTmp);
                logger.info("studioService.setClientInfo >>> userInfo = ", JSON.stringify(userInfo));
                logger.info("studioService.setClientInfo >>> resultTmp = ", JSON.stringify(resultTmp));
            });
            if (common.isValid(userInfo.item)) {
                //注册积分
                var pointsParams = { clientGroup: clientGroup, groupType: userInfo.groupType, userId: userInfo.mobilePhone, item: userInfo.item, val: 0, isGlobal: false, remark: '', opUser: userInfo.userId, opIp: userInfo.ip };
                chatPointsService.add(pointsParams, function() {
                    //DEMO积分
                    if (clientGroup == constant.clientGroup.simulate || clientGroup == constant.clientGroup.notActive || clientGroup == constant.clientGroup.active) {
                        var pointsParamsD = { clientGroup: clientGroup, groupType: userInfo.groupType, userId: userInfo.mobilePhone, item: "hand_openDemo", val: 0, isGlobal: false, remark: '', opUser: userInfo.userId, opIp: userInfo.ip };
                        chatPointsService.add(pointsParamsD, function() {
                            //N客户积分
                            if (clientGroup == constant.clientGroup.notActive || clientGroup == constant.clientGroup.active) {
                                var pointsParamsN = { clientGroup: clientGroup, groupType: userInfo.groupType, userId: userInfo.mobilePhone, item: "hand_openReal", val: 0, isGlobal: false, remark: '', opUser: userInfo.userId, opIp: userInfo.ip };
                                chatPointsService.add(pointsParamsN, function() {
                                    //A客户积分
                                    if (clientGroup == constant.clientGroup.active) {
                                        var pointsParamsA = { clientGroup: clientGroup, groupType: userInfo.groupType, userId: userInfo.mobilePhone, item: "hand_deposit", val: 0, isGlobal: false, remark: '', opUser: userInfo.userId, opIp: userInfo.ip };
                                        chatPointsService.add(pointsParamsA, function(result) {});
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },
    /**
     * 检查客户信息是否存在，
     * 1、存在则把需要与接口提取的用户数据（交易账号，账号级别）同步更新
     * 2、不存在则视为新的记录插入
     * @param userInfo
     * @param callback
     */
    checkMemberAndSave: function(userInfo, callback) {
        var result = { isOK: false, error: errorMessage.code_10 };
        member.findOne({ mobilePhone: userInfo.mobilePhone.replace(/^\d+$|^\d+-/ , ''), valid: 1, 'loginPlatform.chatUserGroup.userType': 0 }, "loginPlatform.chatUserGroup", function(err, row) {
            if (err) {
                logger.error("checkMemberAndSave fail:" + err);
                callback(result);
            } else {
                if (row && row.loginPlatform && common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                    var userGroupArr = row.loginPlatform.chatUserGroup;
                    var currRow = userGroupArr.id(userInfo.groupType);
                    if (currRow) {
                        result.userId = currRow.userId;
                        userInfo.userId = currRow.userId;
                        userInfo.nickname = currRow.nickname;
                        userInfo.avatar = currRow.avatar;
                        userInfo.defTemplate = currRow.defTemplate; //用户设置的默认皮肤
                        if (currRow.vipUser) { //如果是mis后台内部修改为vip，则以该值为准，
                            userInfo.clientGroup = constant.clientGroup.vip;
                        } else {
                            //如果是低级别的需要升级别
                            if (constant.clientGroupSeq[currRow.clientGroup] < constant.clientGroupSeq[userInfo.clientGroup]) {
                                currRow.clientGroup = userInfo.clientGroup;
                            }
                            if (common.isValid(userInfo.accountNo) && common.isValid(currRow.accountNo) && !common.containSplitStr(currRow.accountNo, userInfo.accountNo)) {
                                currRow.accountNo += ',' + userInfo.accountNo; //保存多个账号
                            }
                        }
                        row.save(function(err) {
                            if (err) {
                                logger.error("checkMemberAndSave->update member fail!:" + err);
                            }
                        });
                        result.isOK = true;
                        delete result.error;
                        callback(result);
                    } else {
                        studioService.setClientInfo(row, userInfo, function(resultTmp) {
                            callback(resultTmp);
                        });
                    }
                } else {
                    studioService.setClientInfo(row, userInfo, function(resultTmp) {
                        callback(resultTmp);
                    });
                }
            }
        });
    },
    /**
     * 判断昵称唯一
     * @param userInfo {{mobilePhone:String, groupType:String, nickname:String}}
     * @param callback (err, boolean)，true-唯一，false-不唯一
     */
    checkNickName: function(userInfo, callback) {
        member.findOne({
            mobilePhone: { $ne: userInfo.mobilePhone },
            valid: 1,
            "loginPlatform.chatUserGroup": {
                $elemMatch: {
                    _id: userInfo.groupType,
                    nickname: userInfo.nickname,
                    userType: 0
                }
            }
        }, "loginPlatform.chatUserGroup", function(err, sameNicknameRow) {
            if (err) {
                logger.error("checkNickName fail:" + err);
                callback(err, false);
                return;
            }
            //存在记录，昵称重复
            if (sameNicknameRow) {
                callback(null, false);
            } else {
                callback(null, true);
            }
        });
    },
    /**
     * 通过手机号码提取用户id
     * @param mobilePhone
     */
    formatMobileToUserId: function(mobilePhone) {
        var str = [];
        str[0] = 'p', str[1] = 'x', str[2] = 'i', str[3] = 'u', str[4] = 'd', str[5] = 'c', str[6] = 'v', str[7] = 's', str[8] = 'n', str[9] = 'f';
        var userId = '';
        for (var i = 0; i < mobilePhone.length; i++) {
            userId += str[parseInt(mobilePhone.charAt(i))];
        }
        var index1 = Math.floor(Math.random() * 10),
            index2 = Math.floor(Math.random() * 10);
        return str[index1] + userId + str[index2];
    },
    /**
     * 设置客户信息
     * @param memberRow 是否存在客户记录
     * @param userInfo
     */
    setClientInfo: function(memberRow, userInfo, callback) {
        var result = { isOK: false, error: errorMessage.code_10, defGroupId: '' };
        studioService.getDefaultRoom(userInfo.groupType, userInfo.clientGroup, function(defId) {
            if (common.isBlank(defId)) {
                logger.error("setClientInfo fail: ", "caused by getDefaultRoom fail!", "userInfo=" + JSON.stringify(userInfo));
                callback(result);
            } else {
                userInfo.groupId = defId; //提取默认房间
                userInfo.userId = studioService.formatMobileToUserId(userInfo.mobilePhone);
                result.userId = userInfo.userId;
                result.defGroupId = defId;
                /*userInfo.pwd=common.getMD5(constant.pwdKey+userInfo.pwd);*/
                if (memberRow) { //插入记录
                    var hasRoomsRow = common.checkArrExist(memberRow.loginPlatform.chatUserGroup) && memberRow.loginPlatform.chatUserGroup.id(userInfo.groupType);
                    userService.createChatUserGroupInfo(userInfo, hasRoomsRow, function(isSuccess) {
                        if (isSuccess) {
                            callback({ isOK: true, userId: userInfo.userId });
                        } else {
                            callback(result);
                        }
                    });
                } else {
                    userService.saveMember(userInfo, function(isSuccess) {
                        if (isSuccess) {
                            callback({ isOK: true, userId: userInfo.userId });
                        } else {
                            callback(result);
                        }
                    });
                }
            }
        });
    },

    /**
     * 加入新的房间组
     * @param groupType
     * @param mobilePhone
     * @param userId
     * @param newGroupId
     * @param isLogin
     * @param callback
     */
    joinNewGroup: function(groupType, mobilePhone, userId, newGroupId, isLogin, callback) {
        var result = { isOK: false, error: null };
        if (!isLogin) {
            result.isOK = true;
            callback(result);
            return;
        }
        userService.joinNewRoom({ groupType: groupType, userId: userId, groupId: newGroupId, mobilePhone: mobilePhone }, function() {
            result.isOK = true;
            callback(result);
        });
    },
    /**
     * 通过手机号码检测客户组
     * @param mobilePhone
     */
    checkClientGroup: function(mobilePhone, accountNo, platformKey, callback) {
        var clientGroup = constant.clientGroup.register;
        var apiService = require('../service/' + platformKey + 'ApiService'); //引入ApiService
        apiService.checkAClient({ mobilePhone: mobilePhone, accountNo: accountNo, ip: '', isCheckByMobile: true }, function(result) {
            console.log("checkAClient->flagResult:" + JSON.stringify(result));
            if (result.flag == 2) {
                clientGroup = constant.clientGroup.notActive;
                callback(clientGroup, result.accountNo);
            } else if (result.flag == 3) {
                clientGroup = constant.clientGroup.active;
                callback(clientGroup, result.accountNo);
            } else {
                //检查用户是否模拟用户
                apiService.checkSmClient(mobilePhone, function(hasRow) {
                    if (hasRow) {
                        clientGroup = constant.clientGroup.simulate;
                    }
                    callback(clientGroup);
                });
            }
        });
    },
    /**
     * 客户登陆
     * @param userInfo
     * @param type
     *          1-手机登录,匹配手机号
     *          2-自动登录,匹配userId
     *          3-第三方平台自动登录,匹配thirdId
     *          4-手机号码+密码登录
     * @param callback
     */
    login: function(userInfo, type, callback) {
        var result = { isOK: false, error: '' },
            searchObj = null;
        switch (type) {
            case 1: //手机号登录
                searchObj = {
                    mobilePhone: userInfo.mobilePhone,
                    valid: 1,
                    'loginPlatform.chatUserGroup._id': userInfo.groupType
                };
                break;
            case 2: //userId登录
                searchObj = {
                    valid: 1,
                    "loginPlatform.chatUserGroup": {
                        $elemMatch: {
                            "_id": userInfo.groupType,
                            "userId": userInfo.userId
                        }
                    }
                };
                break;
            case 3: //thirdId登录
                searchObj = {
                    valid: 1,
                    "loginPlatform.chatUserGroup": {
                        $elemMatch: {
                            "_id": userInfo.groupType,
                            "thirdId": userInfo.thirdId
                        }
                    }
                };
                break;
            case 4: //手机号+密码登录
                var pwd = common.getMD5(constant.pwdKey + userInfo.password);
                searchObj = {
                    $or: [{ mobilePhone: userInfo.mobilePhone, 'loginPlatform.chatUserGroup': { $elemMatch: { "_id": userInfo.groupType, "pwd": pwd } } },
                        { 'loginPlatform.chatUserGroup': { $elemMatch: { email: userInfo.mobilePhone, _id: userInfo.groupType, "pwd": pwd } } },
                        { 'loginPlatform.chatUserGroup': { $elemMatch: { userName: userInfo.mobilePhone, _id: userInfo.groupType, "pwd": pwd } } }
                    ],
                    'loginPlatform.chatUserGroup._id': userInfo.groupType,
                    valid: 1
                };
                break;
            default:
                result.error = errorMessage.code_1000;
                callback(result);
                return;
        }
        member.findOne(searchObj, 'mobilePhone loginPlatform.chatUserGroup.$', function(err, row) {
            if (row && common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                result.isOK = true;
                var info = row.loginPlatform.chatUserGroup[0];
                result.userInfo = { mobilePhone: row.mobilePhone, userId: info.userId, nickname: info.nickname, avatar: info.avatar, groupType: info._id, defTemplate: info.defTemplate };
                result.userInfo.clientGroup = info.vipUser ? constant.clientGroup.vip : info.clientGroup;
                result.userInfo.accountNo = info.accountNo;
                result.userInfo.email = common.isBlank(info.email) ? '' : info.email;
                result.userInfo.userName = common.isBlank(info.userName) ? '' : info.userName;
                result.userInfo.password = common.isBlank(info.pwd) ? '' : '已设置';
                if (type == 1 && userInfo.thirdId && !info.thirdId) { //微信直播间登录，绑定openId
                    member.update(searchObj, {
                        $set: { "loginPlatform.chatUserGroup.$.thirdId": userInfo.thirdId }
                    }, function(err) {
                        if (err) {
                            logger.error("login << save thirdId fail:" + err);
                        }
                    });
                }
                callback(result);
            } else {
                result.error = errorMessage.code_1008;
                callback(result);
            }
        });
    },
    /**
     * 通过手机号码检测客户组
     * @param mobilePhone
     * @param clientGroup
     * @param callback
     */
    upgradeClientGroup: function(groupType, mobilePhone, clientGroup, callback) {
        var apiService = require('../service/' + common.getTempPlatformKey(groupType) + 'ApiService'); //引入ApiService
        if (clientGroup === constant.clientGroup.active || clientGroup === constant.clientGroup.notActive) {
            //升级到真实
            apiService.checkAClient({ mobilePhone: mobilePhone, isCheckByMobile: true }, function(result) {
                console.log("checkAClient->flagResult:" + JSON.stringify(result));
                if (result.flag == 2 || result.flag == 3) {
                    var clientGroupTmp = result.flag == 2 ? constant.clientGroup.notActive : constant.clientGroup.active;
                    studioService.updateClientGroup(groupType, mobilePhone, clientGroupTmp, result.accountNo, function(isOk) {
                        if (isOk) {
                            callback(true, clientGroupTmp);
                        } else {
                            callback(false, null);
                        }
                    });
                } else {
                    callback(false, null);
                }
            });
        } else if (clientGroup === constant.clientGroup.simulate) {
            //升级到模拟
            apiService.checkSmClient(mobilePhone, function(hasRow) {
                if (hasRow) {
                    studioService.updateClientGroup(groupType, mobilePhone, constant.clientGroup.simulate, null, function(isOk) {
                        if (isOk) {
                            callback(true, constant.clientGroup.simulate);
                        } else {
                            callback(false, null);
                        }
                    });
                } else {
                    callback(false, null);
                }
            });
        } else {
            callback(false, null);
        }
    },
    /**
     * 更新客户组别
     * @param mobilePhone
     * @param newClientGroup
     * @param accountNo
     * @param callback
     */
    updateClientGroup: function(groupType, mobilePhone, newClientGroup, accountNo, callback) {
        member.findOneAndUpdate({
            mobilePhone: mobilePhone,
            "loginPlatform.chatUserGroup._id": groupType,
            valid: 1,
            status: 1
        }, {
            $set: {
                "loginPlatform.chatUserGroup.$.clientGroup": newClientGroup,
                "loginPlatform.chatUserGroup.$.accountNo": accountNo
            }
        }, { 'new': true }, function(err) {
            if (err) {
                logger.error("updateClientGroup fail:" + err);
                callback(false);
            } else {
                callback(true);
            }
        });
    },
    /**
     * 伦敦金/伦敦银看涨看跌投票
     * @param symbol 伦敦金或伦敦银标识 Gold/Silver
     * @param highsorlows 涨或跌 highs/lows
     * @param callback
     */
    highsLowsVote: function(symbol, highsorlows, callback) {
        var cacheClient = require('../cache/cacheClient');
        var key = 'highsLowsVote_' + symbol;
        var map = {};
        cacheClient.hgetall(key, function(err, result) {
            if (err) {
                logger.error("get highs or lows vote fail:" + err);
                result.highs = 0;
                result.lows = 0;
                callback({ isOK: false, data: result });
            } else if (!err && result) {
                if (highsorlows == 'highs') {
                    result.highs = parseInt(result.highs) + 1;
                    cacheClient.hmset(key, result);
                } else if (highsorlows == 'lows') {
                    result.lows = parseInt(result.lows) + 1;
                    cacheClient.hmset(key, result);
                }
                //cacheClient.expire(key, 24*7*3600);//再次投票时不再设置有效时间
                map.isOK = true;
                map.data = result;
                callback(map);
            } else {
                result = { "highs": 0, "lows": 0 };
                if (highsorlows == 'highs') {
                    result.highs = 1;
                    cacheClient.hmset(key, result);
                } else if (highsorlows == 'lows') {
                    result.lows = 1;
                    cacheClient.hmset(key, result);
                }
                cacheClient.expire(key, 24 * 7 * 3600); //首次投票时设置有效时间
                map.isOK = true;
                map.data = result;
                callback(map);
            }
        });
    },
    /**
     * 伦敦金/伦敦银看涨看跌投票
     * @param symbol 伦敦金或伦敦银标识 Gold/Silver
     * @param highsorlows 涨或跌 highs/lows
     * @param callback
     */
    getHighsLowsVote: function(symbol, highsorlows, callback) {
        var cacheClient = require('../cache/cacheClient');
        var key = 'highsLowsVote_' + symbol;
        var map = {};
        cacheClient.hgetall(key, function(err, result) {
            if (err) {
                logger.error("get highs or lows vote fail:" + err);
                result.highs = 0;
                result.lows = 0;
                callback({ isOK: false, data: result });
            } else if (!err && result) {
                map.isOK = true;
                map.data = result;
                callback(map);
            } else {
                result = { "highs": 0, "lows": 0 };
                map.isOK = true;
                map.data = result;
                callback(map);
            }
        });
    },
    /**
     * 用户修改皮肤样式
     * @param userInfo
     * @param params
     * @param callback
     */
    setUserGroupThemeStyle: function(userInfo, defTemplate, callback) {
        var searchObj = { "status": 1, "valid": 1, "mobilePhone": userInfo.mobilePhone, "loginPlatform.chatUserGroup._id": userInfo.groupType };
        var setObj = { "loginPlatform.chatUserGroup.$.defTemplate": defTemplate };
        member.findOneAndUpdate(searchObj, setObj, function(err, row) {
            var isSuccess = !err && row;
            if (isSuccess) {
                logger.info('setUserGroupThemeStyle=>update UserGroupThemeStyle success!');
            } else {
                logger.info('setUserGroupThemeStyle=>update UserGroupThemeStyle fail!', err);
            }
            callback(isSuccess);
        });
    },
    /**
     * 提取培训班列表
     * @param callback
     */
    getTrainRoomList: function(groupType, callback) {
        chatGroup.find({ valid: 1, status: { $in: [1, 2] }, groupType: groupType, "defaultAnalyst._id": { $ne: null } }).select({ clientGroup: 1, remark: 1, name: 1, level: 1, groupType: 1, talkStyle: 1, whisperRoles: 1, chatRules: 1, openDate: 1, defTemplate: 1, defaultAnalyst: 1, openDate: 1, students: 1 }).sort({ 'sequence': 'asc' }).exec(function(err, rows) {
            if (err) {
                logger.error("getStudioList fail:" + err);
            }
            callback(rows);
        });
    },
    /**
     * 通过用户userNo提取信息
     * @param userNo
     */
    getUserInfoByUserNo: function(groupType, userNo, callback) {
        boUser.findOne({ userNo: userNo }, "userNo userName position avatar introduction introductionImg winRate earningsM wechatCodeImg wechatCode tag", function(err, rows) {
            if (err) {
                logger.error("查询直播老师数据失败!:", err);
                callback(null);
            } else {
                if (rows) {
                    var result = rows.toObject();
                    chatPraiseService.getPraiseNum(result.userNo, constant.chatPraiseType.user, groupType, function(data) {
                        if (data && data.length > 0) {
                            result.praiseNum = data[0].praiseNum;
                        } else {
                            result.praiseNum = 0;
                        }
                        callback(result);
                    });
                } else {
                    callback(null);
                }
            }
        });
    },
    /**
     * 初始直播老师列表
     * @param params
     * @param callback
     */
    getShowTeacher: function(params, dataCallback) {
        async.parallel({
                userInfo: function(callback) {
                    studioService.getUserInfoByUserNo(params.groupType, params.authorId, function(ret) {
                        callback(null, ret);
                    });
                },
                teacherList: function(callback) {
                    userService.getTeacherList({ groupId: params.groupId }, function(rowList) {
                        callback(null, rowList);
                    });
                },
                trainList: function(callback) {
                    clientTrainService.getTrainList(params.groupType, params.authorId, true).then(rooms => {
                        callback(null, rooms);
                    }).catch(e => {
                        callback(null, null);
                    });
                },
                trAndClNum: function(callback) {
                    clientTrainService.getTrainAndClientNum(params.groupType, params.authorId, function(numObj) {
                        callback(null, numObj);
                    });
                },
                tradeList: function(callback) {
                    showTradeService.getShowTradeList({ pageSize: 4, tradeType: 1, groupType: params.groupType, userNo: params.authorId }, function(list) {
                        callback(null, list);
                    });
                }
            },
            function(error, result) {
                dataCallback(result);
            });
    }
};

//导出服务类
module.exports = studioService;