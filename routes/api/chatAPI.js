/**
 * @apiDefine ParametersMissedError
 *
 * @apiError ParametersMissed 参数没有传完整，无法完成请求。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "result": "1000",
 *      "msg": "没有指定参数!"
 *  }
 */
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
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var logger = require("../../resources/logConf").getLogger("chatAPI");
var errorMessage = require('../../util/errorMessage.js');
var chatService = require('../../service/chatService');
var userService = require('../../service/userService');
let chatPointsService = require('../../service/chatPointsService');
var ApiResult = require('../../util/ApiResult');
let APIUtil = require('../../util/APIUtil'); //引入API工具类js

/**
 * @api {get} /chat/getMessageList 获取聊天信息
 * @apiName getMessageList
 * @apiGroup chat
 *
 * @apiParam {Number} pageNo 需要获取的分页.
 * @apiParam {String} [pageSize] 每页的大小.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getMessageList.json
 * @apiExample Example usage:
 *  /api/chat/getMessageList.json?pageNumber=1
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "msg": "OK",
 *          "pageNo": 1,
 *          "pageSize": 15,
 *          "totalRecords": 0,
 *          "data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get(/^\/getMessageList(\.(json|xml))?$/, function(req, res) {
    var params = req.query;
    if (!params.pageNo || params.pageNo <= 0) {
        params.pageNo = 1;
    }
    params.pageNo = parseInt(params.pageNo);
    params.pageSize = parseInt(params.pageSize) || 15;
    if (isNaN(params.pageNo) || isNaN(params.pageSize)) {
        if (req.path.indexOf('.xml') != -1) {
            res.end(ApiResult.result(errorMessage.code_1000, null, ApiResult.dataType.xml));
        } else {
            res.json(ApiResult.result(errorMessage.code_1000));
        }
    } else {
        common.wrapSystemCategory(params, req.query.systemCategory);
        chatService.getMessagePage(params, function(page) {
            if (req.path.indexOf('.xml') != -1) {
                res.end(ApiResult.result(null, page, ApiResult.dataType.xml));
            } else {
                res.json(ApiResult.result(null, page));
            }
        });
    }
});



/**
 * @api {get} /chat/getMemberInfo 获取成员信息。
 * @apiName getMemberInfo
 * @apiGroup chat
 *
 * @apiParam {String} groupType 成员类型，如果此参数为空，mobilePhone和userId就必须不为空。
 * @apiParam {String} [mobilePhone] 手机号码，此参数必须与userId任选其一。
 * @apiParam {String} [userId] 成员的用户ID，此参数必须与mobilePhone任选其一。
 *
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getMemberInfo
 * @apiExample Example usage:
 *  /api/chat/getMemberInfo?groupType=studio&mobilePhone=18122056986
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "mobilePhone": "18122056986",
 *     "groupType": "studio",
 *     "userId": "uxnxiipcvfnvi",
 *     "avatar": "http://192.168.35.91:8090/upload/pic/header/chat/front/201612/20161227165127_54726532.jpg",
 *     "nickname": "无码救赎",
 *     "userType": 0,
 *     "vipUser": false,
 *     "clientGroup": "register",
 *     "createDate": 1481527079817,
 *      - "rooms": [
 *          - {
 *             "roomId": "studio_teach",
 *             "onlineStatus": 1,
 *             "sendMsgCount": 0,
 *             "onlineDate": 1484545992220,
 *             "offlineDate": 1484545990928
 *         },
 *          - {
 *             "roomId": "studio_42",
 *             "onlineStatus": 0,
 *             "sendMsgCount": 0,
 *             "onlineDate": 1482904540821,
 *             "offlineDate": 1482904667222
 *         }
 *     ]
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getMemberInfo", function(req, res) {
    var params = {
        groupType: req.query["groupType"],
        mobilePhone: req.query["mobilePhone"],
        userId: req.query["userId"]
    };
    if (common.isBlank(params.groupType) || (common.isBlank(params.mobilePhone) && common.isBlank(params.userId))) {
        res.json(ApiResult.result(errorMessage.code_1000, null));
    } else {
        common.wrapSystemCategory(params, req.query.systemCategory);
        userService.getMemberInfo(params, function(err, member) {
            res.json(member);
        });
    }
});
/**
 * @api {get} /chat/getAnalysts 查询分析师信息（点赞+胜率）
 * @apiName getAnalysts
 * @apiGroup chat
 *
 * @apiParam {String} platform 平台类型类型，必需。pm是"studio"；fx是"fxstudio"；hx是"hxstudio"。
 * @apiParam {String} analystIds 分析师编号列表，英文逗号分隔，必需。比如"andrew"代表伦老师; "sunman_chu"代表朱老师。
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getAnalysts
 * @apiExample Example usage:
 *  /api/chat/getAnalysts?platform=studio&analystIds=andrew
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * [{
 * 		"userNo": "andrew",
 * 		"userName": "伦老师",
 * 		"position": "金道研究院",
 * 		"avatar": "http://192.168.35.91:8090/upload/pic/header/chat/201508/20150817140000_analyst1.png",
 * 		"introduction": "",
 * 		"wechatCode": "",
 * 		"winRate": "79.60%",
 * 		"praise": 0
 * 	}
 * ]
 *
 * @apiUse ParametersMissedError
 */
router.get("/getAnalysts", function(req, res) {
    let params = {
        platform: req.query["platform"],
        analystIds: req.query["analystIds"]
    }
    if (common.isBlank(params.platform) || common.isBlank(params.analystIds)) {
        res.json(ApiResult.result(errorMessage.code_1000, null));
    } else {
        common.wrapSystemCategory(params, req.query.systemCategory);
        chatService.getAnalystInfo(params, function(analysts) {
            res.json(analysts);
        });
    }
});

/**
 * @api {post} /chat/praiseAnalyst 分析师点赞
 * @apiName praiseAnalyst
 * @apiGroup chat
 *
 * @apiParam {String} platform 平台类型类型，必需。pm是"studio"；fx是"fxstudio"；hx是"hxstudio"。
 * @apiParam {String} analystId 分析师编号，必需。比如"andrew"代表伦老师; "sunman_chu"代表朱老师。
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/chat/praiseAnalyst
 * @apiExample Example usage:
 *  /api/chat/praiseAnalyst?platform=studio&analystId=andrew
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 * 	"isOK": true,
 * 	"msg": "",
 * 	"num": 1
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/praiseAnalyst", function(req, res) {
    let params = {
        platform: req.body["platform"] || req.query["platform"],
        analystId: req.body["analystId"] || req.query["analystId"]
    };
    if (common.isBlank(params.analystId) || common.isBlank(params.platform)) {
        res.json(ApiResult.result(errorMessage.code_1000, null));
    } else {
        common.wrapSystemCategory(params, req.body.systemCategory);
        chatService.praiseAnalyst(params, function(result) {
            res.json(result);
        });
    }
});

/**
 * @api {get} /chat/getShowTrade 分析师晒单
 * @apiName getShowTrade
 * @apiGroup chat
 *
 * @apiParam {String} platform 成员类型，必需
 * @apiParam {String} userId 分析师ID，必需
 * @apiParam {Number} tradeType 晒单类型，1 分析师晒单，2 客户晒单
 * @apiParam {Number} onlyHis 仅查询已平仓的晒单，1 是， 0 否
 * @apiParam {Number} num 条数
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getShowTrade
 * @apiExample Example usage:
 *  /api/chat/getShowTrade?platform=studio&userId=Eugene_ana&tradeType=1&onlyHis=0&num=4
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getShowTrade", function(req, res) {
    var params = {
        platform: req.query["platform"],
        userId: req.query["userId"],
        tradeType: req.query["tradeType"] || 1,
        onlyHis: req.query["onlyHis"] != 0,
        num: req.query["num"]
    };
    if (!params.platform || !params.userId) {
        res.json(ApiResult.result(errorMessage.code_1000, null));
        return;
    }
    if (params.num) {
        params.num = parseInt(params.num, 10);
        if (isNaN(params.num)) {
            params.num = 2;
        }
    }
    common.wrapSystemCategory(params, req.query.systemCategory);
    chatService.getShowTrade(params, function(result) {
        res.json(result);
    });
});

/**
 * @api {get} /chat/getRoomOnlineTotalNum 获取房间的在线人数
 * @apiName getRoomOnlineTotalNum
 * @apiGroup chat
 *
 * @apiParam {String} groupId 分组ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getRoomOnlineTotalNum
 * @apiExample Example usage:
 *  /api/chat/getRoomOnlineTotalNum?groupId=fxstudio_11
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": 0
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getRoomOnlineTotalNum", function(req, res) {
    var groupId = req.query["groupId"];
    if (!groupId) {
        res.json(ApiResult.result(errorMessage.code_1000, null));
        return;
    }
    chatService.getRoomOnlineTotalNum(groupId, function(data) {
        res.json(ApiResult.result(null, data));
    });
});
/**
 * @api {get} /chat/getRoomOnlineList 获取房间在线人数列表
 * @apiName getRoomOnlineList
 * @apiGroup chat
 *
 * @apiParam {String} groupId 分组ID
 * @apiParam {String} groupType 分组类型
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getRoomOnlineList
 * @apiExample Example usage:
 *  /api/chat/getRoomOnlineList?groupId=studio_teach&groupType=studio
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": 0
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getRoomOnlineList", function(req, res) {
    let params = {
        groupId: req.query["groupId"],
        groupType: req.query["groupType"]
    };
    if (!(params.groupId && params.groupType)) {
        res.json(ApiResult.result(errorMessage.code_1000, null));
        return;
    }
    chatService.getRoomOnlineList(params).then(function(data) {
        res.json(ApiResult.result(null, data));
    }).catch(e => {
        res.json(ApiResult.result(e, null));
    });
});
/**
 * @api {post} /chat/checkChatPraise 检查客户是否已经点赞
 * @apiName checkChatPraise
 * @apiGroup chat
 *
 * @apiParam {String} clientId 用户ID，必需
 * @apiParam {String} praiseId 点赞对象ID，必需
 * @apiParam {String} fromPlatform 成员类型，必需 直播间groupType值 studio/fxstudio/hxstudio
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data 返回的数据
 *
 * @apiSampleRequest /api/chat/checkChatPraise
 * @apiExample {json} Request-Example:
 *  {clientId : 'sxunppxunpxix',
 *      praiseId : 'Eugene_ana',
 *      fromPlatform : 'studio'}
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/checkChatPraise", function(req, res) {
    var clientId = req.body.clientId,
        praiseId = req.body.praiseId,
        fromPlatform = req.body.fromPlatform;
    if (common.isBlank(clientId) || common.isBlank(praiseId) || common.isBlank(fromPlatform)) {
        res.json(ApiResult.result(null, true));
    } else {
        chatService.checkChatPraise(req.body, function(isOK) {
            res.json(ApiResult.result(null, isOK));
        });
    }
});
/**
 * @api {post} /chat/acceptMsg 审批聊天消息
 * @apiName acceptMsg
 * @apiGroup chat
 *
 * @apiParam {String} fromUser 发送用户
 * @apiParam {String} content 消息内容
 * @apiParam {String} uiId 消息ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/chat/removeMsg
 * @apiParamExample {json} Request-Example:
 *     {fromUser: "",
 *      content: ""，
 *      uiId: ""}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/acceptMsg", function(req, res) {
    let requires = ["fromUser", "content", "uiId"];
    let isSatify = requires.every(name => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[acceptMsg] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try {
        chatService.acceptMsg(req.body);
        res.json(ApiResult.result(null, true));
    } catch (e) {
        res.json(ApiResult.result(e, false));
    }
});
/**
 * @api {post} /chat/removeMsg 移除聊天消息
 * @apiName removeMsg
 * @apiGroup chat
 *
 * @apiParam {String} groupId 分组ID列表
 * @apiParam {String} msgIds 消息ID列表，逗号分隔
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/chat/removeMsg
 * @apiParamExample {json} Request-Example:
 *     {groupId: "studio_teach",
 *      msgIds: "1489470593313_773839992"}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/removeMsg", function(req, res) {
    let requires = ["groupId", "msgIds"];
    let isSatify = requires.every(name => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[removeMsg] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try {
        chatService.removeMsg(req.body.groupId, req.body.msgIds);
        res.json(ApiResult.result(null, true));
    } catch (e) {
        res.json(ApiResult.result(e, false));
    }
});
/**
 * @api {post} /chat/leaveRoom 离开房间，强制用户下线
 * @apiName leaveRoom
 * @apiGroup chat
 *
 * @apiParam {String} groupIds 分组ID列表，逗号分隔
 * @apiParam {String} userIds 用户ID列表，逗号分隔
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/leaveRoom
 * @apiParamExample {json} Request-Example:
 *     {groupIds: "fxstudio_50",
 *      userIds: "eugene_ana"}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/leaveRoom", (req, res) => {
    let groupIds = req.body["groupIds"];
    let userIds = req.body["userIds"];
    if (common.isBlank(groupIds)) {
        logger.warn("[leaveRoom] Parameters missed! Expecting parameter: groupIds");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try {
        if (common.isValid(userIds)) { //存在用户id
            chatService.leaveRoomByUserId(groupIds, userIds);
        } else { //不存在用户id，则通知房间所有用户下线
            chatService.leaveRoom(groupIds);
        }
        res.json(ApiResult.result(null, { isOK: true }));
    } catch (e) {
        res.json(ApiResult.result(e, { isOK: false }));
    }
});
/**
 * @api {post} /chat/submitPushInfo 提交推送消息
 * @apiName submitPushInfo
 * @apiGroup chat
 *
 * @apiParam {String} infoStr 消息体
 * @apiParam {String} isValid 是否有效 ？ 字面解释，实际效果未知。
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/submitPushInfo
 * @apiParamExample {json} Request-Example:
 *     {infoStr: '{"roomIds": "fxstudio_50"}',
 *      isValid: true}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/submitPushInfo", function(req, res) {
    let infoStr = req.body["infoStr"];
    let isValid = req.body["isValid"];
    if (common.isBlank(infoStr)) {
        logger.warn("[submitPushInfo] Parameters missed! Expecting parameter: infoStr");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try {
        chatService.submitPushInfo(infoStr, isValid);
        res.json(ApiResult.result(null, { isOK: true }));
    } catch (e) {
        res.json(ApiResult.result(e, { isOK: false }));
    }
});
/**
 * @api {post} /chat/removePushInfo 删除推送消息
 * @apiName removePushInfo
 * @apiGroup chat
 *
 * @apiParam {String} ids 消息ID列表，用逗号分隔
 * @apiParam {String} roomIds 房间ID列表，用逗号分隔。
 * @apiParam {String} position 消息位置。
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/removePushInfo
 * @apiParamExample {json} Request-Example:
 *     {infoStr: '{"roomIds": "fxstudio_50"}',
 *      isValid: true}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/removePushInfo", function(req, res) {
    let ids = req.body["ids"];
    let roomIds = req.body["roomIds"];
    let position = req.body["position"];
    if (common.isBlank(ids)) {
        logger.warn("[removePushInfo] Parameters missed! Expecting parameter: ids");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try {
        chatService.removePushInfo(position, roomIds || "", ids);
        res.json(ApiResult.result(null, { isOK: true }));
    } catch (e) {
        logger.error("[removePushInfo] faile: ", e);
        res.json(ApiResult.result(null, { isOK: false }));
    }
});
/**
 * @api {post} /chat/noticeArticle 文章添加/更新提醒
 * @apiName noticeArticle
 * @apiGroup chat
 *
 * @apiParam {String} article 文章体
 * @apiParam {String} opType 文章操作类型
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/noticeArticle
 * @apiParamExample {json} Request-Example:
 *     {article: '{"platform": "fxstudio_50"}',
 *      opType: 'add'}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 * @apiUse ParameterNotAvailableJSONError
 */
router.post("/noticeArticle", function(req, res) {
    let articleJSON = req.body["article"];
    let opType = req.body["opType"];
    if (common.isBlank(articleJSON)) {
        logger.warn("[noticeArticle] Parameters missed! Expecting parameter: articleJSON");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try {
        articleJSON = JSON.parse(articleJSON);
    } catch (e) {
        logger.error(e);
        res.json(APIUtil.APIResult("code_10", null));
        return;
    }
    try {
        chatService.noticeArticle(articleJSON, opType);
        res.json(ApiResult.result(null, { isOK: true }));
    } catch (e) {
        res.json(ApiResult.result(e, { isOK: false }));
    }
});
/**
 * @api {post} /chat/showTradeNotice 显示晒单提醒
 * @apiName showTradeNotice
 * @apiGroup chat
 *
 * @apiParam {String} tradeInfo 晒单信息
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/showTradeNotice
 * @apiParamExample {json} Request-Example:
 *     {tradeInfo: '[{"groupType":"fx","boUser":{"telephone":"18122222222"},"createUser":"eugene_ana","createIp":"127.0.0.1"},{"groupType":"fx","boUser":{"telephone":"18133333333"},"createUser":"eugene_ana","createIp":"127.0.0.1"}]'}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 * @apiUse ParameterNotAvailableJSONError
 */
router.post("/showTradeNotice", function(req, res) {
    let tradeInfoJSON = req.body["tradeInfo"];
    if (common.isBlank(tradeInfoJSON)) {
        logger.warn("[showTradeNotice] Parameters missed! Expecting parameter: tradeInfoJSON");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try {
        tradeInfoArray = JSON.parse(tradeInfoJSON);
    } catch (e) {
        logger.error(e);
        res.json(APIUtil.APIResult("code_10", null));
        return;
    }
    let tradeInfoResult = [],
        mobileArr = [],
        tradeInfo = null;
    tradeInfoArray.forEach(trade => {
        tradeInfo = trade;
        if (tradeInfo.tradeType == 2) { //客户晒单
            mobileArr.push(tradeInfo.boUser.telephone);
        }
    });
    let params = { mobileArr: mobileArr.join(','), groupType: tradeInfo.groupType };
    userService.getClientGroupByMId(params, function(mbObj) {
        tradeInfoArray.forEach(trade => {
            tradeInfo = trade;
            if (tradeInfo.tradeType == 2) { //客户晒单
                tradeInfoResult.push(tradeInfo);
                chatPointsService.add({
                    clientGroup: mbObj[tradeInfo.boUser.telephone],
                    groupType: tradeInfo.groupType,
                    groupType: tradeInfo.groupType,
                    userId: tradeInfo.boUser.telephone,
                    item: 'daily_showTrade',
                    val: 0,
                    isGlobal: false,
                    remark: '',
                    opUser: tradeInfo.createUser,
                    opIp: tradeInfo.createIp
                }, result => true);
            }
        });
        if (tradeInfoResult.length > 0) {
            chatService.showTrade(tradeInfo.groupType, tradeInfoResult);
        }
    });
    res.json(ApiResult.result(null, { isOK: true }));
});
/**
 * @api {post} /chat/modifyRuleNotice 修改规则
 * @apiName modifyRuleNotice
 * @apiGroup chat
 *
 * @apiParam {String} ruleInfo 规则信息
 * @apiParam {String} roomIds 需要应用规则的房间列表，逗号分隔
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/modifyRuleNotice
 * @apiParamExample {json} Request-Example:
 *     {ruleInfo: "{}",
 *      roomIds: "fxstudio_50"}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 * @apiUse ParameterNotAvailableJSONError
 */
router.post("/modifyRuleNotice", function(req, res) {
    let ruleInfo = req.body["ruleInfo"];
    let roomIds = req.body["roomIds"];
    if (common.isBlank(ruleInfo)) {
        logger.warn("[modifyRuleNotice] Parameters missed! Expecting parameter: ruleInfo");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try {
        ruleInfo = JSON.parse(ruleInfo);
    } catch (e) {
        logger.error(e);
        res.json(APIUtil.APIResult("code_10", null));
        return;
    }
    roomIds = roomIds.split(",");
    for (var i in roomIds) {
        chatService.modifyRulePushInfo(roomIds[i], ruleInfo);
    }
    res.json(ApiResult.result(null, { isOK: true }));
});
/**
 * @api {post} /chat/sendNoticeArticle 发送推送通知
 * @apiName sendNoticeArticle
 * @apiGroup chat
 *
 * @apiParam {String} groupId 房间ID。
 * @apiParam {String} article 文章体，json 字符串
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/sendNoticeArticle
 * @apiParamExample {json} Request-Example:
 *     {article: '{"platform": "fxstudio_50"}', groupId: 'fxstudio_50'}
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 * @apiUse ParameterNotAvailableJSONError
 */
router.post("/sendNoticeArticle", function(req, res) {
    let requires = ["groupId", "article"];
    let isSatify = requires.every(name => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[sendNoticeArticle] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let article = req.body["article"],
        groupId = req.body["groupId"];
    try {
        if (typeof article === "string") {
            article = JSON.parse(article);
        }
    } catch (e) {
        logger.error(e);
        res.json(APIUtil.APIResult("code_10", null));
        return;
    }
    chatService.sendNoticeArticle(groupId, article);
    res.json(ApiResult.result(null, { isOK: true }));
});

module.exports = router;