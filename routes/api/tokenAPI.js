var express = require('express');
var router = express.Router();
var tokenService = require('../../service/tokenService');
var common = require('../../util/common');

/**
 * 获取token
 */
router.get('/getToken', function(req, res) {
    var time=req.param('time');
    console.log("getToken cache,time:"+time);
    if(common.isBlank(time)){
        time=null;
    }
    tokenService.getToken(time,function(data){
        res.json(data);
    });
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
