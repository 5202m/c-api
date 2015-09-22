/**
 * 媒体信息<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年07月06日 <BR>
 * Description :<BR>
 * <p>
 *     媒体信息：投资社区--广告
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var mediaSchema = new Schema({
    "_id": String,
    "categoryId": String,//类别号:公告bulletin、广告advertisement、视频video、专家视频video_expert、教学视频video_teaching
    "status": Number,
    "mediaUrl": String,//视频URL或者公告广告的图片URL，包括域名。
    "mediaImgUrl": String,//视频中图片URL
    "linkUrl": String,//外部链接地址
    "platform": String,//平台：投资社区finance
    "publishStartDate": {type : Date, default : new Date()},//发布开始时间
    "publishEndDate": {type : Date, default : new Date()},//发布结束时间
    "detailList": [{
        "lang": String,
        "title": String,
        "remark": String,
        "seoTitle": String,
        "seoKeyword": String,
        "seoDescription": String
    }],
    "valid": Number,
    "sequence": Number,
    "createUser": String,
    "createIp": String,
    "createDate": {type : Date, default : new Date()},
    "updateUser": String,
    "updateIp": String,
    "updateDate": {type : Date, default : new Date()}
});

module.exports = mongoose.model('media',mediaSchema,"media");