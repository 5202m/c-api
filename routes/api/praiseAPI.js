/**
 * 摘要：点赞 API处理类
 * author:Gavin.guo
 * date:2015/8/4
 */
var logger =require("../../resources/logConf").getLogger("praiseAPI");
var express = require('express');
var router = express.Router();
var PraiseService = require('../../service/praiseService.js');
var APIUtil = require('../../util/APIUtil'); 	 	   //引入API工具类js
var CommonJS = require('../../util/common.js');

/**
 * 帖子点赞
 */
router.post('/add', function(req, res){
    APIUtil.logRequestInfo(req, "praiseAPI");
    var loc_memberId = req.body["memberId"];
    var loc_topicId = req.body["topicId"];
    var loc_type = parseInt(req.body["type"], 10);
    if(!loc_memberId || !loc_topicId){
        //缺少参数
        logger.error("param is invalid! ", loc_memberId, loc_topicId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(isNaN(loc_type)){
        //缺少参数
        logger.error("type of praise is invalid! ", loc_type);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    if(loc_type !== 1 && loc_type !== 2){
        //缺少参数
        logger.error("type of praise is invalid! ", loc_type);
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }
    var loc_ip = CommonJS.getClientIp(req);

    PraiseService.doPraise(loc_memberId, loc_topicId, loc_type, loc_ip, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;
