/**
 * 摘要：向Android或IOS推送消息API处理类
 * author:Gavin.guo
 * date:2015/8/27
 */
var express = require('express');
var router = express.Router();
var pushService = require('../../service/pushService');
var APIUtil = require('../../util/APIUtil'); 	 	   //引入API工具类js

/**
 * 推送消息
 */
router.get('/push', function(req, res) {
	APIUtil.logRequestInfo(req, "pushAPI");
	pushService.doPushMessage(1,'oppo消息推送7','工作介绍7',['13543297233','13570894510'],{'lang':'zh','dataid':'84474747'},function(apiResult) {
		res.json(apiResult);
	})
});

router.get('/list', function(req, res) {
	APIUtil.logRequestInfo(req, "pushAPI");
	var memberId = req.query["memberId"];
	var messageType = req.query["messageType"];
	var loc_pageLast = req.query["pageLast"];
	var loc_pageSize = req.query["pageSize"];

	if(!messageType){
		//缺少参数
		console.error("messageType is invalid! ", messageType);
		res.json(APIUtil.APIResult("code_2001", null, null));
		return;
	}
	var pushMessage = {
		lang: 'zh',                        //语言
		platform : 'finance',             //应用平台
		tipType : '2' ,                    //小秘书
		messageType : messageType,
		pushMember :memberId
	};
	pushService.getPushMessageList(pushMessage, loc_pageLast, loc_pageSize,function(apiResult){
		res.json(apiResult);
	});
});

module.exports = router;
