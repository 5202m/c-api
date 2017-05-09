/**
 * 摘要：短信API处理类
 * author:Gavin.guo
 * date:2015/7/14
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
var SmsService = require('../../service/smsService.js');
var APIUtil = require('../../util/APIUtil.js');

/**
 * @api {post} /sms/send 发送短信
 * @apiName send
 * @apiGroup sms
 *
 * @apiParam {String} useType 应用点（参考后台数据字典），必填
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} type 类型 "AUTH_CODE"、"NORMAL"，当短信内容为空时type为"AUTH_CODE"。默认值为"NORMAL"
 * @apiParam {String} deviceKey 设备key值，用于检查发送次数。如果是web页面使用IP，手机客户端使用MAC地址，不传则仅使用手机号作为key值
 * @apiParam {String} content 短信内容，如果内容为空，则默认发送六位数字验证码
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/sms/send
 * @apiParamExample {json} Request-Example:
 *     {
 *       "useType": "studio_reg",
 *       "mobilePhone": "13800138000",
 *       "type": "AUTH_CODE",
 *       "deviceKey": "172.30.5.150",
 *       "content": ""
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
router.post('/send', function(req, res) {
    var loc_smsParam = {
        type: req.body["type"], //类型 "AUTH_CODE"、"NORMAL"，当短信内容为空时type为"AUTH_CODE"。默认值为"NORMAL"
        useType: req.body["useType"], //应用点（参考后台数据字典）
        mobilePhone: req.body["mobilePhone"], //手机号、必输
        deviceKey: req.body["deviceKey"], //设备key值，用于检查发送次数。如果是web页面使用IP，手机客户端使用MAC地址，不传则仅使用手机号作为key值
        content: req.body["content"] //短信内容，如果内容为空，则默认发送六位数字验证码
    };

    if (common.isBlank(loc_smsParam.mobilePhone) || !common.isMobilePhone(loc_smsParam.mobilePhone) || common.isBlank(loc_smsParam.useType)) {
        res.json(APIUtil.APIResult("code_1000", null, null));
        return;
    }
    //内容为空，发送默认六位数验证码
    if (common.isBlank(loc_smsParam.content)) {
        loc_smsParam.type = "AUTH_CODE";
        loc_smsParam.content = common.randomNumber(6);
    }
    //类型为空，默认值为NORMAL
    if (common.isBlank(loc_smsParam.type)) {
        loc_smsParam.type = "NORMAL";
    }
    if (common.isBlank(loc_smsParam.deviceKey)) {
        loc_smsParam.deviceKey = "";
    }
    common.wrapSystemCategory(loc_smsParam, req.body.systemCategory);
    //发送短信
    SmsService.send(loc_smsParam, true, function(apiResult) {
        res.json(apiResult);
    });
});

/**
 * @api {post} /sms/checkAuth 校验验证码
 * @apiName checkAuth
 * @apiGroup sms
 *
 * @apiParam {String} useType 应用点（参考后台数据字典），必填
 * @apiParam {String} mobilePhone 手机号，必填
 * @apiParam {String} authCode 验证码，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/sms/checkAuth
 * @apiParamExample {json} Request-Example:
 *     {
 *       "useType": "studio_reg",
 *       "mobilePhone": "13800138000",
 *       "authCode": "123658"
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
router.post('/checkAuth', function(req, res) {
    var loc_mobilePhone = req.body["mobilePhone"];
    var loc_authCode = req.body["authCode"];
    var loc_useType = req.body["useType"];
    if (common.isBlank(loc_mobilePhone) || common.isBlank(loc_authCode) || common.isBlank(loc_useType)) {
        res.json(APIUtil.APIResult("code_1000", null, null));
        return;
    }

    //重发短信
    SmsService.checkAuth(req.body, function(apiResult) {
        res.json(apiResult);
    });
});

/**
 * @api {post} /sms/resend 重发短信（不检查短信限制，用于后台客服人员重发短信）
 * @apiName resend
 * @apiGroup sms
 *
 * @apiParam {String} smsId 已发送短信记录ID，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/sms/resend
 * @apiParamExample {json} Request-Example:
 *     {
 *       "smsId": "563862cb436e08a016b47b1c"
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
router.post('/resend', function(req, res) {
    var loc_smsId = req.body["smsId"];
    if (common.isBlank(loc_smsId)) {
        res.json(APIUtil.APIResult("code_1000", null, null));
        return;
    }

    //重发短信
    SmsService.resend(req.body, function(apiResult) {
        res.json(apiResult);
    });
});

module.exports = router;