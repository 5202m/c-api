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
"use strict";
const logger = require("../../resources/logConf").getLogger("visitorAPI");
const router = require('express').Router();
const visitorService = require('../../service/visitorService');
const common = require('../../util/common');
const APIUtil = require('../../util/APIUtil.js');
//saveVisitorRecord: (type, dasData)
//getVistiorByName: (groupType,roomId, nickname)

router.post("/saveVisitorRecord", (req, res) => {
    let requires = ["type", "dasData"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if (!isSatify) {
        logger.warn("[saveVisitorRecord] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let type = req.body.type;
    let dasData = JSON.parse(req.body.dasData);
    visitorService.saveVisitorRecord(type, dasData)
        .then(result => {
            res.json(APIUtil.APIResult(null, { isOK: true }));
        })
        .catch(err => {
            logger.warn("visitorService.saveVisitorRecord fail!", err);
            res.json(APIUtil.APIResult("code_10", null));
        });
});

router.get("/getVistiorByName", (req, res) => {
    let requires = ["groupType", "roomId", "nickname"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("[getVistiorByName] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let groupType = req.query.groupType;
    let roomId = req.query.roomId;
    let nickname = req.query.nickname;
    visitorService.getVistiorByName(groupType, roomId, nickname)
        .then(data => {
            res.json(APIUtil.APIResult(null, data));
        })
        .catch(err => {
            logger.warn("visitorService.saveVisitorRecord fail!", err);
            res.json(APIUtil.APIResult("code_10", null));
        });
});

module.exports = router;