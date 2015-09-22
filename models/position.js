/**
 * 投资社区--持仓记录<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月16日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  持仓记录实体类
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var positionSchema = new Schema({
    _id : String,
    memberId : {type : String, index : true},           //会员Id(外键)
    orderNo : {type : String, index : true},            //订单号
    openTime : {type : Date, default : new Date(0)},    //开仓时间
    productCode : String,       //产品编号
    tradeDirection : Number,    //交易方向(1：买入 2：卖出)
    leverageRatio : Number,     //杠杆
    contractPeriod : Number,    //合约单位
    volume : Number,            //手数
    openPrice : Number,         //手数
    earnestMoney : Number,      //保证金
    floatProfit : Number,       //浮动盈亏
    positionProfit : Number,    //持仓盈亏，当前持仓单历史盈亏值总和，每次部分平仓需要更新该值。
    remark : String             //备注
});
module.exports = mongoose.model('position',positionSchema,"position");