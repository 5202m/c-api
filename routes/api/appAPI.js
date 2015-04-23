/**
 * 摘要：APP API处理类
 * author:Gavin.guo
 * date:2015/4/3
 */
var express = require('express');
var router = express.Router();
var appService = require('../../service/appService');
var errorMessage = require('../../util/errorMessage');

/**
 * 获取APP List
 */
router.get('/getAppList', function(req, res) {
	var appCategoryId = req.param("appCategoryId");
	if(appCategoryId == undefined){
		res.json(errorMessage.code_1000);
	}else{
		appService.getAppList(appCategoryId,function(data){
			res.json(data);
		});
	}
});
/**
 * 获取APP信息
 */
router.get('/getAppInfo', function(req, res) {
	var id = req.param("id");
	if(id == undefined){
		res.json(errorMessage.code_1000);
	}else{
		appService.getAppById(id,function(data){
			res.json(data);
		});
	}
});

module.exports = router;
