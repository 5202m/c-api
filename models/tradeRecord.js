/**
 * 投资社区--交易记录<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月16日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  交易记录实体类
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var tradeRecordSchema = new Schema({
    _id : String,
    memberId : {type : String, index : true},           //会员编号
    orderNo : {type : String, index : true},            //订单号
    tradeTime : {type : Date, default : new Date(0)},   //交易时间
    productCode : String,       //产品码
    operType : Number,          //类别(1：开仓  2：平仓)
    tradeDirection : Number,    //交易方向(1：买入 2：卖出)
    leverageRatio : Number,     //杠杆倍数
    contractPeriod : Number,    //合约单位
    volume : Number,            //手数
    transactionPrice : Number,  //交易价格
    profitLoss : Number,        //盈亏
    relationOrderNo : String,   //关联单号--平仓单对应的开仓单号
    tradeMark : Number,         //交易标识：1-普通、2-喊单、3-跟单
    followOrderNo : String,     //跟单号：跟单对应的原订单号
    remark : String             //备注
});
module.exports = mongoose.model('tradeRecord', tradeRecordSchema, "tradeRecord");