/*＃＃＃＃＃＃＃＃＃＃引入所需插件＃＃＃＃＃＃＃＃begin */
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var logger = require('./resources/logConf');
var config=require('./resources/config');
/*＃＃＃＃＃＃＃＃＃＃引入所需插件＃＃＃＃＃＃＃＃end */

/*＃＃＃＃＃＃＃＃＃＃定义app配置信息＃＃＃＃＃＃＃＃begin */
var app = express();
// view engine setup(定义页面，使用html）
app.set('views', path.join(__dirname, 'views'));
/*app.set('view engine', 'ejs');*/
app.set( 'view engine', 'html' );
app.engine('.html',require('ejs').__express);//两个下划线
logger.initConfig();
logger.use(app);//配置框架日志输出
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, parameterLimit:50000}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'views')));如需要设成静态目录，则这就去掉注释。（备注：设为静态目录，不能动态填充数据）

/*＃＃＃＃＃＃＃＃＃＃路由入口设置＃＃＃＃＃＃＃＃begin */
var index = require('./routes/index').init(app);//配置同源页面路由

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
    server: {auto_reconnect: true, poolSize: 5 },
    user: config.dbUserName,
    pass: config.dbUserPWD
};
mongoose.connect(config.dbURL,dboptions);
/*＃＃＃＃＃＃＃＃＃＃数据库连接配置＃＃＃＃＃＃＃＃end */

(function(JSON) {
    let loggerTmp = logger.getLogger("application");
    let jParse = JSON.parse;
    JSON.parse = function() {
        try {
            return jParse.apply(JSON, arguments);
        } catch (e) {
            loggerTmp.error(`JSON parse Error in ${arguments.callee.name}: `, e);
            return {};
        };
    };
    let jStringify = JSON.stringify;
    JSON.stringify = function() {
        try {
            return jStringify.apply(JSON, arguments);
        } catch (e) {
            loggerTmp.error(`JSON stringify Error in ${arguments.callee.name}: `, e);
            return "";
        }
    };
})(global.JSON);

module.exports = app;
