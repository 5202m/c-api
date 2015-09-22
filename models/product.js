/**
 * 投资社区--产品<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月10日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  产品实体类
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var productSchema = new Schema({
    _id : String,
    code : String,      //产品码
    name : String,      //产品名称
    sort : Number,      //产品排序
    status: Number,     //状态(0：禁用 1：启用)
    isDeleted: Number , //是否删除(0：删除 1：未删除)
    children : [{
        _id : String,
        code : String,      //产品码
        name : String,      //产品名称
        sort : Number,      //产品排序
        status: Number,     //状态(0：禁用 1：启用)
        isDeleted: Number , //是否删除(0：删除 1：未删除)
        createUser : String,
        createIp : String,
        createDate : {type : Date, default : new Date()},
        updateUser : String,
        updateIp : String,
        updateDate : {type : Date, default : new Date()}
    }],
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('product',productSchema,"product");