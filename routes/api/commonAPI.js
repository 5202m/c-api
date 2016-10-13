/**
 * 摘要：文章资讯 API处理类
 * author:Gavin.guo
 * date:2015/4/23
 */
var router =  require('express').Router();
var request = require('request');
var constant = require('../../constant/constant');//引入常量
var config = require('../../resources/config');//引入配置
var crypto=require('crypto');//提取加密模块
var xml2js = require('xml2js');
var common = require('../../util/common'); //引入公共的js
var Utils = require('../../util/Utils'); //引入工具类js
var logger = require('../../resources/logConf').getLogger('commonAPI');
var SyllabusService = require('../../service/syllabusService');
var EmailService = require('../../service/emailService');
var articleService = require('../../service/articleService');
var ApiResult = require('../../util/ApiResult');
var errorMessage = require('../../util/errorMessage.js');

/**
 * 提取24k报价数据
 * 先在缓存服务器中提取，没有则到24k链接中提取
 */
router.get('/get24kPrice', function(req, res) {
    var cacheClient=require('../../cache/cacheClient');
    cacheClient.get("24kPrice", function(err, replayData){
        if(replayData){
            res.json(JSON.parse(replayData));
        }else{
            request(config.web24kPriceUrl,function(error, response, data){
                if (!error && response.statusCode == 200 && common.isValid(data)) {
                    var parser = new xml2js.Parser({ explicitArray : false, ignoreAttrs : false,attrkey:'attr' });
                    try{
                        parser.parseString(data,function(err, result){
                            if(err){
                                logger.error("get24kPrice>>>error:"+err);
                                result=null;
                            }
                            cacheClient.set("24kPrice",JSON.stringify(result));
                            cacheClient.expire("24kPrice", 5);//5秒钟有效
                            res.json(result);
                        });
                    }catch(e){
                        logger.error("get24kPrice has error:"+e);
                        res.json(null);
                    }
                }else{
                    logger.error("get24kPrice has error:"+error);
                    res.json(null);
                }
            });
        }
    });
});

/**
 * 提取即时资讯或专业评论
 * @param pageNo
 * @param pageSize
 * @param lang
 * @param contentType 2:即时资讯,3:专业评论
 */
router.get('/getNewsInfoList', function(req, res) {
    var pageNo=req.query["pageNo"],pageSize=req.query["pageSize"],lang=req.query["lang"],contentType1=req.query["contentType1"],contentType2=req.query["contentType2"];
    if(common.isBlank(pageNo)||common.isBlank(pageSize)||common.isBlank(lang)||common.isBlank(contentType1)){//参数输入有误，则返回空结果
        res.json(null);
    }else{
        var time=Date.now();
        var md5 = crypto.createHash('md5');
        var gwApiAuthorKey='YHJK786sdbbmkyusd';//授权码
        md5.update(gwApiAuthorKey+time);
        var token=md5.digest('hex');
        var param={token:token,platTypeKey:'web24k',timeStamp:time,lang:'zh',contenttype1:contentType1,siteflg:1,pageno:pageNo,pagesize:pageSize};
        if(common.isValid(contentType2)){
            param.contenttype2=contentType2;
        }
        request.post({strictSSL:false,url:(config.gwApiUrl+'/information/list'),form:param}, function(error,response,data){
            if(error){
                logger.error("getNewsInfoList has error:"+error);
                res.json(null);
            }else{
                try {
                    res.json(data ? JSON.parse(data) : null);
                }catch(e){
                    logger.error("getNewsInfoList has error:"+e);
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
router.get('/getBroadStrateList', function(req, res) {
    var lang=req.query["lang"],platform=req.query["platform"],dateStr=req.query["dateStr"];
    if(common.isBlank(lang)||common.isBlank(platform)||common.isBlank(dateStr)){//参数输入有误，则返回空结果
        res.json(null);
    }else{
        var time=Date.now();
        var md5 = crypto.createHash('md5');
        var gwApiAuthorKey='',siteflg=0;
        if("web24k"==platform){
            gwApiAuthorKey='YHJK786sdbbmkyusd';//授权码
            siteflg=1;
        }
        md5.update(gwApiAuthorKey+time);
        var token=md5.digest('hex');
        var param={token:token,platTypeKey:platform,timeStamp:time,lang:lang,datestr:dateStr,siteflg:siteflg};
        request.post({strictSSL:false,url:(config.gwApiUrl+'/broadcast/index.json'),form:param}, function(error,response,data){
            if(error){
                logger.error("getBroadStrateList has error:"+error);
                res.json(null);
            }else{
                try{
                    res.json(data?JSON.parse(data):null);
                }catch(e){
                    logger.error("getBroadStrateList has error:"+e);
                    res.json(null);
                }
            }
        });
    }
});

/**
 * 获取指定日期课程安排
 */
router.get("/getCourse", function(req, res) {
    var loc_params = {
        type : req.query["type"],
        platform : req.query["platform"],
        groupType : req.query["groupType"],
        groupId : req.query["groupId"],
        flag : req.query["flag"]
    };
    var cfg = constant.studioThirdUsed.getConfig(loc_params.type, loc_params.platform);
    if(cfg){
        loc_params.groupType = cfg.groupType;
        loc_params.groupId = cfg.roomId;
        loc_params.flag = common.isValid(loc_params.flag)?loc_params.flag:cfg.flag;
    }
    if(!loc_params.groupType){
        res.json(ApiResult.result(errorMessage.code_1000, null));
        return;
    }
    //查询课程安排
    SyllabusService.getCourse(loc_params.groupType, loc_params.groupId, new Date(), loc_params.flag, function(apiResult){
        res.json(apiResult);
    });
});


/**
 * 备份课程表
 */
router.get("/bakSyllabus", function(req, res) {
    var date = req.query["date"];
    var timezoneOffset = new Date().getTimezoneOffset() * 60000;
    if(date){
        date = new Date(date).getTime();
        date = new Date(date - (date % 86400000) + timezoneOffset);
    }else{//默认备份前一天课程表
        date = new Date().getTime();
        date = new Date(date - (date % 86400000) - 86400000 + timezoneOffset);
    }
    SyllabusService.bakSyllabus(date, function(isOK){
        res.json(ApiResult.result(null, isOK));
    });
});

/**
 * 发送电子邮件
 */
router.post("/email", function(req, res) {
    var loc_params = {
        key : req.body["key"],
        data : req.body["data"]
    };
    if(typeof loc_params.data == "string"){
        try{
            loc_params.data = JSON.parse(loc_params.data);
        }catch(e){
            logger.warn("parse JSON data error!" + e);
        }
    }
    if(!loc_params.data){
        loc_params.data = {};
    }
    if(!loc_params.data.date){
        loc_params.data.date = Utils.dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss");
    }

    EmailService.send(loc_params.key, loc_params.data, function(result){
        res.json(result);
    });
});

/**
 * 提取24kCFTC持仓比例数据
 */
router.get('/get24kCftc', function(req, res) {
    var limit = req.query['limit'] ? req.query['limit'] : 0; //默认只取最新的一条持仓比例数据
    request(config.web24k + '/cftc.xml', function(error, response, data){
        if (!error && response.statusCode == 200 && common.isValid(data)) {
            var parser = new xml2js.Parser({ explicitArray : false, ignoreAttrs : false, attrkey: 'attr' });
            try{
                parser.parseString(data, function(err, result){
                    if(err){
                        logger.error("get24kCftc>>>error:"+err);
                        result=null;
                    }
                    //res.json(result);
                    if(limit == 0){
                        //只取第一条数据并返回组成新的json数组
                        var size = result.cftc.column.length;
                        var json = {};
                        var jsonData = [];
                        for(var i = 0; i < size; i++){
                            //json.name = result.cftc.column[i].attr.name;
                            //json.item = result.cftc.column[i].item[0].attr;
                            json[result.cftc.column[i].attr.name] = result.cftc.column[i].item[0].attr;
                            json[result.cftc.column[i].attr.name].name = result.cftc.column[i].attr.name;
                            //jsonData.push(json);
                        }
                        res.json(json);
                    }
                    else{
                        //返回请求到的全部转换为json的数据
                        res.json(result);
                    }
                });
            }catch(e){
                logger.error("get24kCftc has error:" + e);
                res.json(null);
            }
        }else{
            logger.error("get24kCftc has error:" + error);
            res.json(null);
        }
    });
});

/**
 * 获取新闻快讯
 */
router.get('/getInformation', function(req, res){
    var cacheClient = require('../../cache/cacheClient');
    /*var date = new Date();//如需设置过期时间，则需要加入日期作为key的一部分
     var key = "fx678_information"+date.getUTCFullYear()+(date.getUTCMonth()+1)+date.getUTCDate();*/
    var key = "fx678_information";
    cacheClient.get(key, function(err, result){
        if(err){
            logger.error("getInformationCache fail:" + err);
            res.json({isOK:false, data:null});
        }
        else if(!result){
            request(config.fx678ApiUrl + "/union/jdgjs/news/flash.xml", function(error, data){
                if (!error && common.isValid(data.body)) {
                    var parser = new xml2js.Parser({ explicitArray : false, ignoreAttrs : false, attrkey: 'attr' });
                    try{
                        parser.parseString(data.body, function(parseError, result){
                            if(parseError){
                                logger.error("getInformation for fx678 parser>>>error:"+parseError);
                                res.json({isOK:false, data:null});
                                return;
                            }
                            cacheClient.set(key, JSON.stringify(result));
                            cacheClient.expire(key, 5*60);//设置有效时间
                            res.json({isOK:true, data:result});
                        });
                    }catch(e){
                        logger.error("getInformation for fx678 has error:" + e);
                        res.json({isOK:false, data:null});
                    }
                }else{
                    logger.error("getInformation for fx678 has error:" + err);
                    res.json({isOK:false, data:null});
                }
            });
        }
        else{
            res.json({isOK:true, data:JSON.parse(result)});//获取的结果是字符串，需要转为json对象
        }
    });
});

/**
 * 更新点赞数或下载次数
 */
router.post('/modifyArticle', function(req, res){
    var _id = req.body['id'] || req.query['id'];
    var type = req.body['type'] || req.query['type'];
    if(common.isBlank(_id) || common.isBlank(type)){
        res.json({isOk: false,  msg: '参数错误'});
        return;
    }
    articleService.modifyPraiseOrDownloads(_id, type, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;