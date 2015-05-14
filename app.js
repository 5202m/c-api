/*＃＃＃＃＃＃＃＃＃＃引入所需插件＃＃＃＃＃＃＃＃begin */
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var logger = require('./resources/logConf');
var config=require('./resources/config');
/*＃＃＃＃＃＃＃＃＃＃引入所需插件＃＃＃＃＃＃＃＃end */

/*＃＃＃＃＃＃＃＃＃＃路由入口设置＃＃＃＃＃＃＃＃begin */
var webIndex = require('./routes/index');//配置同源页面路由
var appRoutes = require('./routes/api/appAPI');//配置app api路由
var advertisementRoutes = require('./routes/api/advertisementAPI');//配置广告api路由
var tokenRoutes = require('./routes/api/tokenAPI');//配置应用api路由
var articleRoutes = require('./routes/api/articleAPI');//配置文章资讯api路由
var commonRoutes = require('./routes/api/commonAPI');//配置文章资讯api路由

/*＃＃＃＃＃＃＃＃＃＃引入所需插件＃＃＃＃＃＃＃＃end */


/*＃＃＃＃＃＃＃＃＃＃定义app配置信息＃＃＃＃＃＃＃＃begin */
var app = express();
//设置跨域访问
app.all('/api/common/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
// view engine setup(定义页面，使用html）
app.set('views', path.join(__dirname, 'views'));
/*app.set('view engine', 'ejs');*/
app.set( 'view engine', 'html' );
app.engine('.html',require('ejs').__express);//两个下划线
logger.use(app);//配置框架日志输出
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'views')));如需要设成静态目录，则这就去掉注释。（备注：设为静态目录，不能动态填充数据）
/*---------------- 外部链接路由的路径 ---------------- begin */
app.use('/', webIndex);
app.use('/api/app/', appRoutes);
app.use('/api/advertisement/', advertisementRoutes);
app.use('/api/token/',tokenRoutes);
app.use('/api/article/',articleRoutes);
app.use('/api/common/',commonRoutes);
/*----------------  外部链接路由的路径 ---------------- end */

// catch 404 and forward to error handler （400请求错误处理）
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace （开发模式）
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user（500请求错误处理）
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
/*＃＃＃＃＃＃＃＃＃＃定义app配置信息＃＃＃＃＃＃＃＃end */

/*＃＃＃＃＃＃＃＃＃＃数据库连接配置＃＃＃＃＃＃＃＃begin */
var dboptions = {
    server: { poolSize: 5 },
    user: config.dbUserName,
    pass: config.dbUserPWD
};
mongoose.connect(config.dbURL,dboptions);
/*＃＃＃＃＃＃＃＃＃＃数据库连接配置＃＃＃＃＃＃＃＃end */

module.exports = app;
