/**
 * 投资社区--会员资产<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年07月29日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  会员资产
 * </p>
 */
var mongoose = require('mongoose')
    , ObjectId = mongoose.Schema.ObjectId
    , Schema = mongoose.Schema;

var memberBalanceSchema = new Schema({
    _id : ObjectId,
    memberId : String,          //会员Id
    balanceInit : Number,       //期初资产
    balance : Number,           //总资产
    percentYield : Number,      //收益率
    balanceUsed : Number,       //占用资金
    balanceProfit : Number,     //总净盈亏
    incomeRankHis : [{          //历史收益率排名
        dataDate : Date,        //数据时间
        percentYield : Number,  //收益率
        rank :  Number          //排名
    }],
    timesOpen : Number,         //开仓次数
    timesFullyClose : Number,   //平仓次数，对于一开多平的情况，在完全平仓后记录一次
    timesClose: Number,         //平仓总次数
    timesFullyProfit : Number,  //盈利次数，对于一开多平的情况，在完全平仓后，全部平仓盈亏和为正，则记一次
    timesProfit : Number,       //盈利总次数
    timesFullyLoss : Number,    //亏损次数，对于一开多平的情况，在完全平仓后，全部平仓盈亏和为负，则记一次
    timesLoss : Number,         //亏损总次数
    attentionCount : Number,  //关注数
    beAttentionCount : Number,//粉丝数
    topicCount : Number,     //发帖数
    replyCount : Number,      //回帖数
    commentCount : Number,    //评论数
    shoutCount :  Number,      //喊单数
    beShoutCount :  Number,      //被跟单数
    isDeleted : Number,         //是否删除(0：删除 1：未删除)
    createUser : {type:String,default:'admin'},
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : {type:String,default:'admin'},
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('memberBalance',memberBalanceSchema,"memberBalance");