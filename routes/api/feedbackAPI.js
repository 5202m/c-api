/**
 * 摘要：会员反馈 API处理类
 * author:Gavin.guo
 * date:2015/7/20
 */
var express = require('express');
var router = express.Router();
var feedbackService = require('../../service/feedbackService');
var APIUtil = require('../../util/APIUtil'); 	 	            //引入API工具类js
var CommonJS = require('../../util/common.js');

/**
 * 获取会员反馈列表
 */
router.get('/list', function(req, res) {
    APIUtil.logRequestInfo(req, "feedbackAPI");
    var memberId = req.query["memberId"];
	var pageLast = req.query["pageLast"];
	var pageSize = req.query["pageSize"];
    if(!memberId){
        //缺少参数
        console.error("memberId is invalid! ", memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    feedbackService.getFeedbackByMemberId(memberId, pageLast, pageSize, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 添加会员反馈
 */
router.post('/add', function(req, res){
    APIUtil.logRequestInfo(req, "feedbackAPI");
    var feedback = {
        ip : CommonJS.getClientIp(req),
        memberId : req.body["memberId"],
        content : req.body["content"],
        pageLast : req.body["pageLast"],
        pageSize : req.body["pageSize"]
    };
    if(!feedback.memberId){
        //缺少参数
        console.error("memberId is invalid! ", feedback.memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(!feedback.content){
        //缺少参数
        console.error("content is invalid! ", feedback.content);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    feedbackService.addFeedback(feedback, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;
