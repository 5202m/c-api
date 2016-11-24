/**
 * 财经日历数据点评<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016.11.24 by Jade<BR>
 * Author : Jade <BR>
 * Date : 2016年11月24日 <BR>
 * Description :<BR>
 * <p>
 *     财经日历数据点评
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
var ZxFinanceDataCommentSchema = new Schema({
    _id : ObjectId,
    userId : String,
    userName : String,
    avatar : String,
    comment : String,
    valid : Number,// 是否有效(0：无效 1：有效)
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('zxFinanceDataComment',ZxFinanceDataCommentSchema,"zxFinanceDataComment");