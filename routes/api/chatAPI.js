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
var SyllabusService = require('../../service/syllabusService');
var APIUtil = require('../../util/APIUtil'); 	 	            //引入API工具类js
var ApiResult = require('../../util/ApiResult');
var constant = require('../../constant/constant');
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
 * 获取指定日期课程安排
 */
router.get("/getCourse", function(req, res) {
    var loc_params = {
        platform : req.query["platform"],
        groupType : req.query["groupType"],
        groupId : req.query["groupId"]
    };
    var isInitDef = /^(app|webui)$/i.test(loc_params.platform);
    if(!loc_params.groupType && isInitDef){
        loc_params.groupType = constant.defStudioGroup.groupType;
    }
    if(!loc_params.groupId && loc_params.groupType == constant.defStudioGroup.groupType && isInitDef){
        loc_params.groupId = constant.defStudioGroup.groupId;
    }
    if(!loc_params.groupType){
        res.json(APIUtil.APIResult("code_1000", null, null));
        return;
    }
    //查询课程安排
    SyllabusService.getCourse(loc_params.groupType, loc_params.groupId, new Date(), function(apiResult){
        res.json(apiResult);
    });
});
module.exports = router;
