/** 用户服务类
 * Created by Alan.wu on 2015/3/4.
 */
var token = require('../models/token');//引入member数据模型
var uuid=require("node-uuid");//引入uuid
var http = require('http');//引入http
var Schedule = require("node-schedule");//引入定时器
var config = require("../resources/config");
/**
 * 定义token服务类
 * @type {{getMemberList: Function, updateMemberInfo: Function}}
 */
var tokenService = {
    /**
     * 提取token
     */
    getToken:function(time,callback){
        var beginTime=0,endTime=0;
        if(time!=null) {
            var date=new Date();
            beginTime=date.getTime();
            endTime=date+parseInt(time);
        }
        var tokenVal=uuid.v4().replace(/-/g,'');
        var row={
            _id:null,
            value:tokenVal,
            beginTime:beginTime,
            endTime:endTime,
            createDate:new Date() //创建日期
        };
        token.create(row,function(err){
            console.log('save token success!');
            callback({token:tokenVal});
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
                 var date=new Date().getTime();
                 callback((row.beginTime==0 && row.endTime==0)||(row.beginTime<=date && date<=row.endTime));
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
     * 销毁无效的token
     * @param date
     */
    destroyToken:function(date,callback){
        token.remove({"endTime":{ "$lt":date.getTime(),"$gt":0}},function (err) {
            callback(!err);
        });
    }
};

//导出服务类
module.exports =tokenService;

