/**
 * 摘要：帖子统计信息
 * author: Dick.guo
 * date: 2015/8/3
 */
var mongoose = require('mongoose')
    , ObjectId = mongoose.Schema.ObjectId
    , Schema = mongoose.Schema;
var topicStatisticalSchema = new Schema({
    _id : ObjectId,
    topicId : {type: String, index : true},                         //帖子ID或文章ID(外键)
    type : {type : Number, index : true},                           //回帖类别：1--topic 2--article
    praiseCounts : Number,                                          //点赞数
    replyCounts : Number,                                           //回复数
    reportCounts : Number,                                         //举报人数
    readCounts : Number,                                           //阅读数
    isDeleted : Number,                                             //是否删除(0：删除 1：未删除)
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('topicStatistical',topicStatisticalSchema,"topicStatistical");