/**
 * 摘要：帖子 API处理类
 * author:Gavin.guo
 * date:2015/7/1
 */
var logger =require("../../resources/logConf").getLogger("topicAPI");
var express = require('express');
var router = express.Router();
var topicService = require('../../service/topicService');
var topicStatisticalService = require('../../service/topicStatisticalService');
var APIUtil = require('../../util/APIUtil'); 	 	   //引入API工具类js
var CommonJS = require('../../util/common.js');

/**
 * 获取帖子列表
 */
router.get('/list', function(req, res) {
    APIUtil.logRequestInfo(req, "topicAPI");
    var loc_subjectType = req.query["subjectType"];
	var loc_memberId = req.query["memberId"];
	var loc_prodCode = req.query["prodCode"];
    var loc_pageLast = req.query["pageLast"];
    var loc_pageSize = req.query["pageSize"];

    topicService.getTopicList({
        subjectType : loc_subjectType,
        memberId : loc_memberId,
        prodCode : loc_prodCode
    }, loc_pageLast, loc_pageSize, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 帖子详情
 */
router.get('/detail', function(req, res){
    APIUtil.logRequestInfo(req, "topicAPI");
    var loc_topicId = req.query["topicId"];
    if(!loc_topicId){
        //缺少参数
        logger.error("topicId is invalid! ", loc_topicId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_topicId !== "string"){
        //参数类型错误
        logger.error("topicId is invalid! ", loc_topicId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    var loc_pageLast = req.query["pageLast"];
    var loc_pageSize = req.query["pageSize"];
    var loc_opType = parseInt(req.query["opType"], 10);
    if(loc_opType !== 2){
        loc_opType = 1;
    }

    topicService.getTopicDetail(loc_opType, loc_topicId, loc_pageLast, loc_pageSize, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 删除帖子
 */
router.post('/delete', function(req, res){
    APIUtil.logRequestInfo(req, "topicAPI");
    var loc_topicId = req.body["topicId"];
    if(!loc_topicId){
        //缺少参数
        logger.error("topicId is invalid! ", loc_topicId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_topicId !== "string"){
        //参数类型错误
        logger.error("topicId is invalid! ", loc_topicId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    topicService.deleteTopic(loc_topicId, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 发帖
 */
router.post('/add', function(req, res){
    APIUtil.logRequestInfo(req, "topicAPI");
    var loc_topic = {
        ip : CommonJS.getClientIp(req),
        memberId : req.body["memberId"],
        subjectType : req.body["subjectType"],
        expandAttr : req.body["expandAttr"],
        publishLocation : parseInt(req.body["publishLocation"], 10),
        device : req.body["device"],
        title : req.body["title"],
        content : req.body["content"]
    };
    if(!loc_topic.memberId
        || !loc_topic.subjectType
        || (!loc_topic.content && !loc_topic.title)){
        logger.error("topic information is invalid! ", loc_topic);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_topic.memberId !== "string"
        || typeof loc_topic.subjectType !== "string"
        || (loc_topic.device && typeof loc_topic.device !== "string")
        || (loc_topic.title && typeof loc_topic.title !== "string")
        || (loc_topic.content && typeof loc_topic.content !== "string")){
        logger.error("topic information is invalid! ", loc_topic);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    if(isNaN(loc_topic.publishLocation)){
        loc_topic.publishLocation = 3;
    }
    if(!loc_topic.expandAttr){
        loc_topic.expandAttr = null;
    }else{
        try{
            loc_topic.expandAttr = JSON.parse(loc_topic.expandAttr);
        }catch(e){
            loc_topic.expandAttr = null;
        }
    }
    if(!loc_topic.title){
        loc_topic.title = "";
    }
    if(!loc_topic.content){
        loc_topic.content = "";
    }
    if(!loc_topic.device){
        loc_topic.device = "";
    }
    topicService.addTopic(loc_topic, function(apiResult){
        res.json(apiResult);
    });
});


/**
 * 修改帖子
 */
router.post('/modify', function(req, res){
    APIUtil.logRequestInfo(req, "topicAPI");
    var loc_topic = {
        ip : CommonJS.getClientIp(req),
        topicId : req.body["topicId"],
        title : req.body["title"],
        content : req.body["content"]
    };
    if(!loc_topic.topicId
        || (!loc_topic.content && !loc_topic.title)){
        logger.error("topic information is invalid! ", loc_topic);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    topicService.modifyTopic(loc_topic, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 举报帖子
 */
router.post('/report', function(req, res){
    APIUtil.logRequestInfo(req, "topicAPI");
    var loc_topicId = req.body["topicId"];
    var loc_type = parseInt(req.body["type"], 10);
    if(!loc_topicId){
        //缺少参数
        logger.error("param is invalid! ", loc_topicId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(isNaN(loc_type)){
        //缺少参数
        logger.error("type of report is invalid! ", loc_type);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    if(loc_type !== 1 && loc_type !== 2){
        //缺少参数
        logger.error("type of report is invalid! ", loc_type);
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }
    var loc_ip = CommonJS.getClientIp(req);
    topicStatisticalService.report(loc_topicId, loc_type, loc_ip, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;
