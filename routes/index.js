/**
 * 摘要：所有功能API 公共路由入口
 * author:Gavin.guo
 * date:2015/6/30
 */
const logger =require("../resources/logConf").getLogger("indexAPI");
const constant =require("../constant/constant");
const express = require('express');
const path = require('path');
const indexRouter = express.Router();
const apiRoutes = express();
const financeApiRoutes = express();
const tokenRoutes = require('./api/tokenAPI');							      //配置token API路由
const articleRoutes = require('./api/articleAPI');						      //配置文章资讯  API路由
const commonRoutes = require('./api/commonAPI');						   		  //配置公共  API路由
const smsRoutes = require("./api/smsAPI.js");                                   //发送短信信息  API路由
const subscribeRoutes = require("./api/subscribeAPI.js");                     //发送订阅信息  API路由
const clientTrainRoutes = require("./api/clientTrainAPI.js");                    //发送订阅信息  API路由
const pointsRoutes = require("./api/pointsAPI.js");                             //积分信息  API路由
const chatRoutes = require('./api/chatAPI');
const messageRoutes = require('./api/messageAPI');
const pushInfoRoutes = require("./api/pushInfoAPI");
const showTradeRoutes = require("./api/showTradeAPI");
const studioRoutes = require("./api/studioAPI");
const userRoutes = require("./api/userAPI");
const syllabusRoutes = require("./api/syllabusAPI");
const zxFinanceRoutes = require('./api/zxFinanceAPI');                          //财经数据 API路由
const uploadRoutes = require("./api/uploadAPI.js");                             //文件上传  API路由
const noticeRoutes = require("./api/noticeAPI.js");                             //通知  API路由
const chatPraiseRoutes = require("./api/chatPraiseAPI.js");
const visitorRoutes = require("./api/visitorAPI.js");
const adminRoutes = require("./api/adminAPI.js");

indexRouter.get('/', function(req, res) {
    res.render('index');
});
/**
 * 初始化入口
 * @param app
 */
exports.init = app => {
    app.use('/apidoc', express.static(path.join(__dirname, '../apidoc/')));
    app.use('/', indexRouter);
    app.use('/api',apiRoutes);
    //设置跨域访问
    apiRoutes.all('/common|upload|message/*', (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With,X_Requested_With");
        res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By",' 3.2.1');
        res.header("P3P","CP=CAO PSA OUR");//处理ie跨域问题
        res.header("Content-Type", "application/json;charset=utf-8");
        next();
    });
    
    //授权处理
    apiRoutes.all(/\/chat\/getMessage/, (req, res, next) => {//拦截token授权接口
    	var roomCode = req.query["roomCode"];
        if(constant.studioGroupType.studio == roomCode){//直播间聊天记录不校验token(webui特例)
            next();
            return;
        }
        var token=req.query.token||req.body.token;
        require("../service/tokenService").verifyToken(token, isOK => {
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
    apiRoutes.use("/subscribe", subscribeRoutes);
    apiRoutes.use("/clientTrain", clientTrainRoutes);
    apiRoutes.use("/points", pointsRoutes);
    apiRoutes.use("/chat", chatRoutes);
    apiRoutes.use("/message", messageRoutes);
    apiRoutes.use("/pushInfo", pushInfoRoutes);
    apiRoutes.use("/showTrade", showTradeRoutes);
    apiRoutes.use("/studio", studioRoutes);
    apiRoutes.use("/user", userRoutes);
    apiRoutes.use("/syllabus", syllabusRoutes);
    apiRoutes.use("/upload/", uploadRoutes);
    apiRoutes.use("/zxFinanceData", zxFinanceRoutes);
    apiRoutes.use("/notice", noticeRoutes);
    apiRoutes.use("/chatPraise", chatPraiseRoutes);
    apiRoutes.use("/visitor", visitorRoutes);
    apiRoutes.use("/admin", adminRoutes);
};
