/**
 * 摘要：APP版本 实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/9/15
 */
var mongoose = require('mongoose')
    , ObjectId = mongoose.Schema.ObjectId
    , Schema = mongoose.Schema
    , appVersionSchema = new Schema({             //APP 版本Schema
        _id : ObjectId,
        platform : Number,                          //平台(1:android 2:IOS)
        versionNo : Number,                         //版本号
        versionName :String,                        //版本名称
        isMustUpdate :Number,                       //是否强制更新(1:非强制更新  2：强制更新)
        remark : String ,                           //升级说明
        appPath : String,                           //APP下载的路径
        isDeleted : Number                         //是否删除(0：删除 1：未删除)
    });
module.exports = mongoose.model('appVersion',appVersionSchema ,"appVersion");