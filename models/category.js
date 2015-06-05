/**
 * 摘要：资讯栏目实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/4/23
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId
    ,categorySchema = new Schema({
        _id : String,
        name: String ,
        code: {type:String,index:true} ,
        status:Number
    });
module.exports = mongoose.model('category',categorySchema,'category');