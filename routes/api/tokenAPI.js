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
var logger = require("../../resources/logConf").getLogger("tokenAPI");
var express = require('express');
var router = express.Router();
var tokenService = require('../../service/tokenService');
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage');

/**
 * @api {post} /token/setTokenAccess 创建或更新tokenAccess
 * @apiName setTokenAccess
 * @apiGroup token
 *
 * @apiParam {String} appId 必填
 * @apiParam {String} appSecret 必填
 * @apiParam {String} platform 平台，必填
 * @apiParam {String} tokenAccessId tokenAccessId，更新时为必填
 * @apiParam {String} token token
 * @apiParam {Number} expires 过期时间
 * @apiParam {Boolean} createUser 创建人
 * @apiParam {String} createIp 创建IP
 * @apiParam {String} createDate 创建时间
 * @apiParam {String} updateUser 更新人
 * @apiParam {String} updateIp 更新IP
 * @apiParam {String} updateDate 更新时间
 * @apiParam {String} remark 备注
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/token/setTokenAccess
 * @apiParamExample {json} Request-Example:
 *     {
 *       "appId": "",
 *       "appSecret": "",
 *       "platform": "",
 *       "tokenAccessId": "",
 *       "token": "",
 *       "expires": 2,
 *       "createUser": "",
 *       "createIp": "127.0.0.1",
 *       "createDate": "2017-04-12 09:51:12",
 *       "updateUser": "",
 *       "updateIp":"",
 *       "updateDate":"",
 *       "remark":""
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
router.post('/setTokenAccess', function(req, res) {
    try {
        var result = { isOK: false, error: null };
        var model = req.body;
        if (common.isBlank(model.appId) || common.isBlank(model.appSecret) || common.isBlank(model.platform)) {
            result.error = errorMessage.code_1000;
            res.json(result);
        } else {
            if (common.isValid(model.tokenAccessId)) {
                tokenService.updateTokenAccess(model)
                    .then(function(resultTmp) {
                        res.json(resultTmp);
                    }).catch(e => {
                        throw new Error(e);
                    });
            } else {
                tokenService.createTokenAccess(model, function(resultTmp) {
                    res.json(resultTmp);
                });
            }
        }
    } catch (e) {
        logger.error(e);
        result.error = errorMessage.code_10;
        res.json(result);
    }
});

/**
 * @api {get} /token/getTokenAccessList 获取tokenAccess列表
 * @apiName getTokenAccessList
 * @apiGroup token
 *
 * @apiParam {String} appId 必填
 * @apiParam {String} appSecret 必填.
 * @apiParam {String} platform 必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/token/getTokenAccessList
 * @apiExample Example usage:
 *  /api/token/getTokenAccessList?appId=&appSecret=&platform=
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
router.get('/getTokenAccessList', function(req, res) {
    var model = null;
    if (common.isValid(req.query.appId) || common.isValid(req.query.appSecret) || common.isValid(req.query.platform)) {
        model = { appId: req.query.appId, appSecret: req.query.appSecret, platform: req.query.platform };
    }
    tokenService.getTokenAccessList(model, function(result) {
        res.json(result);
    });
});

/**
 * @api {post} /token/deleteTokenAccess 移除tokenAccess
 * @apiName deleteTokenAccess
 * @apiGroup token
 *
 * @apiParam {String} ids tokenAccess Id集，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/token/deleteTokenAccess
 * @apiParamExample {json} Request-Example:
 *     {
 *       "ids": ""
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
router.post('/deleteTokenAccess', function(req, res) {
    var ids = req.body.ids;
    if (common.isBlank(ids)) {
        res.json({ isOK: false, error: errorMessage.code_1000 });
    } else {
        tokenService.deleteTokenAccess(ids, function() {
            res.json({ isOK: true, error: null });
        });
    }
});

/**
 * @api {get} /token/getTokenAccessById 根据tokenAccessId获取TokenAccess
 * @apiName getTokenAccessById
 * @apiGroup token
 *
 * @apiParam {String} tokenAccessId 必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/token/getTokenAccessById
 * @apiExample Example usage:
 *  /api/token/getTokenAccessById?tokenAccessId=
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
router.get('/getTokenAccessById', function(req, res) {
    var tokenAccessId = req.query.tokenAccessId;
    if (common.isBlank(tokenAccessId)) {
        res.json(null);
    } else {
        tokenService.getTokenAccessById(tokenAccessId).then(function(data) {
            res.json(data);
        }).catch(e => {
            logger.error("getTokenAccessById failure", e);
            res.json(null);
        });
    }
});

/**
 * @api {get} /token/getTokenAccessByPlatform 根据platform获取TokenAccess
 * @apiName getTokenAccessByPlatform
 * @apiGroup token
 *
 * @apiParam {String} platform 必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/token/getTokenAccessByPlatform
 * @apiExample Example usage:
 *  /api/token/getTokenAccessByPlatform?platform=
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
router.get('/getTokenAccessByPlatform', function(req, res) {
    var platform = req.query.platform;
    if (common.isBlank(platform)) {
        res.json(null);
    } else {
        tokenService.getTokenAccessList({ platform: platform })
            .then(res.json)
            .catch(e => {
                logger.error(e);
                res.json(null);
            });
    }
});

/**
 * @api {post} /token/getToken 获取token
 * @apiName getToken
 * @apiGroup token
 *
 * @apiParam {String} appId 必填
 * @apiParam {String} appSecret 必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/token/getToken
 * @apiParamExample {json} Request-Example:
 *     {
 *       "appId": "",
 *       "appSecret":""
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": { token: token, expires: time, beginTime: beginTime }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post('/getToken', function(req, res) {
    try {
        var appId = req.body['appId'],
            appSecret = req.body['appSecret'];
        logger.info("getToken->appId:" + appId + ",appSecret:" + appSecret);
        if (common.isBlank(appId) || common.isBlank(appSecret)) {
            res.json(errorMessage.code_1000);
        } else {
            tokenService.getToken(appId, appSecret, function(data) {
                logger.info("getToken->data:" + JSON.stringify(data));
                res.json(data);
            });
        }
    } catch (e) {
        logger.error(e);
        res.json(errorMessage.code_10);
    }
});

/**
 * @api {post} /token/destroyToken 注销token
 * @apiName destroyToken
 * @apiGroup token
 *
 * @apiParam {String} token 必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/token/destroyToken
 * @apiParamExample {json} Request-Example:
 *     {
 *       "token": ""
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
router.post('/destroyToken', function(req, res) {
    var token = req.body.token;
    if (common.isBlank(token)) {
        res.json({ isOK: false, error: errorMessage.code_1000 });
    } else {
        tokenService.destroyToken(token, function(isOK) {
            res.json({ isOK: isOK });
        });
    }
});

/**
 * @api {post} /token/verifyToken 验证token
 * @apiName verifyToken
 * @apiGroup token
 *
 * @apiParam {String} token 必填
 * @apiParam {String} appSecret 必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/token/verifyToken
 * @apiParamExample {json} Request-Example:
 *     {
 *       "token": ""
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
router.post('/verifyToken', function(req, res) {
    var token = req.body.token;
    var appSecret = req.body.appSecret;
    if (common.isBlank(token)) {
        res.json({ isOK: false, error: errorMessage.code_5003 });
    } else {
        tokenService.verifyToken(token, appSecret, function(data) {
            res.json(data);
        });
    }
});

module.exports = router;