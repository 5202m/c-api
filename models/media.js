/**
 * 摘要：媒体实体类
 * author:Alan.wu
 * date: 2015/7/3
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ,mediaSchema = new Schema({
        _id : String,
        categoryId: {type:String,index:true} ,   /**栏目*/
        status: {type:Number, default:1}, /**状态*/
        platform : {type:String,index:true},  /**应用平台*/
        createDate : Date,       /**创建时间*/
        publishStartDate: {type:Date,index:true},
        publishEndDate:{type:Date,index:true},
        mediaUrl:String,/**媒体地址路径*/
        mediaImgUrl:String,/** 媒体图片（视频专用字段）*/
        linkUrl:String,/** 点击媒体链接的路径*/
        valid:{type:Number, default:1}, /**是否有效*/
        detailList : [{   /**文章资讯详细信息*/
            lang: {type:String,index:true} ,          /**语言*/
            title: String ,         /**标题*/
            remark:String         /**简介*/
        }]
    });
module.exports = mongoose.model('media',mediaSchema,'media');