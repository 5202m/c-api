/**
 * 投资社区交易<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月16日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  交易API：
 *     1.持仓列表
 *     2.交易记录
 *     3.开仓
 *     4.平仓
 * </p>
 */
var logger =require("../../resources/logConf").getLogger("tradeAPI");
var express = require('express');
var router = express.Router();
var APIUtil = require('../../util/APIUtil.js');
var financeTradeService = require('../../service/financeTradeService.js');
var CommonJS = require('../../util/common.js');

/**
 * 持仓列表
 */
router.get('/positions', function(req, res) {
    APIUtil.logRequestInfo(req, "tradeAPI");
    var loc_memberId = req.query["memberId"];
    if(!loc_memberId){
        //缺少参数
        logger.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_memberId !== "string"){
        //参数类型错误
        logger.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    financeTradeService.getPositions(loc_memberId, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 交易记录
 */
router.get('/records', function(req, res) {
    APIUtil.logRequestInfo(req, "tradeAPI");
    var loc_memberId = req.query["memberId"];
    if(!loc_memberId){
        //缺少参数
        logger.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_memberId !== "string"){
        //参数类型错误
        logger.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    var loc_pageLast = req.query["pageLast"];
    var loc_pageSize = req.query["pageSize"];
    financeTradeService.getRecords(loc_memberId, loc_pageLast, loc_pageSize, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 开仓
 */
router.post('/open', function(req, res) {
    APIUtil.logRequestInfo(req, "tradeAPI");
    var loc_openParam = {
        ip : CommonJS.getClientIp(req),
        memberId : req.body["memberId"],
        productCode : req.body["productCode"],
        tradeDirection : parseInt(req.body["tradeDirection"], 10),
        leverageRatio : parseInt(req.body["leverageRatio"], 10),
        tradeMark : parseInt(req.body["tradeMark"], 10),
        contractPeriod : parseInt(req.body["contractPeriod"], 10),
        followOrderNo : req.body["followOrderNo"],
        volume : parseFloat(req.body["volume"]),
        openPrice : parseFloat(req.body["openPrice"]),
        remark : !req.body["remark"] ? "" : req.body["remark"]
    };
    if(!loc_openParam.memberId
        || !loc_openParam.productCode
        || isNaN(loc_openParam.tradeDirection)
        || isNaN(loc_openParam.leverageRatio)
        || isNaN(loc_openParam.volume)
        || isNaN(loc_openParam.openPrice)
        || isNaN(loc_openParam.contractPeriod)){
        //缺少参数
        logger.error("parameter is invalid! ", JSON.stringify(loc_openParam));
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_openParam.memberId !== "string"
        ||typeof loc_openParam.productCode !== "string"){
        //参数类型错误
        logger.error("parameter is invalid! ", JSON.stringify(loc_openParam));
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    //买卖方向只能1/2 杠杆比例不能小于0 跟单必须有跟单号
    if((loc_openParam.tradeDirection !== 1 && loc_openParam.tradeDirection !== 2)
        || loc_openParam.leverageRatio <= 0
        || (loc_openParam.tradeMark === 3 && !loc_openParam.followOrderNo)){
        //参数数据错误
        logger.error("parameter is invalid! ", JSON.stringify(loc_openParam));
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }
    if(loc_openParam.tradeMark !== 2 && loc_openParam.tradeMark !== 3){
        loc_openParam.tradeMark = 1;
        loc_openParam.followOrderNo = "";
    }
    financeTradeService.open(loc_openParam, function(apiResult){
        res.json(apiResult);
    });
});


/**
 * 喊单
 */
router.post('/shout', function(req, res) {
    APIUtil.logRequestInfo(req, "tradeAPI");
    var loc_params = {
        ip : CommonJS.getClientIp(req),
        memberId : req.body["memberId"],
        productCode : req.body["productCode"],
        tradeDirection : parseInt(req.body["tradeDirection"], 10),
        leverageRatio : parseInt(req.body["leverageRatio"], 10),
        contractPeriod : parseInt(req.body["contractPeriod"], 10),
        volume : parseFloat(req.body["volume"]),
        openPrice : parseFloat(req.body["openPrice"]),
        remark : !req.body["remark"] ? "" : req.body["remark"],
        expandAttr : req.body["expandAttr"],
        device : req.body["device"],
        title : req.body["title"]
    };
    if(!loc_params.memberId
        || !loc_params.productCode
        || isNaN(loc_params.tradeDirection)
        || isNaN(loc_params.leverageRatio)
        || isNaN(loc_params.contractPeriod)
        || isNaN(loc_params.volume)
        || isNaN(loc_params.openPrice)
        || !loc_params.title
        || !loc_params.expandAttr){
        //缺少参数
        logger.error("parameter is invalid! ", JSON.stringify(loc_params));
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    try{
        loc_params.expandAttr = JSON.parse(loc_params.expandAttr);
    }catch(e){
        logger.error("parameter is invalid! ", JSON.stringify(loc_params));
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }

    if(!loc_params.device){
        loc_params.device = "";
    }

    //买卖方向只能1/2 杠杆比例不能小于0
    if((loc_params.tradeDirection !== 1 && loc_params.tradeDirection !== 2)
        || loc_params.leverageRatio <= 0){
        //参数数据错误
        logger.error("parameter is invalid! ", JSON.stringify(loc_params));
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }

    financeTradeService.shout(loc_params, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 平仓
 */
router.post('/close', function(req, res) {
    APIUtil.logRequestInfo(req, "tradeAPI");
    var loc_closeParam = {
        ip : CommonJS.getClientIp(req),
        memberId : req.body["memberId"],
        orderNo : req.body["orderNo"],
        productCode : req.body["productCode"],
        volume : parseFloat(req.body["volume"]),
        closePrice : parseFloat(req.body["closePrice"]),
        remark : !req.body["remark"] ? "" : req.body["remark"]
    };
    if(!loc_closeParam.memberId
        || !loc_closeParam.orderNo
        || !loc_closeParam.productCode
        || isNaN(loc_closeParam.volume)
        || isNaN(loc_closeParam.closePrice)){
        //缺少参数
        logger.error("parameter is invalid! ", JSON.stringify(loc_closeParam));
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_closeParam.memberId !== "string"
        ||typeof loc_closeParam.orderNo !== "string"
        ||typeof loc_closeParam.productCode !== "string"){
        //参数类型错误
        logger.error("parameter is invalid! ", JSON.stringify(loc_closeParam));
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    financeTradeService.close(loc_closeParam, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 会员资产
 */
router.get("/balance", function(req, res) {
    APIUtil.logRequestInfo(req, "tradeAPI");
    var loc_memberId = req.query["memberId"];
    if(!loc_memberId){
        //缺少参数
        logger.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }

    financeTradeService.getBalanceInfo(loc_memberId, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;