/**
 * 摘要：广告 API处理类
 * author:Gavin.guo
 * date:2015/4/15
 */
var express = require('express');
var router = express.Router();
var advertisementService = require('../../service/advertisementService');
var errorMessage = require('../../util/errorMessage');
var common = require('../../util/common');
var config=require('../../resources/config');

/**
 * 根据平台-->获取广告
 */
router.get('/getAdvertisement', function(req, res) {
	var platform = req.param("platform");
	if(common.isBlank(platform)){
		res.json(errorMessage.code_1000);
	}else{
		advertisementService.getAdvertisementByPlatform(platform,function(advertisement){
			advertisement.img = config.filesDomain + advertisement.img;
			res.json(advertisement);
		});
	}
});

module.exports = router;
