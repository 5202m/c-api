/**
 * 摘要：文章资讯 API处理类
 * author:Gavin.guo
 * date:2015/4/23
 */
var router =  require('express').Router();
var request = require('request');
var config = require('../../resources/config');
var xml2js = require('xml2js');
var common = require('../../util/common'); //引入公共的js
var logger = require('../../resources/logConf').getLogger('commonAPI');

/**
 * 提取24k报价数据
 */
router.get('/get24kPrice', function(req, res) {
    request(config.web24kPriceUrl,function(error, response, data){
        if (!error && response.statusCode == 200) {
            var parser = new xml2js.Parser({ explicitArray : false, ignoreAttrs : false,attrkey:'attr' });
            parser.parseString(data,function(err, result){
                if(err){
                    logger.error("get24kPrice>>>error:"+err);
                    result={};
                }
                res.json(result);
            });
        }else{
            res.json({});
        }
    });
});
module.exports = router;
