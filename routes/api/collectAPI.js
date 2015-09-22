/**
 * 摘要：点赞 API处理类
 * author:Gavin.guo
 * date:2015/8/4
 */
var express = require('express');
var router = express.Router();
var CollectService = require('../../service/collectService.js');
var APIUtil = require('../../util/APIUtil'); 	 	   //引入API工具类js
var CommonJS = require('../../util/common.js');

/**
 * 获取收藏帖子/文章列表
 */
router.get('/list', function(req, res) {
    APIUtil.logRequestInfo(req, "collectAPI");
    var loc_memberId = req.query["memberId"];
    var loc_pageLast = req.query["pageLast"];
    var loc_pageSize = req.query["pageSize"];

    if(!loc_memberId){
        //缺少参数
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }

    CollectService.getCollects(loc_memberId, loc_pageLast, loc_pageSize, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 收藏帖子/文章
 */
router.post('/add', function(req, res){
    APIUtil.logRequestInfo(req, "collectAPI");
    var loc_memberId = req.body["memberId"];
    var loc_topicId = req.body["topicId"];
    var loc_type = parseInt(req.body["type"], 10);
    if(!loc_memberId || !loc_topicId){
        //缺少参数
        console.error("param is invalid! ", loc_memberId, loc_topicId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_memberId !== "string"
        || typeof loc_topicId !== "string"
        || isNaN(loc_type)){
        //参数类型错误
        console.error("param is invalid! ", loc_memberId, loc_topicId, req.body["type"]);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    if(loc_type !== 1 && loc_type !== 2){
        //参数数据错误
        console.error("type of praise is invalid! ", loc_type);
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }
    CollectService.doCollect(loc_memberId, loc_topicId, loc_type, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 取消收藏帖子/文章
 */
router.post('/cancel', function(req, res){
    APIUtil.logRequestInfo(req, "collectAPI");
    var loc_memberId = req.body["memberId"];
    var loc_topicId = req.body["topicId"];
    var loc_type = parseInt(req.body["type"], 10);
    if(!loc_memberId || !loc_topicId){
        //缺少参数
        console.error("param is invalid! ", loc_memberId, loc_topicId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_memberId !== "string"
        || typeof loc_topicId !== "string"
        || isNaN(loc_type)){
        //参数类型错误
        console.error("param is invalid! ", loc_memberId, loc_topicId, req.body["type"]);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    if(loc_type !== 1 && loc_type !== 2){
        //参数数据错误
        console.error("type of praise is invalid! ", loc_type);
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }

    CollectService.undoCollect(loc_memberId, loc_topicId, loc_type, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;
