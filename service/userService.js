/** 用户服务类
 * Created by Alan.wu on 2015/3/4.
 */
var logger = require('../resources/logConf').getLogger("userService");
var member = require('../models/member'); //引入member数据模型
var boUser = require('../models/boUser'); //引入boUser数据模型
var boMenu = require('../models/boMenu'); //引入boMenu数据模型
var boRole = require('../models/boRole'); //引入boRole数据模型
var chatGroup = require('../models/chatGroup'); //引入chatGroup数据模型
var chatPointsService = require('../service/chatPointsService');
var visitorService = require('../service/visitorService');
var chatPraiseService = require('../service/chatPraiseService');
var constant = require('../constant/constant'); //引入constant
var common = require('../util/common');
let followedTeacher = require('../models/followedTeacher'); //引入followedTeacher数据模型
let ObjectId = require('mongoose').Schema.ObjectId;
let async = require('async');
let Deferred = common.Deferred;

/**
 * 定义用户服务类
 */
var userService = {
    /**
     * 通过用户id提取信息
     * @param id
     */
    getUserInfo: function(id, callback) {
        boUser.findById(id, "userNo userName position avatar introduction introductionImg", function(err, row) {
            callback(row);
        });
    },
    /**
     * 通过用户userNo提取信息
     * @param userNo
     */
    getUserInfoByUserNo: function(userNo, callback) {
        boUser.findOne({ userNo: userNo }, "userNo userName position avatar introduction introductionImg winRate earningsM", function(err, row) {
            if (err) {
                logger.error(err);
                callback(null);
                return;
            }
            callback(row);
        });
    },
    /**
     * 通过用户id提取信息
     * @param ids
     */
    getUserList: function(params, callback) {
        let userNo = params.userNo;
        let searchObj = { userNo: { $in: userNo.split(",") } };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        boUser.find(searchObj, "userNo userName position avatar status valid", function(err, rows) {
            if (err) {
                logger.error(err);
                callback(null);
                return;
            }
            callback(rows);
        });
    },
    /**
     * 批量下线房间用户在线状态
     * @param roomId
     */
    batchOfflineStatus: function(params, callback) {
        let roomId = params.roomId;
        var groupType = common.getRoomType(roomId);
        let searchObj = {
            valid: 1,
            'loginPlatform.chatUserGroup': {
                $elemMatch: {
                    _id: groupType,
                    "rooms": {
                        $elemMatch: {
                            '_id': roomId,
                            onlineStatus: 1
                        }
                    }
                }
            }
        };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        member.find(searchObj, function(err, rowList) {
            if (err || !rowList) {
                logger.warn('batchOfflineStatus->fail or no offlineStatus row', err);
                callback('batchOfflineStatus->fail or no offlineStatus row');
            } else {
                var room = null,
                    mRow = null,
                    group = null,
                    currDate = new Date();
                for (var k in rowList) {
                    mRow = rowList[k];
                    group = mRow.loginPlatform.chatUserGroup.id(groupType);
                    if (group) {
                        room = group.rooms.id(roomId);
                        if (room && room.onlineStatus == 1) {
                            room.onlineStatus = 0;
                            room.offlineDate = currDate;
                            mRow.save(function(err) {
                                if (err) {
                                    logger.error("batchOfflineStatus->update fail!", err);
                                }
                            });
                        }
                    }
                }
                logger.info("batchOfflineStatus->update rows[" + roomId + "]:", rowList.length);
                callback(rowList.length);
            }
        });
    },
    /**
     * 移除在线用户
     * @param userInfo
     * @param isUpdate 是否需要更新数据
     * @param callback
     */
    removeOnlineUser: function(userInfo, isUpdate, callback) {
        if (common.hasPrefix(constant.clientGroup.visitor, userInfo.userId) || !isUpdate) {
            callback(true);
            return;
        }
        //更新用户记录表的在线状态(下线设置为0）
        if (common.isValid(userInfo.userId) && common.isValid(userInfo.groupId) && common.isValid(userInfo.groupType)) {
            userService.updateChatUserGroupStatus({
                userInfo: userInfo,
                chatStatus: 0,
                sendMsgCount: userInfo.sendMsgCount
            }, function(err) {});
            callback(true);
        } else {
            callback(false);
        }
    },
    /**
     * 检查用户禁言
     * @param row member信息
     * @param groupId 房间号
     * @returns {*}
     */
    checkUserGag: function(row, groupId) {
        var subRow = row.loginPlatform.chatUserGroup[0];
        if (common.isBlank(subRow.gagDate)) {
            var currRoom = !subRow.rooms ? null : subRow.rooms.id(groupId);
            if (currRoom) {
                if (common.dateTimeWeekCheck(currRoom.gagDate, false)) {
                    return { isOK: false, tip: currRoom.gagTips };
                } else {
                    return { isOK: true };
                }
            } else {
                //房间信息不存在？？
                return { isOK: true };
            }
        } else {
            if (common.dateTimeWeekCheck(subRow.gagDate, false)) {
                return { isOK: false, tip: subRow.gagTips };
            } else {
                return { isOK: true };
            }
        }
    },
    /**
     * 验证规则
     * @param clientGroup
     * @param nickname
     * @param isWh 是否私聊
     * @param groupId
     * @param content
     * @param callback
     */
    verifyRule: function(userInfo, params, content, callback) {
        var deferred = new Deferred();
        var isImg = content.msgType != 'text',
            contentVal = content.value;
        var clientGroup = userInfo.clientGroup,
            nickname = userInfo.nickname,
            userType = userInfo.userType,
            groupId = userInfo.groupId;
        var isWh = params.isWh,
            speakNum = Number(params.speakNum);
        if (common.isBlank(contentVal)) {
            deferred.reject({ isOK: false, tip: "发送的内容有误，已被拒绝!" });
            return deferred.promise;
        }
        contentVal = contentVal.replace(/(<(label|label) class="dt-send-name" tid="[^>"]+">@.*<\/label>)|(<(img|IMG)\s+src="[^>"]+face\/[^>"]+"\s*>)|(<a href="[^>"]+" target="_blank">.*<\/a>)/g, '');
        if (!isImg) { //如果是文字，替换成链接
            if (/<[^>]*>/g.test(contentVal)) { //过滤特殊字符
                deferred.reject({ isOK: false, tip: "有特殊字符，已被拒绝!" });
                return deferred.promise;
            }
        }
        contentVal = common.encodeHtml(contentVal);
        //预定义规则
        let chatGroupQuery = { _id: groupId, valid: 1, status: { $in: [1, 2] } };
        common.wrapSystemCategory(chatGroupQuery, params.systemCategory);
        chatGroup.findOne(chatGroupQuery, function(err, row) {
            if (err || !row) {
                deferred.reject({ isOK: false, tip: '系统异常，房间不存在！', leaveRoom: true });
                return deferred.promise;
            }
            if (constant.roleUserType.member < parseInt(userType)) { //后台用户无需使用规则
                deferred.resolve({ isOK: true, tip: '', talkStyle: row.talkStyle, whisperRoles: row.whisperRoles });
                return deferred.promise;
            }
            if (!common.dateTimeWeekCheck(row.openDate, true)) {
                deferred.reject({ isOK: false, tip: '房间开放时间结束！', leaveRoom: true });
                return deferred.promise;
            }
            var ruleArr = row.chatRules,
                resultTip = [],
                beforeVal = '',
                type = '',
                tip = '',
                clientGroupVal = '';
            var urlArr = [],
                urlTipArr = [],
                ruleRow = null,
                needApproval = false,
                needApprovalTip = null,
                isPass = false;
            //先检查禁止发言的规则
            var isVisitor = (constant.roleUserType.visitor == userType);
            var visitorSpeak = { allowed: false, tip: "请登录后发言" };
            for (var i in ruleArr) {
                ruleRow = ruleArr[i];
                beforeVal = ruleRow.beforeRuleVal;
                type = ruleRow.type;
                tip = ruleRow.afterRuleTips;
                isPass = common.dateTimeWeekCheck(ruleRow.periodDate, true);
                clientGroupVal = ruleRow.clientGroup;
                if (isWh) {
                    if (type == 'whisper_allowed') {
                        if (!isPass) {
                            deferred.reject({ isOK: false, tip: tip });
                        } else {
                            deferred.resolve({ isOK: true, tip: '', talkStyle: row.talkStyle, whisperRoles: row.whisperRoles });
                        }
                        return deferred.promise;
                    }
                } else {
                    if (isPass && type == 'speak_not_allowed') { //禁言
                        deferred.reject({ isOK: false, tip: tip });
                        return deferred.promise;
                    } else if (!isPass && type == 'speak_allowed') { //允许发言
                        deferred.reject({ isOK: false, tip: tip });
                        return deferred.promise;
                    } else if (!visitorSpeak.allowed && isVisitor && type == 'visitor_filter') { //允许游客发言（默认游客不允许发言）
                        visitorSpeak.allowed = isPass;
                        visitorSpeak.tip = tip;
                    }
                    if (isImg && isPass && type == 'img_not_allowed') { //禁止发送图片
                        if (common.isBlank(clientGroupVal) || (common.isValid(clientGroupVal) && common.containSplitStr(clientGroupVal, clientGroup))) {
                            deferred.reject({ isOK: false, tip: tip });
                            return deferred.promise;
                        }
                    }
                    if (isPass && type != 'speak_not_allowed' && common.isValid(beforeVal)) {
                        beforeVal = beforeVal.replace(/(^[,，])|([,|，]$)/g, ''); //去掉结尾的逗号
                        beforeVal = beforeVal.replace(/,|，/g, '|'); //逗号替换成|，便于统一使用正则表达式
                        if (type == 'visitor_filter') {
                            if (visitorSpeak.allowed && isVisitor && eval('/' + beforeVal + '/').test(nickname)) {
                                deferred.reject({ isOK: false, type: "visitorGag", tip: tip });
                                return deferred.promise;
                            }
                        }
                        if (!isImg) {
                            if (type == 'speak_num_set' && visitorSpeak.allowed && speakNum > 0 && Number(beforeVal) <= speakNum) { //发言次数限制(针对游客）
                                deferred.reject({ isOK: false, tip: tip });
                                return deferred.promise;
                            }
                            if (type == 'keyword_filter') { //过滤关键字或过滤链接
                                if (eval('/' + beforeVal + '/').test(contentVal)) {
                                    deferred.reject({ isOK: false, tip: tip });
                                    return deferred.promise;
                                }
                            }
                            if (type == 'url_not_allowed') { //禁止链接
                                var val = beforeVal.replace(/\//g, '\\/').replace(/\./g, '\\.');
                                if (eval('/' + val + '/').test(contentVal)) {
                                    deferred.reject({ isOK: false, tip: tip });
                                    return deferred.promise;
                                }
                            }
                            if (type == 'url_allowed') { //除该连接外其他连接会禁止
                                urlArr.push(beforeVal);
                                urlTipArr.push(tip);
                            }
                            if (type == 'keyword_replace') { //替换关键字
                                if (eval('/' + beforeVal + '/').test(contentVal)) {
                                    content.value = common.encodeHtml(content.value).replace(eval('/' + beforeVal + '/g'), ruleArr[i].afterRuleVal);
                                    resultTip.push(tip);
                                }
                            }
                        }
                    }
                    if (isPass && type == 'need_approval') { //需要审批
                        needApproval = true;
                        needApprovalTip = tip;
                    }
                }
            }
            if (isWh) { //私聊不校验规则
                deferred.resolve({ isOK: true, tip: resultTip.join(";"), talkStyle: row.talkStyle, whisperRoles: row.whisperRoles });
                return deferred.promise;
            }
            if (isVisitor && !visitorSpeak.allowed) {
                deferred.reject({ isOK: false, tip: visitorSpeak.tip });
                return deferred.promise;
            }
            if (!isImg && urlArr.length > 0 && common.urlReg().test(contentVal)) {
                var val = urlArr.join("|").replace(/\//g, '\\\/').replace(/\./g, '\\.');
                if (!eval('/' + val + '/').test(contentVal)) {
                    deferred.reject({ isOK: false, tip: urlTipArr.join(";") });
                    return deferred.promise;
                }
            }
            if (needApproval) { //需要审批
                deferred.reject({ isOK: false, needApproval: true, tip: needApprovalTip }); //需要审批，设置为true
                return deferred.promise;
            }
            deferred.resolve({ isOK: true, tip: resultTip.join(";"), talkStyle: row.talkStyle, whisperRoles: row.whisperRoles });
        });
        return deferred.promise;
    },
    /**
     * 提取会员信息
     */
    getMemberList: function(params, callback) {
        let id = params.id;
        member.findById(id, function(err, members) {
            if (err != null) {
                callback({ isOK: false, msg: "getMemberList fail!" });
            }
            callback(members);
        });
    },
    /**
     * 检查角色是否有审批权限
     */
    getAuthUsersByGroupId: function(groupId, callback) {
        chatGroup.findById(groupId, "authUsers", function(err, row) {
            if (err || !row) {
                callback(null);
            } else {
                callback(row.authUsers);
            }
        });
    },
    /**
     * 检查后台进入聊天室的用户，是则直接登录聊天室
     */
    checkSystemUserInfo: function(userInfo, callback) {
        var result = { isOK: false };
        var newUserInfo = {
            groupType: userInfo.groupType,
            groupId: userInfo.groupId,
            accountNo: userInfo.accountNo,
            userId: userInfo.userId,
            mobilePhone: userInfo.mobilePhone,
            systemCategory: userInfo.systemCategory
        };
        if (constant.fromPlatform.pm_mis == userInfo.fromPlatform) {
            newUserInfo.accountNo = userInfo.userId;
            newUserInfo.userId = ''; //不需要填值
        }
        logger.info("checkSystemUserInfo=>newUserInfo:" + JSON.stringify(newUserInfo));
        userService.createUser(newUserInfo, function(isOk) {
            result.isOK = true;
            callback(result);
        });
    },
    /**
     * 新增用户信息
     * @param userInfo
     * @param callback
     */
    createUser: function(userInfo, callback) {
        let queryObj = { 'mobilePhone': userInfo.mobilePhone, valid: 1 };
        common.wrapSystemCategory(queryObj, userInfo.systemCategory);
        member.findOne(queryObj, "loginPlatform.chatUserGroup", function(err, row) {
            if (!err && row) {
                var hasRow = false;
                if (row.loginPlatform) {
                    if (common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                        hasRow = row.loginPlatform.chatUserGroup.id(userInfo.groupType) ? true : false;
                    }
                }
                logger.info("createUser->userInfo:" + JSON.stringify(userInfo));
                userService.createChatUserGroupInfo(userInfo, hasRow, function(isOK) {
                    callback(isOK);
                });
            } else {
                userService.saveMember(userInfo, function(isOK) {
                    callback(isOK);
                });
            }
        });
    },

    /**
     * 保存用户信息
     * @param userInfo
     * @param callback
     */
    saveMember: function(userInfo, callback) {
        var memberModel = {
            _id: null,
            mobilePhone: userInfo.mobilePhone,
            status: 1, //内容状态：0 、禁用 ；1、启动
            valid: 1, //有效
            createUser: userInfo.userId || userInfo.accountNo,
            createIp: userInfo.ip, //新增记录的Ip
            updateIp: userInfo.ip, //新增记录的Ip
            createDate: new Date(), //创建日期
            systemCategory: userInfo.systemCategory,
            loginPlatform: {
                chatUserGroup: [{
                    _id: userInfo.groupType, //组的大类别，区分是微信组、直播间
                    userId: userInfo.userId, //第三方用户id，对于微信，userId为微信的openId;
                    thirdId: userInfo.thirdId,
                    avatar: userInfo.avatar, //头像
                    nickname: userInfo.nickname, //昵称
                    accountNo: userInfo.accountNo, //账号
                    userType: (userInfo.userType || constant.roleUserType.member), //用户类型
                    roleNo: userInfo.roleNo, //角色编号
                    pwd: userInfo.pwd, //用户密码，直播间需要，微解盘不需要
                    clientGroup: userInfo.clientGroup, //客户类别
                    createDate: new Date(), //创建日期
                    rooms: [{
                        _id: userInfo.groupId, //组id，与聊天室组对应
                        onlineStatus: userInfo.onlineStatus || 1, //在线状态：0 、下线 ；1、在线
                        onlineDate: new Date(), //上线时间
                        sendMsgCount: 0
                    }]
                }]
            }
        };
        member.create(memberModel, function(err, rowTmp) {
            if (err) {
                logger.error('createUser=>create member fail,' + err);
            }
            if (callback) {
                if (common.isValid(userInfo.item)) {
                    //注册积分
                    var pointsParams = { clientGroup: userInfo.clientGroup, groupType: userInfo.groupType, userId: userInfo.mobilePhone, item: userInfo.item, val: 0, isGlobal: false, remark: '', opUser: userInfo.userId, opIp: userInfo.ip };
                    chatPointsService.add(pointsParams, function() {
                        //DEMO积分
                        if (userInfo.clientGroup == constant.clientGroup.simulate || userInfo.clientGroup == constant.clientGroup.notActive || userInfo.clientGroup == constant.clientGroup.active) {
                            var pointsParamsD = { clientGroup: userInfo.clientGroup, groupType: userInfo.groupType, userId: userInfo.mobilePhone, item: "hand_openDemo", val: 0, isGlobal: false, remark: '', opUser: userInfo.userId, opIp: userInfo.ip };
                            chatPointsService.add(pointsParamsD, function() {
                                //N客户积分
                                if (userInfo.clientGroup == constant.clientGroup.notActive || userInfo.clientGroup == constant.clientGroup.active) {
                                    var pointsParamsN = { clientGroup: userInfo.clientGroup, groupType: userInfo.groupType, userId: userInfo.mobilePhone, item: "hand_openReal", val: 0, isGlobal: false, remark: '', opUser: userInfo.userId, opIp: userInfo.ip };
                                    chatPointsService.add(pointsParamsN, function() {
                                        //A客户积分
                                        if (userInfo.clientGroup == constant.clientGroup.active) {
                                            var pointsParamsA = { clientGroup: userInfo.clientGroup, groupType: userInfo.groupType, userId: userInfo.mobilePhone, item: "hand_deposit", val: 0, isGlobal: false, remark: '', opUser: userInfo.userId, opIp: userInfo.ip };
                                            chatPointsService.add(pointsParamsA, function(result) {});
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
                callback(!err && rowTmp);
            }
        });
    },
    /**
     * 加入新的房间组
     * @param userInfo
     * @param callback
     */
    joinNewRoom: function(userInfo, callback) {
        var searchObj = {
            'mobilePhone': userInfo.mobilePhone,
            valid: 1,
            'loginPlatform.chatUserGroup': {
                $elemMatch: {
                    _id: userInfo.groupType,
                    userId: userInfo.userId,
                    "rooms._id": {
                        $ne: userInfo.groupId
                    }
                }
            }
        };
        if (!common.hasPrefix(userInfo.groupId, userInfo.groupType)) {
            callback(false);
            return;
        }
        var setValObj = {
            '$push': {
                'loginPlatform.chatUserGroup.$.rooms': {
                    _id: userInfo.groupId,
                    onlineStatus: 1,
                    onlineDate: new Date()
                }
            }
        };
        if (common.isBlank(userInfo.mobilePhone)) { //如果不存在手机号码，先提取手机号码
            let memberSearchObj = {
                valid: 1,
                'loginPlatform.chatUserGroup': {
                    $elemMatch: {
                        _id: userInfo.groupType,
                        userId: userInfo.userId
                    }
                }
            };
            common.wrapSystemCategory(memberSearchObj, userInfo.systemCategory);
            member.findOne(memberSearchObj, function(err, row) {
                if (row) {
                    searchObj.mobilePhone = row.mobilePhone;
                    var mainRow = row.loginPlatform.chatUserGroup.id(userInfo.groupType);
                    if (!mainRow.rooms.id(userInfo.groupId)) { //不存在对应房间则新增房间信息
                        member.findOneAndUpdate(searchObj, setValObj, function(err, row) {
                            if (err) {
                                logger.error('joinNewGroup=>fail!' + err);
                            }
                        });
                    }
                    callback(true, { mobilePhone: row.mobilePhone, accountNo: mainRow.accountNo });
                } else {
                    callback(false);
                }
            });
        } else {
            common.wrapSystemCategory(searchObj, userInfo.systemCategory);
            member.findOneAndUpdate(searchObj, setValObj, function(err, row) {
                if (err) {
                    logger.error('joinNewGroup=>fail!' + err);
                }
                callback(true);
            });
        }
    },
    /**
     * 新增会员登录聊天室的用户组信息
     * @param userInfo
     * @param hasRooms
     * @param callback
     */
    createChatUserGroupInfo: function(userInfo, hasRooms, callback) {
        if (hasRooms) { //存在房间对应的用户记录，直接加入新的房间
            this.joinNewRoom(userInfo, function() {
                callback(true);
            });
        } else {
            var jsonStr = {
                _id: userInfo.groupType,
                userId: userInfo.userId,
                avatar: userInfo.avatar,
                nickname: userInfo.nickname,
                pwd: userInfo.pwd,
                thirdId: userInfo.thirdId,
                clientGroup: userInfo.clientGroup,
                accountNo: userInfo.accountNo,
                userType: (userInfo.userType || constant.roleUserType.member),
                roleNo: userInfo.roleNo,
                createDate: new Date(),
                rooms: [{
                    _id: userInfo.groupId,
                    onlineStatus: (userInfo.onlineStatus || 1),
                    onlineDate: new Date()
                }]
            };
            let queryObj = { valid: 1, 'mobilePhone': userInfo.mobilePhone, 'loginPlatform.chatUserGroup._id': { $ne: userInfo.groupType } };
            common.wrapSystemCategory(queryObj, userInfo.systemCategory);
            member.findOneAndUpdate(
                queryObj, {
                    '$push': {
                        'loginPlatform.chatUserGroup': jsonStr
                    }
                },
                function(err, row) {
                    var isSuccess = !err && row;
                    if (isSuccess) {
                        logger.info('createChatUserGroupInfo=>create ChatUserGroupInfo success!');
                    }
                    callback(isSuccess);
                });
        }
    },

    /**
     * 提取用户房间通用条件
     */
    getMemberRoomSearch: function(userInfo) {
        var searchObj = null;
        if (constant.fromPlatform.pm_mis == userInfo.fromPlatform) {
            searchObj = { valid: 1, 'loginPlatform.chatUserGroup': { $elemMatch: { _id: userInfo.groupType, accountNo: userInfo.userId, "rooms._id": userInfo.groupId } } };
        } else {
            searchObj = { valid: 1, 'loginPlatform.chatUserGroup': { $elemMatch: { _id: userInfo.groupType, userId: userInfo.userId, "rooms._id": userInfo.groupId } } };
        }
        return searchObj;
    },
    /**
     * 更新会员信息
     * 备注：判断是否存在登录信息，不存在则新增，存在则更新
     * @param userInfo
     * @param callback
     */
    updateMemberInfo: function(userInfo, callback) {
        if (common.hasPrefix(constant.clientGroup.visitor, userInfo.userId)) { //游客则提取离线日期
            visitorService.getByClientStoreId(userInfo, function(offlineDate) {
                callback(0, null, offlineDate);
            });
        } else {
            let searchObj = this.getMemberRoomSearch(userInfo);
            common.wrapSystemCategory(searchObj, userInfo.systemCategory);
            //存在则更新上线状态及上线时间
            member.findOne(searchObj, function(err, row) {
                if (!err && row && common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                    var group = row.loginPlatform.chatUserGroup.id(userInfo.groupType);
                    if (group) {
                        var room = group.rooms.id(userInfo.groupId);
                        room.onlineDate = userInfo.onlineDate;
                        room.onlineStatus = userInfo.onlineStatus;
                        userInfo.hasRegister = true;
                        row.save(function(err, rowTmp) {
                            if (err) {
                                logger.error("updateMemberInfo->update member fail!:" + err);
                            }
                            callback(room.sendMsgCount, row.mobilePhone, room.offlineDate);
                        });
                    } else {
                        callback(0);
                    }
                } else {
                    callback(0);
                }
            });
        }
    },
    /**
     *下线更新会员状态及发送记录条数
     */
    updateChatUserGroupStatus: function(params, callback) {
        let userInfo = params.userInfo,
            chatStatus = params.chatStatus,
            sendMsgCount = params.sendMsgCount;
        let searchObj = this.getMemberRoomSearch(userInfo);
        common.wrapSystemCategory(searchObj, params.systemCategory);
        member.findOne(searchObj, function(err, row) {
            if (row && common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                var group = row.loginPlatform.chatUserGroup.id(userInfo.groupType);
                if (group) {
                    var room = group.rooms.id(userInfo.groupId);
                    room.sendMsgCount = sendMsgCount;
                    room.onlineStatus = chatStatus;
                    room.offlineDate = new Date();
                    row.save(function(err, rowTmp) {
                        if (err) {
                            logger.error("updateChatUserGroupStatus->fail!:" + err);
                        }
                        callback(err);
                    });
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        });
    },
    /**
     * 通过userId及组别检测用户是否已经登录过
     * @param userInfo
     * @param isAllowPass 是否允许通过
     */
    checkUserLogin: function(params, callback) {
        let userInfo = params.userInfo,
            isAllowPass = params.isAllowPass;
        if (isAllowPass) {
            callback(true);
            return;
        }
        var searchObj = {};
        if (constant.fromPlatform.pm_mis == userInfo.fromPlatform) {
            searchObj = { _id: userInfo.groupType, accountNo: (common.isBlank(userInfo.accountNo) ? userInfo.userId : userInfo.accountNo) };
        } else {
            searchObj = { _id: userInfo.groupType, userId: userInfo.userId };
        }
        let queryObj = { 'loginPlatform.chatUserGroup': { $elemMatch: searchObj } };
        common.wrapSystemCategory(queryObj, params.systemCategory);
        member.findOne(queryObj, "mobilePhone loginPlatform.chatUserGroup.$", function(err, row) {
            if (!err && row) {
                callback(row);
            } else {
                callback(null);
            }
        });
    },
    /**
     * 通过手机号查找对应信息
     * @param mobilePhone
     * @param callback
     */
    getMemberByTel: function(mobilePhone, selectField, callback) {
        member.findOne({ 'mobilePhone': mobilePhone }, selectField, function(err, row) {
            callback(row);
        });
    },
    /**
     * 提取cs客服信息
     * @param roomId
     */
    getRoomCsUser: function(roomId, callback) {
        this.getRoomCsUserList(roomId, function(rowList) {
            callback(rowList ? rowList[0] : null);
        });
    },
    /**
     * 提取cs客服信息
     * @param roomId
     */
    getRoomCsUserList: function(roomId, callback) {
        chatGroup.findById(roomId, "authUsers", function(err, row) {
            if (!row || err) {
                callback(null);
            } else {
                boUser.find({ userNo: { "$in": row.authUsers }, "role.roleNo": common.getPrefixReg("cs") }, "userNo userName avatar position", function(err, rowList) {
                    if (!rowList || err) {
                        callback(null);
                    } else {
                        callback(rowList);
                    }
                });
            }
        });
    },
    /**
     * 检查房间是否在开放时间内，或可用
     * @param userId
     * @param groupId
     * @returns {boolean}
     */
    checkRoomStatus: function(params, callback) {
        let userId = params.userId,
            groupId = params.groupId,
            currCount = params.currCount;
        let searchObj = { _id: groupId, valid: 1, status: { $in: [1, 2] } };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        chatGroup.findOne(searchObj, "status openDate maxCount valid roomType traninClient", function(err, row) {
            if (!row || err) {
                callback(false);
                return;
            }
            if (currCount >= row.maxCount) {
                callback(false);
                return;
            }
            var ret = common.dateTimeWeekCheck(row.openDate, true);
            if (!ret) {
                callback(ret);
                return;
            }
            if (row.status == 2) { //授权访问，需要检查授权客户
                ret = false;
                if (row.traninClient) {
                    for (var i = 0; i < row.traninClient.length; i++) {
                        if (row.traninClient[i].clientId == userId) {
                            ret = row.traninClient[i].isAuth == 1;
                            break;
                        }
                    }
                }
            }
            callback(ret);
        });
    },
    /**
     * 修改昵称
     * @param mobilePhone
     * @param groupType
     * @param callback
     */
    modifyNickname: function(params, callback) {
        let mobilePhone = params.mobilePhone,
            groupType = params.groupType,
            nickname = params.nickname;
        let searchObj = {
            mobilePhone: {
                $ne: mobilePhone
            },
            valid: 1,
            "loginPlatform.chatUserGroup": {
                $elemMatch: {
                    _id: groupType,
                    nickname: nickname,
                    userType: 0
                }
            }
        };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        member.find(searchObj).count(function(err, count) {
            if (count > 0) {
                callback({ isOK: false, msg: "该昵称已被占用，请使用其他昵称！" });
            } else {
                let updateQuery = { valid: 1, 'mobilePhone': mobilePhone, 'loginPlatform.chatUserGroup._id': groupType };
                common.wrapSystemCategory(updateQuery, params.systemCategory);
                member.update(updateQuery, { $set: { "loginPlatform.chatUserGroup.$.nickname": nickname } }, function(err, row) {
                    if (err) {
                        logger.error("modifyNickname->update fail!" + err);
                        callback({ isOK: false, msg: "修改失败，请联系客服！" });
                    } else {
                        callback({ isOK: true });
                    }
                });
            }
        });
    },
    /**
     * 修改头像
     * @param mobilePhone
     * @param groupType
     * @param callback
     */
    modifyAvatar: function(params, callback) {
        let queryObj = {
            valid: 1,
            'mobilePhone': params.mobilePhone,
            'loginPlatform.chatUserGroup._id': params.groupType
        };
        common.wrapSystemCategory(queryObj, params.systemCategory);
        member.update(queryObj, { $set: { "loginPlatform.chatUserGroup.$.avatar": params.avatar } }, function(err, row) {
            if (err) {
                logger.error("modifyAvatar->update fail!" + err);
                callback({ isOK: false, msg: "修改失败，请联系客服！" });
            } else {
                callback({ isOK: true });
                if (common.isValid(params.item)) {
                    var pointsParams = {
                        clientGroup: params.clientGroup,
                        change: 'avatar',
                        groupType: params.groupType,
                        userId: params.mobilePhone,
                        item: params.item,
                        val: 0,
                        isGlobal: false,
                        remark: '',
                        opUser: params.userId,
                        opIp: params.ip
                    };
                    common.wrapSystemCategory(pointsParams, params.systemCategory);
                    userService.pointsChange(pointsParams, function(result) {});
                }
            }
        });
    },
    /**
     * 获取分析师
     * @param params
     * @param callback
     */
    getTeacherList: function(params, callback) {
        this.getAuthUsersByGroupId(params.groupId, function(result) {
            if (result) {
                var searchObj = { valid: 1, status: 0, 'role.roleNo': common.getPrefixReg("analyst"), userNo: { $in: result } };
                if (common.isValid(params.hasQRCode)) {
                    searchObj.wechatCodeImg = { $nin: [null, ''] };
                }
                common.wrapSystemCategory(searchObj, params.systemCategory);
                boUser.find(searchObj, "userNo userName wechatCodeImg avatar", function(err, row) {
                    if (err) {
                        logger.error("getTeacherList->get fail!" + err);
                        callback(null);
                    } else {
                        callback(row);
                    }
                });
            } else {
                callback(null);
            }
        });
    },
    /**
     * 根据userid获取分析师二维码等信息
     * @param params
     * @param callback
     */
    getTeacherByUserId: function(userId, callback) {
        var searchObj = { valid: 1, status: 0, userNo: userId };
        boUser.findOne(searchObj, "userNo userName wechatCodeImg introductionImg introductionImgLink", function(err, row) {
            if (err) {
                logger.error("getTeacherByUserId->get fail!" + err);
                callback(null);
            } else {
                callback(row);
            }
        });
    },
    /**
     * 修改用户名
     * @param mobilePhone
     * @param groupType
     * @param callback
     */
    modifyUserName: function(parameters, callback) {
        let userInfo = parameters.userInfo,
            params = parameters.params;
        let searchObj = {
            mobilePhone: {
                $ne: userInfo.mobilePhone
            },
            valid: 1,
            "loginPlatform.chatUserGroup": {
                $elemMatch: {
                    _id: userInfo.groupType,
                    userName: params.userName,
                    userType: 0
                }
            }
        };
        common.wrapSystemCategory(searchObj, parameters.systemCategory);
        member.find(searchObj).count(function(err, count) {
            if (count > 0) {
                callback({ isOK: false, msg: "该用户名已被占用，请使用其他用户名！" });
            } else {
                let updateQuery = {
                    valid: 1,
                    'mobilePhone': userInfo.mobilePhone,
                    'loginPlatform.chatUserGroup._id': userInfo.groupType
                };
                common.wrapSystemCategory(updateQuery, parameters.systemCategory);
                member.update(
                    updateQuery, { $set: { "loginPlatform.chatUserGroup.$.userName": params.userName } },
                    function(err, row) {
                        if (err) {
                            logger.error("modifyUserName->update fail!" + err);
                            callback({ isOK: false, msg: "修改失败，请联系客服！" });
                        } else {
                            callback({ isOK: true });
                            if (common.isValid(params.item)) {
                                var pointsParams = {
                                    clientGroup: userInfo.clientGroup,
                                    change: 'username',
                                    groupType: userInfo.groupType,
                                    userId: userInfo.mobilePhone,
                                    item: params.item,
                                    val: 0,
                                    isGlobal: false,
                                    remark: '',
                                    opUser: userInfo.userId,
                                    opIp: params.ip
                                };
                                common.wrapSystemCategory(pointsParams, parameters.systemCategory);
                                userService.pointsChange(pointsParams, function(result) {

                                });
                            }
                        }
                    });
            }
        });
    },
    /**
     * 修改邮箱
     * @param mobilePhone
     * @param groupType
     * @param callback
     */
    modifyEmail: function(params, callback) {
        let emailSearchObj = {
            valid: 1,
            "loginPlatform.chatUserGroup": {
                $elemMatch: {
                    _id: params.groupType,
                    email: params.email,
                    userType: 0
                }
            }
        };
        common.wrapSystemCategory(emailSearchObj, params.systemCategory);
        member.find(emailSearchObj).count(function(err, count) {
            if (count > 0) {
                callback({ isOK: false, msg: "该邮箱地址已绑定到其他账户，请使用其他邮箱！" });
            } else {
                let userSearchObj = {
                    valid: 1,
                    "loginPlatform.chatUserGroup": {
                        $elemMatch: {
                            _id: params.groupType,
                            userId: params.userId,
                            userType: 0
                        }
                    }
                };
                common.wrapSystemCategory(userSearchObj, params.systemCategory);
                member.findOne(userSearchObj, 'mobilePhone loginPlatform.chatUserGroup.$', function(err, row) {
                    if (err) {
                        logger.error("modifyEmail->update fail!" + err);
                        callback({ isOK: false, msg: "修改失败，请联系客服！" });
                    } else {
                        var clientGroup = row.loginPlatform.chatUserGroup[0].clientGroup;
                        let updateQuery = {
                            valid: 1,
                            'mobilePhone': row.mobilePhone,
                            'loginPlatform.chatUserGroup._id': params.groupType
                        };
                        common.wrapSystemCategory(updateQuery, params.systemCategory);
                        member.update(updateQuery, { $set: { "loginPlatform.chatUserGroup.$.email": params.email } }, function(err, row1) {
                            if (err) {
                                logger.error("modifyEmail->update fail!" + err);
                                callback({ isOK: false, msg: "修改失败，请联系客服！" });
                            } else {
                                callback({ isOK: true });
                                if (common.isValid(params.item)) {
                                    var pointsParams = { clientGroup: clientGroup, change: 'email', groupType: params.groupType, userId: row.mobilePhone, item: params.item, val: 0, isGlobal: false, remark: '', opUser: params.userId, opIp: params.ip };
                                    userService.pointsChange(pointsParams, function(result) {});
                                }
                            }
                        });
                    }
                });
            }
        });
    },
    /**
     * 修改密码
     * @param mobilePhone
     * @param groupType
     * @param callback
     */
    modifyPwd: function(parameters, callback) {
        let userInfo = parameters.userInfo,
            params = parameters.params;
        let searchObj = { valid: 1, 'mobilePhone': userInfo.mobilePhone, 'loginPlatform.chatUserGroup._id': userInfo.groupType };
        common.wrapSystemCategory(searchObj, parameters.systemCategory);
        member.findOne(searchObj, function(err, row) {
            if (err && !row) {
                logger.error("modifyPwd->update fail!" + err);
                callback({ isOK: false, msg: "修改失败，请联系客服！" });
            } else if (row && common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                var chatUserGroup = row.loginPlatform.chatUserGroup.id(userInfo.groupType);
                var pwd = common.getMD5(constant.pwdKey + params.password);
                if (common.isValid(chatUserGroup.pwd) && chatUserGroup.pwd != pwd) {
                    callback({ isOK: false, msg: "输入的原始密码错误！" });
                } else {
                    chatUserGroup.pwd = common.getMD5(constant.pwdKey + params.newPwd);
                    row.save(function(err1, rowTmp) {
                        if (err1) {
                            logger.error("modifyPwd->update fail!" + err1);
                            callback({ isOK: false, msg: "修改失败，请联系客服！" });
                        } else {
                            callback({ isOK: true });
                            if (common.isValid(params.item)) {
                                var pointsParams = {
                                    change: 'pwd',
                                    clientGroup: userInfo.clientGroup,
                                    groupType: userInfo.groupType,
                                    userId: userInfo.mobilePhone,
                                    item: params.item,
                                    val: 0,
                                    isGlobal: false,
                                    remark: '',
                                    opUser: userInfo.userId,
                                    opIp: params.ip
                                };
                                common.wrapSystemCategory(pointsParams, parameters.systemCategory);
                                userService.pointsChange(pointsParams, function(result) {});
                            }
                        }
                    });
                }
            } else {
                callback({ isOK: false, msg: "修改失败，请联系客服！" });
            }
        });
    },
    /**
     * 完善资料积分变化
     * @param mobilePhone
     * @param groupType
     * @param callback
     */
    pointsChange: function(params, callback) {
        var isChange = false;
        let queryObj = {
            mobilePhone: {
                $ne: params.mobilePhone
            },
            valid: 1,
            "loginPlatform.chatUserGroup": {
                $elemMatch: {
                    _id: params.groupType
                }
            }
        };
        common.wrapSystemCategory(queryObj, params.systemCategory);
        member.findOne(queryObj, "loginPlatform.chatUserGroup.$", function(err, result) {
            if (!err && result) {
                if (params.change == 'username' && common.isBlank(result.userName)) {
                    isChange = true;
                } else if (params.change == 'email' && common.isBlank(result.email)) {
                    isChange = true;
                } else if (params.change == 'pwd' && common.isBlank(result.pwd)) {
                    isChange = true;
                } else if (params.change == 'avatar' && common.isBlank(result.avatar)) {
                    isChange = true;
                }
                if (isChange) {
                    var pointsParam = {
                        clientGroup: params.clientGroup,
                        groupType: params.groupType,
                        userId: params.userId,
                        item: params.item,
                        val: params.val,
                        isGlobal: false,
                        remark: params.remark,
                        opUser: params.opUser,
                        opIp: params.ip
                    };
                    common.wrapSystemCategory(pointsParam, params.systemCategory);
                    chatPointsService.add(pointsParam, function(err, res) {
                        callback(res);
                    });
                }
            }
        });
    },
    /**
     * 完善资料积分变化
     * @param mobilePhone
     * @param groupType
     * @param callback
     */
    getClientGroupByMId: function(params, callback) { //["mobileArr"].split(","), req.query["groupType"]
        let mobileArr = params.mobileArr.split(","),
            groupType = params.groupType;
        let searchObj = {
            mobilePhone: {
                $in: mobileArr
            },
            valid: 1,
            "loginPlatform.chatUserGroup": {
                $elemMatch: {
                    _id: groupType
                }
            }
        };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        member.find(searchObj,
            "mobilePhone loginPlatform.chatUserGroup.$",
            function(err, result) {
                if (err) {
                    logger.error("getTeacherByUserId->get fail!" + err);
                    callback(null);
                } else {
                    var mbGrObj = {},
                        row = null;
                    if (result && result.length > 0) {
                        for (var i = 0; i < result.length; i++) {
                            row = result[i].loginPlatform.chatUserGroup.id(groupType);
                            mbGrObj[result[i].mobilePhone] = row.clientGroup;
                        }
                    }
                    callback(mbGrObj);
                }
            });
    },
    handleMemberInfoData: function(data) {
        var result = {
            mobilePhone: data.mobilePhone
        };
        if (data.loginPlatform && data.loginPlatform.chatUserGroup && data.loginPlatform.chatUserGroup.length > 0) {
            var chatUserGroup = data.loginPlatform.chatUserGroup[0];
            result.groupType = chatUserGroup._id;
            result.userId = chatUserGroup.userId;
            result.avatar = chatUserGroup.avatar;
            result.nickname = chatUserGroup.nickname;
            result.userType = chatUserGroup.userType;
            result.vipUser = chatUserGroup.vipUser;
            result.clientGroup = chatUserGroup.clientGroup;
            result.createDate = (chatUserGroup.createDate instanceof Date ? chatUserGroup.createDate.getTime() : 0);
            var rooms = [],
                room;
            for (var i = 0, lenI = chatUserGroup.rooms ? chatUserGroup.rooms.length : 0; i < lenI; i++) {
                room = chatUserGroup.rooms[i];
                rooms.push({
                    roomId: room._id,
                    onlineStatus: room.onlineStatus,
                    sendMsgCount: room.sendMsgCount,
                    onlineDate: (room.onlineDate instanceof Date ? room.onlineDate.getTime() : 0),
                    offlineDate: (room.offlineDate instanceof Date ? room.offlineDate.getTime() : 0)
                });
            }
            result.rooms = rooms;
        }
        return result;
    },
    /**
     * 按照手机号查询用户信息
     * @param params  {{mobilePhone:String, userId:String, groupType:String}}
     * @param callback
     */
    getMemberInfo: function(params, callback) {
        callback = callback || (() => {});
        let _this = this;
        let deferred = new Deferred();
        var searchObj = {
            valid: 1,
            status: 1
        };
        if (params.userId) {
            searchObj["loginPlatform.chatUserGroup"] = { $elemMatch: { _id: params.groupType, userId: params.userId } };
        } else {
            searchObj["mobilePhone"] = params.mobilePhone;
            searchObj["loginPlatform.chatUserGroup._id"] = params.groupType;
        }
        common.wrapSystemCategory(searchObj, params.systemCategory);
        member.findOne(searchObj, {
            "mobilePhone": 1,
            "loginPlatform.chatUserGroup.$": 1
        }, function(err, data) {
            if (err || !data) {
                if (err) {
                    logger.error("getMemberByMobile>>get momber info error:" + err);
                }
                callback(err, null);
                deferred.reject(err);
                return;
            }
            var result = _this.handleMemberInfoData(data);
            callback(null, result);
            deferred.resolve(result);
        });
        return deferred.promise;
    },
    getMemberListByUserNos: function(params) {
        let _this = this;
        let userNos = typeof params.userNos === 'string' ? params.userNos.split(',') : params.userNos;
        let deferred = new Deferred();
        var searchObj = {
            valid: 1,
            status: 1
        };
        searchObj["loginPlatform.chatUserGroup._id"] = params.groupType;
        searchObj["loginPlatform.chatUserGroup.userId"] = {
            "$in": userNos
        };
        member.find(searchObj, {
                "mobilePhone": 1,
                "loginPlatform.chatUserGroup.$": 1
            })
            .then(jsonData => {
                deferred.resolve(jsonData.map(user => _this.handleMemberInfoData(user)));
            })
            .catch(deferred.reject);
        return deferred.promise;
    },
    getMemberListByMobilePhones: function(params) {
        let deferred = new common.Deferred();
        let mobilePhoneArray = typeof params.mobilePhones === 'string' ? params.mobilePhones.split(",") : params.mobilePhones;
        let queryObj = {
            mobilePhone: { $in: mobilePhoneArray },
            valid: 1,
            "loginPlatform.chatUserGroup._id": params.groupType
        };
        common.wrapSystemCategory(queryObj, params.systemCategory);
        let fieldObj = {
            "mobilePhone": 1,
            "loginPlatform.chatUserGroup.$": 1
        };
        member.find(queryObj, fieldObj, (err, rows) => {
            if (err) {
                logger.error(err);
                deferred.reject(err);
            }
            deferred.resolve(rows);
        });
        return deferred.promise;
    },
    /**
     * 获取分析师列表
     * @param systemCategory
     * @param callback
     */
    getAnalystList: function(systemCategory, callback) {
        boUser.find({ valid: 1, status: 0, systemCategory: systemCategory, 'role.roleNo': common.getPrefixReg("analyst") }, "userNo userName position avatar winRate wechatCode wechatCodeImg earningsM tag introduction", function(err, rows) {
            callback(rows);
        });
    },
    setTeacherFollower: function(params) {
        let deferred = new common.Deferred();
        params.isFollow = 'isFollow' in params ? params.isFollow : 1; //如果isFollow不存在，则设置1为默认值
        followedTeacher.findOne({ status: 1, userNo: params.analystNo })
            .then(row => {
                if (!row) {
                    row = new followedTeacher({
                        _id: null,
                        userNo: params.analystNo,
                        followers: [],
                        status: 1
                    });
                }
                if (!row.followers) {
                    row.followers = new Array();
                }
                if (params.isFollow === 1 && row.followers.some(no => no === params.userId)) { //已经是关注者了，并且又要重新设置关注，那么直接resolve。
                    deferred.resolve({ isOK: false, userNo: row.userNo });
                    return;
                }
                if (params.isFollow === 0) { //取消关注。
                    row.followers = row.followers.filter(followerId => followerId !== params.userId);
                    row.save().then(data => {
                        deferred.resolve({ isOK: true, userNo: params.analystNo });
                    }).catch(err => {
                        logger.error("setTeacherFollower and save Error: ", err);
                        deferred.reject(err);
                    });
                } else { //设置关注。
                    row.followers.push(params.userId);
                    row.save().then(data => {
                        deferred.resolve({ isOK: true, userNo: params.analystNo });
                    }).catch(err => {
                        logger.error("setTeacherFollower and save Error: ", err);
                        deferred.reject(err);
                    });
                }
            })
            .catch(err => {
                logger.error("setTeacherFollower Error: ", err);
                deferred.reject(err);
            });
        return deferred.promise;
    },
    getTeacherFollowers: function(params) {
        let _this = this;
        let deferred = new common.Deferred();
        followedTeacher.findOne({ status: 1, userNo: params.userNo })
            .then(row => {
                if (!row || !row.followers || row.followers.length === 0) {
                    deferred.resolve([]);
                    return;
                }
                _this.getMemberListByUserNos({
                    userNos: row.followers,
                    groupType: params.groupType
                }).then(deferred.resolve).catch(deferred.reject);
            })
            .catch(err => {
                logger.error("getTeacherFollowers error", err);
                deferred.reject(err);
            });
        return deferred.promise;
    },
    getFollowedTeachers: function(params) {
        let _this = this;
        let deferred = new common.Deferred();
        followedTeacher.find({ status: 1, followers: params.userId }, "userNo")
            .then(userNoList => {
                let list = userNoList.map(user => user.userNo);
                _this.getUserList({ userNo: list.toString() }, deferred.resolve);
            })
            .catch(err => {
                logger.error("getFollowedTeachers error", err);
                deferred.reject(err);
            });
        return deferred.promise;
    }
};

//导出服务类
module.exports = userService;