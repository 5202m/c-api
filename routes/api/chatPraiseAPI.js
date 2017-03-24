/**
 * @apiDefine ParametersMissedError
 *
 * @apiError ParametersMissed 参数没有传完整，无法完成请求。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     -{
 *      "result": "1000",
 *      "msg": "没有指定参数!"
 *  }
 */
/**
 * @apiDefine ParametersDataBrokenError
 * 
 * @apiError ParametersDataBroken 参数数据格式错误，无法完成请求。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     -{
 *      "result": "2003",
 *      "msg": "参数数据错误！"
 *  } 
 */
/**
 * @apiDefine CommonResultDescription
 * 
 * @apiSuccess {Number} result 结果码，0 - 成功；-1 - 未知或未定义的错误；other - API系统定义的错误
 * @apiSuccess {String} errmsg  错误信息.
 * @apiSuccess {Number} errcode  错误码.
 */
"use strict";
var logger =require("../../resources/logConf").getLogger("chatPraiseAPI");
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage');
var chatPraiseService = require("../../service/chatPraiseService");
var ApiResult = require('../../util/APIUtil.js').APIResult;

/**
 * @api {get} /chatPraise/getPraiseNum 获取点赞数
 * @apiName getPraiseNum
 * @apiGroup chatPraise
 *
 * @apiParam {String} praiseId 点赞ID
 * @apiParam {String} type 点赞人的类型
 * @apiParam {String} platfrom 平台
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/chatPraise/getPraiseNum
 * @apiExample Example usage:
 *  /api/chatPraise/getPraiseNum?praiseId=caiyizhu&type=user&platfrom=studio
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "result": 0,
 *     "errcode": "0",
 *     "errmsg": "",
 *     "data": [{
 *             "_id": "5747d1e8c6eb5fe769aab017",
 *             "praiseId": "caiyizhu",
 *             "praiseType": "user",
 *             "fromPlatform": "studio",
 *             "__v": 0,
 *             "praiseNum": 16
 *         }
 *     ]
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getPraiseNum", function(req, res){
    var praiseId = req.query["praiseId"],
        type = req.query["type"],
        platfrom = req.query["platfrom"];
    if(common.isBlank(type)
        ||common.isBlank(platfrom)){
        res.json(ApiResult(errorMessage.code_1000, null));
    }else{
        chatPraiseService.getPraiseNum(praiseId, type, platfrom, function(data){
            res.json(ApiResult(null, data));
        });
    }
});
/**
 * @api {get} /chatPraise/setPraise 设置点赞
 * @apiName setPraise
 * @apiGroup chatPraise
 *
 * @apiParam {String} praiseId 点赞ID
 * @apiParam {String} type 点赞人的类型
 * @apiParam {String} fromPlatform 平台
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/chatPraise/setPraise
 * @apiExample Example usage:
 *  /api/chatPraise/setPraise?praiseId=caiyizhu&type=user&fromPlatform=studio
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "result": 0,
 *     "errcode": "0",
 *     "errmsg": "",
 *     "data": {
 *         "isOK": true
 *     }
 * }
 *
 * @apiUse ParametersMissedError
 */
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