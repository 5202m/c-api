/**
 * 摘要：会员反馈只能回复库实体类
 * author: Gavin.guo
 * date: 2015/7/20
 */
var mongoose = require('mongoose')
    , ObjectId = mongoose.Schema.ObjectId
    , Schema = mongoose.Schema
    , feedbackAutoSchema = new Schema({
        _id : ObjectId,
        type: {type:Number},                    //类型，1-自定义，2-系统
        antistop : {type:String,index:true},    //关键词
        content : String,                       //内容
        isDeleted : Number,                     //是否删除(0：删除 1：未删除)
        createUser : String,
        createIp : String,
        createDate : {type : Date, default : new Date()},
        updateUser : String,
        updateIp : String,
        updateDate : {type : Date, default : new Date()}
    });
module.exports = mongoose.model('feedbackAuto', feedbackAutoSchema ,"feedbackAuto");