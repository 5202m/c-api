/**
 * 摘要：会员反馈实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/7/20
 */
var mongoose = require('mongoose')
    , ObjectId = mongoose.Schema.ObjectId
    , Schema = mongoose.Schema
    , feedbackSchema = new Schema({             //会员反馈Schema
        _id : ObjectId,
        memberId : {type:String,index:true},
        lastFeedbackDate : Date,               //最后反馈时间
        lastFeedbackContent :String,           //最后反馈内容
        replyList : [{
            _id : ObjectId,
            feedBackDate : Date,               //反馈时间
            feedBackContent : String,          //反馈内容
            type : {type:Number, default:1}    //类型  1:会员  2:管理员
        }],
        isDeleted : Number,                     //是否删除(0：删除 1：未删除)
        isReply : Number,                       //是否回复用户反馈内容(1：是  0：否)
        createUser : String,
        createIp : String,
        createDate : {type : Date, default : new Date()},
        updateUser : String,
        updateIp : String,
        updateDate : {type : Date, default : new Date()}
    });
module.exports = mongoose.model('feedback',feedbackSchema ,"feedback");