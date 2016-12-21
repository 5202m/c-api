/**
 * @apiDefine ParametersMissedError
 *
 * @apiError ParametersMissed 参数没有传完整，无法完成请求。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     -{
 *		"result": "1000",
 *		"msg": "没有指定参数!"
 *	}
 */
/**
 * @apiDefine ParametersDataBrokenError
 * 
 * @apiError ParametersDataBroken 参数数据格式错误，无法完成请求。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     -{
 *		"result": "2003",
 *		"msg": "参数数据错误！"
 *	} 
 */
/**
 * @apiDefine CommonResultDescription
 * 
 * @apiSuccess {Number} result 结果码，0 - 成功；-1 - 未知或未定义的错误；other - API系统定义的错误
 * @apiSuccess {String} errmsg  错误信息.
 * @apiSuccess {Number} errcode  错误码.
 */
var logger =require("../../resources/logConf").getLogger("articleAPI");
var express = require('express');
var router = express.Router();
var articleService = require('../../service/articleService');
"use strict";
let errorMessage = require('../../util/errorMessage');
let common = require('../../util/common');
let constant = require('../../constant/constant');
let APIUtil = require('../../util/APIUtil'); 	 	   //引入API工具类js
let ApiResult = require('../../util/ApiResult');       //引起聊天室工具类js

/**
 * @api {get} /article/getGroupArticles 获取分组文档资讯列表
 * @apiName getGroupArticles
 * @apiGroup article
 *
 * @apiParam {Number} [days] 多少天范围以内的文章.
 * @apiParam {String} code 文章类型，对应数据库中的categoryId.
 * @apiParam {String} platform 文章平台.
 * @apiParam {String} [format] 待补充说明
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest http://pmchat.24k.hk/api/article/getGroupArticles?code=download&platform=studio_market
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "msg": "OK",
 *          "pageNo": 1,
 *          "pageSize": 50,
 *          "totalRecords": 0,
 *          -"data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get('/getGroupArticles', (req, res) => {
    let params={
        days:req.query["days"],
        code:req.query["code"],
        platform:req.query["platform"],
        format:req.query["format"]
    };
    let requires = ["code", "platform"];
    let isSatify = requires.every(name => {
        return common.isValid(params[name]);
    });
    if(!isSatify){
        logger.warn("[verifyRule] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    articleService.getListByGroup(params, data => {
	res.json(APIUtil.APIResult(null, data));
    });
});

/**
 * @api {get} /article/getArticleCount 获取文档资讯列表条数
 * @apiName getArticleCount
 * @apiGroup article
 *
 * @apiParam {String} code 文章类型，对应数据库中的categoryId.
 * @apiParam {String} platform 文章平台.
 * @apiParam {String} [format] 待补充说明
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest http://pmchat.24k.hk/api/article/getArticleCount?code=download&platform=studio_market
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          -"data": {
 *          	"count": 0
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get('/getArticleCount', (req, res) => {
    var params= {
        code: req.query["code"],
        platform: req.query["platform"],
        dateTime: req.query["dateTime"]
    };
    let requires = ["code", "platform"];
    let isSatify = requires.every(name => {
        return common.isValid(params[name]);
    });
    if(!isSatify){
        logger.warn("[verifyRule] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    articleService.getCountByDate(params, data => {
	res.json(APIUtil.APIResult(null, data));
    });
});

/**
 * @api {get} /article/getArticleList.json|.xml 获取文档资讯列表
 * @apiName getArticleList
 * @apiGroup article
 *
 * @apiParam {String} [authorId] 作者ID.
 * @apiParam {String} code 文章类型，对应数据库中的categoryId.
 * @apiParam {String} platform 文章平台.
 * @apiParam {String} [lang] 待补充说明
 * @apiParam {Number} pageNo 待补充说明
 * @apiParam {Number} pageSize 待补充说明
 * @apiParam {Number} [pageLess] 待补充说明
 * @apiParam {String} [pageKey] 待补充说明
 * @apiParam {Number} [isAll] 待补充说明
 * @apiParam {String} [orderByJsonStr] 待补充说明
 * @apiParam {String} [hasContent] 待补充说明
 * @apiParam {String} [format] 待补充说明
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          -"data": {
 *          	"count": 0
 *          }
 *      }
 *
 * @apiSampleRequest http://pmchat.24k.hk/api/article/getArticleList.json?code=download&platform=studio_market&pageNo=1&pageSize=10
 * @apiUse ParametersMissedError
 */
router.get(/^\/getArticleList(\.(json|xml))?$/, function(req, res) {
    var params={};
        params.authorId = req.query["authorId"];
        params.code = req.query["code"];
        params.platform = req.query["platform"];
        params.lang =req.query["lang"];
        params.pageNo = common.isBlank(req.query["pageNo"]) ? constant.curPageNo : req.query["pageNo"];
        params.pageSize = common.isBlank(req.query["pageSize"]) ? constant.pageSize : req.query["pageSize"];
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
    if(isNaN(params.pageNo)||isNaN(params.pageSize)||common.isBlank(params.code)||common.isBlank(params.platform)){
	var result = APIUtil.APIResult("code_1000", null);
	if(req.path.indexOf('.xml')!=-1){
	    result = common.toXML(result);
        }
	res.json(result);
    }else{
        if("class_note" == params.code){ //官网请求直播精华，应用位置直接修改为普通房间的直播精华（特殊处理）
            if("24k_web" == params.platform || "24k_mobile" == params.platform){
                params.platform = constant.studioDefRoom.studio
            }else if("gwfx_web" == params.platform || "gwfx_mobile" == params.platform){
                params.platform = constant.studioDefRoom.fxstudio
            }
        }
        articleService.getArticlePage(params,function(page){
            var result = APIUtil.APIResult(null, page);
            if(req.path.indexOf('.xml')!=-1){
        	result = common.toXML(result);
            }
            res.json(result);
        });
    }
});

/**
 * @api {get} /article/getArticleInfo 根据ID提取文档信息
 * @apiName getArticleInfo
 * @apiGroup article
 *
 * @apiParam {String} id 文章id.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest http://pmchat.24k.hk/api/article/getArticleInfo?id=download
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          -"data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get('/getArticleInfo', function(req, res) {
    var id= req.query["id"];
    if(common.isBlank(id)){
	res.json(APIUtil.APIResult("code_1000", null));
    }else{
        articleService.getArticleInfo(id,function(article){
            res.json(APIUtil.APIResult(null, article));
        });
    }
});

/**
 * @api {post} /article/add 提交添加文档信息
 * @apiName add
 * @apiGroup article
 *
 * @apiParam {Object} data 请求体中的data字段.
 * @apiParam {String} [data.template] 请求体中的data字段的参数.
 * @apiParam {Date} data.publishStartDate 请求体中的data字段的参数.
 * @apiParam {Date} data.publishEndDate 请求体中的data字段的参数.
 * @apiParam {String} [data.mediaUrl] 请求体中的data字段的参数.
 * @apiParam {String} [data.mediaImgUrl] 请求体中的data字段的参数.
 * @apiParam {String} [data.linkUrl] 请求体中的data字段的参数.
 * @apiParam {Array} data.detailList 请求体中的data字段的参数.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest http://pmchat.24k.hk/api/article/getArticleInfo
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          -"data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
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
	APIUtil.APIResult(null, apiResult, null);
    });
});

/**
 * @api {post} /article/modify 修改文档信息
 * @apiName modify
 * @apiGroup article
 *
 * @apiParam {String} query 请求体中的query字段，json字符串.
 * @apiParam {String} data 请求体中的data字段，json字符串.
 * @apiParam {String} field 请求体中的data字段.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest http://pmchat.24k.hk/api/article/getArticleInfo?id=download
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          -"data": {
 *          	...
 *          }
 *      }
 *      
 * @apiUse ParametersMissedError
 * 
 * @apiUse ParametersDataBrokenError
 */
router.post('/modify',function(req, res){
    APIUtil.logRequestInfo(req, "articleAPI");
    var query = req.body['query'];
    var updater = req.body['data'];
    var field = req.body['field'];
    
    let requires = ["query", "data"];
    let isSatify = requires.every(name => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[modify] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    if(typeof query == 'string'){
        try {
            query = JSON.parse(query);
        }catch(e){
            res.json(APIUtil.APIResult("code_2003", null));
            return;
        }
    }
    if(typeof updater == 'string'){
        try {
            updater = JSON.parse(updater);
        }catch(e){
            res.json(APIUtil.APIResult("code_2003", null));
            return;
        }
    }
    articleService.modifyArticle(query, field, updater, function(apiResult){
	APIUtil.APIResult(null, apiResult, null);
    });
});

/**
 * @api {get} /article/modifyPraiseOrDownloads 更新点赞数或下载次数
 * @apiName modifyPraiseOrDownloads
 * @apiGroup article
 *
 * @apiParam {String} query 请求体中的query字段，json字符串.
 * @apiParam {String} type 请求体中的query字段.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest http://pmchat.24k.hk/api/article/getArticleInfo?id=download
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          -"data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 * 
 * @apiUse ParametersDataBrokenError
 */
router.post('/modifyPraiseOrDownloads', function(req, res){
    APIUtil.logRequestInfo(req, "articleAPI");
    var query = req.body['query'];
    var type = req.body['type'];
    let requires = ["query", "type"];
    let isSatify = requires.every(name => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[modifyPraiseOrDownloads] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    if(typeof query == 'string'){
        try {
            query = JSON.parse(query);
        }catch(e){
            res.json(APIUtil.APIResult("code_2003", null));
            return;
        }
    }
    articleService.modifyPraiseOrDownloads(query, type, function(apiResult){
	APIUtil.APIResult(null, apiResult, null);
    });
});

module.exports = router;
