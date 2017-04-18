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
"use strict";
let logger = require("../../resources/logConf").getLogger("userAPI");
let express = require('express');
let router = express.Router();
let userService = require('../../service/userService');
let common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

/**
 * @api {get} /user/getUserInfo 通过用户ID提取用户信息（分析师）
 * @apiName getUserInfo
 * @apiGroup user
 *
 * @apiParam {String} id 用户ID，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getUserInfo
 * @apiExample Example usage:
 *  /api/user/getUserInfo?id=U150511B000005
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
router.get("/getUserInfo", (req, res) => {
    if (common.isBlank(req.query["id"])) {
        logger.warn("[getUserInfo] Parameters missed! Expecting parameters: ", "id");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getUserInfo(
        req.query["id"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /user/getUserInfoByUserNo 通过用户userNo提取用户信息（分析师）
 * @apiName getUserInfoByUserNo
 * @apiGroup user
 *
 * @apiParam {String} userNo 用户userNo，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getUserInfoByUserNo
 * @apiExample Example usage:
 *  /api/user/getUserInfoByUserNo?userNo=leo
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
router.get("/getUserInfoByUserNo", (req, res) => {
    if (common.isBlank(req.query["userNo"])) {
        logger.warn("[getUserInfoByUserNo] Parameters missed! Expecting parameters: ", "userNo");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getUserInfoByUserNo(
        req.query["userNo"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /user/getUserList 通过多个用户userNo提取用户信息（分析师）
 * @apiName getUserList
 * @apiGroup user
 *
 * @apiParam {String} userNOs 用户userNo，多个用,隔开必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getUserList
 * @apiExample Example usage:
 *  /api/user/getUserList?userNo=leo,kitty
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
router.get("/getUserList", (req, res) => {
    if (common.isBlank(req.query["userNOs"])) {
        logger.warn("[getUserList] Parameters missed! Expecting parameters: ", "userNOs");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getUserList(
        req.query["userNOs"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /user/batchOfflineStatus 批量下线房间用户在线状态（客户）
 * @apiName batchOfflineStatus
 * @apiGroup user
 *
 * @apiParam {String} roomId 房间Id，取userInfo.groupId 必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/batchOfflineStatus
 * @apiExample Example usage:
 *  /api/user/batchOfflineStatus?roomId=studio_teach
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
router.get("/batchOfflineStatus", (req, res) => {
    if (common.isBlank(req.query["roomId"])) {
        logger.warn("[batchOfflineStatus] Parameters missed! Expecting parameters: ", "roomId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.batchOfflineStatus(
        req.query["roomId"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {post} /user/verifyRule 验证规则
 * @apiName verifyRule
 * @apiGroup user
 *
 * @apiParam {String} nickname 昵称，必填
 * @apiParam {Number} userType 用户类型，必填 前台或后台用户(-1,0,1,2,3)
 * @apiParam {String} groupId 房间ID，必填 取userInfo.groupId
 * @apiParam {String} content 发言内容，必填
 * @apiParam {String} clientGroup 用户组别，取userInfo.clientGroup值
 * @apiParam {String} isWh 是否私聊 true||false
 * @apiParam {Number} speakNum 发言次数
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/verifyRule
 * @apiParamExample {json} Request-Example:
 *     {
 *       "nickname": "test",
 *       "userType": -1,
 *       "groupId": "studio_teach",
 *       "content": "test",
 *       "clientGroup": "register",
 *       "isWh": false,
 *       "speakNum": 1
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
router.post("/verifyRule", (req, res) => {
    let requires = ["nickname", "userType", "groupId", "content"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[verifyRule] Parameters missed! Expecting parameters: ", requires, req.body);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let userInfo = {
        clientGroup: req.body["clientGroup"] || "",
        nickname: req.body["nickname"],
        userType: req.body["userType"],
        groupId: req.body["groupId"],
    };
    let params = {
        isWh: req.body["isWh"],
        speakNum: req.body["speakNum"]
    };

    userService.verifyRule(
        userInfo,
        params,
        req.body["content"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /user/getMemberList 根据id提取会员信息
 * @apiName getMemberList
 * @apiGroup user
 *
 * @apiParam {String} id 会员ID 必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getMemberList
 * @apiExample Example usage:
 *  /api/user/getMemberList?id=578de12d87c3f6ec3382ad37
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
router.get("/getMemberList", (req, res) => {
    if (common.isBlank(req.query["id"])) {
        logger.warn("[getMemberList] Parameters missed! Expecting parameters: ", "id");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getMemberList(
        req.query["id"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /user/getAuthUsersByGroupId 检查角色是否有审批权限
 * @apiName getAuthUsersByGroupId
 * @apiGroup user
 *
 * @apiParam {String} groupId  房间ID，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getAuthUsersByGroupId
 * @apiExample Example usage:
 *  /api/user/getAuthUsersByGroupId?groupId=studio_teach
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
router.get("/getAuthUsersByGroupId", (req, res) => {
    if (common.isBlank(req.query["groupId"])) {
        logger.warn("[getAuthUsersByGroupId] Parameters missed! Expecting parameters: ", "groupId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getAuthUsersByGroupId(
        req.query["groupId"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {post} /user/createUser 新增用户信息
 * @apiName createUser
 * @apiGroup user
 *
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} groupId 房间ID，必填 取userInfo.groupId
 * @apiParam {String} accountNo 交易账号，必填
 * @apiParam {String} mobilePhone 手机号，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/createUser
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupType": "studio",
 *       "groupId": "studio_teach",
 *       "accountNo": "",//交易账号
 *       "mobilePhone": "13800138000"
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
router.post("/createUser", (req, res) => {
    let requires = ["groupType", "groupId", "accountNo", "mobilePhone"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[createUser] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.createUser(
        req.body,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {get} /user/joinNewRoom 加入新的房间组
 * @apiName joinNewRoom
 * @apiGroup user
 *
 * @apiParam {String} mobilePhone  手机号，必填
 * @apiParam {String} userId  用户ID，必填
 * @apiParam {String} groupType  组别，必填 取userInfo.groupType值
 * @apiParam {String} groupId  房间ID，必填 取userInfo.groupId值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/joinNewRoom
 * @apiExample Example usage:
 *  /api/user/joinNewRoom?mobilePhone=13800138012&userId=sxunppxunpxix&groupType=studio&groupId=studio_teach
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
router.get("/joinNewRoom", (req, res) => {
    let requires = ["mobilePhone", "userId", "groupType", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("[joinNewRoom] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.joinNewRoom(
        req.query,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {post} /user/updateMemberInfo 更新会员信息
 * @apiName updateMemberInfo
 * @apiGroup user
 *
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} nickname 昵称，必填
 * @apiParam {String} groupId 房间ID，必填 取userInfo.groupId
 * @apiParam {String} clientStoreId 客户端缓存ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/updateMemberInfo
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupType": "studio",
 *       "groupId": "studio_teach",
 *       "nickname": "beatp",
 *       "clientStoreId": "1485046160186_32772873"
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
router.post("/updateMemberInfo", (req, res) => {
    let requires = ["groupType", "nickname", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[updateMemberInfo] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.updateMemberInfo(
        req.body,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {post} /user/updateChatUserGroupStatus 下线更新会员状态及发送记录条数
 * @apiName updateChatUserGroupStatus
 * @apiGroup user
 *
 * @apiParam {String} userId 用户ID，必填
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} groupId 房间ID，必填 取userInfo.groupId
 * @apiParam {Number} chatStatus 状态，0下线，1上线
 * @apiParam {Number} sendMsgCount 消息条数
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/updateChatUserGroupStatus
 * @apiParamExample {json} Request-Example:
 *     {
 *       "userInfo":{
 *          "userId":"sxunppxunpxix",
 *          "groupType":"studio",
 *          "groupId":"studio_teach"
 *       },
 *       "chatStatus": 0,
 *       "sendMsgCount": 10
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
router.post("/updateChatUserGroupStatus", (req, res) => {
    if (common.isBlank(req.body["userInfo"])) {
        logger.warn("[updateChatUserGroupStatus] Parameters missed! Expecting parameters: ", "userInfo");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let requires = ["userId", "groupType", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if (!isSatify) {
        logger.warn("[updateChatUserGroupStatus] Parameters missed! Expecting parameters in 'userInfo': ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    userService.updateChatUserGroupStatus(
        req.body["userInfo"],
        req.body["chatStatus"],
        req.body["sendMsgCount"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {get} /user/checkUserLogin 通过userId及组别检测用户是否已经登录过
 * @apiName checkUserLogin
 * @apiGroup user
 *
 * @apiParam {String} userId  用户ID，必填
 * @apiParam {String} groupType  组别，必填 取userInfo.groupType值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/checkUserLogin
 * @apiExample Example usage:
 *  /api/user/checkUserLogin?userId=sxunppxunpxix&groupType=studio
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
router.get("/checkUserLogin", (req, res) => {
    let requires = ["userId", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("[checkUserLogin] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.checkUserLogin(
        req.query,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
// router.get("/getMemberByTel", (req, res) => {});

/**
 * @api {get} /user/getRoomCsUser 提取cs客服信息(单个)
 * @apiName getRoomCsUser
 * @apiGroup user
 *
 * @apiParam {String} roomId  房间ID，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getRoomCsUser
 * @apiExample Example usage:
 *  /api/user/getRoomCsUser?roomId=studio_teach
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
router.get("/getRoomCsUser", (req, res) => {
    if (common.isBlank(req.query["roomId"])) {
        logger.warn("[getRoomCsUser] Parameters missed! Expecting parameters: ", "roomId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getRoomCsUser(
        req.query["roomId"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /user/getRoomCsUserList 提取cs客服信息列表
 * @apiName getRoomCsUserList
 * @apiGroup user
 *
 * @apiParam {String} roomId  房间ID，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getRoomCsUserList
 * @apiExample Example usage:
 *  /api/user/getRoomCsUserList?roomId=studio_teach
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
router.get("/getRoomCsUserList", (req, res) => {
    if (common.isBlank(req.query["roomId"])) {
        logger.warn("[getRoomCsUserList] Parameters missed! Expecting parameters: ", "roomId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getRoomCsUserList(
        req.query["roomId"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /user/checkRoomStatus 检查房间是否在开放时间内，或可用
 * @apiName checkRoomStatus
 * @apiGroup user
 *
 * @apiParam {String} groupId  房间ID，必填
 * @apiParam {String} currCount  当前人数，必填
 * @apiParam {String} userId  用户ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/checkRoomStatus
 * @apiExample Example usage:
 *  /api/user/checkRoomStatus?groupId=studio_teach&currCount=100&userId=sxunppxunpxix
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
router.get("/checkRoomStatus", (req, res) => {
    let requires = ["groupId", "currCount"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("[checkRoomStatus] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.checkRoomStatus(
        req.query["userId"],
        req.query["groupId"],
        req.query["currCount"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {post} /user/modifyNickname 修改昵称
 * @apiName modifyNickname
 * @apiGroup user
 *
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} nickname 昵称，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/modifyNickname
 * @apiParamExample {json} Request-Example:
 *     {
 *        "mobilePhone":"13800138000",
 *        "groupType":"studio",
 *        "nickname":"test"
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
router.post("/modifyNickname", (req, res) => {
    let requires = ["mobilePhone", "groupType", "nickname"];
    let isSatify = requires.some((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[modifyNickname] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.modifyNickname(
        req.body["mobilePhone"],
        req.body["groupType"],
        req.body["nickname"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {post} /user/modifyAvatar 修改头像
 * @apiName modifyAvatar
 * @apiGroup user
 *
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} item 积分类别，必填
 * @apiParam {String} clientGroup 客户组别，必填 取userInfo.clientGroup值
 * @apiParam {String} userId 用户ID，必填 取userInfo.userId值
 * @apiParam {String} ip 客户IP，必填
 * @apiParam {String} avatar 头像路径，上传成功后的URL值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/modifyAvatar
 * @apiParamExample {json} Request-Example:
 *     {
 *        "mobilePhone":"13800138012",
 *        "groupType":"studio",
 *        "item":"register_avatar",
 *        "clientGroup":"notActive",
 *        "userId":"sxunppxunpxix",
 *        "ip":"172.30.5.150",
 *        "avatar":"http://192.168.35.91:8090/upload/pic/header/chat/front/201703/20170330145322_68288711.jpg"
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
router.post("/modifyAvatar", (req, res) => {
    let requires = ["mobilePhone", "groupType", "item", "clientGroup", "userId", "ip"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[modifyAvatar] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.modifyAvatar(
        req.body,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {get} /user/getTeacherList 获取房间分析师列表
 * @apiName getTeacherList
 * @apiGroup user
 *
 * @apiParam {String} groupId  房间ID，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getTeacherList
 * @apiExample Example usage:
 *  /api/user/getTeacherList?groupId=studio_teach
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
router.get("/getTeacherList", (req, res) => {
    if (common.isBlank(req.query["groupId"])) {
        logger.warn("[getTeacherList] Parameters missed! Expecting parameters: ", "groupId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getTeacherList(
        req.query,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {get} /user/getTeacherByUserId 根据分析师ID获取分析师二维码等信息
 * @apiName getTeacherByUserId
 * @apiGroup user
 *
 * @apiParam {String} userId  分析师ID，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getTeacherByUserId
 * @apiExample Example usage:
 *  /api/user/getTeacherByUserId?userId=leo
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
router.get("/getTeacherByUserId", (req, res) => {
    if (common.isBlank(req.query["userId"])) {
        logger.warn("[getTeacherByUserId] Parameters missed! Expecting parameters: ", "userId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.getTeacherByUserId(
        req.query["userId"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {post} /user/modifyUserName 修改用户名
 * @apiName modifyUserName
 * @apiGroup user
 *
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} clientGroup 客户组别，必填 取userInfo.clientGroup值
 * @apiParam {String} userId 用户ID，必填 取userInfo.userId值
 * @apiParam {String} userName 用户名，必填
 * @apiParam {String} ip 客户IP，必填
 * @apiParam {String} item 积分类别，对应mis后台配置的类别，目前未配置，留空
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/modifyUserName
 * @apiParamExample {json} Request-Example:
 *     {
 *        "userInfo":{
 *          "mobilePhone":"13800138012",
 *          "groupType":"studio",
 *          "clientGroup":"notActive",
 *          "userId":"sxunppxunpxix"
 *        },
 *        "params":{
 *          "item":"",
 *          "ip":"172.30.5.150",
 *          "userName":"beatp"
 *        }
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
router.post("/modifyUserName", (req, res) => {
    let requires = ["userInfo", "params"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[modifyUserName] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType", "clientGroup", "userId"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if (!isSatify) {
        logger.warn("[modifyUserName] Parameters missed! Expecting parameters: ", requires);
        logger.warn("Your 'userInfo' is: ", JSON.stringify(req.body["userInfo"]));
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["userName", "ip"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["params"][name]);
    });
    if (!isSatify) {
        logger.warn("[modifyUserName] Parameters missed! Expecting parameters: ", requires);
        logger.warn("Your 'params' is: ", JSON.stringify(req.body["params"]));
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.modifyUserName(
        req.body["userInfo"], req.body["params"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {post} /user/modifyEmail 修改邮箱
 * @apiName modifyEmail
 * @apiGroup user
 *
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} email 邮箱地址，必填
 * @apiParam {String} userId 用户ID，必填 取userInfo.userId值
 * @apiParam {String} item 积分类别，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/modifyEmail
 * @apiParamExample {json} Request-Example:
 *     {
 *          "groupType":"studio",
 *          "email":"test@gwtsz.net",
 *          "userId":"sxunppxunpxix",
 *          "item":"register_email"
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
router.post("/modifyEmail", (req, res) => {
    let requires = ["groupType", "email", "userId", "item"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[modifyEmail] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    userService.modifyEmail(
        req.body,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {post} /user/modifyPwd 修改密码
 * @apiName modifyPwd
 * @apiGroup user
 *
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} clientGroup 客户组别，必填 取userInfo.clientGroup值
 * @apiParam {String} userId 用户ID，必填 取userInfo.userId值
 * @apiParam {String} password 原密码，必填
 * @apiParam {String} newPwd 新密码，必填
 * @apiParam {String} item 积分类别，对应mis后台配置的类别，目前未配置，留空
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/modifyPwd
 * @apiParamExample {json} Request-Example:
 *     {
 *        "userInfo":{
 *          "mobilePhone":"13800138012",
 *          "groupType":"studio",
 *          "clientGroup":"notActive",
 *          "userId":"sxunppxunpxix"
 *        },
 *        "params":{
 *          "item":"",
 *          "password":"123456",
 *          "newPwd":"654321"
 *        }
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
router.post("/modifyPwd", (req, res) => {
    let requires = ["userInfo", "params"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[modifyPwd] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType", "clientGroup", "userId"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if (!isSatify) {
        logger.warn("[modifyPwd] Parameters missed! Expecting parameters in req.body[\"userInfo\"]: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["password", "newPwd"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["params"][name]);
    });
    if (!isSatify) {
        logger.warn("[modifyPwd] Parameters missed! Expecting parameters in req.body[\"params\"]: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    userService.modifyPwd(
        req.body["userInfo"], req.body["params"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /user/getClientGroupByMId 完善资料积分变化
 * @apiName getClientGroupByMId
 * @apiGroup user
 *
 * @apiParam {String} mobileArr  ,隔开的手机号码串，必填
 * @apiParam {String} groupType  组别，必填 取userInfo.groupType值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getClientGroupByMId
 * @apiExample Example usage:
 *  /api/user/getClientGroupByMId?mobileArr=13800138000,13800138001&groupType=studio
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
router.get("/getClientGroupByMId", (req, res) => {
    let requires = ["mobileArr", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("[getClientGroupByMId] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    userService.getClientGroupByMId(
        req.query["mobileArr"].split(","), req.query["groupType"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {get} /user/getAnalystList 获取分析师列表
 * @apiName getAnalystList
 * @apiGroup user
 *
 * @apiParam {String} systemCategory  所属事业部，必填（pm/fx/hx/cf/ix）
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/user/getAnalystList
 * @apiExample Example usage:
 *  /api/user/getAnalystList?systemCategory=pm
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
router.get("/getAnalystList", (req, res) => {
    let systemCategory = req.query["systemCategory"];
    if (common.isBlank(systemCategory)) {
        logger.warn("[getAnalystList] Parameters missed! Expecting parameters: ", "systemCategory");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    userService.getAnalystList(systemCategory, (data) => {
        res.json(APIUtil.APIResult(null, data));
    });
});

module.exports = router;