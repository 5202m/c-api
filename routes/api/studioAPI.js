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
let logger = require("../../resources/logConf").getLogger("studioAPI");
let express = require('express');
let router = express.Router();
let studioService = require('../../service/studioService');
let common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

/**
 * @api {get} /studio/getIndexLoadData 提取主页需要加载的数据
 * @apiName getIndexLoadData
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填.
 * @apiParam {Boolean} isGetRoomList 是否加载房间
 * @apiParam {Boolean} isGetSyllabus 是否加载课程表数据
 * @apiParam {Boolean} isGetMember 是否加载客户信息
 * @apiParam {String} userId 用户ID
 * @apiParam {String} groupId 房间ID，取userInfo.groupId值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/getIndexLoadData
 * @apiExample Example usage:
 *  /api/studio/getIndexLoadData?groupType=studio&isGetRoomList=true&isGetSyllabus=true&isGetMember=true&userId=sxunppxunpxix&groupId=studio_teach
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
router.get("/getIndexLoadData", (req, res) => {
    let requires = ["groupType"]; //, "groupId"
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let isGetRoomList = req.query["isGetRoomList"] || false,
        isGetSyllabus = req.query["isGetSyllabus"] || true,
        isGetMember = req.query["isGetMember"] || false;

    let params = {
        userId: req.query["userId"],
        groupType: req.query["groupType"],
        groupId: req.query["groupId"],
        isGetRoomList: isGetRoomList === "true",
        isGetSyllabus: isGetSyllabus === "true",
        isGetMember: isGetMember === "true"
    };

    studioService.getIndexLoadData(
        params,
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
/**
 * @api {get} /studio/getRoomList 获取房间列表
 * @apiName getRoomList
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填. 取直播间groupType值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/getRoomList
 * @apiExample Example usage:
 *  /api/studio/getRoomList?groupType=studio
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
router.get("/getRoomList", (req, res) => {
    if (common.isBlank(req.query["groupType"])) {
        logger.warn("Parameters missed! Expecting parameters: ", "groupType");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    studioService.getRoomList(
        req.query["groupType"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
/**
 * @api {get} /studio/getClientGroupList 获取客户组列表
 * @apiName getClientGroupList
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填. 取直播间groupType值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/getClientGroupList
 * @apiExample Example usage:
 *  /api/studio/getClientGroupList?groupType=studio
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
router.get("/getClientGroupList", (req, res) => {
    if (common.isBlank(req.query["groupType"])) {
        logger.warn("Parameters missed! Expecting parameters: ", "groupType");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    studioService.getClientGroupList(
        req.query["groupType"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
/**
 * @api {post} /studio/resetPwd 修改登录密码
 * @apiName resetPwd
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} mobilePhone 用户手机号，必填
 * @apiParam {String} newPwd 新密码，必填
 * @apiParam {String} oldPwd 旧密码，已经设置过密码的为必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/resetPwd
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupType": "studio",
 *       "mobilePhone": "13800138012",
 *       "newPwd": "123456",
 *       "oldPwd": ""
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
router.post("/resetPwd", (req, res) => {
    //groupType,mobilePhone,newPwd
    let requires = ["groupType", "mobilePhone", "newPwd"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.resetPwd(
        req.body["groupType"],
        req.body["mobilePhone"],
        req.body["newPwd"],
        req.body["oldPwd"] || "",
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {get} /studio/getStudioByGroupId 提取直播间
 * @apiName getStudioByGroupId
 * @apiGroup studio
 *
 * @apiParam {String} groupId 房间ID，必填 取直播间groupId值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/getStudioByGroupId?groupId=studio_teach
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
router.get("/getStudioByGroupId", (req, res) => {
    if (common.isBlank(req.query["groupId"])) {
        logger.warn("Parameters missed! Expecting parameters: ", "groupId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    studioService.getStudioByGroupId(
        req.query["groupId"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
/**
 * @api {get} /studio/checkGroupAuth 检查用户组权限
 * @apiName checkGroupAuth
 * @apiGroup studio
 *
 * @apiParam {String} groupId 房间ID，必填 取直播间groupId值
 * @apiParam {String} roomType 房间类型 simple：新手场 normal：普通场 vip：VIP场 train：培训班
 * @apiParam {String} clientGroup 客户组别 取直播间userInfo里的clientGroup值
 * @apiParam {String} userId 用户ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/checkGroupAuth?groupId=studio_teach&roomType=normal&clientGroup=notActive&userId=sxunppxunpxix
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
router.get("/checkGroupAuth", (req, res) => {
    let requires = ["groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let service = common.getCompanyOnlyService(req.query.companyId);
    service = service || studioService;
    service.checkGroupAuth({
        roomType: req.query["roomType"],
        groupId: req.query["groupId"],
        clientGroup: req.query["clientGroup"],
        userId: req.query["userId"]
    }).then((data, err) => {
        res.json(APIUtil.APIResult(err, data));
    }).catch((data, err) => {
        res.json(APIUtil.APIResult(err, data));
    });
});
/**
 * @api {get} /studio/getDefaultRoom 获取默认房间
 * @apiName getDefaultRoom
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} clientGroup 客户组别，必填 取直播间userInfo里的clientGroup值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/getDefaultRoom?groupType=studio&clientGroup=notActive
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
router.get("/getDefaultRoom", (req, res) => {
    let requires = ["groupType", "clientGroup"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.getDefaultRoom(
        req.query["groupType"],
        req.query["clientGroup"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {post} /studio/studioRegister 注册直播间
 * @apiName studioRegister
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} clientGroup 客户组别，必填 取userInfo.clientGroup值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/studioRegister
 * @apiParamExample {json} Request-Example:
 *     {
 *       "clientGroup":"register",
 *       "userInfo": {
 *          "groupType": "studio",
 *          "mobilePhone" : "13800138000"
 *       }
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
router.post("/studioRegister", (req, res) => {
    let requires = ["userInfo", "clientGroup"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed in 'userInfo'! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.studioRegister(
        req.body["userInfo"],
        req.body["clientGroup"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {post} /studio/checkMemberAndSave 检查客户信息是否存在
 * @apiName checkMemberAndSave
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取userInfo.groupType值
 * @apiParam {String} mobilePhone 手机号
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/checkMemberAndSave
 * @apiParamExample {json} Request-Example:
 *     {
 *       "userInfo": {
 *          "groupType": "studio",
 *          "mobilePhone" : "13800138000"
 *       }
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
router.post("/checkMemberAndSave", (req, res) => {
    if (!req.body["userInfo"]) {
        logger.warn("Parameters missed! Expecting parameters: ", "userInfo");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let requires = ["mobilePhone", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let userInfo = req.body["userInfo"];
    studioService.checkMemberAndSave(
        userInfo,
        (data) => {
            if (data) {
                data.userInfo = userInfo;
            }
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
/**
 * @api {get} /studio/checkNickName 判断昵称唯一
 * @apiName checkNickName
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} nickname 昵称，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Boolean} data  返回的数据
 *
 * @apiSampleRequest /api/studio/checkNickName?groupType=studio&mobilePhone=13800138012&nickname=test
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
router.get("/checkNickName", (req, res) => {
    if (common.isBlank(req.query["groupType"])) {
        logger.warn("Parameters missed! Expecting parameters: ", "groupType");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.checkNickName(
        req.query,
        (err, isExist) => {
            res.json(APIUtil.APIResult(null, { isExist: isExist }));
        }
    );
});
/**
 * @api {post} /studio/login 登录直播间
 * @apiName login
 * @apiGroup studio
 *
 * @apiParam {Object} userInfo 登录信息对象，包含手机号/密码等
 * @apiParam {Number} type 登录方式 1 , 2 , 3 , 4
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/login
 * @apiParamExample {json} Request-Example:
 *     {
 *       "type": 1,
 *       "userInfo": {
 *          mobilePhone:"13800138000",
 *          groupType:"studio"
 *       }
 *     }
 *     {
 *       "type": 2,
 *       "userInfo": {
 *          userId:"",//取直播间userInfo里的userId
 *          groupType:"studio"
 *       }
 *     }
 *     {
 *       "type": 3,
 *       "userInfo": {
 *          thirdId:"",//第三方ID，例如微信打开直播间链接
 *          groupType:"studio"
 *       }
 *     }
 *     {
 *       "type": 4,
 *       "userInfo": {
 *          mobilePhone:"13800138000",
 *          password:"123456",
 *          groupType:"studio"
 *       }
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
router.post("/login", (req, res) => {
    let requires = ["userInfo", "type"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    switch (req.body["type"]) {
        case 1:
            requires = ["mobilePhone", "groupType"];
            break;
        case 2:
            requires = ["userId", "groupType"];
            break;
        case 3:
            requires = ["thirdId", "groupType"];
            break;
        case 4:
            requires = ["mobilePhone", "password", "groupType"];
            break;
        default:
            {
                logger.warn("Unexpecting parameter value of 'type': ", req.body["type"]);
                res.json(APIUtil.APIResult("code_1000", null));
                return;
            }
    };
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed in 'userInfo'! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.login(
        req.body["userInfo"],
        req.body["type"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {post} /studio/updateClientGroup 升级客户组别
 * @apiName updateClientGroup
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} newClientGroup 新客户组，必填
 * @apiParam {String} accountNo 交易账号
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/updateClientGroup
 * @apiParamExample {json} Request-Example:
 *     {
 *        groupType: "studio",
 *        mobilePhone:"13800138000",
 *        newClientGroup:"vip",
 *        accountNo:""//交易账号
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
router.post("/updateClientGroup", (req, res) => {
    let requires = ["groupType", "mobilePhone", "newClientGroup", "accountNo"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.updateClientGroup(
        req.body["groupType"],
        req.body["mobilePhone"],
        req.body["newClientGroup"],
        req.body["accountNo"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {post} /studio/setUserGroupThemeStyle 用户设置默认皮肤
 * @apiName setUserGroupThemeStyle
 * @apiGroup studio
 *
 * @apiParam {Object} userInfo 用户信息对象，包含手机号/直播间组别
 * @apiParam {Number} defTemplate 默认皮肤
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/studio/setUserGroupThemeStyle
 * @apiParamExample {json} Request-Example:
 *     {
 *       "defTemplate": "{\"theme\":\"theme1\",\"style\":\"pm_def\"}",
 *       "userInfo": {
 *          mobilePhone:"13800138000",
 *          groupType:"studio"
 *       }
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
router.post("/setUserGroupThemeStyle", (req, res) => {
    let requires = ["userInfo", "defTemplate"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed in 'userInfo'! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.setUserGroupThemeStyle(
        req.body["userInfo"],
        req.body["defTemplate"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {get} /studio/getTrainRoomList 获取培训班列表
 * @apiName getTrainRoomList
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Boolean} data  返回的数据
 *
 * @apiSampleRequest /api/studio/getTrainRoomList?groupType=studio
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
router.get("/getTrainRoomList", (req, res) => {
    if (common.isBlank(req.query["groupType"])) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    studioService.getTrainRoomList(
        req.query["groupType"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
/**
 * @api {get} /studio/getUserInfoByUserNo 根据用户编号获取用户信息
 * @apiName getUserInfoByUserNo
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} userNo 用户编号
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Boolean} data  返回的数据
 *
 * @apiSampleRequest /api/studio/getUserInfoByUserNo?groupType=studio&userNo=hxbj
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
    let requires = ["groupType", "userNo"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.getUserInfoByUserNo(
        req.query["groupType"],
        req.query["userNo"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {get} /studio/getShowTeacher 获取老师信息
 * @apiName getShowTeacher
 * @apiGroup studio
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} authorId 老师ID，必填
 * @apiParam {String} groupId 房间Id，必填 取直播间userInfo.groupId值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Boolean} data  返回的数据
 *
 * @apiSampleRequest /api/studio/getShowTeacher?groupType=studio&authorId=tonylee&groupId=studio_teach
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
router.get("/getShowTeacher", (req, res) => {
    let requires = ["authorId", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.getShowTeacher({
            groupType: req.query["groupType"],
            groupId: req.query["groupId"],
            authorId: req.query["authorId"] || ""
        },
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;