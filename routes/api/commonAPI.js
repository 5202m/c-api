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
const fs = require('fs');
var router = require('express').Router();
const profiler = require('v8-profiler');
var request = require('request');
var constant = require('../../constant/constant'); //引入常量
var config = require('../../resources/config'); //引入配置
var crypto = require('crypto'); //提取加密模块
var xml2js = require('xml2js');
var common = require('../../util/common'); //引入公共的js
var Utils = require('../../util/Utils'); //引入工具类js
var logger = require('../../resources/logConf').getLogger('commonAPI');
var SyllabusService = require('../../service/syllabusService');
var EmailService = require('../../service/emailService');
var articleService = require('../../service/articleService');
var ApiResult = require('../../util/ApiResult');
var errorMessage = require('../../util/errorMessage.js');
var Redirect4FXAPI = require('./redirect4FXAPI.js');
var ZxFinanceService = require('../../service/zxFinanceService.js');

/**
 * @api {get} /common/get24kPrice 提取24k报价数据
 * @apiName get24kPrice
 * @apiGroup common
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/common/get24kPrice
 * @apiExample Example usage:
 *  /api/common/get24kPrice
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          ...
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get('/get24kPrice', function(req, res) {
    var cacheClient = require('../../cache/cacheClient');
    cacheClient.get("24kPrice", function(err, replayData) {
        if (replayData) {
            res.json(JSON.parse(replayData));
        } else {
            request(config.web24kPriceUrl, function(error, response, data) {
                if (!error && response.statusCode == 200 && common.isValid(data)) {
                    var parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, attrkey: 'attr' });
                    try {
                        parser.parseString(data, function(err, result) {
                            if (err) {
                                logger.error("get24kPrice>>>error:" + err);
                                result = null;
                            }
                            cacheClient.set("24kPrice", JSON.stringify(result));
                            cacheClient.expire("24kPrice", 5); //5秒钟有效
                            res.json(result);
                        });
                    } catch (e) {
                        logger.error("get24kPrice has error:" + e);
                        res.json(null);
                    }
                } else {
                    logger.error("get24kPrice has error:" + error);
                    res.json(null);
                }
            });
        }
    });
});

/**
 * @api {get} /common/getNewsInfoList 提取即时资讯或专业评论
 * @apiName getNewsInfoList
 * @apiGroup common
 *
 * @apiParam {String} pageNo 页数
 * @apiParam {String} pageSize 条数
 * @apiParam {String} lang 语言
 * @apiParam {String} contentType1 2:即时资讯,3:专业评论
 * @apiParam {String} contentType2 2:即时资讯,3:专业评论
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/common/getNewsInfoList
 * @apiExample Example usage:
 *  /api/common/getNewsInfoList
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          ...
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get('/getNewsInfoList', function(req, res) {
    var pageNo = req.query["pageNo"],
        pageSize = req.query["pageSize"],
        lang = req.query["lang"],
        contentType1 = req.query["contentType1"],
        contentType2 = req.query["contentType2"];
    if (common.isBlank(pageNo) || common.isBlank(pageSize) || common.isBlank(lang) || common.isBlank(contentType1)) { //参数输入有误，则返回空结果
        res.json(null);
    } else {
        var time = Date.now();
        var md5 = crypto.createHash('md5');
        var gwApiAuthorKey = config.gwApiOauthKeys.web24k; //授权码
        md5.update(gwApiAuthorKey + time);
        var token = md5.digest('hex');
        var param = { token: token, platTypeKey: 'web24k', timeStamp: time, lang: 'zh', contenttype1: contentType1, siteflg: 1, pageno: pageNo, pagesize: pageSize };
        if (common.isValid(contentType2)) {
            param.contenttype2 = contentType2;
        }
        request.post({ strictSSL: false, url: (config.gwApiUrl + '/restweb/information/list'), form: param }, function(error, response, data) {
            if (error) {
                logger.error("getNewsInfoList has error:" + error);
                res.json(null);
            } else {
                try {
                    res.json(data ? JSON.parse(data) : null);
                } catch (e) {
                    logger.error("getNewsInfoList has error:" + e);
                    res.json(null);
                }
            }
        });
    }
});

/**
 * 提取实盘直播
 * @param platform
 * @param dateStr
 * @param lang
 */
/**
 * @api {get} /common/getBroadStrateList 提取实盘直播
 * @apiName getBroadStrateList
 * @apiGroup common
 *
 * @apiParam {String} platform 平台，必填 pm(web24k,webui,app,pc)/fx(gwfx,uce,webui)/hx(uce,webui)
 * @apiParam {String} dateStr 日期时间字符串，必填
 * @apiParam {String} lang 语言，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/common/getBroadStrateList
 * @apiExample Example usage:
 *  /api/common/getBroadStrateList?platform=web24k&dateStr=&lang=
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
router.get('/getBroadStrateList', function(req, res) {
    var lang = req.query["lang"],
        platform = req.query["platform"],
        dateStr = req.query["dateStr"];
    if (common.isBlank(lang) || common.isBlank(platform) || common.isBlank(dateStr)) { //参数输入有误，则返回空结果
        res.json(null);
    } else {
        var time = Date.now();
        var md5 = crypto.createHash('md5');
        var gwApiAuthorKey = '',
            siteflg = 0;
        if ("web24k" == platform) {
            gwApiAuthorKey = config.gwApiOauthKeys.web24k; //授权码
            siteflg = 1;
        }
        md5.update(gwApiAuthorKey + time);
        var token = md5.digest('hex');
        var param = { token: token, platTypeKey: platform, timeStamp: time, lang: lang, datestr: dateStr, siteflg: siteflg };
        request.post({ strictSSL: false, url: (config.gwApiUrl + '/restweb/broadcast/index.json'), form: param }, function(error, response, data) {
            if (error) {
                logger.error("getBroadStrateList has error:" + error);
                res.json(null);
            } else {
                try {
                    res.json(data ? JSON.parse(data) : null);
                } catch (e) {
                    logger.error("getBroadStrateList has error:" + e);
                    res.json(null);
                }
            }
        });
    }
});

/**
 * @api {get} /common/getCourse 获取指定日期课程安排
 * @apiName getCourse
 * @apiGroup common
 *
 * @apiParam {String} type 事业部标识，pm/fx/hx
 * @apiParam {String} platform 平台 pm(web24k,webui,app,pc)/fx(gwfx,uce,webui)/hx(uce,webui)
 * @apiParam {String} groupType 组别，必填. 取直播间groupType值
 * @apiParam {String} groupId 房间ID，取直播间groupId值
 * @apiParam {String} flag 获取课程安排标识 S(下次课程安排)/D(全天课程安排)/W(一周课程安排)
 * @apiParam {Number} strategy 是否填充交易策略信息
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/common/getCourse
 * @apiExample Example usage:
 *  /api/common/getCourse?type=pm&platform=pc&groupType=studio&groupId=studio_teach&flag=D&strategy=1
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
router.get("/getCourse", function(req, res) {
    var loc_params = {
        type: req.query["type"],
        platform: req.query["platform"],
        groupType: req.query["groupType"],
        groupId: req.query["groupId"],
        flag: req.query["flag"],
        strategy: req.query["strategy"] == 1
    };
    var cfg = constant.studioThirdUsed.getConfig(loc_params.type, loc_params.platform);
    if (cfg) {
        loc_params.groupType = cfg.groupType;
        loc_params.groupId = cfg.roomId;
        loc_params.flag = common.isValid(loc_params.flag) ? loc_params.flag : cfg.flag;
    }
    if (!loc_params.groupType) {
        res.json(ApiResult.result(errorMessage.code_1000, null));
        return;
    }
    if (Redirect4FXAPI.needRedirect4Fxstudio(req, loc_params.groupType)) {
        Redirect4FXAPI.redirect(req, res);
        return;
    }
    //查询课程安排
    let courseParams = {
        groupType: loc_params.groupType,
        groupId: loc_params.groupId,
        today: new Date(),
        flag: loc_params.flag,
        strategy: loc_params.strategy
    };
    common.wrapSystemCategory(courseParams, req.query.systemCategory);
    SyllabusService.getCourse(courseParams, function(apiResult) {
        res.json(apiResult);
    });
});

/**
 * @api {get} /common/getNextCourses 获取指定分析师的下次课程安排
 * @apiName getNextCourses
 * @apiGroup common
 *
 * @apiParam {String} type 事业部标识，pm/fx/hx
 * @apiParam {String} platform 平台 pm(web24k,webui,app,pc)/fx(gwfx,uce,webui)/hx(uce,webui)
 * @apiParam {String} groupType 组别，必填.取直播间groupType值
 * @apiParam {String} groupId 房间ID 取直播间groupId值
 * @apiParam {String} analystIds 分析师ID，多个,隔开
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/common/getNextCourses
 * @apiExample Example usage:
 *  /api/common/getNextCourses?type=pm&platform=pc&groupType=studio&groupId=studio_teach&analystIds=kitty
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
router.get("/getNextCourses", function(req, res) {
    var loc_params = {
        type: req.query["type"],
        platform: req.query["platform"],
        groupType: req.query["groupType"],
        groupId: req.query["groupId"],
        analystIds: req.query["analystIds"],
        isIncludeCurrent: req.query["hasCurr"]
    };
    var cfg = constant.studioThirdUsed.getConfig(loc_params.type, loc_params.platform);
    if (cfg) {
        loc_params.groupType = cfg.groupType;
        loc_params.groupId = cfg.roomId;
    }
    if (!loc_params.groupType || !loc_params.groupId) {
        res.json(null);
        return;
    }
    if (Redirect4FXAPI.needRedirect4Fxstudio(req, loc_params.groupType)) {
        Redirect4FXAPI.redirect(req, res);
        return;
    }
    if (loc_params.analystIds) {
        loc_params.analystIds = loc_params.analystIds.split(/[,，]/);
    }
    SyllabusService.getNextCources(new Date(), loc_params.groupType, loc_params.groupId, loc_params.analystIds, loc_params.isIncludeCurrent, function(courses) {
        res.json(courses);
    });
});

/**
 * @api {get} /common/bakSyllabus 备份课程表
 * @apiName bakSyllabus
 * @apiGroup common
 *
 * @apiParam {String} date 日期字符串
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/common/bakSyllabus
 * @apiExample Example usage:
 *  /api/common/bakSyllabus?data=
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
router.get("/bakSyllabus", function(req, res) {
    var date = req.query["date"];
    if (date) {
        date = new Date(date);
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else { //默认备份前一天课程表
        date = new Date();
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    }
    SyllabusService.bakSyllabus(date, function(isOK) {
        res.json(ApiResult.result(null, isOK));
    });
});

/**
 * 发送电子邮件
 */
router.post("/email", function(req, res) {
    var loc_params = {
        key: req.body["key"],
        data: req.body["data"]
    };
    if (typeof loc_params.data == "string") {
        try {
            loc_params.data = JSON.parse(loc_params.data);
        } catch (e) {
            logger.warn("parse JSON data error!" + e);
        }
    }
    if (!loc_params.data) {
        loc_params.data = {};
    }
    if (!loc_params.data.date) {
        loc_params.data.date = Utils.dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss");
    }

    EmailService.send(loc_params.key, loc_params.data, function(result) {
        res.json(result);
    });
});

/**
 * @api {get} /common/get24kCftc 提取24kCFTC持仓比例数据
 * @apiName get24kCftc
 * @apiGroup common
 *
 * @apiParam {Number} limit 0 条数，默认只取最新的一条持仓比例数据
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/common/get24kCftc
 * @apiExample Example usage:
 *  /api/common/get24kCftc?limit=0
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
router.get('/get24kCftc', function(req, res) {
    var limit = req.query['limit'] ? req.query['limit'] : 0; //默认只取最新的一条持仓比例数据
    request(config.web24k + '/cftc.xml', function(error, response, data) {
        if (!error && response.statusCode == 200 && common.isValid(data)) {
            var parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, attrkey: 'attr' });
            try {
                parser.parseString(data, function(err, result) {
                    if (err) {
                        logger.error("get24kCftc>>>error:" + err);
                        result = null;
                    }
                    //res.json(result);
                    if (limit == 0) {
                        //只取第一条数据并返回组成新的json数组
                        var size = result.cftc.column.length;
                        var json = {};
                        var jsonData = [];
                        for (var i = 0; i < size; i++) {
                            //json.name = result.cftc.column[i].attr.name;
                            //json.item = result.cftc.column[i].item[0].attr;
                            json[result.cftc.column[i].attr.name] = result.cftc.column[i].item[0].attr;
                            json[result.cftc.column[i].attr.name].name = result.cftc.column[i].attr.name;
                            //jsonData.push(json);
                        }
                        res.json(json);
                    } else {
                        //返回请求到的全部转换为json的数据
                        res.json(result);
                    }
                });
            } catch (e) {
                logger.error("get24kCftc has error:" + e);
                res.json(null);
            }
        } else {
            logger.error("get24kCftc has error:" + error);
            res.json(null);
        }
    });
});

/**
 * @api {get} /common/getInformation 获取新闻快讯
 * @apiName getInformation
 * @apiGroup common
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/common/getInformation
 * @apiExample Example usage:
 *  /api/common/getInformation
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
router.get('/getInformation', function(req, res) {
    var cacheClient = require('../../cache/cacheClient');
    /*var date = new Date();//如需设置过期时间，则需要加入日期作为key的一部分
     var key = "fx678_information"+date.getUTCFullYear()+(date.getUTCMonth()+1)+date.getUTCDate();*/
    var key = "fx678_information";
    cacheClient.get(key, function(err, result) {
        if (err) {
            logger.error("getInformationCache fail:" + err);
            res.json({ isOK: false, data: null });
        } else if (!result) {
            request(config.fx678ApiUrl + "/union/jdgjs/news/flash.xml", function(error, data) {
                if (!error && common.isValid(data.body)) {
                    var parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, attrkey: 'attr' });
                    try {
                        parser.parseString(data.body, function(parseError, result) {
                            if (parseError) {
                                logger.error("getInformation for fx678 parser>>>error:" + parseError);
                                res.json({ isOK: false, data: null });
                                return;
                            }
                            cacheClient.set(key, JSON.stringify(result));
                            cacheClient.expire(key, 5 * 60); //设置有效时间
                            res.json({ isOK: true, data: result });
                        });
                    } catch (e) {
                        logger.error("getInformation for fx678 has error:" + e);
                        res.json({ isOK: false, data: null });
                    }
                } else {
                    logger.error("getInformation for fx678 has error:" + error);
                    res.json({ isOK: false, data: null });
                }
            });
        } else {
            res.json({ isOK: true, data: JSON.parse(result) }); //获取的结果是字符串，需要转为json对象
        }
    });
});

/**
 * @api {post} /common/modifyArticle 更新点赞数或下载次数
 * @apiName modifyArticle
 * @apiGroup common
 *
 * @apiParam {String} id 更新对象ID，必填
 * @apiParam {String} type 更新类型，必填 praise or downloads
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/common/modifyArticle
 * @apiParamExample {json} Request-Example:
 *     {
 *       "id": "10000538",
 *       "type": "praise"
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
router.post('/modifyArticle', function(req, res) {
    var _id = req.body['id'] || req.query['id'];
    var type = req.body['type'] || req.query['type'];
    if (common.isBlank(_id) || common.isBlank(type)) {
        res.json({ isOk: false, msg: '参数错误' });
        return;
    }
    articleService.modifyPraiseOrDownloads({ '_id': _id }, type, function(apiResult) {
        res.json(apiResult);
    });
});

/**
 * @api {get} /common/getLastReview 获取财经日历最后点评的数据
 * @apiName getLastReview
 * @apiGroup common
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/common/getLastReview
 * @apiExample Example usage:
 *  /api/common/getLastReview
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
router.get('/getLastReview', function(req, res) {
    ZxFinanceService.getFinanceDataLastReview(function(data) {
        res.json(data);
    });
});

/**
 * @api {get} /common/getSymbolLongShortRatios 多空比例
 * @apiName getSymbolLongShortRatios
 * @apiGroup common
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/common/getSymbolLongShortRatios
 * @apiExample Example usage:
 *  /api/common/getSymbolLongShortRatios
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
router.get('/getSymbolLongShortRatios', function(req, res) {
    var cacheClient = require('../../cache/cacheClient');
    var date = new Date();
    var key = "symbolLongShortRatios";
    if (common.getHHMM(date) > '11:15') {
        cacheClient.set(key, null);
    }
    cacheClient.get(key, function(err, result) {
        if (err) {
            logger.error("getSymbolLongShortRatios fail:" + err);
            res.json({ code: "FAIL", result: [] });
        } else if (!result) {
            request(config.symbolLongShortOpenPositionRatios + "/findSymbolLongShortRatios", function(error, response, data) {
                if (!error && data) {
                    try {
                        if (typeof data == 'string') {
                            data = JSON.parse(data);
                        }
                        cacheClient.set(key, JSON.stringify(data));
                        cacheClient.expire(key, 5 * 60); //设置有效时间
                        res.json(data);
                    } catch (e) {
                        logger.error("getSymbolLongShortRatios JSON.parse error:" + e);
                        res.json({ code: "FAIL", result: [] });
                    }
                } else {
                    logger.error("getSymbolLongShortRatios has error:" + err);
                    res.json({ code: "FAIL", result: [] });
                }
            });
        } else {
            res.json(JSON.parse(result));
        }
    });
});

/**
 * @api {get} /common/getSymbolOpenPositionRatios 未平仓品种比率
 * @apiName getSymbolOpenPositionRatios
 * @apiGroup common
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/common/getSymbolOpenPositionRatios
 * @apiExample Example usage:
 *  /api/common/getSymbolOpenPositionRatios
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
router.get('/getSymbolOpenPositionRatios', function(req, res) {
    var cacheClient = require('../../cache/cacheClient');
    var date = new Date();
    var key = "symbolOpenPositionRatios";
    if (common.getHHMM(date) > '11:15') {
        cacheClient.set(key, null);
    }
    cacheClient.get(key, function(err, result) {
        if (err) {
            logger.error("getSymbolOpenPositionRatios fail:" + err);
            res.json({ code: "FAIL", result: [] });
        } else if (!result) {
            request(config.symbolLongShortOpenPositionRatios + "/findSymbolOpenPositionRatios", function(error, response, data) {
                if (!error && data) {
                    try {
                        if (typeof data == 'string') {
                            data = JSON.parse(data);
                        }
                        cacheClient.set(key, JSON.stringify(data));
                        cacheClient.expire(key, 5 * 60); //设置有效时间
                        res.json(data);
                    } catch (e) {
                        logger.error("getSymbolOpenPositionRatios JSON.parse error:" + e);
                        res.json({ code: "FAIL", result: [] });
                    }
                } else {
                    logger.error("getSymbolOpenPositionRatios has error:" + err);
                    res.json({ code: "FAIL", result: [] });
                }
            });
        } else {
            res.json(JSON.parse(result));
        }
    });
});

router.get('/cpuprofile', function(req, res) {
    let userName = req.query['user'];
    let password = req.query['pwd'];
    if(userName == 'chatDev' && password == 'chat@dev.!$') {
        const duration = req.query.duration || 60;
        //Start Profiling
        profiler.startProfiling('CPU profile');
        setTimeout(() => {
            //Stop Profiling after duration
            const profile = profiler.stopProfiling();
            profile.export()
            .pipe(fs.createWriteStream(
                'cpuprofile-' + Date.now() + '.cpuprofile'))
            .on('finish', () => profile.delete());
            res.sendStatus(200);
        }, duration * 1000);
    }
});

module.exports = router;