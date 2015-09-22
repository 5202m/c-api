/**
 * 摘要：回帖实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/7/2
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;
var replySchema = new Schema({
    _id : String,
    topicId : {type: String, index : true},                         //帖子ID或文章ID(外键)
    device : String,                                                //发帖设备
    type : {type : Number, index : true},                           //回帖类别：1--topic 2--article
    content : String,                                               //回复内容
    replyDate : {type : Date, default : new Date()},                //回复时间
    replyList :[{
        _id:String ,
        topicId : {type: String, index : true},
        device : String,                                              //发帖设备
        type : {type : Number, index : true},
        content: String ,
        replyDate: {type : Date, default : new Date()},
        isDeleted : Number,                                           //是否删除(0：删除 1：未删除)
        createUser : String,
        createIp : String,
        createDate : {type : Date, default : new Date()},
        updateUser : String,
        updateIp : String,
        updateDate : {type : Date, default : new Date()}
    }],
    isDeleted : Number,                                           //是否删除(0：删除 1：未删除)
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('reply',replySchema,"reply");