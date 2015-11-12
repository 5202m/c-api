/**
 * 摘要：短信API处理类
 * author:Gavin.guo
 * date:2015/7/14
 */
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var SmsService = require('../../service/smsService.js');
var APIUtil = require('../../util/APIUtil.js');

/**
 * 发送短信
 */
router.post('/send', function(req, res) {
    var loc_smsParam = {
        type : req.body["type"],               //类型 "AUTH_CODE"、"NORMAL"，当短信内容为空时type为"AUTH_CODE"。默认值为"NORMAL"
        useType : req.body["useType"],         //应用点（参考后台数据字典）
        mobilePhone : req.body["mobilePhone"], //手机号、必输
        deviceKey : req.body["deviceKey"],     //设备key值，用于检查发送次数。如果是web页面使用IP，手机客户端使用MAC地址，不传则仅使用手机号作为key值
        content : req.body["content"]          //短信内容，如果内容为空，则默认发送六位数字验证码
    };

    if(common.isBlank(loc_smsParam.mobilePhone) || !common.isMobilePhone(loc_smsParam.mobilePhone) || common.isBlank(loc_smsParam.useType)){
        res.json(APIUtil.APIResult("code_1000", null, null));
        return;
    }
    //内容为空，发送默认六位数验证码
    if(common.isBlank(loc_smsParam.content)){
        loc_smsParam.type = "AUTH_CODE";
        loc_smsParam.content = common.randomNumber(6);
    }
    //类型为空，默认值为NORMAL
    if(common.isBlank(loc_smsParam.type)){
        loc_smsParam.type = "NORMAL";
    }
    if(common.isBlank(loc_smsParam.deviceKey)){
        loc_smsParam.deviceKey = "";
    }

    //发送短信
    SmsService.send(loc_smsParam, true, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 校验验证码
 */
router.post('/checkAuth', function(req, res) {
    var loc_mobilePhone = req.body["mobilePhone"];
    var loc_authCode = req.body["authCode"];
    var loc_useType = req.body["useType"];
    if(common.isBlank(loc_mobilePhone) || common.isBlank(loc_authCode) || common.isBlank(loc_authCode)){
        res.json(APIUtil.APIResult("code_1000", null, null));
        return;
    }

    //重发短信
    SmsService.checkAuth(loc_mobilePhone, loc_authCode, loc_useType, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 重发短信（不检查短信限制，用于后台客服人员重发短信）
 */
router.post('/resend', function(req, res) {
    var loc_smsId = req.body["smsId"];
    if(common.isBlank(loc_smsId)){
        res.json(APIUtil.APIResult("code_1000", null, null));
        return;
    }

    //重发短信
    SmsService.resend(loc_smsId, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;
