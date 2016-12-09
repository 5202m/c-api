"use strict";
var logger =require("../../resources/logConf").getLogger("chatPraiseAPI");
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var chatPraiseService = require("../../service/chatPraiseService");
var ApiResult = require('../../util/APIUtil.js').APIResult;


router.get("/getPraiseNum", function(req, res){
    var praiseId = req.query["praiseId"],
        type = req.query["type"],
        platfrom = req.query["platfrom"];
    if(common.isBlank(praiseId)
        ||common.isBlank(type)
        ||common.isBlank(platfrom)){
        res.json(ApiResult(errorMessage.code_1000, null));
    }else{
        chatPraiseService.getPraiseNum(praiseId, type, platfrom, function(data){
            res.json(ApiResult(null, data));
        });
    }
});

router.get("/setPraise", function(req, res){
    var praiseId = req.query["praiseId"],
        type = req.query["type"],
        fromPlatform = req.query["fromPlatform"];
    if(common.isBlank(praiseId)
        ||common.isBlank(type)
        ||common.isBlank(fromPlatform)){
        res.json(ApiResult(errorMessage.code_1000, null));
    }else{
        chatPraiseService.setPraise(praiseId, type, fromPlatform, function(data){
            res.json(ApiResult(null, data));
        });
    }
});

module.exports =router;