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

/**
 * @api {post} /visitor/saveVisitorRecord 更新访问记录
 * @apiName saveVisitorRecord
 * @apiGroup visitor
 *
 * @apiParam {String} type 访问类别，必填 login/online/offline/logout
 * @apiParam {String} clientStoreId  客服端id，必填
 * @apiParam {String} ip  访问者ip，必填
 * @apiParam {String} groupType  房间组别
 * @apiParam {String} roomId  所在房间id
 * @apiParam {String} userId  用户id
 * @apiParam {String} visitorId  访客id
 * @apiParam {String} nickname  用户昵称
 * @apiParam {String} visitTimes   累计访问次数
 * @apiParam {Number} loginTimes   累计登陆次数
 * @apiParam {Number} onlineStatus  在线状态
 * @apiParam {Number} loginStatus  登陆状态
 * @apiParam {Date} onlineDate  最近上线时间
 * @apiParam {Date} onlinePreDate  前一次上线时间
 * @apiParam {Date} loginDate  登录时间
 * @apiParam {Date} loginPreDate  上次登录时间
 * @apiParam {String} mobile  手机号
 * @apiParam {String} clientGroup  客户组
 * @apiParam {String} accountNo  账号
 * @apiParam {String} userAgent  用户客户端信息
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/visitor/saveVisitorRecord
 * @apiParamExample {json} Request-Example:
 *     {
 *        "type":"login",
 *        "dasData":{
 *          "clientStoreId": "1491556848930_70196925", //客服端id
 *          "groupType": "studio", //房间组别
 *          "roomId": "studio_teach", //所在房间id
 *          "userId": "dxunppxunppps", //用户id
 *          "visitorId": "visitor_70196925", //访客id
 *          "nickname": "KK", //用户昵称
 *          "ip": "172.30.5.136", //访问者ip
 *          "visitTimes": 1, //累计访问次数
 *          "loginTimes": 0, //累计登陆次数
 *          "onlineStatus": 0, //在线状态
 *          "loginStatus": 0, //登陆状态
 *          "onlineDate": "2017-04-10 08:30:52", //最近上线时间
 *          "onlinePreDate": "2017-04-09 09:10:23", //前一次上线时间
 *          "loginDate": "2017-04-11 09:01:05", //登录时间
 *          "loginPreDate": "2017-04-10 08:30:52", //上次登录时间
 *          "mobile": "13800138000", //手机号
 *          "clientGroup": "register", //客户组
 *          "accountNo": "", //账号
 *          "userAgent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36", //用户客户端信息
 *        }
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
    visitorService.saveVisitorRecord(req.body)
        .then(result => {
            res.json(APIUtil.APIResult(null, { isOK: true }));
        })
        .catch(err => {
            logger.warn("visitorService.saveVisitorRecord fail!", err);
            res.json(APIUtil.APIResult("code_10", null));
        });
});

/**
 * @api {get} /visitor/getVistiorByName 完善资料积分变化
 * @apiName getVistiorByName
 * @apiGroup visitor
 *
 * @apiParam {String} roomId  房间名，必填 取userInfo.groupId值
 * @apiParam {String} groupType  组别，必填 取userInfo.groupType值
 * @apiParam {String} nickname  昵称，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/visitor/getVistiorByName
 * @apiExample Example usage:
 *  /api/visitor/getVistiorByName?roomId=studio_teach&groupType=studio&nickname=test
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
    visitorService.getVistiorByName(req.query)
        .then(data => {
            res.json(APIUtil.APIResult(null, data));
        })
        .catch(err => {
            logger.warn("visitorService.saveVisitorRecord fail!", err);
            res.json(APIUtil.APIResult("code_10", null));
        });
});

module.exports = router;