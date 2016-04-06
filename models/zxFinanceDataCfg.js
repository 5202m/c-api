/**
 * 财经日历配置<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年04月01日 <BR>
 * Description :<BR>
 * <p>
 *     财经日历配置
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var ZxFinanceDataCfgSchema = new Schema({
    _id : String, //指标ID
    name : String, //指标名称
    country : String, //指标国家
    importanceLevel : Number,// 重要指数
    description : String,// 描述
    dataType : {type : Number, index : true},// 数据类型(0：所有 1：外汇 2：贵金属 )
    valid : Number,// 是否有效(0：无效 1：有效 )
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('zxFinanceDataCfg',ZxFinanceDataCfgSchema,"zxFinanceDataCfg");