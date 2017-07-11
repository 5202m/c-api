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
var logger = require("../../resources/logConf").getLogger("showTradeAPI");
var express = require('express');
var router = express.Router();
var showTradeService = require('../../service/showTradeService');
var common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');
let ApiResult = require('../../util/ApiResult'); //引起聊天室工具类js
/**
 * @api {get} /showTrade/getShowTrade 获取指定用户晒单数据
 * @apiName getShowTrade
 * @apiGroup showTrade
 *
 * @apiParam {String} groupType 成员类型，必需. 取直播间groupType值
 * @apiParam {String} [userNo] 用户ID，必需
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/showTrade/getShowTrade
 * @apiExample Example usage:
 *  /api/showTrade/getShowTrade?groupType=studio&userNo=fxcviisincnxv
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "msg": "OK",
 *          "pageNo": 1,
 *          "pageSize": 15,
 *          "totalRecords": 0,
 *          "data": [
 *          {...},{...}
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getShowTrade", (req, res) => {
    let requires = ["groupType", "userNo"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("[getShowTrade] Parameters missed! Expecting parameters: ", requires, req.query);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    showTradeService.getShowTrade(
        req.query["groupType"],
        req.query["userNo"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

/**
 * @api {get} /showTrade/getShowTradeList 获取指定条数晒单数据
 * @apiName getShowTradeList
 * @apiGroup showTrade
 *
 * @apiParam {String} groupType 成员类型，必需. 取直播间groupType值
 * @apiParam {String} pageSize 条数，必需
 * @apiParam {Number} pageNo 页码
 * @apiParam {String} [userNo] 指定用户的晒单，查所有可不传
 * @apiParam {Number} [tradeType] 晒单类型 1：分析师晒单，2：客户晒单 查所有可不传
 * @apiParam {Number} [status] 状态：0 待审核， 1 审核通过， -1 审核不通过 查所有可不传
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/showTrade/getShowTradeList
 * @apiExample Example usage:
 *  /api/showTrade/getShowTradeList?groupType=studio&pageSize=100&pageNo=1
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK //pageNo不为空时返回的数据结果
 *     {
 *       result: 0,
 *       msg: "OK",
 *       pageNo: "1",
 *       pageSize: "100",
 *       totalRecords: 100,
 *       data:[{}]
 *      }
 *     HTTP/1.1 200 OK //pageNo为空时返回的数据结果
 *     { result: 0,
 *       errcode: '0',
 *       errmsg: '',
 *       data:
 *        {
 *          tradeList: [{}]
 *        }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getShowTradeList", (req, res) => {
    let requires = ["groupType", "pageSize"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("[getShowTradeList] Parameters missed! Expecting parameters: ", requires, req.query);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    showTradeService.getShowTradeList(
        req.query,
        (data) => {
            if (req.query['pageNo']) {
                res.json(ApiResult.result(null, data));
            } else {
                res.json(APIUtil.APIResultFromData(data));
            }
        }
    );
});

/**
 * @api {post} /showTrade/addShowTrade 添加晒单
 * @apiName addShowTrade
 * @apiGroup showTrade
 *
 * @apiParam {String} groupType 组别，必填 取直播间groupType值
 * @apiParam {String} userNo 用户ID，必填
 * @apiParam {String} avatar 用户头像，必填
 * @apiParam {String} userName 用户昵称，必填
 * @apiParam {String} telePhone 手机号
 * @apiParam {String} tradeImg 晒单图片URL，必填
 * @apiParam {String} [remark] 心得，选填
 * @apiParam {String} Ip 添加晒单的IP，必填
 * @apiParam {String} [title] 晒单的标题，选填
 * @apiParam {Number} tradeType 类别 1 分析师晒单，2 客户晒单，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/showTrade/addShowTrade
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupType": "studio",
 *       "userNo": "sxunppxunpxix",
 *       "avatar": "http://xxx.xxx.xxx/xx.jpg",
 *       "userName": "beatp",
 *       "telePhone": "13800138000",
 *       "tradeImg": "http://xxx.xxx.xxx/xx.jpg",
 *       "remark": "小赚了一笔",
 *       "Ip": "192.168.35.91",
 *       "title": "小赚了一笔",
 *       "tradeType": 2
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
router.post("/addShowTrade", (req, res) => {
    let requires = [
        "groupType",
        "userNo",
        "avatar",
        "userName",
        "tradeImg",
        "Ip",
        "tradeType",
        "telePhone"
    ];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[addShowTrade] Parameters missed! Expecting parameters: ", requires, req.body);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    showTradeService.addShowTrade(
        req.body,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {get} /showTrade/setShowTradePraise 更新晒单点赞数
 * @apiName setShowTradePraise
 * @apiGroup showTrade
 *
 * @apiParam {String} praiseId 晒单数据ID，必需.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/showTrade/setShowTradePraise
 * @apiExample Example usage:
 *  /api/showTrade/setShowTradePraise?praiseId=58b690a812bef5f790df34b1
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     { result: 0,
 *       errcode: '0',
 *       errmsg: '',
 *       data:
 *        {
 *        ...
 *        }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/setShowTradePraise", (req, res) => {
    if (common.isBlank(req.query["praiseId"])) {
        logger.warn("[setShowTradePraise] Parameters missed! Expecting parameter: ", "praiseId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    showTradeService.setShowTradePraise(
        req.query,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {get} /showTrade/getShowTradeByIds 根据ID获取晒单数据
 * @apiName getShowTradeByIds
 * @apiGroup showTrade
 *
 * @apiParam {String} tradeIds 晒单数据ID，多个用,隔开，必需.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/showTrade/getShowTradeByIds
 * @apiExample Example usage:
 *  /api/showTrade/getShowTradeByIds?tradeIds=58b690a812bef5f790df34b1
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     { result: 0,
 *       errcode: '0',
 *       errmsg: '',
 *       data:
 *        {
 *        ...
 *        }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getShowTradeByIds", (req, res) => {
    if (common.isBlank(req.query["tradeIds"])) {
        logger.warn("[addShowTrade] Parameters missed! Expecting parameter: ", "tradeIds");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    showTradeService.getShowTradeByIds(
        req.query["tradeIds"].split(","),
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
/**
 * @api {post} /showTrade/addComments 添加晒单评论
 * @apiName addComments
 * @apiGroup showTrade
 *
 * @apiParam {String} id 晒单数据ID，必填。
 * @apiParam {Object} userInfo 用户信息，必填。
 * @apiParam {String} userInfo.mobilePhone 用户手机号码
 * @apiParam {String} userInfo.nickname 用户昵称。
 * @apiParam {String} userInfo.avatar 用户头像。
 * @apiParam {String} content 评论内容，必填。
 * @apiParam {String} refId 被评论的评论ID。
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/showTrade/addComments
 * @apiParamExample {json} Request-Example:
 *     {
 *       "groupType": "studio",
 *       "userNo": "sxunppxunpxix",
 *       "avatar": "http://xxx.xxx.xxx/xx.jpg",
 *       "userName": "beatp",
 *       "telePhone": "13800138000",
 *       "tradeImg": "http://xxx.xxx.xxx/xx.jpg",
 *       "remark": "小赚了一笔",
 *       "Ip": "192.168.35.91",
 *       "title": "小赚了一笔",
 *       "tradeType": 2
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
router.post("/addComments", (req, res) => {
    let requires = ["id", "userInfo", "content"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[addComments] Parameters missed! Expecting parameters: ", requires, req.body);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    showTradeService.addComments(req.body)
        .then(data => {
            res.json(APIUtil.APIResult(null, data));
        }).catch(e => {
            logger.error("addComments Failure!", e);
            res.json(APIUtil.APIResult(null, e));
        });
})

module.exports = router;