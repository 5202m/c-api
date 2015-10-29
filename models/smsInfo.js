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
    , Schema = mongoose.Schema;

var smsInfoSchema = new Schema({
    _id : String,
    type : {type: String}, //信息类型 NORMAL-普通、AUTH_CODE-验证码
    useType : String,      //应用点
    mobilePhone : {type : String, index : true},   //手机号
    content : String,      //短信内容
    status : Number,       //发送状态：0-未发送 1-成功 2-发送成功
    sendTime : {type : Date, default : new Date()} //发送时间
});
module.exports = mongoose.model('smsInfo',smsInfoSchema,"smsInfo");