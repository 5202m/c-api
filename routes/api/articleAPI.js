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

/**
 * 根据栏目code-->提取文章咨询列表
 */
router.get('/getArticleList', function(req, res) {
	var code = req.param("code");
	var lang = commonJs.isBlank(req.param("lang")) ? constant.lang : req.param("lang");
	var curPageNo = commonJs.isBlank(req.param("curPageNo")) ? constant.curPageNo : req.param("curPageNo");
	var pageSize = commonJs.isBlank(req.param("pageSize")) ? constant.pageSize : req.param("pageSize");
	if(commonJs.isBlank(code)){
		res.json(errorMessage.code_1000);
	}else{
		articleService.getArticleList(code,lang,curPageNo,pageSize,function(articles){
			res.json(articles);
		});
	}
});

module.exports = router;
