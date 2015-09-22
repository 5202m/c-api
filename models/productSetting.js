/**
 * 投资社区--产品配置<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月10日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  产品配置实体类
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var productSettingSchema = new Schema({
    _id : String,
    productCode: {type : String, index : true}, //产品编码
    priceDecimal: Number,       //报价小数位
    leverageRatio: String,      //杠杆比例(设置多个模式，模式之间使用“#“分隔)
    contractPeriod:Number,      //合约单位
    minTradeHand: Number,       //最小交易手数
    tradeModel: Number,         //交易模式(1：市价  2：现价)
    isDeleted: Number,          //是否删除(0：删除 1：未删除)
    status: Number,             //状态(0:禁用 1：启用)
    remark: String,
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('productSetting',productSettingSchema,"productSetting");