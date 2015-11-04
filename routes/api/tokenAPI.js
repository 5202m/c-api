var logger =require("../../resources/logConf").getLogger("tokenAPI");
var express = require('express');
var router = express.Router();
var tokenService = require('../../service/tokenService');
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage');
/**
 * 新增tokenAccess
 */

router.post('/setTokenAccess', function(req, res) {
    try {
        var result={isOK:false,error:null};
        var model=req.body;
        if(common.isBlank(model.appId)||common.isBlank(model.appSecret)||common.isBlank(model.platform)){
            result.error=errorMessage.code_1000;
            res.json(result);
        }else{
            if(common.isValid(model.tokenAccessId)){
                tokenService.updateTokenAccess(model,function(resultTmp){
                    res.json(resultTmp);
                });
            }else{
                tokenService.createTokenAccess(model,function(resultTmp){
                    res.json(resultTmp);
                });
            }
        }
    }catch(e){
        logger.error(e);
        result.error=errorMessage.code_10;
        res.json(result);
    }
});

/**
 * 新增tokenAccess
 */
router.get('/getTokenAccessList', function(req, res) {
    var model=null;
    if(common.isValid(req.query.appId) || common.isValid(req.query.appSecret) || common.isValid(req.query.platform)){
        model={appId:req.query.appId,appSecret:req.query.appSecret,platform:req.query.platform};
    }
    tokenService.getTokenAccessList(model,function(result){
        res.json(result);
    });
});


/**
 * 新增tokenAccess
 */
router.post('/deleteTokenAccess', function(req, res) {
    var ids=req.body.ids;
    if(common.isBlank(ids)){
        res.json({isOK:false,error:errorMessage.code_1000});
    }else{
        tokenService.deleteTokenAccess(ids,function(){
            res.json({isOK:true,error:null});
        });
    }
});

/**
 * 新增tokenAccess
 */
router.get('/getTokenAccessById', function(req, res) {
    var tokenAccessId=req.query.tokenAccessId;
    if(common.isBlank(tokenAccessId)){
        res.json(null);
    }else{
        tokenService.getTokenAccessById(tokenAccessId,function(data){
            res.json(data);
        });
    }
});

/**
 * 新增tokenAccess
 */
router.get('/getTokenAccessByPlatform', function(req, res) {
    var platform=req.query.platform;
    if(common.isBlank(platform)){
        res.json(null);
    }else{
        tokenService.getTokenAccessByPlatform(platform,function(data){
            res.json(data);
        })
    }
});

/**
 * 获取token
 */
router.post('/getToken', function(req, res) {
    try {
        var appId = req.body['appId'],appSecret =req.body['appSecret'];
        logger.info("getToken->appId:" + appId + ",appSecret:" + appSecret);
        if (common.isBlank(appId) || common.isBlank(appSecret)) {
            res.json(errorMessage.code_1000);
        }else{
            tokenService.getToken(appId,appSecret,function (data) {
                logger.info("getToken->data:"+JSON.stringify(data));
                res.json(data);
            });
        }
    }catch(e){
        logger.error(e);
        res.json(errorMessage.code_10);
    }
});

/**
 * 注销token
 */
router.post('/destroyToken', function(req, res) {
    var token=req.body.token;
    if(common.isBlank(token)){
        res.json({isOK:false,error:errorMessage.code_1000});
    }else{
        tokenService.destroyToken(token,function(isOK){
            res.json({isOK:isOK});
        });
    }
});
/**
 * 验证token
 */
router.post('/verifyToken', function(req, res) {
    var token=req.body.token;
    logger.info("verifyToken token:"+token);
    if(common.isBlank(token)){
       res.json({success:false});
    }else{
        tokenService.verifyToken(token,function(data){
            res.json({success:data});
        });
    }
});

module.exports = router;
