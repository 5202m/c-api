/**
 * 摘要：财经数据API处理类
 * author:Dick.guo
 * date:2016/03/25
 */
var express = require('express');
var router = express.Router();
var ZxFinanceService = require('../../service/zxFinanceService.js');
var ApiResult = require('../../util/ApiResult.js');
var Logger = require('../../resources/logConf').getLogger("zxFinanceAPI");

/**
 * 财经数据列表
 */
router.get('/list', function(req, res) {
    var loc_param = {
        releaseTime : req.query["releaseTime"],    //财经日历发布时间（yyyy-MM-dd）
        dataTypeCon : req.query["dataTypeCon"]  //数据类型：1-外汇 2-贵金属
    };

    var loc_msg = null;
    if(!loc_param.releaseTime){
        loc_msg = "缺少参数[releaseTime]";
    }else if(!loc_param.dataTypeCon){
        loc_msg = "缺少参数[dataTypeCon]";
    }else if(!/^\d{4}\-\d{2}\-\d{2}$/.test(loc_param.releaseTime)){
        loc_msg = "参数错误[" + loc_param.releaseTime + "]";
    }else if(!/^[12]$/.test(loc_param.dataTypeCon)){
        loc_msg = "参数错误[" + loc_param.dataTypeCon + "]";
    }

    if(loc_msg != null){
        res.json(ApiResult.result(loc_msg, null));
    }else{
        loc_param.dataTypeCon = parseInt(loc_param.dataTypeCon, 10);
        ZxFinanceService.getFinanceData(loc_param.releaseTime, loc_param.dataTypeCon, function(err, data){
            res.json(ApiResult.result(null, data));
        });
    }
});

/**
 * 财经历史数据
 */
router.get('/history', function(req, res) {
    var loc_param = {
        basicIndexId : req.query["basicIndexId"],    //指标编号
        startTime : req.query["startTime"] || "",  //开始时间（yyyy-MM-dd）
        endTime : req.query["endTime"] || ""  //结束时间（yyyy-MM-dd）
    };

    var loc_msg = null;
    if(!loc_param.basicIndexId){
        loc_msg = "缺少参数[basicIndexId]";
    }else if(loc_param.startTime && !/^\d{4}\-\d{2}\-\d{2}$/.test(loc_param.startTime)){
        loc_msg = "参数错误[" + loc_param.startTime + "]";
    }else if(loc_param.endTime && !/^\d{4}\-\d{2}\-\d{2}$/.test(loc_param.endTime)){
        loc_msg = "参数错误[" + loc_param.endTime + "]";
    }

    if(loc_msg != null){
        res.json(ApiResult.result(loc_msg, null));
    }else{
        ZxFinanceService.getFinanceDataHis(loc_param.basicIndexId, loc_param.startTime, loc_param.endTime, function(err, data){
            if(err || !data){
                res.json(ApiResult.result("财经数据不存在[" + loc_param.basicIndexId + "]", null));
            }else{
                res.json(ApiResult.result(null, data));
            }
        });
    }
});

/**
 * 财经详情数据
 */
router.get('/detail', function(req, res) {
    var loc_dataId = req.query["dataId"];//财经日历编号

    if(!loc_dataId){
        res.json(ApiResult.result("缺少参数[dataId]", null));
    }else if(!/^[0-9a-fA-F]{24}$/.test(loc_dataId)) {
        res.json(ApiResult.result("参数错误[" + loc_dataId + "]", null));
    }else{
        ZxFinanceService.getFinanceDataDetail(loc_dataId, function(err, data){
            if(err || !data){
                res.json(ApiResult.result("财经数据不存在[" + loc_dataId + "]", null));
            }else{
                res.json(ApiResult.result(null, data));
            }
        });
    }
});

/**
 * 手动更新数据：预防异常情况
 */
router.get('/refresh', function(req, res) {
    var loc_params = {
        type : req.query["type"],  //类型 event、data
        date : req.query["date"]   //日期 yyyy-MM-dd
    };
    if(loc_params.type != "event" && loc_params.type != "data"){
        res.json(ApiResult.result("参数错误[type]:" + loc_params.type, null));
    }else if(!/^\d{4}-\d{2}-\d{2}$/.test(loc_params.date)) {
        res.json(ApiResult.result("参数错误[date]:" + loc_params.date, null));
    }else{
        if(loc_params.type == "event"){
            ZxFinanceService.importEventFromFxGold([loc_params.date], function(isOK){
                var msg = "手动更新财经事件‘" + loc_params.date + "’数据" + (isOK ? "成功" : "失败");
                Logger.debug(msg);
                res.json(ApiResult.result(null, msg));
            });
        }else if(loc_params.type == "data"){
            ZxFinanceService.importDataFromFxGold([loc_params.date], function(isOK){
                var msg = "手动更新财经数据‘" + loc_params.date + "’数据" + (isOK ? "成功" : "失败");
                Logger.debug(msg);
                res.json(ApiResult.result(null, msg));
            });
        }
    }
});

module.exports = router;
