/**
 * 短信配置信息<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年10月29日 <BR>
 * Description :<BR>
 * <p>
 *     短信配置信息
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var smsConfigSchema = new Schema({
    _id : ObjectId,
    type : {type: String}, //信息类型 NORMAL-普通、AUTH_CODE-验证码
    useType : String,      //应用点
    validTime : Number,    //验证码有效时间
    cycle : String,        //计数周期（H-时、D-天、W-周、M-月、Y-年）
    cnt : Number,          //重新发送次数
    status : Number,       //是否有效 1-有效 0-无效
    isDeleted : Number,    //是否删除(0：删除 1：未删除)
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('smsConfig',smsConfigSchema,"smsConfig");