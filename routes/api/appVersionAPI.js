/**
 * 摘要：APP版本 API处理类
 * author:Gavin.guo
 * date:2015/9/15
 */
var express = require('express');
var router = express.Router();
var appVersionService = require('../../service/appVersionService');
var APIUtil = require('../../util/APIUtil'); 	 	   //引入API工具类js

/**
 * 获取对应平台的APP版本信息
 */
router.get('/get', function(req, res) {
	APIUtil.logRequestInfo(req, "appVersionAPI");
	var platform  =  req.query["platform"];
	if(!platform){
		//缺少参数
		console.error("platform is invalid! ", platform);
		res.json(APIUtil.APIResult("code_2001", null, null));
		return;
	}
	appVersionService.getAppVersion(platform,function(data){
		res.json(data);
	});
});

module.exports = router;
