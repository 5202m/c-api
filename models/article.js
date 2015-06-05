/**
 * 摘要：文章资讯实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/4/23
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId
    ,articleDetailSchema = new Schema({   /**文章资讯详细信息*/
        _id : String,
        lang: {type:String,index:true} ,          /**语言*/
        title: String ,         /**标题*/
        content:String         /**内容*/
    });

var articleSchema = new Schema({
    _id : String,
    categoryId: {type:String,index:true} ,   /**栏目*/
    status: {type:Number, default:1}, /**状态*/
    platform : {type:String,index:true},      /**应用平台*/
    createDate : Date,       /**创建时间*/
    publishStartDate: {type:Date,index:true},
    publishEndDate:{type:Date,index:true},
    detailList : [articleDetailSchema]  /**文章资讯详细信息*/
});
module.exports = mongoose.model('article',articleSchema,'article');