/**
 * 摘要：app 实体类(主要用于查询)
 * author：Gavin.guo
 * date:2015/4/8
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId
    ,appCategorySchema = new Schema({
        _id : String
    });

var appSchema = new Schema({
    _id : String,
    code: String ,
    title: String,
    status:Number,
    isDefaultVisibility:Number,
    valid : Number,
    appCategory : [appCategorySchema]
});
module.exports = mongoose.model('app',appSchema,"app");