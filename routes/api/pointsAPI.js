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
var common = require('../../util/common');
var ChatPointsService = require('../../service/chatPointsService.js');
var APIUtil = require('../../util/APIUtil.js');

/**
 * @api {get} /points/pointsInfo 查询积分信息
 * @apiName pointsInfo
 * @apiGroup points
 *
 * @apiParam {String} groupType 组别，必填.取直播间groupType值
 * @apiParam {String} userId 用户ID，必填.
 * @apiParam {String} noJournal 是否查询积分记录
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/points/pointsInfo
 * @apiExample Example usage:
 *  /api/points/pointsInfo?groupType=studio&userId=13800138075&noJournal=0
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
router.get('/pointsInfo', function(req, res) {
    var params = {
        groupType: req.query["groupType"],
        userId: req.query["userId"],
        hasJournal: req.query["noJournal"] != "1",
    };
    common.wrapSystemCategory(params, req.query.systemCategory);
    if (common.isBlank(params.groupType) ||
        common.isBlank(params.userId)) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    //查询积分
    ChatPointsService.getPointsInfo(params, function(pointsInfo) {
        //    res.json(pointsInfo);
        if (pointsInfo) {
            res.json(APIUtil.APIResult(null, pointsInfo));
        } else {
            res.json(APIUtil.APIResult("code_3003", null));
        }
    });
});

/**
 * @api {post} /points/add 增加积分
 * @apiName add
 * @apiGroup points
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} clientGroup 客户组别，必填 取直播间userInfo里的clientGroup值
 * @apiParam {String} userId 用户ID，必填
 * @apiParam {String} item 积分类别，必填 具体参数可到直播间mis后台字典管理-积分项目中查询
 * @apiParam {String} tag 标签
 * @apiParam {Number} val 积分变化
 * @apiParam {Boolean} isGlobal 是否总积分更新
 * @apiParam {String} remark 备注
 * @apiParam {String} opUser 操作人
 * @apiParam {String} opIp 操作IP
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/points/add
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupType": "studio",
 *       "clientGroup": "notActive",
 *       "userId": "13800138012",
 *       "item": "daily_sign",
 *       "tag": "",
 *       "val": 0,
 *       "isGlobal": "1",
 *       "remark": "每日签到",
 *       "opUser": "sxunppxunpxix",
 *       "opIp": "127.0.0.1"
 *     }
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
router.post('/add', function(req, res) {
    var params = {
        groupType: req.body["groupType"],
        clientGroup: req.body["clientGroup"] || "",
        userId: req.body["userId"],
        item: req.body["item"],
        tag: req.body["tag"] || "",
        val: req.body["val"],
        isGlobal: req.body["isGlobal"] == "1",
        remark: req.body["remark"] || "",
        opUser: req.body["opUser"] || "",
        opIp: req.body["opIp"] || ""
    };
    if (common.isBlank(params.groupType) ||
        common.isBlank(params.userId) ||
        common.isBlank(params.item)) {
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    if (common.isBlank(params.val)) {
        params.val = 0;
    } else {
        params.val = parseInt(params.val, 10);
        if (isNaN(params.val)) {
            params.val = 0;
        }
    }
    common.wrapSystemCategory(params, req.body.systemCategory);
    //添加积分
    ChatPointsService.add(params, function(apiResult) {
        if (apiResult) {
            res.json(apiResult);
        } else {
            res.json(APIUtil.APIResult("code_3002", null));
        }
    });
});

/**
 * @api {get} /points/getChatPointsConfig 查询积分配置表
 * @apiName getChatPointsConfig
 * @apiGroup points
 *
 * @apiParam {String} groupType 组别，必填.取直播间groupType值
 * @apiParam {String} type 类别，必填.
 * @apiParam {String} item 项目，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/points/getChatPointsConfig
 * @apiExample Example usage:
 *  /api/points/getChatPointsConfig?groupType=studio&type=daily&item=daily_sign
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
router.get("/getChatPointsConfig", (req, res) => {
    let requires = ["groupType", "type", "item"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    ChatPointsService.getChatPointsConfig(
        req.query,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;