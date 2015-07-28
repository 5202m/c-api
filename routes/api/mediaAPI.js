/**
 * 摘要：媒体API处理类
 * author:Alan.wu
 * date:2015/7/3
 */
var express = require('express');
var router = express.Router();
var mediaService = require('../../service/mediaService');
var errorMessage = require('../../util/errorMessage');
var common = require('../../util/common');
var config=require('../../resources/config');
var constant = require('../../constant/constant');
/**
 * 根据平台-->获取媒体
 */
router.get('/getMedia', function(req, res) {
    var categoryId = req.param("code");
    var platform = req.param("platform");
    var lang = common.isBlank(req.param("lang")) ? constant.lang : req.param("lang");
	if(common.isBlank(categoryId)||common.isBlank(platform)){
		res.json(errorMessage.code_1000);
	}else{
        mediaService.getMediaByPlatform(categoryId,platform,lang,function(row){
            if(row){
                row.mediaUrl = config.filesDomain + row.mediaUrl;
                res.json(row);
            }else{
                res.json(null);
            }
		});
	}
});

module.exports = router;
