/**
 * 摘要：token设置实体类
 * author: Gavin.guo
 * date: 2015/5/12
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId
    ,tokenAccessSchema = new Schema({
            _id:ObjectId,
            appId:String,                                //appId
            appSecret:String,                           //appSecret
            expires:{type:Number, default:2},          //有效时间
            valid: {type:Number, default:1},           //是否删除
            status: String                              //是否启用
     });
module.exports = mongoose.model('tokenAccess',tokenAccessSchema,"tokenAccess");