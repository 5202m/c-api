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
let logger = require("../../resources/logConf").getLogger("syllabusAPI");
let express = require('express');
let router = express.Router();
let syllabusService = require('../../service/syllabusService');
let common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

/**
 * @api {get} /syllabus/getSyllabus 查询聊天室课程安排(一周完整课表安排)
 * @apiName getSyllabus
 * @apiGroup syllabus
 *
 * @apiParam {String} groupType 组别，必填. 取直播间groupType值
 * @apiParam {String} today 当天的时间戳
 * @apiParam {String} groupId 房间Id，取直播间userInfo.groupId值
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/syllabus/getSyllabus
 * @apiExample Example usage:
 *  /api/syllabus/getSyllabus?groupType=studio&today=1490253074566&groupId=studio_teach
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
router.get("/getSyllabus", (req, res) => {
    let requires = ["groupType", "today"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    syllabusService.getSyllabus(
        req.query["groupType"],
        req.query["groupId"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

/**
 * @api {get} /syllabus/getCourseInfo 通过参数提取课程信息,包括课程分析师的个人信息
 * @apiName getCourseInfo
 * @apiGroup syllabus
 *
 * @apiParam {String} groupType 组别，必填. 取直播间groupType值
 * @apiParam {String} groupId 房间Id，取直播间userInfo.groupId值
 * @apiParam {String} startTime 开始时间
 * @apiParam {String} endTime 结束时间
 * @apiParam {String} authorId 分析师Id
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/syllabus/getCourseInfo
 * @apiExample Example usage:
 *  /api/syllabus/getCourseInfo?groupType=studio&groupId=studio_teach&startTime=1490253074566&endTime=&authorId=
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
router.get("/getCourseInfo", (req, res) => {
    let requires = ["groupType", "groupId", "startTime", "endTime", "authorId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if (!isSatify) {
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let startTime = new Date(req.query["startTime"] - 0);
    let endTime = new Date(req.query["endTime"] - 0);
    syllabusService.getCourseInfo({
            groupType: req.query["groupType"],
            groupId: req.query["groupId"],
            day: req.query["day"],
            startTime: startTime,
            endTime: endTime,
            authorId: req.query["authorId"]
        },
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getSyllabusHis", (req, res) => {
    if (common.isBlank(req.query["groupType"])) {
        logger.warn("Parameters missed! Expecting parameter 'groupType': ", req.query["groupType"]);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    syllabusService.getSyllabusHis(
        req.query["groupType"],
        req.query["groupId"],
        req.query["date"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;