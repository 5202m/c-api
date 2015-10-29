/**
 * 摘要：短信API处理类
 * author:Gavin.guo
 * date:2015/7/14
 */
var express = require('express');
var router = express.Router();
var request = require('request');
var errorMessage = require('../../util/errorMessage');
var common = require('../../util/common');
var config = require('../../resources/config');
var SmsService = require('../../service/smsService.js');

/**
 * 发送短信
 */
router.get('/send', function(req, res) {
	var mobile = req.query["mobile"];
	var useType = req.query["useType"];
	if(common.isBlank(mobile)){
		res.json(errorMessage.code_1000);
        return;
	}
	var smsUrl = config.smsUrl;
	var content = req.query["content"];
    var loc_smsInfo = {
        mobilePhone : mobile,
        status : 0,
        content : content,
        useType : useType,
        type : "NORMAL"
    };
	if(common.isBlank(content)){   //如果不传入内容，则默认是短信验证码，随机输入6位
		content = common.randomNumber(6);
        loc_smsInfo.type = "AUTH_CODE";
        loc_smsInfo.content = content;
		smsUrl = smsUrl + "/sms_send.ucs?type=AUTH_CODE"+"&PHONE="+mobile+"&CODE="+content;
	}else{    //如果传入内容，则按内容输出
		smsUrl = smsUrl + "/sms_send_common.ucs?phone="+mobile+"&content="+content;
	}
	request(smsUrl,function(error, response, data){
        var loc_result = null;
		if (!error && response.statusCode == 200 && common.isValid(data)) {
            loc_result = {result:0,content : content};
            loc_smsInfo.status = 1;
		}else{
            console.error("smsAPI["+smsUrl+"]->sendSms has error:"+error);
            loc_result = {result:1,errCode:errorMessage.code_1002.errcode,errMessage:errorMessage.code_1002.errmsg};
            loc_smsInfo.status = 2;
		}
        SmsService.add(loc_smsInfo, function(err, smsInfo){
            if(err){
                //保存信息失败，不影响短信发送，仅打印错误日志。
                console.error("save sms information error, smsInfo=[" + JSON.stringify(loc_smsInfo) + "] error：" + error);
            }

            //记录短信发送
            res.json(loc_result);
        });
    });
});

module.exports = router;
