/**
 * 媒体API<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月16日 <BR>
 * Description :<BR>
 * <p>
 *     媒体API：
 *     1.广告列表
 * </p>
 */
var express = require('express');
var router = express.Router();
var APIUtil = require('../../util/APIUtil.js');
var mediaService = require('../../service/mediaService.js');

/**
 * 广告列表
 */
router.get('/adList', function(req, res) {
    APIUtil.logRequestInfo(req, "mediaAPI");
    mediaService.getList("advertisement", "finance", function(apiResult){
        res.json(apiResult);
    });
});


/**
 * 系统图片
 */
router.get('/sysPic', function(req, res) {
    APIUtil.logRequestInfo(req, "mediaAPI");
    mediaService.getList("sysPicture", "finance", function(apiResult){
        res.json(apiResult);
    });
});
module.exports = router;