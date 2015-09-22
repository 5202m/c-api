/**
 * 摘要：回复 API处理类
 * author:Dick.guo
 * date:2015/8/4
 */
var express = require('express');
var router = express.Router();
var ReplyService = require('../../service/replyService.js');
var APIUtil = require('../../util/APIUtil'); 	 	   //引入API工具类js
var CommonJS = require('../../util/common.js');

/**
 * 回帖
 */
router.post('/add', function(req, res){
    APIUtil.logRequestInfo(req, "replyAPI");
    var loc_reply = {
        ip : CommonJS.getClientIp(req),
        sMemberId : req.body["sMemberId"],    //发帖人Id
        memberId : req.body["memberId"],      //回帖人Id
        topicId : req.body["topicId"],
        content : req.body["content"],
        device : req.body["device"],
        type : parseInt(req.body["type"], 10)        //1-回帖 2-文章回复
    };

    var loc_opType = 1;
    var loc_replyId = req.body["replyId"];
    if(loc_replyId && typeof loc_replyId === "string"){
        loc_opType = 2;
        loc_reply.replyId = loc_replyId;
    }

    if(!loc_reply.memberId
        || !loc_reply.topicId
        || !loc_reply.content){
        console.error("reply information is invalid! ", loc_reply);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_reply.memberId !== "string"
        || typeof loc_reply.topicId !== "string"
        || typeof loc_reply.content !== "string"
        || isNaN(loc_reply.type)){
        console.error("reply information is invalid! ", loc_reply);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    if(loc_reply.type !== 1 && loc_reply.type !== 2){
        console.error("reply information is invalid! ", loc_reply);
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }

    if(!loc_reply.device){
        loc_reply.device = "";
    }
    ReplyService.addReply(loc_opType, loc_reply, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;
