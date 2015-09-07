/**
 * 摘要：文章资讯 API处理类
 * author:Gavin.guo
 * date:2015/4/23
 */
var router =  require('express').Router();
var request = require('request');
var config = require('../../resources/config');//引入配置
var crypto=require('crypto');//提取加密模块
var xml2js = require('xml2js');
var common = require('../../util/common'); //引入公共的js
var logger = require('../../resources/logConf').getLogger('commonAPI');
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
                    parser.parseString(data,function(err, result){
                        if(err){
                            logger.error("get24kPrice>>>error:"+err);
                            result=null;
                        }
                        cacheClient.set("24kPrice",JSON.stringify(result));
                        cacheClient.expire("24kPrice", 5);//5秒钟有效
                        res.json(result);
                    });
                }else{
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
                res.json(data?JSON.parse(data):null);
            }
        });
    }
});


module.exports = router;
