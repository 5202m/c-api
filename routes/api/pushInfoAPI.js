//pushInfoAPI
var logger =require("../../resources/logConf").getLogger("pushInfoAPI");
var express = require('express');
var router = express.Router();
var pushInfoService = require('../../service/pushInfoService');
var common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

router.get("/getPushInfo", (req, res) => {
    let requires = ["groupType", "roomId", "clientGroup", "position"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    pushInfoService.getPushInfo(
        req.query["groupType"],
        req.query["roomId"], 
        req.query["clientGroup"],
        req.query["position"],    
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/checkPushInfo", (req, res) => {
    let requires = ["groupType", "roomId", "position"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
	console.log(req.query);
    	logger.warn("[checkPushInfo] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    pushInfoService.checkPushInfo(
        req.query["groupType"],
        req.query["roomId"], 
        req.query["clientGroup"] || "",
        req.query["position"],
        req.query["filterTime"],   
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;