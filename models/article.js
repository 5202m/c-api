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
        lang: String ,          /**语言*/
        title: String ,         /**标题*/
        content:String         /**内容*/
    });

var articleSchema = new Schema({
    _id : String,
    categoryId: String ,   /**栏目*/
    status: String,         /**状态*/
    platform : String,      /**应用平台*/
    createDate : Date,       /**创建时间*/
    detailList : [articleDetailSchema]  /**文章资讯详细信息*/
});
module.exports = mongoose.model('article',articleSchema,'article');