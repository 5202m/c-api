/**
 * 摘要：财经数据API处理类
 * author:Dick.guo
 * date:2016/03/25
 */
var express = require('express');
var router = express.Router();
var ZxFinanceService = require('../../service/zxFinanceService.js');

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
        res.json({
            ret_code:"1",
            ret_msg : loc_msg
        });
    }else{
        loc_param.dataTypeCon = parseInt(loc_param.dataTypeCon, 10);
        ZxFinanceService.getFinanceData(loc_param.releaseTime, loc_param.dataTypeCon, function(err, data){
            res.json({
                ret_code : "0",
                ret_msg  : "成功",
                financeEvent : data.financeEvent,
                financeVacation : data.financeVacation,
                financeData : data.financeData
            });
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
        res.json({
            ret_code:"1",
            ret_msg : loc_msg
        });
    }else{
        ZxFinanceService.getFinanceDataHis(loc_param.basicIndexId, loc_param.startTime, loc_param.endTime, function(err, data){
            if(err || !data){
                res.json({
                    ret_code:"1",
                    ret_msg : "财经数据不存在[" + loc_param.basicIndexId + "]"
                });
            }else{
                res.json({
                    ret_code:"0",
                    ret_msg : "成功",
                    detail : data.detail,
                    history : data.history
                });
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
        res.json({
            ret_code:"1",
            ret_msg : "缺少参数[dataId]"
        });
    }else if(!/^[0-9a-fA-F]{24}$/.test(loc_dataId)) {
        res.json({
            ret_code:"1",
            ret_msg : "参数错误[" + loc_dataId + "]"
        });
    }else{
        ZxFinanceService.getFinanceDataDetail(loc_dataId, function(err, data){
            if(err || !data){
                res.json({
                    ret_code:"1",
                    ret_msg : "财经数据不存在[" + loc_dataId + "]"
                });
            }else{
                res.json({
                    ret_code:"0",
                    ret_msg : "成功",
                    detail : data
                });
            }
        });
    }
});

module.exports = router;
