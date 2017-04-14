var common = require('../util/common'); //引入common类
var constant = require('../constant/constant'); //引入constant
var userService = require('../service/userService'); //引入userService服务类
var messageService = require('../service/messageService'); //引入messageService服务类
var logger = require('../resources/logConf').getLogger('chatService'); //引入log4js
var visitorService = require('../service/visitorService');
var pushInfoService = require('../service/pushInfoService');
var config = require('../resources/config'); //资源文件
var async = require('async'); //引入async
var redis = require('redis');
var ChatShowTrade = require('../models/chatShowTrade'); //引入chatShowTrade数据模型
var BoUser = require('../models/boUser'); //引入boUser数据模型
var ChatPraise = require('../models/chatPraise'); //引入chatPraise数据模型
var noticeMessage = require("../message/NoticeMessage");
var chatMessage = require("../message/ChatMessage");
var baseMessage = require("../message/BaseMessage");
var cacheClient = require("../cache/cacheClient");
var ObjectId = require('mongoose').Types.ObjectId;
var ApiResult = require('../util/ApiResult');
var errorMessage = require('../util/errorMessage'); //引入errorMessage类

let updateCacheClient = userInfo => {
    //设置到redis中 userId 与socketId
    var key = chatService.getRedisKey(userInfo.groupType, userInfo.groupId, userInfo.userId);
    cacheClient.get(key, function(error, result) {
        if (!error && result) {
            //通知老socket退出
            noticeMessage.leaveRoomByOtherLogin(userInfo.groupType, result);
        }
    });
    //设置最后登录的socket
    cacheClient.set(key, userInfo.socketId);
    //设置有效时间2天
    cacheClient.expire(key, 1000 * 60 * 60 * 24 * 2);
};

let initSocketForUser = userInfo => {
    var uuid = chatService.getUserUUId(userInfo);
    //发送在线通知
    var onlineNumMsg = noticeMessage.buildSendOnlineNum(userInfo.groupType, userInfo.groupId, userInfo, true);
    //离线后通知
    var offlineNumMsg = noticeMessage.buildSendOnlineNum(userInfo.groupType, userInfo.groupId, userInfo, false);
    //设置加入房间
    var joinMsg = baseMessage.buildJoin(userInfo.groupType, userInfo.socketId, uuid, userInfo.groupId);
    //推送服务时间
    var serverTimeMsg = noticeMessage.buildServerTimePushInfo(userInfo.groupType, userInfo.socketId, uuid);
    //获取在线列表
    var onlineUserList = baseMessage.buildOnlineList(userInfo.groupType, userInfo.groupId, userInfo.socketId, uuid);
    //初始化socket 配置执行事件、设置属性、断开后事件。
    baseMessage.initSocket(
        userInfo.groupType,
        userInfo.socketId,
        uuid, //设置uuid
        {
            now: [serverTimeMsg, joinMsg, onlineNumMsg, onlineUserList], //需要马上执行的消息 获取服务器时间，加入房间，发送在线通知
            disconnect: [offlineNumMsg] //断开连接后执行的消息  发送离线通知
        },
        userInfo
    );
}

/**
 * 聊天室服务类
 * 备注：处理聊天室接受发送的所有信息及其管理
 * author Alan.wu
 */
var chatService = {
    /**
     * 初始化
     */
    init: function() {},
    /****
     * 用户加入 socket 设置数据
     * @param data
     */
    join: function(data) {
        var userAgent = data.userAgent;
        var fromPlatform = data.fromPlatform;
        var userInfo = data.userInfo,
            lastPublishTime = data.lastPublishTime,
            allowWhisper = data.allowWhisper,
            fUserTypeStr = data.fUserTypeStr,
            requestParams = data.requestParams;
        try {
            //数据格式转换
            userInfo.userType = parseInt(userInfo.userType);
            //删除不需要的数据
            delete userInfo.roleNo;
            delete userInfo.roleName;
            delete userInfo.mobilePhone;
            delete userInfo.mobile;
            delete userInfo.email;
        } catch (e) {
            logger.error("parseInt userInfo userType error: \n", userInfo, e);
        }
        userInfo.isMobile = common.isMobile(userAgent);
        if (common.isBlank(userInfo.groupType)) {
            return false;
        }
        //设置客户序列
        chatService.setClientSequence(userInfo);
        //更新在线状态
        userInfo.onlineStatus = 1;
        userInfo.onlineDate = new Date();
        userService.updateMemberInfo(userInfo, function(sendMsgCount, dbMobile, offlineDate) {
            updateCacheClient(userInfo);
            initSocketForUser(userInfo);

            //直播间创建访客记录
            if (parseInt(userInfo.userType) <= constant.roleUserType.member) {
                var vrRow = {
                    requestParams: requestParams,
                    userAgent: userAgent,
                    platform: fromPlatform,
                    visitorId: userInfo.visitorId,
                    groupType: userInfo.groupType,
                    roomId: userInfo.groupId,
                    nickname: userInfo.nickname,
                    clientGroup: userInfo.clientGroup,
                    clientStoreId: userInfo.clientStoreId,
                    ip: data.ip
                };

                if (userInfo.clientGroup != constant.clientGroup.visitor) {
                    vrRow.mobile = dbMobile;
                    vrRow.userId = userInfo.userId;
                    vrRow.loginStatus = 1;
                }
                visitorService.saveVisitorRecord('online', vrRow);
            }
            //加载私聊离线信息提示
            if (allowWhisper && offlineDate && common.isValid(fUserTypeStr)) {
                messageService.getWhUseMsgCount(userInfo.groupType, userInfo.groupId, userInfo.userType, fUserTypeStr.split(","), userInfo.userId, offlineDate, function(whUserData) {
                    if (whUserData && Object.getOwnPropertyNames(whUserData).length > 0) {
                        chatMessage.loadWhMsg(userInfo.groupType, userInfo.socketId, chatService.getUserUUId(userInfo), whUserData);
                    }
                });
            }
            //允许私聊,推送私聊信息
            if (allowWhisper) {
                pushInfoService.checkPushInfo(userInfo.groupType, userInfo.groupId, userInfo.clientGroup, constant.pushInfoPosition.whBox, true, function(pushInfos) {
                    if (pushInfos && pushInfos.length > 0) {
                        var pushInfo = null;
                        var infos = [];
                        for (var i = 0, len = pushInfos.length; i < len; i++) {
                            pushInfo = pushInfos[i];
                            infos.push({ serverTime: new Date().getTime(), publishTime: ((new Date().getTime() + pushInfo.onlineMin * 60 * 1000) + "_" + process.hrtime()[1]), contentId: pushInfo._id, timeOut: pushInfo.onlineMin, content: pushInfo.content });
                        }
                        if (pushInfo.replyRepeat == 0) {
                            messageService.existRecord({ "toUser.talkStyle": 1, "toUser.userType": 3, "toUser.questionId": pushInfo._id }, function(hasRecord) {
                                !hasRecord && noticeMessage.whChatPushInfo(userInfo.groupType, { socketId: userInfo.socketId, uuid: chatService.getUserUUId(userInfo) }, infos);
                            });
                        } else {
                            noticeMessage.whChatPushInfo(userInfo.groupType, { socketId: userInfo.socketId, uuid: chatService.getUserUUId(userInfo) }, infos);
                        }
                    }
                });
            }
            //公聊框推送
            pushInfoService.checkPushInfo(userInfo.groupType, userInfo.groupId, userInfo.clientGroup, constant.pushInfoPosition.talkBox, false, function(pushInfos) {
                if (pushInfos && pushInfos.length > 0) {
                    var infos = [];
                    for (var i = 0, lenI = pushInfos.length; i < lenI; i++) {
                        var pushInfo = pushInfos[i];
                        infos.push({ serverTime: new Date().getTime(), contentId: pushInfo._id, pushDate: pushInfo.pushDate, intervalMin: pushInfo.intervalMin, onlineMin: pushInfo.onlineMin, content: pushInfo.content });
                    }
                    noticeMessage.chatPushInfo(userInfo.groupType, { socketId: userInfo.socketId, uuid: chatService.getUserUUId(userInfo) }, infos);
                }
            });
            //视频框推送
            pushInfoService.checkPushInfo(userInfo.groupType, userInfo.groupId, userInfo.clientGroup, constant.pushInfoPosition.videoBox, true, function(pushInfos) {
                if (pushInfos && pushInfos.length > 0) {
                    var infos = [];
                    for (var i = 0, lenI = pushInfos.length; i < lenI; i++) {
                        var pushInfo = pushInfos[i];
                        infos.push({ contentId: pushInfo._id, title: pushInfo.title, pushDate: pushInfo.pushDate, pushType: pushInfo.pushType, clientGroup: pushInfo.clientGroup, intervalMin: pushInfo.intervalMin, onlineMin: pushInfo.onlineMin, content: pushInfo.content, url: pushInfo.url });
                    }
                    noticeMessage.videoPushInfo(userInfo.groupType, { socketId: userInfo.socketId, uuid: chatService.getUserUUId(userInfo) }, infos);
                }
            });
            //公聊记录
            messageService.loadMsg(userInfo, lastPublishTime, false, function(msgData) {
                var uuid = chatService.getUserUUId(userInfo);
                //同步数据到客户端
                chatMessage.loadMsg(userInfo.groupType, userInfo.socketId, uuid, { msgData: msgData, isAdd: common.isValid(lastPublishTime) ? true : false })
            });
        });
    },
    /****
     * 断开连接
     * @param data
     */
    disconnect: function(data) {
        if (data.user) {
            var userInfo = data.user;
            userService.removeOnlineUser(userInfo, true, function() {
                //直播间记录离线数据
                logger.debug("disconnect", userInfo);
                visitorService.saveVisitorRecord('offline', { roomId: userInfo.groupId, groupType: userInfo.groupType, clientStoreId: userInfo.clientStoreId });
            });
            return { clientStoreId: userInfo.clientStoreId, nickname: userInfo.nickname };
        }
        return null;

    },
    /****
     * 加载私聊消息
     * @param userInfo
     */
    getWHMsg: function(userInfo) {
        messageService.loadMsg(userInfo, null, true, function(result) {
            if (result && result.length > 0) {
                chatMessage.loadWhMsg(userInfo.groupType, userInfo.socketId, chatService.getUserUUId(userInfo), { type: 'online', data: result, toUserId: userInfo.toUser.userId });
            }
        });
    },
    /****
     * 发送服务器时间消息
     * @param groupType
     * @param socketId
     */
    sendServerTime: function(groupType, socketId) {
        noticeMessage.serverTimePushInfo(groupType, socketId);
    },
    sendMsg: function(data) {
        chatService.acceptMsg(data);
    },
    /**
     * 设置客户序列
     * @param userInfo
     */
    setClientSequence: function(userInfo) {
        if (common.isStudio(userInfo.groupType)) {
            var userType = userInfo.userType;
            if (userType && userType != 0 && userType != -1) {
                userInfo.sequence = userType;
            } else {
                var clientGroup = userInfo.clientGroup;
                if (constant.clientGroup.vip == clientGroup) {
                    userInfo.sequence = 10;
                } else if (constant.clientGroup.active == clientGroup) {
                    userInfo.sequence = 11;
                } else if (constant.clientGroup.notActive == clientGroup) {
                    userInfo.sequence = 12;
                } else if (constant.clientGroup.simulate == clientGroup) {
                    userInfo.sequence = 13;
                } else if (constant.clientGroup.register == clientGroup) {
                    userInfo.sequence = 14;
                } else {
                    userInfo.sequence = 15;
                }
            }
        } else {
            return;
        }
    },
    /**
     * 清除缓存数据及强制离线，清除缓存的在线线用户
     * @param callback
     */
    clearAllData: function(callback) {

    },
    /**
     * 提取分析师信息
     * @param platform
     * @param analystIds
     * @param callback
     */
    getAnalystInfo: function(platform, analystIds, callback) {
        var ids = analystIds.split(/\s*[,，]\s*/);
        if (!ids || ids.length == 0) {
            callback(null);
            return;
        }
        async.parallel({
            userInfo: function(callbackTmp) {
                BoUser.find({
                    userNo: { "$in": ids }
                }, callbackTmp);
            },
            praise: function(callbackTmp) {
                ChatPraise.find({
                    fromPlatform: platform,
                    praiseType: "user",
                    praiseId: { $in: ids }
                }, callbackTmp);
            }
        }, function(err, results) {
            var userMap = {},
                praiseMap = {};
            var i, lenI;
            for (i = 0, lenI = !results.userInfo ? 0 : results.userInfo.length; i < lenI; i++) {
                userMap[results.userInfo[i].userNo] = results.userInfo[i];
            }
            for (i = 0, lenI = !results.praise ? 0 : results.praise.length; i < lenI; i++) {
                praiseMap[results.praise[i].praiseId] = results.praise[i];
            }
            var result = [],
                analyst, user;
            for (i = 0, lenI = ids.length; i < lenI; i++) {
                analyst = {
                    userNo: ids[i],
                    userName: "",
                    position: "",
                    avatar: "",
                    introduction: "",
                    wechatCode: "",
                    tag: "",
                    winRate: "",
                    earningsM: "",
                    praise: 0
                };
                if (userMap.hasOwnProperty(analyst.userNo)) {
                    user = userMap[analyst.userNo];
                    analyst.userName = user.userName;
                    analyst.position = user.position;
                    analyst.avatar = user.avatar;
                    analyst.introduction = user.introduction;
                    analyst.wechatCode = user.wechatCode;
                    analyst.tag = user.tag;
                    analyst.winRate = user.winRate;
                    analyst.earningsM = user.earningsM;
                }
                if (praiseMap.hasOwnProperty(analyst.userNo)) {
                    analyst.praise = praiseMap[analyst.userNo].praiseNum;
                }
                result.push(analyst);
            }
            callback(result);
        });
    },

    /**
     * 分析师点赞
     */
    praiseAnalyst: function(platform, analystId, callback) {
        ChatPraise.findOne({
            fromPlatform: platform,
            praiseType: "user",
            praiseId: analystId
        }, function(err, row) {
            if (err) {
                logger.error("praiseAnalyst->find fail!:" + err);
                callback({ isOK: false, msg: '更新失败', num: 0 });
                return;
            }
            if (row) {
                if (!row.praiseNum) {
                    row.praiseNum = 1;
                } else {
                    row.praiseNum += 1;
                }
            } else {
                row = new ChatPraise({
                    _id: new ObjectId(),
                    praiseId: analystId,
                    praiseType: "user",
                    fromPlatform: platform,
                    praiseNum: 1,
                    remark: ""
                });
            }
            row.save(function(err1, rowTmp) {
                if (err1) {
                    logger.error('praiseAnalyst=>save fail!' + err1);
                    callback({ isOK: false, msg: '更新失败', num: 0 });
                    return;
                }
                callback({ isOK: true, msg: '', num: rowTmp.praiseNum });
            });
        });
    },

    /**
     * 获取分析师晒单
     * @param params {{platform:String, userId:String, tradeType:Number, num:Number, onlyHis:boolean}}
     * @param callback
     */
    getShowTrade: function(params, callback) {
        var queryObj = {
            groupType: params.platform,
            "boUser.userNo": params.userId,
            tradeType: params.tradeType,
            valid: 1
        };
        if (params.tradeType != 1) {
            queryObj.status = 1; //审核通过
        }
        if (params.onlyHis) {
            queryObj.profit = { $nin: [null, ""] };
        }
        ChatShowTrade.find(queryObj)
            .limit(params.num)
            .sort({ showDate: -1 })
            .exec('find', function(err, datas) {
                if (err) {
                    logger.error('getShowTrade=>query fail:' + err);
                    callback(ApiResult.result(errorMessage.code_10, null));
                } else {
                    var result = [],
                        data = null;
                    for (var i = 0, lenI = !datas ? 0 : datas.length; i < lenI; i++) {
                        data = datas[i];
                        result.push({
                            id: data._id,
                            groupType: data.groupType,
                            groupId: data.groupId,
                            userId: data.boUser.userNo,
                            userName: data.boUser.userName,
                            userAvatar: data.boUser.avatar,
                            showDate: data.showDate ? data.showDate.getTime() : 0,
                            tradeImg: data.tradeImg,
                            profit: data.profit,
                            remark: data.remark,
                            title: data.title,
                            praise: data.praise
                        });
                    }
                    callback(ApiResult.result(null, result));
                }
            });
    },
    /**
     * 提取房间在线总人数
     * @param groupId
     * @param callback
     */
    getRoomOnlineTotalNum: function(groupId, callback) {
        var namespace = common.getRoomType(groupId);
        baseMessage.getRoomUserCount(namespace, groupId)
            .then(function(count) {
                callback(count);
            })
            .catch(e => {
                callback(0);
                logger.error("获取在线人数失败", e);
            });
    },
    /**
     * 接收信息数据
     */
    acceptMsg: function(data) {
        var userInfo = data.fromUser,
            groupId = userInfo.groupId;
        userInfo.email = null;
        userInfo.mobilePhone = null; //手机号码不能暴露
        userInfo.mobile = null;
        //userInfo.accountNo = null;
        //如果首次发言需要登录验证(备注：微信取openId为userId，即验证openId）
        var toUser = userInfo.toUser,
            isWh = toUser && common.isValid(toUser.userId) && "1" == toUser.talkStyle; //私聊
        //如果是私聊游客或水军发言直接保存数据
        var isWhVisitor = (isWh && constant.clientGroup.visitor == userInfo.clientGroup);
        var isAllowPass = isWhVisitor || userInfo.userType == constant.roleUserType.navy || (common.isStudio(userInfo.groupType) && constant.clientGroup.visitor == userInfo.clientGroup);
        userService.checkUserLogin(userInfo, isAllowPass, function(row) {
            if (row) {
                var userSaveInfo = {};
                if (!isAllowPass) {
                    var tipResult = userService.checkUserGag(row, userInfo.groupId); //检查用户禁言
                    if (!tipResult.isOK) { //是否设置了用户禁言
                        chatMessage.sendMsg(
                            userInfo.groupType,
                            userInfo.socketId,
                            chatService.getUserUUId(userInfo), {
                                fromUser: userInfo,
                                uiId: data.uiId,
                                value: tipResult,
                                rule: true
                            }
                        );
                        return false;
                    }
                    userSaveInfo = row.loginPlatform.chatUserGroup[0]; //用于信息保存
                    if (userSaveInfo.vipUser) {
                        userSaveInfo.clientGroup = "vip";
                    }
                    userSaveInfo.mobilePhone = row.mobilePhone;
                    if (userSaveInfo.nickname) {
                        userInfo.nickname = userSaveInfo.nickname; //如果后台设置了昵称则更新为后台
                    }

                    userSaveInfo.userType = userInfo.userType = userSaveInfo.userType || userInfo.userType;
                } else {
                    userSaveInfo.userType = isWhVisitor ? constant.roleUserType.visitor : userInfo.userType;
                    userSaveInfo.nickname = userInfo.nickname;
                    userSaveInfo.accountNo = userInfo.accountNo;
                }
                var currentDate = new Date();
                userInfo.publishTime = currentDate.getTime() + "_" + process.hrtime()[1]; //产生唯一的id
                userSaveInfo.groupType = userSaveInfo._id || userInfo.groupType;
                userSaveInfo.position = userInfo.position;
                userSaveInfo.avatar = userInfo.avatar;
                userSaveInfo.groupId = userInfo.groupId;
                userSaveInfo.publishTime = userInfo.publishTime;
                userSaveInfo.userId = userInfo.userId;
                userSaveInfo.toUser = userInfo.toUser;
                var speakNum = 0; //TODO need to fix this later, to get speakNum from socket.
                //                if(socket){
                //                    speakNum=socket.userInfo && socket.userInfo.sendMsgCount;
                //                }
                //验证规则
                userService.verifyRule(userInfo, { isWh: isWh, speakNum: speakNum }, data.content).then(resultVal => {
                    if (!resultVal.isOK) { //匹配规则，则按规则逻辑提示
                        logger.info('acceptMsg=>resultVal:' + JSON.stringify(resultVal));
                        //通知自己的客户端
                        chatMessage.sendMsg(userInfo.groupType, userInfo.socketId, chatService.getUserUUId(userInfo), { fromUser: userInfo, uiId: data.uiId, value: resultVal, rule: true });
                    } else {
                        data.content.status = 1; //设为通过
                        //私聊权限逻辑判断
                        if (isWh && (!common.containSplitStr(resultVal.talkStyle, toUser.talkStyle) || (constant.roleUserType.member < parseInt(userInfo.userType) && !common.containSplitStr(resultVal.whisperRoles, userInfo.userType)) ||
                                (constant.roleUserType.member >= parseInt(userInfo.userType) && !common.containSplitStr(resultVal.whisperRoles, toUser.userType)))) {
                            //通知自己的客户端
                            chatMessage.sendMsg(userInfo.groupType, userInfo.socketId, chatService.getUserUUId(userInfo), { fromUser: userInfo, uiId: data.uiId, value: { tip: '你或对方没有私聊权限' }, rule: true });
                            return false;
                        }
                        //发送给自己
                        var myMsg = { uiId: data.uiId, fromUser: userInfo, serverSuccess: true, content: { msgType: data.content.msgType, needMax: data.content.needMax } };
                        if (resultVal.tip) {
                            myMsg.rule = true;
                            myMsg.value = resultVal;
                        }
                        chatMessage.sendMsg(userInfo.groupType, userInfo.socketId, chatService.getUserUUId(userInfo), myMsg);
                        var imgMaxValue = data.content.maxValue;
                        //发送给除自己之外的用户
                        if (isWh) { //私聊
                            data.content.maxValue = "";
                            var newToUser = {
                                userId: userInfo.toUser.userId,
                                groupId: userInfo.groupId,
                                groupType: userInfo.groupType
                            }
                            chatMessage.sendMsg(userInfo.groupType, userInfo.toUser.socketId, chatService.getUserUUId(newToUser), data);
                            var key = chatService.getRedisKey(userInfo.groupType, userInfo.groupId, userInfo.toUser.userId);
                            var cacheClient = require("../cache/cacheClient");
                            //获取最后一次登录的socket
                            cacheClient.get(key, function(error, result) {
                                var socketId = userInfo.toUser.userId;
                                if (!error && result) {
                                    socketId = result;
                                }
                                baseMessage.checkUserIsOnline(userInfo.groupType, userInfo.groupId, socketId)
                                    .then(function(online) {
                                        saveMsg(online);
                                    }, function(error) {
                                        saveMsg(false);
                                        logger.error("获取用户在线信息失败.", error);
                                    });

                                function saveMsg(online) {
                                    data.content.msgStatus = online ? 1 : 0; //1:0;判断信息是否离线或在线
                                    data.content.maxValue = imgMaxValue;
                                    messageService.saveMsg({ fromUser: userSaveInfo, content: data.content })
                                        .then(data => { logger.info(data); })
                                        .catch(e => { logger.error("saveMsg 失败.", e); });
                                }
                            });
                        } else {
                            messageService.saveMsg({ fromUser: userSaveInfo, content: data.content })
                                .then(data => { logger.info(data) })
                                .catch(e => { logger.error("saveMsg 失败.", e); });
                            data.content.maxValue = "";
                            chatMessage.sendMsgByRoom(userInfo.groupType, groupId, { fromUser: userInfo, content: data.content })
                        }
                    }
                }).catch(e => {
                    logger.error("acceptMsg! >>verifyRule:", e);
                    chatMessage.sendMsg(userInfo.groupType, userInfo.socketId, chatService.getUserUUId(userInfo), {
                        fromUser: userInfo,
                        uiId: data.uiId,
                        value: { tip: e.tip },
                        rule: true
                    });
                });
            } else {
                //通知自己的客户端
                chatMessage.sendMsg(userInfo.groupType, userInfo.socketId, chatService.getUserUUId(userInfo), { isVisitor: true, uiId: data.uiId });
            }
        });
    },
    /**
     * 移除数据
     * @param groupId
     * @param msgIds
     */
    removeMsg: function(groupId, msgIds) {
        var namespace = this.getGroupType(groupId);
        noticeMessage.removeMsg(namespace, groupId, msgIds);
    },

    /**
     * 删除字幕推送信息
     * @param groupId
     * @param msgIds
     */
    removePushInfo: function(position, groupIds, ids) {
        try {
            var groupIds = groupIds.split('|');
            if (groupIds.length > 0) {
                var obj = null;
                for (var i = 0; i < groupIds.length; i++) {
                    obj = groupIds[i].split(",");
                    for (var j = 0; j < obj.length; j++) {
                        var groupId = obj[j];
                        var namespace = this.getGroupType(groupId);
                        noticeMessage.removePushInfo(namespace, groupId, position, ids.split('|')[i]);
                    }
                }
            }
        } catch (e) {
            logger.error("removePushInfo fail", e);
            throw new Error(e);
        }
    },
    /**
     * 新增或修改字幕,需要查询数据
     * @param ids
     */
    submitPushInfo: function(infoStr, isValid) {
        try {
            var obj = JSON.parse(infoStr);
            obj.isValid = isValid;
            obj.edit = true;
            var rmIds = obj.roomIds;
            for (var i in rmIds) {
                var groupId = rmIds[i];
                var groupType = this.getGroupType(groupId);
                noticeMessage.submitPushInfo(groupType, groupId, obj);
            }
        } catch (e) {
            logger.error("submitPushInfo fail", e);
        }

    },
    /**
     * 通知文档数据
     * @param articleJSON
     * @param opType
     */
    noticeArticle: function(articleJSON, opType) {
        try {
            var article = JSON.parse(articleJSON);
            if (article && article.platform) {
                article.position = 5; //课堂笔记
                article.opType = opType; //操作类型
                var rmIds = article.platform.split(",");
                for (var i in rmIds) {
                    chatService.sendNoticeArticle(rmIds[i], article);
                }
            }
        } catch (e) {
            logger.error("noticeArticle fail", e);
        }
    },
    sendNoticeArticle: function(groupId, article) {
        var groupType = this.getGroupType(groupId);
        noticeMessage.noticeArticle(groupType, groupId, article);
    },
    /****
     * 房间规则改变
     * @param groupId
     * @param ruleInfo
     */
    modifyRulePushInfo: function(groupId, ruleInfo) {
        var groupType = this.getGroupType(groupId);
        noticeMessage.modifyRulePushInfo(groupType, groupId, ruleInfo);
    },
    /****
     * 晒单推送
     * @param groupType
     * @param tradeInfoResult
     */
    showTrade: function(groupType, tradeInfoResult) {
        noticeMessage.showTradePushInfo(groupType, tradeInfoResult);
    },
    /****
     * 根据房间号 返回对应namespace
     * @param groupId
     * @returns {string}
     */
    getGroupType: function(groupId) {
        return common.getRoomType(groupId);
    },
    /**
     * 离开房间(房间关闭）
     * @param groupIds
     * @param flag
     */
    leaveRoom: function(groupIds) {
        var groupIdArr = groupIds.split(",");
        for (var i in groupIdArr) {
            var groupId = groupIdArr[i];
            var groupType = this.getGroupType(groupId);
            noticeMessage.leaveRoom(groupType, groupId);
        }
    },
    /**
     * 根据userId离开房间
     * @param roomIds 若干房间
     * @param userIds 若干用户
     * @param flag
     */
    leaveRoomByUserId: function(roomIds, userIds) {
        if (common.isBlank(roomIds) || common.isBlank(userIds)) {
            logger.error("leaveRoomByUserId=>userId is null");
            return;
        }
        var userIdArr = userIds.split(",");
        var roomIdArr = roomIds.split(",");
        for (var i in roomIdArr) {
            var groupId = roomIdArr[i];
            var groupType = this.getGroupType(groupId);
            for (var j = 0; j < userIdArr.length; j++) {
                var uid = userIdArr[j];
                noticeMessage.leaveRoomByUserId(groupType, this.getUserUUId({ userId: uid, groupId: groupId, groupType: groupType }));
            }
        }
    },

    /****
     * 返回uuid
     * @param userInfo
     */
    getUserUUId: function(userInfo) {
        return userInfo.userId;
    },
    /**
     * 检查客户是否已经点赞
     * 已点赞返回false，否则返回true
     */
    checkChatPraise: function(clientId, praiseId, fromPlatform, callback) {
        var cacheClient = require('../cache/cacheClient');
        var key = 'chatPraise_' + fromPlatform + '_' + clientId + '_' + praiseId;
        cacheClient.hgetall(key, function(err, result) {
            if (!err && result) {
                callback(false);
            } else {
                cacheClient.hmset(key, 'createTime', Date());
                cacheClient.expire(key, 24 * 3600);
                callback(true);
            }
        });
    },
    getRedisKey: function(groupType, groupId, userId) {
        return "chat_socket_" + groupType + "_" + groupId + "_" + userId;
    }
};
chatService.init();
//导出服务类
module.exports = chatService;