var common = require('../util/common'); //引入common类
var constant = require('../constant/constant'); //引入constant
var boUser = require('../models/boUser.js'); //引入boUser数据模型
var boDict = require('../models/boDict.js'); //引入boDict数据模型
var chatGroup = require('../models/chatGroup'); //引入chatGroup数据模型
var chatGroupRule = require('../models/chatGroupRule'); //引入chatGroupRule数据模型
var member = require('../models/member'); //引入member数据模型
var logger = require('../resources/logConf').getLogger('adminService'); //引入log4js

/**
 * 后台聊天室服务类
 * 备注：处理聊天室接受发送的所有信息及其管理
 * author Alan.wu
 */
var adminService = {
    /**
     * 后台聊天室用户登录
     * @param userNo 用户名
     * @param password 密码
     * @param callback
     */
    checkSystemUserInfo: function(param, callback) {
        var result = { userType: 0, isOK: false, nickname: '' };
        var searchObj = { 'userNo': param.userNo, 'password': param.password, 'status': 0, 'valid': 1 };
        searchObj = common.wrapSystemCategory(searchObj, param.systemCategory);
        boUser.findOne(searchObj, function(err, row) {
            if (!err && row) {
                result.isOK = true;
                result.position = row.position;
                result.avatar = row.avatar;
                var userTypeTmp = null;
                for (var p in constant.roleUserType) {
                    if (common.hasPrefix(p, row.role.roleNo)) {
                        userTypeTmp = constant.roleUserType[p];
                        result.roleNo = row.role.roleNo;
                        result.roleName = row.role.roleName;
                        break;
                    }
                }
                result.userType = userTypeTmp;
                result.userId = result.accountNo = row.userNo;
                result.nickname = row.userName;
                result.mobilePhone = row.telephone;
                result.fromPlatform = constant.fromPlatform.pm_mis;
                common.wrapSystemCategory(result, param.systemCategory);
                adminService.updateMember(result, function(isOK) {
                    callback(result);
                });
            } else {
                callback(result);
            }
        });
    },
    /**
     * 后台使用最新数据更新member
     * */
    updateMember: function(userInfo, callback) {
        member.findOne({
            systemCategory: userInfo.systemCategory,
            valid: 1,
            'loginPlatform.chatUserGroup': {
                $elemMatch: {
                    accountNo: userInfo.userId
                }
            }
        }, function(err, row) {
            if (err) {
                logger.error("updateMember->fail!:" + err);
                callback(false);
                return;
            } else if (row && common.checkArrExist(row.loginPlatform.chatUserGroup)) {
                var groups = row.loginPlatform.chatUserGroup,
                    group;
                for (var i = 0, lenI = groups.length; i < lenI; i++) {
                    group = groups[i];
                    if (group.accountNo == userInfo.userId) {
                        group.nickname = userInfo.nickname;
                        group.userType = userInfo.userType;
                        group.avatar = userInfo.avatar;
                    }
                }
                row.save(function(err) {
                    if (err) {
                        logger.error("updateMember->fail!:" + err);
                        callback(false);
                        return;
                    }
                    callback(true);
                });
                return;
            }
            callback(true);
        });
    },
    /**
     * 根据登录用户的ID获取房间列表
     * @param userId
     * @param callback
     */
    getChatGroupListByAuthUser: function(param, callback) {
        let deferred = new common.Deferred();
        let queryObj = { status: { $in: [1, 2] }, valid: 1, authUsers: param.userId };
        common.wrapSystemCategory(queryObj, param.systemCategory);
        chatGroup.find(queryObj, "id name groupType", function(err, rooms) {
            if (err) {
                deferred.reject(err);
                return;
            }
            deferred.resolve(rooms);
        });
        return deferred.promise;
    },
    /**
     * 获取房间类型列表
     * @param callback
     */
    getChatGroupRoomsList: function(param) {
        let deferred = new common.Deferred();
        let systemCategory = param.systemCategory;
        let queryObj = { code: constant.chatGroup.dict_chat_group_type, valid: 1, status: 1 };
        queryObj["children.systemCategory"] = {
            $regex: `${systemCategory},|,${systemCategory}|,${systemCategory},|${systemCategory}`
        };
        boDict.findOne(queryObj, "children.$", function(err, roomTypes) {
            if (err) {
                deferred.reject(err);
                return;
            }
            deferred.resolve(roomTypes ? roomTypes.children : roomTypes);
        });
        return deferred.promise;
    },
    /**
     * 设置登录用户禁言
     * @param data
     * @param callback
     */
    setUserGag: function(data, callback) {
        var searchObj = { valid: 1, status: 1, 'loginPlatform.chatUserGroup': { $elemMatch: { _id: data.groupType, userId: data.userId, "rooms._id": data.groupId } } };
        common.wrapSystemCategory(searchObj, data.systemCategory);
        member.findOne(searchObj, function(err, row) {
            if (!err && row) {
                var group = row.loginPlatform.chatUserGroup.id(data.groupType);
                if (group) {
                    var room = group.rooms.id(data.groupId);
                    room.gagDate = data.gagDate;
                    room.gagTips = data.gagTips;
                    room.gagRemark = data.gagRemark;
                    row.save(function(err, rowTmp) {
                        if (err) {
                            logger.error("setUserGag->fail!:" + err);
                        }
                        callback(true);
                    });
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    },
    /**
     * 更新房间游客禁言值
     * @param data
     * @param callback
     */
    setVisitorGag: function(data, callback) {
        var searchObj = { _id: data.groupId, groupType: data.groupType, status: { $in: [1, 2] }, valid: 1, chatRules: { $elemMatch: { type: data.type } } };
        common.wrapSystemCategory(searchObj, data.systemCategory);
        chatGroup.findOne(searchObj, "chatRules.$", function(err, row) {
            if (err) {
                logger.error("setVisitorGag->fail!:" + err);
                callback({ isOk: false, isIn: false, msg: '禁言失败' });
            } else {
                if (row) {
                    var chatRules = row.chatRules[0];
                    if (chatRules) {
                        var beforeRule = chatRules.beforeRuleVal;
                        if (common.containSplitStr(beforeRule, data.userId)) {
                            callback({ isOk: false, isIn: true, msg: '已存在禁言列表中' });
                        } else {
                            beforeRule = beforeRule.replace(/(,|，)$/, ''); //去掉结尾的逗号
                            var beforeRuleVal = beforeRule + common.joinSplit(data.userId);
                            beforeRuleVal = beforeRuleVal.replace(/(,|，)$/, ''); //去掉结尾的逗号
                            if (beforeRuleVal.substr(0, 1) == ',') {
                                beforeRuleVal = beforeRuleVal.substr(1); //去掉开始的逗号
                            }
                            var setObj = { '$set': { 'chatRules.$.beforeRuleVal': beforeRuleVal } };
                            chatGroup.findOneAndUpdate(searchObj, setObj, function(err1, row1) {
                                if (err1) {
                                    logger.error('setChatGroupGag=>fail!' + err1);
                                    callback({ isOk: false, isIn: false, msg: '禁言失败' });
                                }
                                chatGroupRule.findOneAndUpdate(common.wrapSystemCategory({ type: data.type, valid: 1 }, data.systemCategory), { '$set': { beforeRuleVal: beforeRuleVal } }, function(err2, row2) {
                                    if (err2) {
                                        logger.error('setChatGroupRuleGag=>fail!' + err2);
                                        callback({ isOk: false, isIn: false, msg: '禁言失败' });
                                    }
                                });
                                callback({ isOk: true, isIn: false, msg: '' });
                            });
                        }
                    } else {
                        callback({ isOk: false, isIn: false, msg: '未设置规则' });
                    }
                } else {
                    callback({ isOk: false, isIn: false, msg: '禁言失败' });
                }
            }
        });
    },
    /**
     * 获取禁言设置数据
     * @param data
     * @param callback
     */
    getUserGag: function(data, callback) {
        var searchObj = { valid: 1, status: 1, 'loginPlatform.chatUserGroup': { $elemMatch: { _id: data.groupType, userId: data.userId, "rooms._id": data.groupId } } };
        common.wrapSystemCategory(searchObj, data.systemCategory);
        member.findOne(searchObj, function(err, row) {
            if (err) {
                logger.error('getUserGag=>fail!' + err);
                callback(null);
            }
            if (row) {
                var group = row.loginPlatform.chatUserGroup.id(data.groupType);
                if (group) {
                    var room = group.rooms.id(data.groupId);
                    callback(room);
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        });
    }
};

//导出服务类
module.exports = adminService;