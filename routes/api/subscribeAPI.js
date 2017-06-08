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
var SubscribeService = require('../../service/subscribeService');
var APIUtil = require('../../util/APIUtil.js');

/**
 * @api {get} /subscribe/notice 发送订阅通知——文章发布（喊单策略、交易策略）
 * @apiName notice
 * @apiGroup subscribe
 *
 * @apiParam {String} type 类型 "ARTICLE"-文档（喊单策略、交易策略、日常行情、大行情、每日周评、金道周评）
 * @apiParam {String} dataId 数据编号，必填.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/subscribe/notice
 * @apiExample Example usage:
 *  /api/subscribe/notice?type=ARTICLE&dataId=10000756
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
router.post('/notice', function(req, res) {
    var loc_param = {
        type: req.body["type"], //类型 "ARTICLE"-文档（喊单策略、交易策略、日常行情、大行情、每日周评、金道周评）
        dataId: req.body["dataId"] //数据编号
    };

    if (common.isBlank(loc_param.dataId)) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    switch (loc_param.type) {
        case "ARTICLE":
            SubscribeService.noticeArticle(loc_param.dataId, function(isOK) {
                res.json(APIUtil.APIResult(null, isOK));
            });
            break;

        default:
            res.json(APIUtil.APIResult("code_2003", null));
    }
});

/**
 * @api {get} /subscribe/getSubscribeList 查询已订阅数据
 * @apiName getSubscribeList
 * @apiGroup subscribe
 *
 * @apiParam {String} groupType 组别，必填. 取直播间groupType值
 * @apiParam {String} userId 用户ID，必填.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/subscribe/getSubscribeList
 * @apiExample Example usage:
 *  /api/subscribe/getSubscribeList?groupType=studio&userId=13800138075
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
router.get('/getSubscribeList', function(req, res) {
    var params = {
        groupType: req.query["groupType"],
        userId: req.query["userId"]
    };
    if (common.isBlank(params.userId) ||
        common.isBlank(params.groupType)) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.getSubscribeList(params, (data) => {
        res.json(APIUtil.APIResultFromData(data));
    });
});
/**
 * @api {post} /subscribe/saveSubscribe 保存订阅服务
 * @apiName saveSubscribe
 * @apiGroup subscribe
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} clientGroup 客户组别，必填 取直播间userInfo里的clientGroup值
 * @apiParam {String} userId 用户ID，必填
 * @apiParam {String} type 订阅服务类型，必填
 * @apiParam {String} analyst 分析师，必填
 * @apiParam {String} noticeType 订阅方式，必填 email/sms
 * @apiParam {Date} startDate 订阅开始日期
 * @apiParam {Date} endDate 订阅结束日期
 * @apiParam {Number} point 消费积分
 * @apiParam {String} userName 操作人
 * @apiParam {String} orip 操作IP
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/subscribe/saveSubscribe
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupType": "studio",
 *       "clientGroup": "notActive",
 *       "userId": "13800138012",
 *       "type": "daily_quotation",
 *       "analyst": "leo",
 *       "noticeType": "email",
 *       "startDate": "2016-08-30",
 *       "endDate": "2016-09-06",
 *       "point": 100,
 *       "userName": "eva.gai",
 *       "opIp": "127.0.0.1"
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
router.post('/saveSubscribe', function(req, res) {
    var params = {
        groupType: req.body["groupType"],
        type: req.body["type"],
        clientGroup: req.body["clientGroup"],
        userId: req.body["userId"],
        analyst: req.body["analyst"],
        noticeType: req.body["noticeType"],
        startDate: req.body["startDate"],
        endDate: req.body["endDate"],
        point: req.body["point"],
        userName: req.body["userName"],
        Ip: req.body["orip"]
    };
    var requires = ["groupType", "type", "userId", "analyst", "noticeType"];
    var isNotSatify = requires.every((name) => {
        return common.isBlank(params[name]);
    });
    if (isNotSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.saveSubscribe(params, (data) => {
        res.json(APIUtil.APIResult(null, data));
    });
});
/**
 * @api {post} /subscribe/modifySubscribe 修改订阅服务
 * @apiName modifySubscribe
 * @apiGroup subscribe
 *
 * @apiParam {String} id 订阅ID
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} clientGroup 客户组别，必填 取直播间userInfo里的clientGroup值
 * @apiParam {String} userId 用户ID，必填
 * @apiParam {String} analyst 分析师
 * @apiParam {String} noticeType 订阅方式，email/sms
 * @apiParam {String} noticeCycle 订阅周期，week/month/year
 * @apiParam {Number} point 消费积分
 * @apiParam {String} pointsRemark 积分说明
 * @apiParam {String} userName 操作人
 * @apiParam {String} Ip 操作IP
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/subscribe/modifySubscribe
 * @apiParamExample {json} Request-Example:
 *     {
 *       "id": "58115d9790fdfa3a0e518f82",
 *       "groupType": "studio",
 *       "clientGroup": "notActive",
 *       "userId": "13800138012",
 *       "analyst": "leo",
 *       "noticeType": "email",
 *       "noticeCycle": "month",
 *       "point": 100,
 *       "pointsRemark": "修改订阅xxxx",
 *       "userName": "eva.gai",
 *       "opIp": "127.0.0.1"
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
router.post('/modifySubscribe', function(req, res) {
    var params = {
        userName: req.body["userName"],
        Ip: req.body["Ip"],
        pointsRemark: req.body["pointsRemark"],
        userId: req.body["userId"],
        groupType: req.body["groupType"],
        noticeType: req.body["noticeType"],
        clientGroup: req.body["clientGroup"],
        analyst: req.body["analyst"],
        point: req.body["point"],
        noticeCycle: req.body["noticeCycle"],
        id: req.body["id"]
    };
    var requires = ["groupType", "id", "userId", "analyst", "noticeType"];
    var isNotSatify = requires.every((name) => {
        return common.isBlank(params[name]);
    });
    if (isNotSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.modifySubscribe(params, (data) => {
        res.json(APIUtil.APIResult(null, data));
    });
});
/**
 * @api {post} /subscribe/saveSubscribe4UTM 保存订阅至UTM系统
 * @apiName saveSubscribe4UTM
 * @apiGroup subscribe
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} userId 用户ID，必填
 * @apiParam {String} subscribeType 订阅方式，email/sms
 * @apiParam {String} isAdd 是否添加，add/remove
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/subscribe/saveSubscribe4UTM
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupType": "studio",
 *       "userId": "13800138012",
 *       "subscribeType": "email",
 *       "isAdd": "add"
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
router.post('/saveSubscribe4UTM', function(req, res) {
    //groupType, userId, subscribeType, isAdd
    var params = {
        userId: req.body["userId"],
        groupType: req.body["groupType"],
        subscribeType: req.body["subscribeType"],
        isAdd: req.body["isAdd"]
    };
    var isNotSatify = ["userId", "groupType", "subscribeType"].every((name) => {
        return common.isBlank(params[name]);
    });
    if (isNotSatify) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.saveSubscribe4UTM(params.groupType, params.userId, params.subscribeType, params.isAdd, (data) => {
        res.json(APIUtil.APIResult(null, data));
    });

});
/**
 * @api {get} /subscribe/getSubscribeTypeList 查询可订阅类型数据
 * @apiName getSubscribeTypeList
 * @apiGroup subscribe
 *
 * @apiParam {String} groupType 组别，必填. 取直播间groupType值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/subscribe/getSubscribeTypeList
 * @apiExample Example usage:
 *  /api/subscribe/getSubscribeTypeList?groupType=studio
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
router.get('/getSubscribeTypeList', function(req, res) {
    var params = {
        groupType: req.query["groupType"]
    };
    if (common.isBlank(params.groupType)) {
        res.json(APIUtil.APIResult("code_1000", null));
    }
    SubscribeService.getSubscribeTypeList(params, (data) => {
        res.json(APIUtil.APIResult(null, data));
    });

});

/**
 * @api {get} /subscribe/getSubscribeNum 查询分析师的总订阅数量
 * @apiName getSubscribeNum
 * @apiGroup subscribe
 *
 * @apiParam {String} groupType 直播间groupType值
 * @apiParam {String} analystId 直播间分析师ID
 * @apiParam {String} [subscribeTypes] 订阅类型，允许传入用逗号分隔的多个类型，也可以不传。不传就统计所有订阅类型。
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/subscribe/getSubscribeNum
 * @apiExample Example usage:
 *  /api/subscribe/getSubscribeNum?groupType=hxstudio&analystId=fox
 * or 
 *  /api/subscribe/getSubscribeNum?groupType=hxstudio&analystId=fox&subscribeTypes=daily_quotation,live_reminder
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
router.get('/getSubscribeNum', function(req, res) {
    let requires = ["groupType", "analystId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("[getSubscribeNum] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.getSubscribeNum(req.query).then(data => {
        res.json(APIUtil.APIResult(null, data));
    }).catch(e => {
        res.json(APIUtil.APIResult(e, null));
    });

});


module.exports = router;