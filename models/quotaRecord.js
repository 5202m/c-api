/**
 * 投资社区--额度记录<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月17日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  额度记录实体类
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var quotaRecordSchema = new Schema({
    _id : String,
    memberId : {type : String, index : true},           //会员编号
    orderNo : {type : String, index : true},            //订单号
    tradeTime : {type : Date, default : new Date(0)},   //交易时间
    item : Number,              //项目(1：盈亏  2：积分兑换)
    beforeTradeBalance : Number,//交易前余额
    afterTradeBalance : Number, //交易后余额
    income : Number,            //收入
    expenditure : Number,       //支出
    remark : String             //备注
});
module.exports = mongoose.model('quotaRecord', quotaRecordSchema, "quotaRecord");