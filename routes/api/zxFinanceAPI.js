/**
 * 摘要：财经数据API处理类
 * author:Dick.guo
 * date:2016/03/25
 */
/**
 * @apiDefine ParameterNotAvailableJSONError
 *
 * @apiError ParameterNotAvailableJSONError 参数数据不是合法的JSON字符串。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 1,
 *          "errcode": "10",
 *          "errmsg": "操作异常!",
 *          "data": null
 *      }
 */
/**
 * @apiDefine CommonResultDescription
 *
 * @apiSuccess {Number} result 结果码，0 - 成功；-1 - 未知或未定义的错误；other - API系统定义的错误
 * @apiSuccess {String} errmsg  错误信息.
 * @apiSuccess {Number} errcode  错误码.
 */
var express = require('express');
var router = express.Router();
var ZxFinanceService = require('../../service/zxFinanceService.js');
var ApiResult = require('../../util/ApiResult.js');
var Logger = require('../../resources/logConf').getLogger("zxFinanceAPI");

/**
 * @api {get} /zxFinanceData/list 财经数据列表
 * @apiName list
 * @apiGroup zxFinanceData
 *
 * @apiParam {String} releaseTime 财经日历发布时间，必填
 * @apiParam {String} dataTypeCon 数据类型：1-外汇 2-贵金属，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/zxFinanceData/list
 * @apiExample Example usage:
 *  /api/zxFinanceData/list?releaseTime=2017-04-104&dataTypeCon=1
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
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
        ZxFinanceService.getFinanceDataCache(loc_param.releaseTime, loc_param.dataTypeCon, function(err, data){
            res.json(ApiResult.result(null, data));
        });
    }
});

/**
 * @api {get} /zxFinanceData/history 财经历史数据
 * @apiName history
 * @apiGroup zxFinanceData
 *
 * @apiParam {String} basicIndexId 指标编号，必填
 * @apiParam {String} startTime 开始时间，必填
 * @apiParam {String} endTime 结束时间，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/zxFinanceData/history
 * @apiExample Example usage:
 *  /api/zxFinanceData/history?basicIndexId=254&startTime=2016-12-01&endTime=2017-01-12
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
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
        ZxFinanceService.getFinanceDataHisCache(loc_param.basicIndexId, loc_param.startTime, loc_param.endTime, function(err, data){
            if(err || !data){
                res.json(ApiResult.result("财经数据不存在[" + loc_param.basicIndexId + "]", null));
            }else{
                res.json(ApiResult.result(null, data));
            }
        });
    }
});

/**
 * @api {get} /zxFinanceData/detail 财经详情数据
 * @apiName detail
 * @apiGroup zxFinanceData
 *
 * @apiParam {String} dataId 财经日历编号，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/zxFinanceData/detail
 * @apiExample Example usage:
 *  /api/zxFinanceData/detail?dataId=5703789c0cc7efb80e4bf441
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get('/detail', function(req, res) {
    var loc_dataId = req.query["dataId"];//财经日历编号

    if(!loc_dataId){
        res.json(ApiResult.result("缺少参数[dataId]", null));
    }else if(!/^[0-9a-fA-F]{24}$/.test(loc_dataId)) {
        res.json(ApiResult.result("参数错误[" + loc_dataId + "]", null));
    }else{
        ZxFinanceService.getFinanceDataDetailCache(loc_dataId, function(err, data){
            if(err || !data){
                res.json(ApiResult.result("财经数据不存在[" + loc_dataId + "]", null));
            }else{
                res.json(ApiResult.result(null, data));
            }
        });
    }
});

/**
 * @api {get} /zxFinanceData/refresh 手动更新数据：预防异常情况
 * @apiName refresh
 * @apiGroup zxFinanceData
 *
 * @apiParam {String} type 类型 event、data，必填
 * @apiParam {String} date 日期 yyyy-MM-dd，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/zxFinanceData/refresh
 * @apiExample Example usage:
 *  /api/zxFinanceData/refresh?type=event&date=2017-04-11
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
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
                Logger.info(msg);
                res.json(ApiResult.result(null, msg));
            });
        }else if(loc_params.type == "data"){
            ZxFinanceService.importDataFromFxGold([loc_params.date], function(isOK){
                var msg = "手动更新财经数据‘" + loc_params.date + "’数据" + (isOK ? "成功" : "失败");
                Logger.info(msg);
                res.json(ApiResult.result(null, msg));
            });
        }
    }
});

/**
 * 获取最后点评的数据
 */
router.get('/getLastReview', function(req, res){
    ZxFinanceService.getFinanceDataLastReview(function(data){
        res.json(data);
    });
});

//adding this is for formatted response.
/**
 * @api {get} /zxFinanceData/getFinanceDataLastReview 获取最后点评的数据
 * @apiName getFinanceDataLastReview
 * @apiGroup zxFinanceData
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/zxFinanceData/getFinanceDataLastReview
 * @apiExample Example usage:
 *  /api/zxFinanceData/getFinanceDataLastReview
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get('/getFinanceDataLastReview', function(req, res){
    ZxFinanceService.getFinanceDataLastReview(function(data){
        res.json(ApiResult.result(null, data));
    });
});

module.exports = router;
