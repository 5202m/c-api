/**
 * 摘要：所有功能API 公共路由入口
 * author:Gavin.guo
 * date:2015/6/30
 */
var logger =require("../resources/logConf").getLogger("indexAPI");
var constant =require("../constant/constant");
var express = require('express');
var indexRouter = express.Router();
indexRouter.get('/', function(req, res) {
    res.render('index');
});

var apiRoutes = express();
var financeApiRoutes = express();

var tokenRoutes = require('./api/tokenAPI');							      //配置token API路由
var articleRoutes = require('./api/articleAPI');						      //配置文章资讯  API路由
var commonRoutes = require('./api/commonAPI');						   		  //配置公共  API路由
var smsRoutes = require("./api/smsAPI.js");                                   //发送短信信息  API路由
var chatRoutes = require('./api/chatAPI');
var zxFinanceRoutes = require('./api/zxFinanceAPI');                          //财经数据 API路由
var uploadRoutes = require("./api/uploadAPI.js");                             //文件上传  API路由
/**
 * 初始化入口
 * @param app
 */
exports.init = function(app){
	app.use('/', indexRouter);
    app.use('/api',apiRoutes);
    //设置跨域访问
    apiRoutes.all('/common|upload/*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By",' 3.2.1');
        res.header("P3P","CP=CAO PSA OUR");//处理ie跨域问题
        res.header("Content-Type", "application/json;charset=utf-8");
        next();
    });
    
    //授权处理
    apiRoutes.all(/\/chat\/getMessage/, function(req, res, next) {//拦截token授权接口
    	var roomCode = req.query["roomCode"];
        if(constant.studioGroupType.studio == roomCode){//直播间聊天记录不校验token(webui特例)
            next();
            return;
        }
        var token=req.query.token||req.body.token;
        require("../service/tokenService").verifyToken(token,function(isOK){
            if(isOK){
                next();
            }else{
                var ApiResult = require('../util/ApiResult');
                var errorMessage = require('../util/errorMessage.js');
                logger.warn("check token fail->token:" + token);
                if(req.path.indexOf('.xml')!=-1){
                    res.end(ApiResult.result(errorMessage.code_15,null,ApiResult.dataType.xml));
                }else{
                    res.json(ApiResult.result(errorMessage.code_15,null));
                }
            }
        });
    });
    
    apiRoutes.use('/token',tokenRoutes);
    apiRoutes.use('/article',articleRoutes);
    apiRoutes.use('/common',commonRoutes);
    apiRoutes.use("/sms", smsRoutes);
    apiRoutes.use("/chat", chatRoutes);
    apiRoutes.use("/upload/", uploadRoutes);
    apiRoutes.use("/zxFinanceData", zxFinanceRoutes);
};
