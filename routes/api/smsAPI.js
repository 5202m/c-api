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

/**
 * 发送短信
 */
router.get('/send', function(req, res) {
	var mobile = req.param("mobile");
	if(common.isBlank(mobile)){
		res.json(errorMessage.code_1000);
        return;
	}
	var smsUrl = config.smsUrl;
	var content = req.param("content");
	if(common.isBlank(content)){   //如果不传入内容，则默认是短信验证码，随机输入6位
		content = common.randomNumber(6);
		smsUrl = smsUrl + "/sms_send.ucs?type=AUTH_CODE"+"&PHONE="+mobile+"&CODE="+content;
	}else{    //如果传入内容，则按内容输出
		smsUrl = smsUrl + "/sms_send_common.ucs?phone="+mobile+"&content="+content;
	}
	console.info(smsUrl);
	request(smsUrl,function(error, response, data){
		if (!error && response.statusCode == 200 && common.isValid(data)) {
			res.json({result:0,content : content});
		}else{
            console.error("smsAPI->sendSms has error:"+error);
			res.json({result:1,errCode:errorMessage.code_1002.errcode,errMessage:errorMessage.code_1002.errmsg});
		}
	});
});

module.exports = router;
