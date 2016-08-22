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
 * 提取分组样式文档数据
 */
router.get('/getGoupArticles', function(req, res) {
    var params={days:req.query["days"],code:req.query["code"],platform:req.query["platform"]};
    if(commonJs.isBlank(params.code)||commonJs.isBlank(params.platform)){
        res.json(null);
    }else{
        articleService.getListByGroup(params,function(data){
            res.json(data);
        });
    }
});

/**
 * 提取分组样式文档数据
 */
router.get('/getArticleCount', function(req, res) {
    var params={code:req.query["code"],platform:req.query["platform"],dateTime:req.query["dateTime"]};
    if(commonJs.isBlank(params.code)||commonJs.isBlank(params.platform)){
        res.json(null);
    }else{
        articleService.getCountByDate(params,function(data){
            res.json(data);
        });
    }
});

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
        params.pageLess = req.query["pageLess"] == "1";
        params.pageKey = req.query["pageKey"];
        params.isAll = req.query["isAll"] == "1";
        params.orderByJsonStr=req.query["orderByJsonStr"];
        params.hasContent= req.query["hasContent"];
        params.format= req.query["format"];
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
 * 通过id提取文档信息
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
 * 新增文档信息
 */
router.post('/add', function(req, res){
    APIUtil.logRequestInfo(req, "articleAPI");
    var param = req.body['data'];
    if(typeof param == 'string'){
        param = JSON.parse(param);
    }
    var loc_article = {
        template: param.template,
        categoryId: param.category,
        status: 1,
        platform: param.platform,
        publishStartDate: param.publishStartDate,
        publishEndDate: param.publishEndDate,
        valid: 1,
        sequence: 1,
        mediaUrl: param.mediaUrl,
        mediaImgUrl: param.mediaImgUrl,
        linkUrl: param.linkUrl,
        detailList: param.detailList
    };
    if(!loc_article.publishStartDate
        || !loc_article.publishEndDate
        || !loc_article.detailList){
        logger.error("article is invalid! ", loc_article);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_article.publishStartDate !== "string"
        || typeof loc_article.publishEndDate !== "string"
        || typeof loc_article.detailList !== "object"){
        logger.error("article is invalid! ", loc_article);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    articleService.addArticle(loc_article, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 更新文章
 */
router.post('/modify',function(req, res){
    APIUtil.logRequestInfo(req, "articleAPI");
    var query = req.body['query'];
    var updater = req.body['data'];
    var field = req.body['field'];
    if(typeof query == 'string'){
        try {
            query = JSON.parse(query);
        }catch(e){
            res.json(null);
            return;
        }
    }
    if(typeof updater == 'string'){
        try {
            updater = JSON.parse(updater);
        }catch(e){
            res.json(null);
            return;
        }
    }
    articleService.modifyArticle(query, field, updater, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 更新点赞数或下载次数
 */
router.post('/modifyPraiseOrDownloads', function(req, res){
    APIUtil.logRequestInfo(req, "articleAPI");
    var query = req.body['query'];
    var type = req.body['type'];
    if(typeof query == 'string'){
        try {
            query = JSON.parse(query);
        }catch(e){
            res.json(null);
            return;
        }
    }
    articleService.modifyPraiseOrDownloads(query, type, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;
