/**
 * 摘要：文章资讯 API处理类
 * author:Gavin.guo
 * date:2015/4/23
 */
var express = require('express');
var router = express.Router();
var articleService = require('../../service/articleService');
var errorMessage = require('../../util/errorMessage');
var commonJs = require('../../util/common');
var constant = require('../../constant/constant');
var ApiResult = require('../../util/ApiResult');
/**
 * 根据栏目code-->提取文章咨询列表
 */
router.get(/^\/getArticleList(\.(json|xml))?$/, function(req, res) {
    var params={};
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

module.exports = router;
