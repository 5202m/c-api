/**
 * 广告 API处理类
 */
var express = require('express');
var router = express.Router();
var advertisementService = require('../../service/advertisementService');
var errorMessage = require('../../util/errorMessage');
var common = require('../../util/common');
var constant = require('../../constant/constant');

/**
 * 根据平台-->获取广告
 */
router.get('/getAdvertisement', function(req, res) {
	var platform = req.param("platform");
	if(common.isBlank(platform)){
		res.json(errorMessage.code_1000);
	}else{
		advertisementService.getAdvertisementByPlatform(platform,function(data){
			res.json(data);
		});
	}
});

module.exports = router;
