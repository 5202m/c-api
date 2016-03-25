/**
 * 财经事件<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年03月25日 <BR>
 * Description :<BR>
 * <p>
 *     财经事件
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var ZxFinanceEventSchema = new Schema({
    _id : ObjectId, // 事件ID
    status : String, // 事件状态
    type : {type : String, index : true}, // 事件种类[1-财经日历、2-国债发行、3-假期预告]
    country : String, // 事件国家
    region : String, // 事件地区
    importance : Number, // 事件重要性[low-1、mid-2、high-3]
    content : String, // 事件内容
    title : {type : String, index : true}, // 事件标题
    link : String, // 事件链接
    date : {type : String, index : true}, // 事件日期 yyyy-MM-dd
    time : {type : String, index : true}, // 事件时间 HH:mm:ss
    importanceLevel : Number, // 重要指数
    dataType : {type : Number, index : true},// 是否有效(0：所有 1：外汇 2：贵金属 )
    valid : Number,// 是否有效(0：无效 1：有效 )
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('zxFinanceEvent',ZxFinanceEventSchema,"zxFinanceEvent");