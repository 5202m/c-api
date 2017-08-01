/**
 * @apiDefine ParameterNotAvailableJSONError
 *
 * @apiError ParameterNotAvailableJSONError 参数数据不是合法的JSON字符串。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 1,
 *          "errcode": "10",
 *          "errmsg": "操作异常!",
 *          "data": null
 *      }
 */
/**
 * @apiDefine CommonResultDescription
 *
 * @apiSuccess {Number} result 结果码，0 - 成功；-1 - 未知或未定义的错误；other - API系统定义的错误
 * @apiSuccess {String} errmsg  错误信息.
 * @apiSuccess {Number} errcode  错误码.
 */
var logger = require("../../resources/logConf").getLogger("messageAPI");
var express = require('express');
var router = express.Router();
var messageService = require('../../service/messageService');
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage');
var APIUtil = require('../../util/APIUtil.js');
var chatService = require("../../service/chatService");

/**
 * @api {get} /message/loadMsg 从数据库中加载已有的聊天记录
 * @apiName loadMsg
 * @apiGroup message
 *
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} groupId 房间ID，必填 取userInfo.groupId值
 * @apiParam {String} userId 用户ID，必填 取userInfo.userId值
 * @apiParam {Date} lastPublishTime 最后发布时间
 * @apiParam {String} allowWhisper 状态
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/message/loadMsg
 * @apiExample Example usage:
 *  /api/message/loadMsg?groupType=studio&groupId=studio_teach&userId=&lastPublishTime=&allowWhisper=
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode: "0",
 *           errmsg: "",
 *          "data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/loadMsg", (req, res) => {
    let requires = ["groupType", "groupId", "userId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let userInfo = {};
    requires.forEach(function(name) {
        userInfo[name] = req.query[name];
    });
    userInfo.toUser = req.query.toUser || {};
    common.wrapSystemCategory(userInfo, req.query.systemCategory);
    messageService.loadMsg(
        userInfo,
        req.query["lastPublishTime"],
        (req.query["allowWhisper"] === true),
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {post} /message/saveMsg 保存聊天内容到数据库中
 * @apiName saveMsg
 * @apiGroup message
 *
 * @apiParam {String} userId 用户ID，必填. 取userInfo.userId值
 * @apiParam {String} nickname 昵称，必填  取userInfo.nickname值
 * @apiParam {String} groupId 房间ID，必填  取userInfo.groupId值
 * @apiParam {String} groupType 组别，必填  取userInfo.groupType值
 * @apiParam {String} approvalUserArr 审核用户列表.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/message/saveMsg
 * @apiParamExample {json} Request-Example:
 *     data: {
 *          "messageData":{
 *              "fromUser":{
 *              "userId":"dxunppxunppps",
 *             "nickname":"KK",
 *             "groupId":"studio_teach",
 *             "groupType":"studio"
 *             }
 *          },
 *       "approvalUserArr": ""
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post("/saveMsg", (req, res) => {
    let msgData = req.body["messageData"];
    if (!msgData) {
        logger.warn("Parameters missed! Expecting parameters: msgData");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let requires = ["userId", "nickname", "groupId", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(msgData["fromUser"][name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters in msgData['fromUser']: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    common.wrapSystemCategory(msgData, req.body.systemCategory);
    messageService.saveMsg(
        msgData,
        req.body["approvalUserArr"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {get} /message/existRecord 是否存在符合条件的记录
 * @apiName existRecord
 * @apiGroup message
 *
 * @apiParam {String} req.query 具体参数暂时不祥，待确认
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} groupId 房间ID，必填 取userInfo.groupId值
 * @apiParam {String} userId 用户ID，必填 取userInfo.userId值
 * @apiParam {String} lastPublishTime 最后发布时间
 * @apiParam {String} allowWhisper 状态
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/message/existRecord
 * @apiExample Example usage:
 *  /api/message/existRecord?groupType=studio&groupId=studio_teach&userId=&lastPublishTime=&allowWhisper=
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode: "0",
 *           errmsg: "",
 *          "data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/existRecord", (req, res) => {
    if (!req.query) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    messageService.existRecord(
        req.query,
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /message/getWhUseMsgCount 获取用户私聊信息条数
 * @apiName getWhUseMsgCount
 * @apiGroup message
 *
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} groupId 房间ID，必填 取userInfo.groupId值
 * @apiParam {String} userType 用户类别，必填 取userInfo.userType值
 * @apiParam {String} whUserTypeArr 用户类别数组，必填  后台用户发起，则验证自己是否匹配私聊授权角色||前台客户发起，则验证对方是否匹配私聊授权角色
 * @apiParam {String} toUserId 接收消息的用户ID，必填
 * @apiParam {String} lastOfflineDate 最后发送时间
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/message/getWhUseMsgCount
 * @apiExample Example usage:
 *  /api/message/getWhUseMsgCount?groupType=studio&groupId=studio_teach&userType=0&whUserTypeArr=0&toUserId=dxunppxunppps&lastOfflineDate=2017-04-11 10:12:02
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode: "0",
 *           errmsg: "",
 *          "data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getWhUseMsgCount", (req, res) => {
    let requires = ["groupType", "groupId", "userType", "whUserTypeArr", "toUserId", "lastOfflineDate"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    messageService.getWhUseMsgCount(
        req.query["groupType"],
        req.query["groupId"],
        req.query["userType"],
        req.query["whUserTypeArr"],
        req.query["toUserId"],
        req.query["lastOfflineDate"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /message/loadBigImg 加载大图
 * @apiName loadBigImg
 * @apiGroup message
 *
 * @apiParam {String} userId 用户ID，必填 取userInfo.userId值
 * @apiParam {String} publishTime 发布时间，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/message/loadBigImg
 * @apiExample Example usage:
 *  /api/message/loadBigImg?publishTime=1491979138364_498397452&userId=dxunppxunppps
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode: "0",
 *           errmsg: "",
 *          "data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/loadBigImg", (req, res) => {
    let requires = ["userId", "publishTime"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    messageService.loadBigImg(
        req.query["userId"],
        req.query["publishTime"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {post} /message/deleteMsg 删除聊天记录
 * @apiName deleteMsg
 * @apiGroup message
 *
 * @apiParam {String} publishTimeArr 发布时间数组，必填.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/message/deleteMsg
 * @apiParamExample {json} Request-Example:
 *     data: {
 *          "publishTimeArr":['1453949338397_907267807','1453949361830_340701687']
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post("/deleteMsg", (req, res) => {
    let isSatify = req.body && "publishTimeArr" in req.body;
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    messageService.deleteMsg(
        req.body,
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /message/getLastTwoDaysMsg 查询两天内的聊天记录并分组
 * @apiName getLastTwoDaysMsg
 * @apiGroup message
 *
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} groupId 房间ID，必填 取userInfo.groupId值
 * @apiParam {String} userId 用户ID，必填 取userInfo.userId值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/message/getLastTwoDaysMsg
 * @apiExample Example usage:
 *  /api/message/getLastTwoDaysMsg?groupType=studio&groupId=studio_teach&userId=dxunppxunppps
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode: "0",
 *           errmsg: "",
 *          "data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getLastTwoDaysMsg", (req, res) => {
    let requires = ["groupType", "groupId", "userId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    messageService.getLastTwoDaysMsg(
        req.query,
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {post} /message/join 用户加入验证
 * @apiName join
 * @apiGroup message
 *
 * @apiParam {String} userAgent 用户浏览器user-agent
 * @apiParam {Object} userInfo 用户信息
 * @apiParam {String} lastPublishTime 发布时间
 * @apiParam {String} allowWhisper 聊天方式
 * @apiParam {String} fUserTypeStr 发布时间数组
 * @apiParam {String} fromPlatform 私聊角色类型
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/message/join
 * @apiParamExample {json} Request-Example:
 *     data: {
 *          "userInfo":{
 *              "groupType":"studio",
 *              "isLogin":true,
 *              "groupId":"studio_teach",
 *              "userId":"dxunppxunppps",
 *              "clientGroup":"register",
 *              "nickname":"KK",
 *              "userType":0,
 *              "clientStoreId":"1491556848930_70196925",
 *              "visitorId":"visitor_70196925",
 *              "loginId":"dxunppxunppps",
 *             "socketId":"doxxE5MzxJmtHkxLAAHO"
 *          },
 *          "lastPublishTime":"",
 *          "fUserTypeStr":"3,1",
 *          "allowWhisper":true
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post("/join", (req, res) => {
    let data = req.body;
    chatService.join({
        userAgent: data.userAgent,
        userInfo: data.userInfo,
        lastPublishTime: data.lastPublishTime,
        allowWhisper: data.allowWhisper,
        fUserTypeStr: data.fUserTypeStr,
        fromPlatform: data.fromPlatform,
        ip: req.connection.remoteAddress,
        systemCategory: data.systemCategory
    });
    res.json({ code: 200 });
});

/**
 * @api {post} /message/sendMsg 发送消息
 * @apiName sendMsg
 * @apiGroup message
 *
 * @apiParam {String} uiId 发送消息时生成的uiId
 * @apiParam {String} groupType 组别，userInfo.groupType
 * @apiParam {Boolean} isLogin 是否登录，userInfo.isLogin
 * @apiParam {String} groupId 房间ID，userInfo.groupId
 * @apiParam {String} userId 用户ID，userInfo.userId
 * @apiParam {String} clientGroup 客户组别，userInfo.clientGroup
 * @apiParam {String} nickname 用户昵称，userInfo.nickname
 * @apiParam {Number} userType 用户类别
 * @apiParam {String} clientStoreId 取userInfo.clientStoreId值
 * @apiParam {String} visitorId 用户访客ID
 * @apiParam {String} loginId 用户登录ID
 * @apiParam {String} socketId 用户socketId
 * @apiParam {String} pointsGlobal 用户可用积分
 * @apiParam {Object} toUser 聊天对象
 * @apiParam {String} msgType 消息类型 text/img
 * @apiParam {String} value 消息内容
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/message/sendMsg
 * @apiParamExample {json} Request-Example:
 *     data: {
 *          "uiId":"1491980799812_ms",
 *          "fromUser":{
 *              "groupType":"studio",
 *              "isLogin":true,
 *              "groupId":"studio_teach",
 *              "userId":"dxunppxunppps",
 *              "clientGroup":"register",
 *              "nickname":"KK",
 *              "userType":0,
 *              "clientStoreId":"1491556848930_70196925",
 *              "visitorId":"visitor_70196925",
 *              "loginId":"dxunppxunppps",
 *              "socketId":"doxxE5MzxJmtHkxLAAHO",
 *              "pointsGlobal":"11000",
 *              "toUser":null
 *          },
 *          content:{
 *              "msgType":"text",
 *             "value":"1"
 *         }
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post("/sendMsg", (req, res) => {
    let data = req.body.data;
    chatService.acceptMsg(data);
    res.json({ code: 200 });
});

/**
 * @api {post} /message/getWhMsg 加载私聊消息
 * @apiName getWhMsg
 * @apiGroup message
 *
 * @apiParam {String} groupType 组别，userInfo.groupType
 * @apiParam {String} groupId 房间ID，userInfo.groupId
 * @apiParam {String} userId 用户ID，userInfo.userId
 * @apiParam {Number} userType 用户类别
 * @apiParam {String} clientStoreId 取userInfo.clientStoreId值
 * @apiParam {String} [toUser][userId] 聊天对象ID
 * @apiParam {String} [toUser][userType] 聊天用户类别
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/message/getWhMsg
 * @apiParamExample {json} Request-Example:
 *     data: {
 *          "clientStoreId":"1491556848930_70196925",
 *          "userType":0,
 *          "groupId":"studio_teach",
 *          "groupType":"studio",
 *          "userId":"dxunppxunppps",
 *          "toUser":{
 *              "userId":"alan_cs2",
 *              "userType":3
 *          }
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post("/getWhMsg", (req, res) => {
    let userInfo = req.body.data;
    chatService.getWHMsg(userInfo);
    res.json({ code: 200 });
});

/**
 * @api {post} /message/serverTime 推送服务器时间
 * @apiName serverTime
 * @apiGroup message
 *
 * @apiParam {String} groupType 组别，userInfo.groupType
 * @apiParam {String} socketId 用户socketId，取userInfo.socketId值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/message/serverTime
 * @apiParamExample {json} Request-Example:
 *     data: {
 *          "groupType":"studio",
 *          "socketId":"CbW2rxTAPd29yGokABli"
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post("/serverTime", (req, res) => {
    let data = req.body.data;
    if (data.groupType && data.socketId) {
        chatService.sendServerTime(data.groupType, data.socketId);
    }
    res.json({ code: 200 });
});

function disconnect(req, res) {
    let data = req.body.data;
    let info = chatService.disconnect(data.msgData[0]);
    if (info) {
        res.json({ code: 200, data: info });
    } else {
        res.json({ code: 200 });
    }
}
//接收到socket消息  目前只处理断开消息
router.post("/", (req, res) => {
    let data = req.body.data;
    if (data) {
        if (data.msgType == 'disconnect') {
            disconnect(req, res);
        }
    } else {
        res.json({ code: 500 });
    }
});


/**
 * @api {post} /message/getMessageUser 查询当天发言用户列表
 * @apiName getMessageUser
 * @apiGroup message
 *
 * @apiParam {String} groupType 组别 取userInfo.groupType值
 * @apiParam {String} systemCategory 系统类别 pm/fx/hx
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/message/getMessageUser
 * @apiExample Example usage:
 *  /api/message/getMessageUser?groupType=fxstudio&systemCategory=fx
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode: "0",
 *           errmsg: "",
 *          "data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post("/getMessageUser", (req, res) => {
    let requires = ["groupType", "systemCategory"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    messageService.getMessageByLteTodayCurrentTime(
        req.body,
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

module.exports = router;