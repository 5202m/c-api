/**
 * 摘要：订阅API处理类
 * author:Dick.guo
 * date:2016/10/18
 */
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var SubscribeService = require('../../service/subscribeService');
var APIUtil = require('../../util/APIUtil.js');

/**
 * 发送短信
 */
router.post('/notice', function(req, res) {
    var loc_param = {
        type : req.body["type"],               //类型 "ARTICLE"-文档（喊单策略、交易策略、日常行情、大行情、每日周评、金道周评）
        dataId : req.body["dataId"]            //数据编号
    };

    if(common.isBlank(loc_param.dataId)){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    switch (loc_param.type){
        case "ARTICLE":
            SubscribeService.noticeArticle(loc_param.dataId, function(isOK){
                res.json(APIUtil.APIResult(null, isOK));
            });
            break;

        default :
            res.json(APIUtil.APIResult("code_2003", null));
    }
});


module.exports = router;
