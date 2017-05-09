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
let express = require('express');
let router = express.Router();
let common = require('../../util/common');
let clientTrainService = require('../../service/clientTrainService');
let APIUtil = require('../../util/APIUtil.js');

/**
 * @api {post} /clientTrain/saveTrain 培训班报名，未使用
 * @apiName saveTrain
 * @apiGroup clientTrain
 *
 * @apiParam {String} groupId 房间ID，必填
 * @apiParam {String} userId 用户ID，必填
 * @apiParam {String} nickname 用户昵称，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/clientTrain/saveTrain
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupId": "studio_57",
 *       "userId": "sxunppxunpxix",
 *       "nickname": "beatp"
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
router.post("/saveTrain", (req, res) => { //groupId,userId,nickname
    let requires = ["groupId", "userId", "nickname"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let service = common.getCompanyOnlyService(req.body.companyId);
    service = service || clientTrainService;
    service.saveTrain(req.body)
        .then(data => {
            res.json(APIUtil.APIResultFromData(data));
        }).catch(e => {
            res.json(APIUtil.APIResultFromData(e));
        });
});
/**
 * @api {post} /clientTrain/addClientTrain 客户学员报名
 * @apiName addClientTrain
 * @apiGroup clientTrain
 *
 * @apiParam {String} groupId 房间ID，必填
 * @apiParam {String} userId 用户ID，必填
 * @apiParam {String} nickname 用户昵称，必填
 * @apiParam {String} clientGroup 客户组别，必填 vip/active/notActive/real/simulate/register/visitor
 * @apiParam {Boolean} noApprove 是否需要审批 true/false
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/clientTrain/addClientTrain
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupId": "studio_57",
 *       "userId": "sxunppxunpxix",
 *       "nickname": "beatp",
 *       "clientGroup": "notActive",
 *       "noApprove": false
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
router.post("/addClientTrain", (req, res) => {
    let requires = ["groupId", "userId", "nickname", "clientGroup"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    let service = common.getCompanyOnlyService(req.body.companyId);
    service = service || clientTrainService;
    let trainParams = {
        groupId: req.body["groupId"],
        nickname: req.body["nickname"],
        noApprove: req.body['noApprove']
    };
    common.wrapSystemCategory(trainParams, req.body.systemCategory);
    service.addClientTrain(trainParams, {
            userId: req.body["userId"],
            clientGroup: req.body["clientGroup"]
        })
        .then(data => {
            res.json(APIUtil.APIResult(null, data));
        }).catch(errData => {
            res.json(APIUtil.APIResult(null, errData));
        });
});
/**
 * @api {get} /clientTrain/getTrainAndClientNum 提取培训班数及人数
 * @apiName getTrainAndClientNum
 * @apiGroup clientTrain
 *
 * @apiParam {String} groupType 组别，必填，直播间groupType值
 * @apiParam {String} teachId 老师ID，必填.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/clientTrain/getTrainAndClientNum
 * @apiExample Example usage:
 *  /api/clientTrain/getTrainAndClientNum?groupType=studio&teachId=tracey_jiang
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
router.get("/getTrainAndClientNum", (req, res) => {
    let requires = ["groupType", "teachId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    clientTrainService.getTrainAndClientNum(
        req.query,
        data => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
/**
 * @api {get} /clientTrain/getTrainList 获取培训班列表
 * @apiName getTrainList
 * @apiGroup clientTrain
 *
 * @apiParam {String} groupType 组别，必填，直播间groupType值
 * @apiParam {String} teachId 老师ID.
 * @apiParam {Boolean} isAll 是否全部
 * @apiParam {String} userId 用户ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/clientTrain/getTrainList
 * @apiExample Example usage:
 *  /api/clientTrain/getTrainList?groupType=studio&teachId=tracey_jiang&isAll=&userId=
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
router.get("/getTrainList", (req, res) => {
    if (common.isBlank(req.query["groupType"])) {
        logger.warn("Parameters missed! Expecting parameter: ", "groupType");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    let service = common.getCompanyOnlyService(req.query.companyId);
    service = service || clientTrainService;
    let params = {
        groupType: req.query["groupType"],
        teachId: req.query["teachId"],
        isAll: req.query["isAll"] ? req.query["isAll"] : false,
        userId: req.query['userId']
    };
    service.getTrainList(params)
        .then(data => {
            res.json(APIUtil.APIResultFromData(data));
        }).catch(e => {
            res.json(APIUtil.APIResultFromData(null));
        });
});
/**
 * @api {post} /clientTrain/addSignin 添加签到
 * @apiName addSignin
 * @apiGroup clientTrain
 *
 * @apiParam {String} groupType 组别，必填，直播间groupType值
 * @apiParam {String} mobilePhone 手机号.
 * @apiParam {Boolean} clientip 客户ip
 * @apiParam {String} clientGroup 客户组 vip/active/notActive/real/simulate/register/visitor
 * @apiParam {String} avatar 用户头像
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/clientTrain/addSignin
 * @apiExample Example usage:
 *  /api/clientTrain/addSignin
 * @apiParamExample {json} Request-Example:
 *     {
 *       "mobilePhone": "13800138000",
 *       "groupType": "studio",
 *       "avatar": "http://xx.xx.xx/xx.jpg",
 *       "clientip": "192.168.35.91",
 *       "clientGroup": "notActive"
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
router.post("/addSignin", (req, res) => {
    let requires = ["mobilePhone", "groupType", "clientip", "clientGroup"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    clientTrainService.addSignin(
        req.body,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {get} /clientTrain/getSignin 获取签到数据
 * @apiName getSignin
 * @apiGroup clientTrain
 *
 * @apiParam {String} groupType 组别，必填，直播间groupType值.
 * @apiParam {String} mobilePhone 手机号.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/clientTrain/getSignin
 * @apiExample Example usage:
 *  /api/clientTrain/getSignin?groupType=studio&mobilePhone=13800138000
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
router.get("/getSignin", (req, res) => {
    let requires = ["mobilePhone", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    let service = common.getCompanyOnlyService(req.query.companyId);
    service = service || clientTrainService;
    let params = {
        mobilePhone: req.query["mobilePhone"],
        groupType: req.query["groupType"]
    };
    common.wrapSystemCategory(params, req.query.systemCategory);
    service.getSignin(params).then(data => {
        res.json(APIUtil.APIResultFromData(data));
    }).catch(errData => {
        res.json(APIUtil.APIResultFromData(errData));
    });
});
/**
 * @api {post} /clientTrain/checkTodaySignin 查询客户当天是否签到
 * @apiName checkTodaySignin
 * @apiGroup clientTrain
 *
 * @apiParam {String} groupType 组别，必填，直播间groupType值.
 * @apiParam {String} mobilePhone 手机号.
 * @apiParam {Boolean} clientip 客户ip
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/clientTrain/checkTodaySignin
 * @apiExample Example usage:
 *  /api/clientTrain/checkTodaySignin
 * @apiParamExample {json} Request-Example:
 *     {
 *       "mobilePhone": "13800138000",
 *       "groupType": "studio",
 *       "clientip": "192.168.35.91",
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
router.post('/checkTodaySignin', (req, res) => {
    let requires = ["mobilePhone", "groupType", "clientip"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    clientTrainService.checkTodaySignin(req.body,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;