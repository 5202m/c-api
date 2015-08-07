/**
 * Api默认跳转到主页
 * author:alan.wu
 * date:2015/7/3
 */
var express=require('express');
var indexRouter = express.Router();
indexRouter.get('/', function(req, res) {
    res.render('index');
});

/**
 * 摘要：所有功能API 公共路由入口
 * author:Gavin.guo
 * date:2015/6/30
 */
var apiRoutes=express();
var appRoutes = require('./api/appAPI');							//配置APP API路由
var tokenRoutes = require('./api/tokenAPI');						//配置token API路由
var articleRoutes = require('./api/articleAPI');				//配置文章资讯  API路由
var commonRoutes = require('./api/commonAPI');					//配置公共  API路由
var smsRoutes = require("./api/smsAPI.js");
var chatRoutes = require('./api/chatAPI');
/**
 * 初始化入口
 * @param app
 */
exports.init = function(app){
    app.use('/', indexRouter);
    app.use('/api',apiRoutes);
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
    apiRoutes.all(/\/chat\/*/, function(req, res, next) {//拦截token授权接口
        var token=req.query.token||req.body.token;
        if(token){//检查token
            require("../service/tokenService").verifyToken(token,function(isOK){
              if(isOK){
                  next();
              }else{
                  res.end("No Authority,Please Check!");
              }
            });
        }else{
            res.end("No Authority,Please Check!");
        }
    });
    apiRoutes.use('/app', appRoutes);
    apiRoutes.use('/token',tokenRoutes);
    apiRoutes.use('/article',articleRoutes);
    apiRoutes.use('/common',commonRoutes);
    apiRoutes.use("/sms", smsRoutes);
    apiRoutes.use("/chat", chatRoutes);
};
