/**
 * 摘要：文章资讯 API处理类
 * author:Gavin.guo
 * date:2015/4/23
 */
var logger =require("../../resources/logConf").getLogger("articleAPI");
var express = require('express');
var router = express.Router();
var articleService = require('../../service/articleService');
var errorMessage = require('../../util/errorMessage');
var commonJs = require('../../util/common');
var constant = require('../../constant/constant');
var APIUtil = require('../../util/APIUtil'); 	 	   //引入API工具类js
var ApiResult = require('../../util/ApiResult');       //引起聊天室工具类js

/**
 * 根据栏目code-->提取文章咨询列表
 */
router.get(/^\/getArticleList(\.(json|xml))?$/, function(req, res) {
    var params={};
        params.authorId = req.query["authorId"];
        params.code = req.query["code"];
        params.platform = req.query["platform"];
        params.lang =req.query["lang"];
        params.pageNo = commonJs.isBlank(req.query["pageNo"]) ? constant.curPageNo : req.query["pageNo"];
        params.pageSize = commonJs.isBlank(req.query["pageSize"]) ? constant.pageSize : req.query["pageSize"];
        params.orderByJsonStr=req.query["orderByJsonStr"];
        params.hasContent= req.query["hasContent"];
    if(!params.pageNo||params.pageNo <= 0){
        params.pageNo = 1;
    }
    params.pageNo=parseInt(params.pageNo);
    params.pageSize=parseInt(params.pageSize)||15;
    if(isNaN(params.pageNo)||isNaN(params.pageSize)||commonJs.isBlank(params.code)||commonJs.isBlank(params.platform)){
        if(req.path.indexOf('.xml')!=-1){
            res.end(ApiResult.result(errorMessage.code_1000,null,ApiResult.dataType.xml));
        }else{
            res.json(ApiResult.result(errorMessage.code_1000));
        }
    }else{
        articleService.getArticlePage(params,function(page){
            if(req.path.indexOf('.xml')!=-1){
                res.end(ApiResult.result(null,page,ApiResult.dataType.xml));
            }else{
                res.json(ApiResult.result(null,page));
            }
        });
    }
});

/**
 * 根据栏目code-->提取文章咨询列表
 */
router.get('/getArticleInfo', function(req, res) {
    var id= req.query["id"];
    if(commonJs.isBlank(id)){
        res.json(errorMessage.code_1000);
    }else{
        articleService.getArticleInfo(id,function(article){
            res.json(article);
        });
    }
});

/**
 * 获取文章列表
 */
router.get('/finance/list', function(req, res) {
    APIUtil.logRequestInfo(req, "articleAPI");
    var loc_code = req.query["code"];
    var loc_pageLast = req.query["pageLast"];
    var loc_pageSize = req.query["pageSize"];
    if(!loc_code){
        //缺少参数
        logger.error("code is invalid! ", loc_code);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }

    articleService.getArticleListWithRely({
        code : loc_code,
        platform : "finance"
    }, loc_pageLast, loc_pageSize, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 文章详情
 */
router.get('/finance/detail', function(req, res){
    APIUtil.logRequestInfo(req, "articleAPI");
    var loc_articleId = req.query["articleId"];
    if(!loc_articleId){
        //缺少参数
        logger.error("articleId is invalid! ", loc_articleId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_articleId !== "string"){
        //参数类型错误
        logger.error("articleId is invalid! ", loc_articleId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    var loc_pageLast = req.query["pageLast"];
    var loc_pageSize = req.query["pageSize"];
    var loc_opType = parseInt(req.query["opType"], 10);
    if(loc_opType !== 2){
        loc_opType = 1;
    }

    articleService.getArticleDetail(loc_opType, loc_articleId, loc_pageLast, loc_pageSize, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;
