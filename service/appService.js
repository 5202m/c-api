/**
 * 摘要：app Service服务类
 * author：Gavin.guo
 * date:2015/4/8
 */
var app = require('../models/app');//引入app数据模型
var commonJs = require('../util/common'); //引入公共的js

/**
 * 定义服务类
 * @type {{getAppList: Function}}
 */
var appService = {
    /**
     * 根据应用类别Id-->提取应用信息列表
     */
    getAppList:function(appCategoryId,callback){
        var searchObj = {};
        if(!commonJs.isBlank(appCategoryId)){
            searchObj = {'appCategory._id' : appCategoryId};
        }
        app.find(searchObj,function (err,apps) {
            if(err!=null){
                callback(null);
            }
            callback(apps);
        });
    },
    /**
     * 根据应用Id --> 获取应用信息
     * @param appId  应用Id
     */
    getAppById : function(appId,callback){
        app.findById(appId ,function (err,app) {
            if(err!=null){
                callback(null);
            }
            callback(app);
        });
    }
}

//导出服务类
module.exports = appService;

