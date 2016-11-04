/**
 * 摘要：聊天室相关 API处理类
 * author:alan.wu
 * date:2015/8/7
 */
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage.js');
var chatService = require('../../service/chatService');
var userService = require('../../service/userService');
var ApiResult = require('../../util/ApiResult');

/**
 * 获取聊天信息
 */
router.get(/^\/getMessageList(\.(json|xml))?$/, function(req, res) {
    var params=req.query;
    if(!params.pageNo||params.pageNo <= 0){
        params.pageNo = 1;
    }
    params.pageNo=parseInt(params.pageNo);
    params.pageSize=parseInt(params.pageSize)||15;
    if(isNaN(params.pageNo)||isNaN(params.pageSize)){
        if(req.path.indexOf('.xml')!=-1){
            res.end(ApiResult.result(errorMessage.code_1000,null,ApiResult.dataType.xml));
        }else{
            res.json(ApiResult.result(errorMessage.code_1000));
        }
    }else{
        chatService.getMessagePage(params,function(page){
            if(req.path.indexOf('.xml')!=-1){
                res.end(ApiResult.result(null,page,ApiResult.dataType.xml));
            }else{
                res.json(ApiResult.result(null,page));
            }
        });
    }
});

/**
 * 检查客户是否已经点赞
 * 已点赞返回false，否则返回true
 */
router.post("/checkChatPraise", function(req, res) {
    var clientId=req.body.clientId,praiseId=req.body.praiseId,fromPlatform=req.body.fromPlatform;
    if(common.isBlank(clientId)||common.isBlank(praiseId)||common.isBlank(fromPlatform)){
        res.json({result:true});
    }else{
        chatService.checkChatPraise(clientId,praiseId,fromPlatform,function(isOK){
            res.json({result:isOK});
        });
    }
});

/**
 * 按照手机号查询客户信息
 */
router.get("/getMemberInfo", function(req, res) {
    var params = {
        groupType : req.query["groupType"],
        mobilePhone : req.query["mobilePhone"],
        userId : req.query["userId"]
    };
    if(common.isBlank(params.groupType)||(common.isBlank(params.mobilePhone)&&common.isBlank(params.userId))){
        res.json(null);
    }else{
        userService.getMemberInfo(params, function(err, member){
            res.json(member);
        });
    }
});

/**
 * 查询分析师信息（点赞+胜率）
 */
router.get("/getAnalysts", function(req, res) {
    var platform = req.query["platform"];
    var analystIds = req.query["analystIds"];
    if(common.isBlank(platform) || common.isBlank(analystIds)){
        res.json(null);
    }else{
        chatService.getAnalystInfo(platform, analystIds, function(analysts){
            res.json(analysts);
        });
    }
});

/**
 * 分析师点赞
 */
router.post("/praiseAnalyst", function(req, res) {
    var platform = req.body["platform"] || req.query["platform"];
    var analystId = req.body["analystId"] || req.query["analystId"];
    if(common.isBlank(analystId) || common.isBlank(platform)){
        res.json({isOK:false, msg:'参数错误', num : 0});
    }else{
        chatService.praiseAnalyst(platform, analystId, function(result){
            res.json(result);
        });
    }
});

/**
 * 分析师晒单
 */
router.get("/getShowTrade", function(req, res) {
    var params = {
        platform : req.query["platform"],
        userId : req.query["userId"],
        tradeType : req.query["tradeType"] || 1,
        onlyHis : req.query["onlyHis"] != 0,
        num : req.query["num"]
    };
    if(!params.platform || !params.userId){
        res.json(ApiResult.result(errorMessage.code_1000, null));
        return;
    }
    if(params.num){
        params.num = parseInt(params.num, 10);
        if(isNaN(params.num)){
            params.num = 2;
        }
    }
    chatService.getShowTrade(params, function(result){
        res.json(result);
    });
});
module.exports = router;
