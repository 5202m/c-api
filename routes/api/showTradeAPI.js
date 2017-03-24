//showTradeAPI
var logger =require("../../resources/logConf").getLogger("showTradeAPI");
var express = require('express');
var router = express.Router();
var showTradeService = require('../../service/showTradeService');
var common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

router.get("/getShowTrade", (req, res) => {
    let requires = ["groupType", "userNo"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("[getShowTrade] Parameters missed! Expecting parameters: ", requires, req.query);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    showTradeService.getShowTrade(
        req.query["groupType"],
        req.query["userNo"],     
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

router.get("/getShowTradeList", (req, res) => {
    let requires = ["groupType", "pageSize"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("[getShowTradeList] Parameters missed! Expecting parameters: ", requires, req.query);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    showTradeService.getShowTradeList(
        req.query,    
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.post("/addShowTrade", (req, res) => {
    let requires = [
        "groupType", 
        "userNo", 
        "avatar", 
        "userName", 
        "tradeImg",  
        "Ip", 
        "tradeType"
    ];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[addShowTrade] Parameters missed! Expecting parameters: ", requires, req.body);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    showTradeService.addShowTrade(
        req.body,    
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/setShowTradePraise", (req, res) => {
    if(common.isBlank(req.query["praiseId"])){
        logger.warn("[setShowTradePraise] Parameters missed! Expecting parameter: ", "praiseId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    showTradeService.setShowTradePraise(
        req.query,    
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getShowTradeByIds", (req, res) => {
    if(common.isBlank(req.query["tradeIds"])){
        logger.warn("[addShowTrade] Parameters missed! Expecting parameter: ", "tradeIds");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    showTradeService.getShowTradeByIds(
        req.query["tradeIds"].split(","),    
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

module.exports = router;