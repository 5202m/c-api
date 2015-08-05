/**
 * Api默认跳转到主页
 * author:alan.wu
 * date:2015/7/3
 */
var indexRouter = require('express').Router();
indexRouter.get('/', function(req, res) {
    res.render('index');
});

/**
 * 摘要：所有功能API 公共路由入口
 * author:Gavin.guo
 * date:2015/6/30
 */
var appRoutes = require('./api/appAPI');							//配置APP API路由
var tokenRoutes = require('./api/tokenAPI');						//配置token API路由
var articleRoutes = require('./api/articleAPI');				//配置文章资讯  API路由
var commonRoutes = require('./api/commonAPI');					//配置公共  API路由
var smsRoutes = require("./api/smsAPI.js");
/**
 * 初始化入口
 * @param app
 */
exports.init = function(app){
    app.use('/', indexRouter);
    app.use('/api/app/', appRoutes);
    app.use('/api/token/',tokenRoutes);
    app.use('/api/article/',articleRoutes);
    app.use('/api/common/',commonRoutes);
    app.use("/api/sms/", smsRoutes);
};
