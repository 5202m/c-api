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

router.get('/getSubscribeList', function(req, res) {
    var params = {
        groupType: req.query["groupType"],
        userId: req.query["userId"]
    };
    if(common.isBlank(params.userId)
        || common.isBlank(params.groupType)){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.getSubscribeList(params, (data) => {
        res.json(APIUtil.APIResultFromData(data));
    });
});

router.post('/saveSubscribe', function(req, res){
    var params = {
        groupType   : req.body["groupType"],
        type        : req.body["type"],
        userId      : req.body["userId"],
        analyst     : req.body["analyst"],
        noticeType  : req.body["noticeType"],
        startDate   : req.body["startDate"],
        endDate     : req.body["endDate"],
        point       : req.body["point"],
        userName    : req.body["userName"],
        Ip          : req.body["Ip"]
    };
    var requires = ["groupType","type","userId","analyst","noticeType"];
    var isNotSatify = requires.every((name) => {
        return common.isBlank(params[name]);
    });
    if(isNotSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.saveSubscribe(params, (data) => {
        res.json(APIUtil.APIResult(null, data));
    });
});

router.post('/modifySubscribe', function(req, res) {
    var params = {
        userName        : req.body["userName"],
        Ip              : req.body["Ip"],
        pointsRemark    : req.body["pointsRemark"],
        userId          : req.body["userId"],
        groupType       : req.body["groupType"],
        noticeType      : req.body["noticeType"],
        clientGroup     : req.body["clientGroup"],
        analyst         : req.body["analyst"],
        point           : req.body["point"],
        noticeCycle     : req.body["noticeCycle"],
        id              : req.body["id"]
    };
    var requires = ["groupType","id","userId","analyst","noticeType"];
    var isNotSatify = requires.every((name) => {
        return common.isBlank(params[name]);
    });
    if(isNotSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.modifySubscribe(params, (data) => {
        res.json(APIUtil.APIResult(null, data));
    });
});

router.post('/saveSubscribe4UTM', function(req, res) {
    //groupType, userId, subscribeType, isAdd
    var params = {
        userId          : req.body["userId"],
        groupType       : req.body["groupType"],
        subscribeType   : req.body["subscribeType"],
        isAdd           : req.body["isAdd"]
    };
    var isNotSatify = ["userId","groupType","subscribeType"].every((name) => {
        return common.isBlank(params[name]);
    });
    if(isNotSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    SubscribeService.saveSubscribe4UTM(params.groupType, params.userId, params.subscribeType, params.isAdd, (data) => {
        res.json(APIUtil.APIResultFromData(data));
    });
    
});

router.get('/getSubscribeTypeList', function(req, res) {
    //groupType, userId, subscribeType, isAdd
    var params = {
        groupType : req.query["groupType"]
    };
    if(common.isBlank(params.groupType)){
        res.json(APIUtil.APIResult("code_1000", null));
    }
    SubscribeService.getSubscribeTypeList(params, (data) => {
        res.json(APIUtil.APIResultFromData(data));
    });
    
});
//getSubscribeTypeList


module.exports = router;
