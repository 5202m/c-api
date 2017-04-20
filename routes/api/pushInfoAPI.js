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
//pushInfoAPI
var logger =require("../../resources/logConf").getLogger("pushInfoAPI");
var express = require('express');
var router = express.Router();
var pushInfoService = require('../../service/pushInfoService');
var common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

/**
 * @api {get} /pushInfo/getPushInfo 提取信息推送列表
 * @apiName getPushInfo
 * @apiGroup pushInfo
 *
 * @apiParam {String} groupType 组别，必填.取userInfo.groupType值
 * @apiParam {String} roomId 房间Id，必填.取userInfo.groupId值
 * @apiParam {String} clientGroup 用户组别，必填 取userInfo.clientGroup值
 * @apiParam {Number} position 推送位置，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/pushInfo/getPushInfo
 * @apiExample Example usage:
 *  /api/pushInfo/getPushInfo?groupType=studio&roomId=studio_teach&clientGroup=register&position=3
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
router.get("/getPushInfo", (req, res) => {
    let requires = ["groupType", "roomId", "clientGroup", "position"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    pushInfoService.getPushInfo(
        req.query["groupType"],
        req.query["roomId"], 
        req.query["clientGroup"],
        req.query["position"],    
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /pushInfo/checkPushInfo 检查推送是否符合条件
 * @apiName checkPushInfo
 * @apiGroup pushInfo
 *
 * @apiParam {String} groupType 组别，必填.取userInfo.groupType值
 * @apiParam {String} roomId 房间Id，必填.取userInfo.groupId值
 * @apiParam {Number} position 推送位置，必填
 * @apiParam {String} clientGroup 用户组别 取userInfo.clientGroup值
 * @apiParam {Boolean} filterTime 是否过滤时间
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/pushInfo/checkPushInfo
 * @apiExample Example usage:
 *  /api/pushInfo/checkPushInfo?groupType=studio&roomId=studio_teach&clientGroup=register&position=3&filterTime=true
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
router.get("/checkPushInfo", (req, res) => {
    let requires = ["groupType", "roomId", "position"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
	console.log(req.query);
    	logger.warn("[checkPushInfo] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    pushInfoService.checkPushInfo(
        req.query["groupType"],
        req.query["roomId"], 
        req.query["clientGroup"] || "",
        req.query["position"],
        req.query["filterTime"],   
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;