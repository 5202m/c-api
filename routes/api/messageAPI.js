var logger =require("../../resources/logConf").getLogger("messageAPI");
var express = require('express');
var router = express.Router();
var messageService = require('../../service/messageService');
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage');
let APIUtil = require('../../util/APIUtil.js');

 
router.get("/loadMsg", (req, res) => {
    let requires = ["groupType", "groupId", "userId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let userInfo = {};
    requires.forEach(function(name){
        userInfo[name] = req.query[name];
    });
    userInfo.toUser = req.query.toUser || {};
    messageService.loadMsg(
        userInfo, 
        req.query["lastPublishTime"],
        (req.query["allowWhisper"] === true),   
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.post("/saveMsg", (req, res) => {
    let msgData = req.body["messageData"];
    if(!msgData){
        logger.warn("Parameters missed! Expecting parameters: msgData");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let requires = ["userId", "nickname", "groupId", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(msgData["fromUser"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters in msgData['fromUser']: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    messageService.saveMsg(
        msgData, 
        req.body["approvalUserArr"], 
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/existRecord", (req, res) => {
    if(!req.query){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    messageService.existRecord( 
        req.query,   
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getWhUseMsgCount", (req, res) => {
    let requires = ["groupType", "groupId", "userType", "whUserTypeArr", "toUserId", "lastOfflineDate"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
	logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    messageService.getWhUseMsgCount(
        req.query["groupType"],
        req.query["groupId"], 
        req.query["userType"],
        req.query["whUserTypeArr"], 
        req.query["toUserId"],
        req.query["lastOfflineDate"],   
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/loadBigImg", (req, res) => {
    let requires = ["userId", "publishTime"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
	logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    messageService.loadBigImg(
        req.query["userId"],
        req.query["publishTime"], 
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.post("/deleteMsg", (req, res) => {
    let isSatify = req.body && "publishTimeArr" in req.body;
    if(!isSatify){
	logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    messageService.deleteMsg(
        req.body, 
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getLastTwoDaysMsg", (req, res) => {
    let requires = ["groupType", "groupId", "userId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    messageService.getLastTwoDaysMsg(
        req.query, 
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

module.exports = router;
