/**
 * 投资社区--账户资产<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年07月29日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  账户资产服务类
 * </p>
 */
var logger = require('../resources/logConf').getLogger("MemberBalanceService");
var MemberBalance = require('../models/memberBalance.js');
var Member = require('../models/member.js');
var ObjectId = require('mongoose').Types.ObjectId;
var APIUtil = require('../util/APIUtil.js');
var IteratorUtil = require('../util/IteratorUtil.js');
var Utils = require('../util/Utils.js');
var async = require('async');//引入async

var MemberBalanceService = {

    /**
     * 默认资产信息
     */
    DEFAULT_BALANCE_INFO : {
        balanceInit : 100000,
        balance : 100000,
        percentYield : 0,
        balanceUsed : 0,
        balanceProfit : 0,
        incomeRankHis:[],
        timesOpen : 0,
        timesFullyClose : 0,
        timesClose : 0,
        timesFullyProfit : 0,
        timesProfit : 0,
        timesFullyLoss : 0,
        timesLoss : 0,
        createUser : 'admin',
        updateUser : 'admin'
    },

    /**
     * 按照会员Id查询资产信息。
     * @param memberId  会员Id
     * @param callback 回调(err, memberBalance)
     */
    find : function(memberId, callback){
        APIUtil.DBFindOne(MemberBalance,
            {
                query : {
                    isDeleted : 1,
                    memberId : memberId
                }
            }, callback);
    },

    /**
     * 查询收益率排名
     * @param balance  当前资产信息
     * @param callback  回调(err, rank)
     */
    getRanking : function(balance, callback){
       MemberBalance.count({
            isDeleted : 1,
            $or :[
                {
                    percentYield : {$gt : balance.percentYield}
                },{
                    percentYield : balance.percentYield, _id : {$lt : balance._id}
                }
            ]

        }, function(err, rank){
            if(err){
                logger.error("查询收益率排名信息失败！", err);
                callback(err, 0);
                return;
            }
            callback(null, rank + 1);
        });
    },

    /**
     * 平仓后实时获取排名
     */
    getRankingAfterClose : function(memberId, callback){
        APIUtil.DBFind(MemberBalance,
            {
                query : {isDeleted : 1},
                sortDesc : ["percentYield"]
            },
            function(err, memberBalances){
                if(err){
                    logger.error("统计会员收益率排名失败--查询会员资产信息失败！", err);
                    callback(err, 0);
                    return;
                }
                if(memberBalances != null && memberBalances.length > 0){
                    for(var i =0;i<memberBalances.length;i++){
                        var tempMemberBalance = memberBalances[i];
                        if(tempMemberBalance.memberId == memberId){
                            callback(null, i + 1);
                            return;
                        }
                    }
                }
            }
        );
    },

    /**
     * 重建会员的资产信息
     * @param memberId
     * @param ip
     * @param callback
     */
    rebuild : function(memberId, ip, callback){
        //删除会员已有的资产信息
        MemberBalance.update(
            {
                isDeleted : 1,
                memberId : memberId
            },
            {
                $set : {isDeleted : 0}
            },
            { multi : true},
            function(err){
                if(err){
                    logger.error("删除会员原有资产信息失败！", err);
                    callback(err, null);
                    return;
                }
                //新增资产信息
                var loc_timeNow = new Date();
                var loc_balance = new MemberBalance({
                    _id : new ObjectId(),
                    memberId : memberId,
                    balanceInit : MemberBalanceService.DEFAULT_BALANCE_INFO.balanceInit,
                    balance : MemberBalanceService.DEFAULT_BALANCE_INFO.balance,
                    percentYield : MemberBalanceService.DEFAULT_BALANCE_INFO.percentYield,
                    balanceUsed : MemberBalanceService.DEFAULT_BALANCE_INFO.balanceUsed,
                    balanceProfit : MemberBalanceService.DEFAULT_BALANCE_INFO.balanceProfit,
                    incomeRankHis : MemberBalanceService.DEFAULT_BALANCE_INFO.incomeRankHis,
                    timesOpen : MemberBalanceService.DEFAULT_BALANCE_INFO.timesOpen,
                    timesFullyClose : MemberBalanceService.DEFAULT_BALANCE_INFO.timesFullyClose,
                    timesClose: MemberBalanceService.DEFAULT_BALANCE_INFO.timesClose,
                    timesFullyProfit : MemberBalanceService.DEFAULT_BALANCE_INFO.timesFullyProfit,
                    timesProfit : MemberBalanceService.DEFAULT_BALANCE_INFO.timesProfit,
                    timesFullyLoss : MemberBalanceService.DEFAULT_BALANCE_INFO.timesFullyLoss,
                    timesLoss : MemberBalanceService.DEFAULT_BALANCE_INFO.timesLoss,
                    isDeleted : 1,
                    createUser : MemberBalanceService.DEFAULT_BALANCE_INFO.createUser,
                    createIp : ip,
                    createDate : loc_timeNow,
                    updateUser : MemberBalanceService.DEFAULT_BALANCE_INFO.updateUser,
                    updateIp : ip,
                    updateDate : loc_timeNow
                });
                loc_balance.save(function(err, balance){
                    if(err){
                        logger.error("重建会员资产信息失败！", err);
                        callback(err, null);
                        return;
                    }
                    callback(null, balance);
                })
            }
        );
    },

    /**
     * 修改会员资产信息
     * @param memberId
     * @param updater
     * @param callback
     */
    modify : function(memberId, updater, callback){
        MemberBalance.findOneAndUpdate({
            isDeleted : 1,
            memberId : memberId
        }, updater, {'new' : true}, callback)
    },

    /**
     * 更新会员统计信息部分字段值
     */
    updateMemberBalance : function(callback){
        APIUtil.DBFind(MemberBalance,
            {
                query : {isDeleted : 1}
            },
            function(err, memberBalances) {
                if (err) {
                    logger.error("统计会员收益率排名失败--查询会员资产信息失败！", err);
                    callback(err, 0);
                    return;
                }
                async.eachSeries(memberBalances, function (memberBalance, callbackTmp) {
                    var memberId = memberBalance.memberId;
                    APIUtil.DBFindOne(Member,{
                        query : {
                            valid : 1,
                            status : 1,
                            _id : memberId,
                            "loginPlatform.financePlatForm" : {$exists: true},
                            "loginPlatform.financePlatForm.isDeleted" : 1,
                            "loginPlatform.financePlatForm.status" : 1
                        },
                        fieldIn : ["_id", "mobilePhone", "loginPlatform.financePlatForm"]
                    }, function(error,data){
                        if(err){
                            logger.error("查询账户信息失败!", err);
                            callback(err);
                            return;
                        }
                        var financePlatForm = data.loginPlatform.financePlatForm;
                        var memberBalanceTemp = {
                            $set : {
                                attentionCount: financePlatForm.attentions && financePlatForm.attentions.length > 0 ? financePlatForm.attentions.length : 0,
                                beAttentionCount: financePlatForm.beAttentions && financePlatForm.beAttentions.length > 0 ? financePlatForm.beAttentions.length : 0,
                                topicCount: financePlatForm.topicCount ? financePlatForm.topicCount : 0,
                                replyCount: financePlatForm.replyCount ? financePlatForm.replyCount : 0,
                                commentCount: financePlatForm.commentCount ? financePlatForm.commentCount : 0,
                                shoutCount: financePlatForm.shoutCount ? financePlatForm.shoutCount : 0,
                                beShoutCount: financePlatForm.beShoutCount ? financePlatForm.beShoutCount : 0
                            }
                        };
                        MemberBalanceService.modify(memberId,memberBalanceTemp,function(error){
                            callbackTmp(error);
                        });
                    });
                }, function (err) {
                    callback(!err);
                });
            }
        )
    },

    /**
     * 统计排名
     */
    rankStatistic : function(callback){
        APIUtil.DBFind(MemberBalance,
            {
                query : {isDeleted : 1},
                sortDesc : ["percentYield"]
            },
            function(err, memberBalances){
                if(err){
                    logger.error("统计会员收益率排名失败--查询会员资产信息失败！", err);
                    callback(err, 0);
                    return;
                }
                var lenI = !memberBalances ? 0 : memberBalances.length;
                if(lenI === 0){
                    callback(null, lenI);
                    return;
                }
                var loc_timeNow = new Date();
                var loc_timeHis = new Date(loc_timeNow.getFullYear(), loc_timeNow.getMonth(), 0);
                var loc_timeHisTime = loc_timeHis.getTime();
                IteratorUtil.asyncArray(memberBalances, function(index, memberBalance, callback){
                    //如果存在则直接更新，否者添加
                    var loc_incomeRankObj = null;
                    for(var i = !memberBalance.incomeRankHis ? -1 : memberBalance.incomeRankHis.length - 1; i >= 0; i--){
                        loc_incomeRankObj = memberBalance.incomeRankHis[i];
                        if(loc_incomeRankObj.dataDate instanceof Date && loc_timeHisTime == loc_incomeRankObj.dataDate.getTime()){
                            if(loc_incomeRankObj.percentYield == memberBalance.percentYield && loc_incomeRankObj.rank == index + 1){
                                callback(null, 0);
                            }else{
                                var loc_update = {"$set" : {}};
                                loc_update["$set"]["incomeRankHis." + i] = {
                                    dataDate : loc_timeHis,
                                    percentYield : memberBalance.percentYield,
                                    rank : index + 1
                                };
                                memberBalance.update(loc_update, function(err){
                                        callback(err, !err ? 1 : 0);
                                });
                            }
                            return;
                        }
                    }
                    if(i == -1){
                        memberBalance.update(
                            {$push : {
                                "incomeRankHis" : {
                                    dataDate : loc_timeHis,
                                    percentYield : memberBalance.percentYield,
                                    rank : index + 1
                                }
                            }}, function(err){
                                callback(err, !err ? 1 : 0);
                            });
                    }
                }, function(err, newMemberBalances){
                    if(err){
                        logger.error("统计会员收益率排名失败--更新会员资产信息失败！", err);
                        callback(err, 0);
                        return;
                    }
                    callback(null, newMemberBalances.length);
                });
            }
        );
    },

    /**
     * 计算：总资产、总收益率、胜率、仓位、保证金水平、占用资金、净盈亏
     * @param memberBalance
     * @returns {{balance: number, percentYield: number, rateWin: number, ratePosition: number, rateEarnest: number，balanceUsed ：number balanceProfit：number}}
     */
    balanceCalculate : function(memberBalance){
        var loc_reuslt = {
            balance : 0,
            percentYield : 0,
            rateWin : 0,
            ratePosition : 0,
            rateEarnest : 0,
            balanceUsed : 0,
            balanceProfit : 0
        };
        if(memberBalance){
            //总资产 = 总资产
            loc_reuslt.balance = memberBalance.balance;
            //总收益率 = (期末总资产-期初总资产)/期初总资产
            loc_reuslt.percentYield = memberBalance.percentYield;
            //胜率 = 平仓盈利次数 / 开仓次数
            loc_reuslt.rateWin = !memberBalance.timesOpen ? 0 : Utils.accDiv(memberBalance.timesFullyProfit, memberBalance.timesOpen);
            //仓位 = 占用资金 / 总资产
            loc_reuslt.ratePosition = !memberBalance.balance ? 0 : Utils.accDiv(memberBalance.balanceUsed, memberBalance.balance);
            //保证金水平 = (总资产-总净盈亏)/占用资金
            loc_reuslt.rateEarnest = !memberBalance.balanceUsed ? 0 : Utils.accDiv(Utils.accSub(memberBalance.balance, memberBalance.balanceProfit), memberBalance.balanceUsed);
            //占用资金 = 占用资金
            loc_reuslt.balanceUsed = memberBalance.balanceUsed;
            //净盈亏 = 净盈亏
            loc_reuslt.balanceProfit = memberBalance.balanceProfit;
        }
        return loc_reuslt;
    }
};

module.exports = MemberBalanceService;

