var express = require('express');
var router = express.Router();
var tokenService = require('../../service/tokenService');
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage');
var logger =require("../../resources/logConf").getLogger("tokenAPI");

/**
 * 获取token
 */
router.post('/getToken', function(req, res) {
    try {
        var appId = req.param('appId'),appSecret = req.param('appSecret');
        logger.info("getToken->appId:" + appId + ",appSecret:" + appSecret);
        if (common.isBlank(appId) || common.isBlank(appSecret)) {
            res.json(errorMessage.code_1000);
        }
        tokenService.getTokenAccess(appId, appSecret, function (data) {
            if (data) {
                console.info(data);
                tokenService.getToken(data.expires, data._id, function (data) {
                    res.json(data);
                });
            } else {
                res.json(errorMessage.code_1001);
            }
        });
    }
    catch(e){
        logger.error(e);
        res.send("ERROR !");
    }
});

/**
 * 获取webui对应token
 */
router.get('/getWebuiToken', function(req, res) {
    tokenService.getWebuiToken(function(data){
        res.json(JSON.parse(data));
    });
});
/**
 * 验证token
 */
router.post('/verifyToken', function(req, res) {
    var token=req.param('token');
    console.log("verifyToken token:"+token);
    if(common.isBlank(token)){
       res.json({success:false});
    }
    tokenService.verifyToken(token,function(data){
        res.json({success:data});
    });
});

module.exports = router;
