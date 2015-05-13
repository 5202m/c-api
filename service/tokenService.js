/** 用户服务类
 * Created by Alan.wu on 2015/3/4.
 */
var token = require('../models/token');                 //引入token数据模型
var tokenAccess = require('../models/tokenAccess');   //引入tokenAccess数据模型
var uuid=require("node-uuid");//引入uuid
var http = require('http');//引入http
var Schedule = require("node-schedule");//引入定时器
var config = require("../resources/config");

/**
 * 定义token服务类
 */
var tokenService = {
    /**
     * 提取token
     * @param expires 0:一次有效  1:1个小时  2:2个小时
     */
    getToken:function(expires,tokenAccessId,callback){
        var beginTime=0,endTime=0;
        if(expires!=null && expires!= 0) {
            var date=new Date();
            beginTime=date.getTime();
            endTime=date + expires*3600*1000;
        }
        var tokenVal=uuid.v4().replace(/-/g,'');
        var row={
            _id:null,
            value:tokenVal,
            tokenAccessId:tokenAccessId,
            beginTime:beginTime,
            endTime:endTime,
            createDate:new Date() //创建日期
        };
        token.create(row,function(err){
            console.log('save token success!');
            callback({token:tokenVal,expires : expires*3600});
        });
    },

    /**
     * 验证token
     * @param val
     * @param callback
     */
    verifyToken:function(val,callback){
        token.findOne({value:val},function (err,row) {
             if(err!=null||row==null){
                callback(false);
             }else{
                 if(row.beginTime == 0 && row.endTime == 0){
                     tokenService.deleteToken(val,0,0,function(data){
                         callback(true);
                     });
                 }else{
                     var date=new Date().getTime();
                     callback(row.beginTime<=date && date<=row.endTime);
                 }
             }
         });
    },
    /**
     * 提取webui对应token
     */
    getWebuiToken:function(callback) {
        http.get(config.webUiUrl, function(res) {
             res.on('data',function(data){
                 callback(data);
            });
        }).on('error', function(e) {
            console.log("Get WebuiToken Error: " + e.message);
        });
    },
    /**
     * 删除token信息
     */
    deleteToken:function(val,beginTime,endTime,callback){
        token.remove({"value": val,"beginTime":beginTime,"endTime":endTime},function (err) {
            callback(!err);
        });
    },
    /**
     * 销毁无效的token
     * @param date
     */
    destroyToken:function(date,callback){
        token.remove({"endTime":{ "$lt":date.getTime(),"$gt":0}},function (err) {
            callback(!err);
        });
    },
    /**
     * 获取tokenAccess值
     * @param appId
     * @param appSecret
     * @param callback
     */
    getTokenAccess:function(appId,appSecret,callback){
        tokenAccess.findOne({appId:appId,appSecret:appSecret},function (err,row) {
            if(err!=null||row==null){
                callback(false);
            }else{
                callback(row);
            }
        });
    }
};

//导出服务类
module.exports =tokenService;

