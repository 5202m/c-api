/**
 * 摘要：积分API处理类
 * author:Dick.guo
 * date:2016/9/14
 */
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var ChatPointsService = require('../../service/chatPointsService.js');
var APIUtil = require('../../util/APIUtil.js');

/**
 * 查询积分信息
 */
router.get('/pointsInfo', function(req, res) {
    var params = {
        groupType : req.query["groupType"],
        userId : req.query["userId"],
        hasJournal : req.query["noJournal"] != "1"
    };
    if(common.isBlank(params.groupType)
        || common.isBlank(params.userId)){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    //查询积分
    ChatPointsService.getPointsInfo(params.groupType, params.userId, params.hasJournal, function(pointsInfo){
    //    res.json(pointsInfo);
        if(pointsInfo){
            res.json(APIUtil.APIResult(null, pointsInfo));
        } else {
            res.json(APIUtil.APIResult("code_3003", null));
        }
    });
});

/**
 * 增加积分
 */
router.post('/add', function(req, res) {
    var params = {
        groupType : req.body["groupType"],
        clientGroup : req.body["clientGroup"] || "",
        userId : req.body["userId"],
        item : req.body["item"],
        tag : req.body["tag"] || "",
        val : req.body["val"],
        isGlobal : req.body["isGlobal"] == "1",
        remark : req.body["remark"] || "",
        opUser : req.body["opUser"] || "",
        opIp : req.body["opIp"] || ""
    };
    if(common.isBlank(params.groupType)
        || common.isBlank(params.userId)
        || common.isBlank(params.item)){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    if(common.isBlank(params.val)){
        params.val = 0;
    }else{
        params.val = parseInt(params.val, 10);
        if(isNaN(params.val)){
            params.val = 0;
        }
    }

    //添加积分
    ChatPointsService.add(params, function(apiResult){
        if(apiResult){
            res.json(apiResult);
        } else {
            res.json(APIUtil.APIResult("code_3002", null));
        }
    });
});

module.exports = router;
