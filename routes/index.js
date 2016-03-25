/**
 * 摘要：所有功能API 公共路由入口
 * author:Gavin.guo
 * date:2015/6/30
 */
var logger =require("../resources/logConf").getLogger("indexAPI");
var express = require('express');
var indexRouter = express.Router();
indexRouter.get('/', function(req, res) {
    res.render('index');
});

var apiRoutes = express();
var financeApiRoutes = express();

var appRoutes = require('./api/appAPI');									  //配置APP API路由
var tokenRoutes = require('./api/tokenAPI');							      //配置token API路由
var articleRoutes = require('./api/articleAPI');						      //配置文章资讯  API路由
var commonRoutes = require('./api/commonAPI');						   		  //配置公共  API路由
var productAPIRoutes = require("./api/productAPI.js");                        //配置产品  API路由
var financeUserAPIRoutes = require("./api/financeUserAPI.js");				  //配置社区会员  API路由
var tradeAPIRoutes = require("./api/tradeAPI.js");                            //配置交易  API路由
var topicAPIRoutes = require("./api/topicAPI.js");                            //配置帖子  API路由
var mediaRoutes = require("./api/mediaAPI.js");                               //媒体信息  API路由
var smsRoutes = require("./api/smsAPI.js");                                   //发送短信信息  API路由
var feedbackRoutes = require("./api/feedbackAPI");                            //会员反馈信息  API路由
var uploadRoutes = require("./api/uploadAPI.js");                             //文件上传  API路由
var quotationRoutes = require("./api/quotationAPI.js");                       //行情  API路由
var replyRoutes = require("./api/replyAPI.js");                               //回帖  API路由
var praiseRoutes = require("./api/praiseAPI.js");                             //点赞  API路由
var collectRoutes = require("./api/collectAPI.js");                           //收藏  API路由
var pushRoutes = require("./api/pushAPI.js");                                 //推送消息 API路由
var appVersionRoutes = require("./api/appVersionAPI.js");                     //APP版本 API路由
var chatRoutes = require('./api/chatAPI');
var zxFinanceRoutes = require('./api/zxFinanceAPI');                          //财经数据 API路由

/**
 * 初始化入口
 * @param app
 */
exports.init = function(app){
	app.use('/', indexRouter);
    app.use('/api',apiRoutes);
    apiRoutes.use('/finance',financeApiRoutes);
    
    //设置跨域访问
    apiRoutes.all('/common/*', function(req, res, next) {
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
    
    apiRoutes.use('/app', appRoutes);
    apiRoutes.use('/token',tokenRoutes);
    apiRoutes.use('/article',articleRoutes);
    apiRoutes.use('/common',commonRoutes);
    apiRoutes.use("/sms", smsRoutes);
    apiRoutes.use("/chat", chatRoutes);
    apiRoutes.use("/message", pushRoutes);
    apiRoutes.use("/upload/", uploadRoutes);
    apiRoutes.use("/zxFinanceData", zxFinanceRoutes);

    financeApiRoutes.use("/product/", productAPIRoutes);
    financeApiRoutes.use("/account/", financeUserAPIRoutes);
    financeApiRoutes.use("/trade/", tradeAPIRoutes);
    financeApiRoutes.use("/quotation/", quotationRoutes);
    financeApiRoutes.use("/topic/", topicAPIRoutes);
    financeApiRoutes.use("/feedback/", feedbackRoutes);
    financeApiRoutes.use("/reply/", replyRoutes);
    financeApiRoutes.use("/praise/", praiseRoutes);
    financeApiRoutes.use("/collect/", collectRoutes);
    financeApiRoutes.use("/appVersion", appVersionRoutes);
    financeApiRoutes.use("/media", mediaRoutes); 
};
