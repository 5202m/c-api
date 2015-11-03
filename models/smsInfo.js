/**
 * 短信记录信息<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年10月28日 <BR>
 * Description :<BR>
 * <p>
 *     短信记录信息
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var smsInfoSchema = new Schema({
    _id : ObjectId,
    type : {type: String}, //信息类型 NORMAL-普通、AUTH_CODE-验证码
    useType : String,      //应用点
    mobilePhone : {type : String, index : true},      //手机号
    deviceKey : String,    //设备关键字，保存ip或者MAC地址，用于次数限制的设备唯一标识。
    content : String,      //短信内容
    status : Number,       //发送状态：0-未发送 1-发送成功 2-发送失败 3-已使用(针对于短信验证码) 4-已失效
    cntFlag : Number,      //计数标志 1-有效 0-无效
    sendTime : Date ,      //发送时间
    validUntil : Date,     //有效期至
    useTime : Date         //使用时间
});
module.exports = mongoose.model('smsInfo',smsInfoSchema,"smsInfo");