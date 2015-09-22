/**
 * 投资社区--交易<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月16日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  交易服务类
 *     1.持仓
 *     2.交易记录
 *     3.开仓
 *     4.平仓
 * </p>
 */
var Position = require('../models/position.js');
var TradeRecord = require('../models/tradeRecord.js');
var QuotaRecord = require('../models/quotaRecord.js');

var APIUtil = require('../util/APIUtil.js');
var IdSeqManager = require('../constant/IdSeqManager.js');
var Async = require('async');
var Utils = require('../util/Utils.js');

var MemberBalanceService = require('../service/memberBalanceService.js');
var TopicService = require('../service/topicService.js');
var FinanceUserService = require('../service/financeUserService.js');
var ProductService = require('../service/productService.js');

var financeTradeService = {
    /**
     * 持仓列表
     * @param memberId
     * @param callback
     */
    getPositions : function(memberId, callback){
        APIUtil.DBFind(Position, {
            query : {memberId : memberId},
            sortDesc : ['openTime'],
            fieldEx : ["_id", "memberId"]
        }, function(err, positions){
            if(err){
                console.error("查询持仓单失败!", err);
                callback(APIUtil.APIResult("code_2008", null, null));
                return;
            }
            var loc_positions = [];
            for(var i = 0, lenI = positions ? positions.length : 0; i < lenI; i++){
                var loc_pos = positions[i].toObject();
                loc_positions.push({
                    orderNo : loc_pos.orderNo,
                    openTime : loc_pos.openTime.getTime(),
                    productCode : loc_pos.productCode,
                    tradeDirection : loc_pos.tradeDirection,
                    leverageRatio : loc_pos.leverageRatio,
                    contractPeriod : loc_pos.contractPeriod,
                    volume : loc_pos.volume,
                    openPrice : loc_pos.openPrice,
                    earnestMoney : loc_pos.earnestMoney,
                    floatProfit : loc_pos.floatProfit,
                    remark : loc_pos.remark
                });
            }
            callback(APIUtil.APIResult(null, loc_positions, null));
        });
    },

    /**
     * 查询交易记录
     * @param memberId
     * @param pageLast
     * @param pageSize
     * @param callback
     */
    getRecords : function(memberId, pageLast, pageSize, callback){
        APIUtil.DBPage(TradeRecord, {
            pageLast : pageLast,
            pageSize : pageSize,
            pageId : "_id",
            pageDesc : true,
            query : {memberId : memberId},
            fieldEx : ["memberId"]
        }, function(err, records, page){
            if(err){
                console.error("查询持仓单失败!", err);
                callback(APIUtil.APIResult("code_2009", null, null));
                return;
            }
            var loc_records = [];
            for(var i = 0, lenI = records ? records.length : 0; i < lenI; i++){
                var loc_record = records[i].toObject();
                loc_records.push({
                    orderNo : loc_record.orderNo,
                    tradeTime : loc_record.tradeTime.getTime(),
                    productCode : loc_record.productCode,
                    operType : loc_record.operType,
                    tradeDirection : loc_record.tradeDirection,
                    contractPeriod : loc_record.contractPeriod,
                    leverageRatio : loc_record.leverageRatio,
                    volume : loc_record.volume,
                    transactionPrice : loc_record.transactionPrice,
                    profitLoss : loc_record.profitLoss,
                    relationOrderNo : loc_record.relationOrderNo,
                    remark : loc_record.remark
                });
            }
            callback(APIUtil.APIResult(null, loc_records, page));
        });
    },

    /**
     * 开仓
     * @param param
     *              memberId String 会员Id
     *              openPrice Number 开仓价
     *              volume Number 手数
     *              leverageRatio Number 杠杆比例
     *              productCode String 产品码
     *              tradeDirection Number 买卖方向
     *              tradeMark Number 交易标识：1-普通、2-喊单、3-跟单
     *              followOrderNo String 跟单号：跟单对应的原订单号
     *              ip String ip地址
     *              remark String 备注
     *
     * @param resultCallback
     */
    doOpen : function(param, resultCallback){
        //先判断产品配置信息是否被禁用
        ProductService.getProdSettingByCode(param.productCode , function(err, prodSettings){
            if(err){
                console.error("查询产品配置信息失败!", err);
                resultCallback("code_2012", null);
                return;
            }
            if(prodSettings == null || prodSettings.status == 0){  //产品配置信息已经被禁用
                console.error("产品配置信息被禁用!", err);
                resultCallback("code_2050", null);
                return;
            }else{
                MemberBalanceService.find(param.memberId, function(err, memberBalance){
                    if(err){
                        console.error("查询用户资产信息失败！", err);
                        resultCallback("code_2028", null);
                        return;
                    }
                    memberBalance = memberBalance.toObject();
                    //保证金 = (开仓价 * 手数) / 杠杆比例 ：此处不考虑合约数的问题，注意与真实交易的区别
                    //var loc_earnestMoney = Utils.accDiv(Utils.accMul(param.openPrice, param.volume), param.leverageRatio);
                    var loc_earnestMoney = financeTradeService._calcEarnestMoney(param.productCode,param.openPrice,param.volume
                        ,param.contractPeriod,param.leverageRatio);
                    if(Utils.accSub(memberBalance.balance, memberBalance.balanceUsed) < loc_earnestMoney){
                        console.error("会员可用资金不足！", JSON.stringify(memberBalance), loc_earnestMoney);
                        resultCallback("code_2042", null);
                        return;
                    }

                    Async.parallel({
                        //订单号
                        tradeOrderNo : function(callback){
                            IdSeqManager.FinanceTradeOrder.getNextSeqId(function(err, seq){
                                if(err){
                                    console.error("获取订单号失败！", err);
                                }
                                callback(err, seq);
                            });
                        },
                        //持仓单号
                        positionId : function(callback){
                            IdSeqManager.FinancePosition.getNextSeqId(function(err, seq){
                                if(err){
                                    console.error("获取持仓单号失败！", err);
                                }
                                callback(err, seq);
                            });
                        },
                        //交易记录号
                        tradeRecordId : function(callback){
                            IdSeqManager.FinanceTradeRecord.getNextSeqId(function(err, seq){
                                if(err){
                                    console.error("获取持交易记录号失败！", err);
                                }
                                callback(err, seq);
                            });
                        }
                    },function(err, seqs){
                        if(err){
                            resultCallback("code_2005", null);
                            return;
                        }

                        var loc_timeNow = new Date();
                        var loc_leverageRatio = param.leverageRatio;
                        //记录持仓
                        var loc_postion = new Position({
                            _id : seqs.positionId,
                            memberId : param.memberId,
                            orderNo : seqs.tradeOrderNo,
                            openTime : loc_timeNow,
                            productCode : param.productCode,
                            tradeDirection : param.tradeDirection,
                            leverageRatio : loc_leverageRatio,
                            contractPeriod : param.contractPeriod,
                            volume : param.volume,
                            openPrice : param.openPrice,
                            earnestMoney : loc_earnestMoney,
                            floatProfit : 0,
                            positionProfit : 0,
                            remark : param.remark
                        });

                        //交易记录
                        var loc_tradeRecord = new TradeRecord({
                            _id : seqs.tradeRecordId,
                            memberId : param.memberId,
                            orderNo : seqs.tradeOrderNo,
                            tradeTime : loc_timeNow,
                            productCode : param.productCode,
                            operType : 1, //开仓
                            tradeDirection : param.tradeDirection,
                            leverageRatio : loc_leverageRatio,
                            contractPeriod : param.contractPeriod,
                            volume : param.volume,
                            transactionPrice : param.openPrice,
                            profitLoss : 0,
                            relationOrderNo : "",
                            tradeMark : param.tradeMark,
                            followOrderNo : param.followOrderNo,
                            remark : param.remark
                        });

                        //资产变更
                        memberBalance.balanceUsed = Utils.accAdd(memberBalance.balanceUsed, loc_earnestMoney);
                        memberBalance.timesOpen = Utils.accAdd(memberBalance.timesOpen, 1);
                        var loc_balanceUpdater = {
                            $set : {
                                balanceUsed : memberBalance.balanceUsed,
                                timesOpen : memberBalance.timesOpen,
                                updateUser : MemberBalanceService.DEFAULT_BALANCE_INFO.updateUser,
                                updateIp : param.ip,
                                updateDate : loc_timeNow
                            }
                        };

                        Async.parallel({
                            //保存持仓记录
                            savePosition : function(callback){
                                loc_postion.save(function(err){
                                    if(err){
                                        console.error("[订单:%s]保存持仓记录失败！", seqs.tradeOrderNo, err);
                                        callback("code_2006", 0);
                                        return;
                                    }
                                    console.info("[订单:%s]保存持仓信息成功！", seqs.tradeOrderNo);
                                    callback(null, 1);
                                });
                            },

                            //保存交易记录
                            saveTradeRecord : function(callback){
                                loc_tradeRecord.save(function(err){
                                    if(err){
                                        console.error("[订单:%s]保存交易记录失败！", seqs.tradeOrderNo, err);
                                        callback("code_2007", 0);
                                        return;
                                    }
                                    console.info("[订单:%s]保存交易记录成功！", seqs.tradeOrderNo);
                                    callback(null, 1);
                                });
                            },

                            //更新会员资产信息
                            saveBalance : function(callback){
                                MemberBalanceService.modify(param.memberId, loc_balanceUpdater, function(err){
                                    if(err){
                                        console.error("[订单:%s]更新资产信息失败！", seqs.tradeOrderNo, err);
                                        callback("code_2019", 0);
                                        return;
                                    }
                                    console.info("[订单:%s]更新资产信息成功！", seqs.tradeOrderNo);
                                    callback(null, 1);
                                });
                            }
                        }, function(err){
                            if(err != null){
                                console.error("[订单:%s]开仓失败, 错误号:<%s>！", seqs.tradeOrderNo, JSON.stringify(param), err);
                                resultCallback(err, null);
                                return;
                            }
                            console.info("[订单:%s]开仓成功！", seqs.tradeOrderNo);
                            loc_tradeRecord = loc_tradeRecord.toObject();
                            delete loc_tradeRecord["__v"];
                            delete loc_tradeRecord["_id"];
                            delete loc_tradeRecord["memberId"];
                            loc_tradeRecord["tradeTime"] = loc_tradeRecord["tradeTime"].getTime();
                            var loc_resultBalance = MemberBalanceService.balanceCalculate(memberBalance);
                            loc_tradeRecord.balance = loc_resultBalance.balance;
                            loc_tradeRecord.percentYield = loc_resultBalance.percentYield;
                            loc_tradeRecord.rateWin = loc_resultBalance.rateWin;
                            loc_tradeRecord.ratePosition = loc_resultBalance.ratePosition;
                            loc_tradeRecord.rateEarnest = loc_resultBalance.rateEarnest;
                            loc_tradeRecord.balanceUsed = loc_resultBalance.balanceUsed;
                            loc_tradeRecord.balanceProfit = loc_resultBalance.balanceProfit;
                            resultCallback(null, loc_tradeRecord);
                        });
                    });
                });
            }
        });
    },

    /**
     * 开仓
     * @param param
     * @param resultCallback
     */
    open : function(param, resultCallback){
        financeTradeService.doOpen(param, function(err, tradeRecord){
            if(err){
                resultCallback(APIUtil.APIResult(err, null, null));
                return;
            }
            resultCallback(APIUtil.APIResult(null, tradeRecord, null));
        });
    },

    /**
     * 喊单：开仓+发帖
     */
    shout : function(param, resultCallback){
        FinanceUserService.getMemberById(param.memberId, function(err, member){
            if(err){
                console.error("喊单失败--查询用户信息失败！", err);
                callback(APIUtil.APIResult("code_2010", null, null));
                return;
            }
            //用户非禁言状态才可发帖
            if(!member || !member.loginPlatform || !member.loginPlatform.financePlatForm || member.loginPlatform.financePlatForm.isGag !== 0){
                console.error("喊单失败--用户被禁言！", err);
                callback(APIUtil.APIResult("code_2015", null, null));
                return;
            }

            //开仓所需参数
            var loc_positionParam = {
                memberId : param.memberId,
                openPrice : param.openPrice,
                volume : param.volume,
                leverageRatio : param.leverageRatio,
                contractPeriod : param.contractPeriod,
                productCode : param.productCode,
                tradeDirection : param.tradeDirection,
                tradeMark : 2,
                followOrderNo : "",
                ip : param.ip,
                remark : param.remark
            };
            financeTradeService.doOpen(loc_positionParam, function(err, tradeRecord){
                if(err){
                    resultCallback(APIUtil.APIResult(err, null, null));
                    return;
                }

                //发帖所需参数
                var loc_topicParam = {
                    ip : param.ip,
                    memberId : param.memberId,
                    subjectType : "callBill", //喊单
                    expandAttr : param.expandAttr,
                    publishLocation : 3,
                    device : param.device,
                    title : param.title,
                    content : ""
                };
                loc_topicParam.expandAttr.orderNo = tradeRecord.orderNo;

                TopicService.doAddTopic(loc_topicParam, function(err, topic){
                    if(err){
                        resultCallback(APIUtil.APIResult(err, null, null));
                        return;
                    }
                    FinanceUserService.modifyById(param.memberId, {$inc : {"loginPlatform.financePlatForm.shoutCount" : 1}}, function(err){
                        if(err){
                            console.error("更新用户喊单数失败！", err);
                            resultCallback(APIUtil.APIResult("code_2055", null, null));
                            return;
                        }
                        tradeRecord.topicId = topic._id;
                        resultCallback(APIUtil.APIResult(null, tradeRecord, null));
                    });
                });
            });
        });
    },

    /**
     * 平仓
     * @param param '{memberId : String, orderNo: String, volume : Number, closePrice: Number, remark : String, ip : String}'
     * @param resultCallback
     */
    close : function(param, resultCallback){
        //先判断产品配置信息是否被禁用
        ProductService.getProdSettingByCode(param.productCode , function(err, prodSettings) {
            if (err) {
                console.error("查询产品配置信息失败!", err);
                resultCallback(APIUtil.APIResult("code_2012", null, null));
                return;
            }
            if (prodSettings == null || prodSettings.status == 0) {  //产品配置信息已经被禁用
                console.error("产品配置信息被禁用!", err);
                resultCallback(APIUtil.APIResult("code_2050", null, null));
                return;
            }else{
                //查询相关持仓单
                APIUtil.DBFindOne(Position, {
                    query : {memberId : param.memberId, orderNo : param.orderNo},
                    fieldEx : ["__v", "_id"]
                },function(err, loc_position){
                    if(err){
                        console.error("查询持仓单失败!", err);
                        resultCallback(APIUtil.APIResult("code_2007", null, null));
                        return;
                    }
                    if(loc_position === null){
                        console.error("持仓单不存在，客户ID：%s, 订单号：%s!", param.memberId, param.orderNo);
                        resultCallback(APIUtil.APIResult("code_2013", null, null));
                        return;
                    }
                    loc_position = loc_position.toObject();
                    if(param.volume > loc_position.volume){
                        console.error("平仓数大于持仓数，平仓数：%d, 持仓数：%d!", param.volume, loc_position.volume);
                        resultCallback(APIUtil.APIResult("code_2014", null, null));
                        return;
                    }

                    //查询账户资金
                    MemberBalanceService.find(param.memberId, function(err, memberBalance){
                        if(err || !memberBalance){
                            console.error("查询会员资产信息失败!", err);
                            resultCallback(APIUtil.APIResult("code_2028", null, null));
                            return;
                        }
                        memberBalance = memberBalance.toObject();

                        Async.parallel({
                            //订单号
                            tradeOrderNo : function(callback){
                                IdSeqManager.FinanceTradeOrder.getNextSeqId(function(err, seq){
                                    if(err){
                                        console.error("获取订单号失败！", err);
                                    }
                                    callback(err, seq);
                                });
                            },
                            //额度记录号
                            quotaRecordId : function(callback){
                                IdSeqManager.FinanceQuotaRecord.getNextSeqId(function(err, seq){
                                    if(err){
                                        console.error("获取额度记录号失败！", err);
                                    }
                                    callback(err, seq);
                                });
                            },
                            //交易记录号
                            tradeRecordId : function(callback){
                                IdSeqManager.FinanceTradeRecord.getNextSeqId(function(err, seq){
                                    if(err){
                                        console.error("获取持交易记录号失败！", err);
                                    }
                                    callback(err, seq);
                                });
                            }
                        },function(err, seqs){
                            if(err){
                                resultCallback(APIUtil.APIResult("code_2005", null, null));
                                return;
                            }

                            var loc_balance = memberBalance.balance;

                            //盈亏
                            var loc_profitLoss = financeTradeService._calcProfitLoss(loc_position.productCode,loc_position.tradeDirection,
                                loc_position.openPrice,param.closePrice, param.volume,loc_position.contractPeriod);
                            var loc_newBalance = Utils.accAdd(loc_balance, loc_profitLoss);
                            var loc_isCloseFully = (param.volume === loc_position.volume);
                            //Utils.accDiv(Utils.accMul(loc_position.openPrice, param.volume), Utils.strToInt(loc_position.leverageRatio));
                            var loc_earnestMoneyChg = loc_isCloseFully ? loc_position.earnestMoney :
                                financeTradeService._calcEarnestMoney(loc_position.productCode,loc_position.openPrice,param.volume
                                    ,loc_position.contractPeriod,loc_position.leverageRatio);
                            var loc_timeNow = new Date();

                            //交易记录
                            var loc_tradeRecord = new TradeRecord({
                                _id : seqs.tradeRecordId,
                                memberId : param.memberId,
                                orderNo : seqs.tradeOrderNo,
                                tradeTime : loc_timeNow,
                                productCode : loc_position.productCode,
                                operType : 2, //平仓
                                tradeDirection : loc_position.tradeDirection === 1 ? 2 : 1,
                                leverageRatio : loc_position.leverageRatio,
                                contractPeriod : loc_position.contractPeriod,
                                volume : param.volume,
                                transactionPrice : param.closePrice,
                                profitLoss : loc_profitLoss,
                                relationOrderNo : loc_position.orderNo,
                                tradeMark : 1,
                                followOrderNo : "",
                                remark : param.remark
                            });

                            //额度记录
                            var loc_quotaRecord = new QuotaRecord({
                                _id : seqs.quotaRecordId,
                                memberId : param.memberId,
                                orderNo : seqs.tradeOrderNo,
                                tradeTime : loc_timeNow,
                                item : 1,
                                beforeTradeBalance : loc_balance,
                                afterTradeBalance : loc_newBalance,
                                income : loc_profitLoss > 0 ? loc_profitLoss : 0,
                                expenditure : loc_profitLoss < 0 ? 0 - loc_profitLoss : 0,
                                remark : param.remark
                            });

                            memberBalance.balance = loc_newBalance;
                            memberBalance.balanceUsed = Utils.accSub(memberBalance.balanceUsed, loc_earnestMoneyChg);
                            memberBalance.balanceProfit = Utils.accAdd(memberBalance.balanceProfit, loc_profitLoss);
                            memberBalance.timesClose = Utils.accAdd(memberBalance.timesClose, 1);
                            //资产变更
                            var loc_balanceUpdater = {
                                $set : {
                                    balance : memberBalance.balance,
                                    balanceUsed : memberBalance.balanceUsed,
                                    balanceProfit : memberBalance.balanceProfit,
                                    timesClose : memberBalance.timesClose,
                                    percentYield : Utils.numToFixed(Utils.accDiv(Utils.accSub(loc_newBalance, memberBalance.balanceInit), memberBalance.balanceInit).toString(),4),
                                    updateUser : MemberBalanceService.DEFAULT_BALANCE_INFO.updateUser,
                                    updateIp : param.ip,
                                    updateDate : loc_timeNow
                                }
                            };
                            if(loc_isCloseFully){
                                memberBalance.timesFullyClose = Utils.accAdd(memberBalance.timesFullyClose, 1);
                                loc_balanceUpdater.$set.timesFullyClose = memberBalance.timesFullyClose;
                                var loc_profitLossAll = Utils.accAdd(loc_position.positionProfit, loc_profitLoss);
                                if(loc_profitLossAll > 0){
                                    memberBalance.timesFullyProfit = Utils.accAdd(memberBalance.timesFullyProfit, 1);
                                    loc_balanceUpdater.$set.timesFullyProfit = memberBalance.timesFullyProfit;
                                }else if(loc_profitLossAll < 0){
                                    memberBalance.timesFullyLoss = Utils.accAdd(memberBalance.timesFullyLoss, 1);
                                    loc_balanceUpdater.$set.timesFullyLoss = memberBalance.timesFullyLoss;
                                }
                            }
                            if(loc_profitLoss > 0){
                                memberBalance.timesProfit = Utils.accAdd(memberBalance.timesProfit, 1);
                                loc_balanceUpdater.$set.timesProfit = memberBalance.timesProfit;
                            }else if(loc_profitLoss < 0){
                                memberBalance.timesLoss = Utils.accAdd(memberBalance.timesLoss, 1);
                                loc_balanceUpdater.$set.timesLoss = memberBalance.timesLoss;
                            }

                            //平仓
                            Async.parallel({
                                //保存交易记录
                                saveTradeRecord : function(callback){
                                    loc_tradeRecord.save(function(err){
                                        if(err){
                                            console.error("[%s]保存交易记录失败！", seqs.tradeOrderNo, err);
                                            callback("code_2007", 0);
                                            return;
                                        }
                                        console.info("[%s]保存交易记录成功！", seqs.tradeOrderNo);
                                        callback(null, 1);
                                    });
                                },
                                //保存额度记录
                                saveQuotaRecord : function(callback){
                                    loc_quotaRecord.save(function(err){
                                        if(err){
                                            console.error("[%s]保存额度记录失败！", seqs.tradeOrderNo, err);
                                            callback("code_2016", 0);
                                            return;
                                        }
                                        console.info("[%s]保存额度记录成功！", seqs.tradeOrderNo);
                                        callback(null, 1);
                                    });
                                },
                                //修改持仓记录
                                modifyPosition : function(callback){
                                    //是否完全平仓，完全平仓时，需要删除持仓记录
                                    var loc_query = {memberId : param.memberId, orderNo : param.orderNo};
                                    if(loc_isCloseFully){
                                        Position.findOneAndRemove(loc_query, function(err){
                                            if(err){
                                                console.error("[%s]删除持仓信息失败！", seqs.tradeOrderNo, err);
                                                callback("code_2018", 0);
                                                return;
                                            }
                                            console.info("[%s]删除持仓信息成功！", seqs.tradeOrderNo);
                                            callback(null, 1);
                                        });
                                    }else{
                                        var loc_updater = {
                                            $inc : {
                                                "volume" : 0 - param.volume,
                                                "earnestMoney" : 0 - loc_earnestMoneyChg,
                                                "positionProfit" : loc_profitLoss
                                            }};
                                        Position.findOneAndUpdate(loc_query, loc_updater, function(err){
                                            if(err){
                                                console.error("[%s]修改持仓信息失败！", seqs.tradeOrderNo, err);
                                                callback("code_2017", 0);
                                                return;
                                            }
                                            console.info("[%s]修改持仓信息成功！", seqs.tradeOrderNo);
                                            callback(null, 1);
                                        });
                                    }
                                },
                                //修改账户资金
                                modifyBalance : function(callback){
                                    MemberBalanceService.modify(param.memberId, loc_balanceUpdater, function(err){
                                        if(err){
                                            console.error("[%s]更新资产信息失败！", seqs.tradeOrderNo, err);
                                            callback("code_2019", 0);
                                            return;
                                        }
                                        console.info("[%s]更新资产信息成功！", seqs.tradeOrderNo);
                                        callback(null, 1);
                                    });
                                }
                            },function(err){
                                if(err != null){
                                    console.error("[%s]平仓失败, 错误号:<%s>！", seqs.tradeOrderNo, JSON.stringify(param), err);
                                    resultCallback(APIUtil.APIResult(err, null, null));
                                    return;
                                }
                                console.info("[%s]平仓成功！", seqs.tradeOrderNo);
                                loc_tradeRecord = loc_tradeRecord.toObject();
                                delete loc_tradeRecord["__v"];
                                delete loc_tradeRecord["_id"];
                                delete loc_tradeRecord["memberId"];
                                loc_tradeRecord["tradeTime"] = loc_tradeRecord["tradeTime"].getTime();
                                var loc_resultBalance = MemberBalanceService.balanceCalculate(memberBalance);
                                loc_tradeRecord.balance = loc_resultBalance.balance;
                                loc_tradeRecord.percentYield = Utils.numToFixed(loc_resultBalance.percentYield.toString(),4);
                                loc_tradeRecord.rateWin = loc_resultBalance.rateWin;
                                loc_tradeRecord.ratePosition = loc_resultBalance.ratePosition;
                                loc_tradeRecord.rateEarnest = loc_resultBalance.rateEarnest;
                                loc_tradeRecord.balanceUsed = loc_resultBalance.balanceUsed;
                                loc_tradeRecord.balanceProfit = loc_resultBalance.balanceProfit;
                                loc_tradeRecord.incomeRank = 0;
                                MemberBalanceService.getRankingAfterClose(param.memberId, function(err, rank){
                                    if(err){
                                        console.error("查询会员收益率排名信息失败！", err);
                                        //排名查询失败的时候，直接忽略那个错误。不影响平仓操作，为0时页面不更新
                                    }else{
                                        loc_tradeRecord.incomeRank = rank;
                                    }
                                    resultCallback(APIUtil.APIResult(null, loc_tradeRecord, null));
                                });
                            });
                        });
                    });
                });
            }
        })
    },

    /**
     * 获取会员资产信息
     * @param memberId
     * @param resultCallback
     */
    getBalanceInfo : function(memberId, resultCallback){
        MemberBalanceService.find(memberId, function(err, balance){
            if(err || !balance){
                console.error("查询会员资产信息失败！", balance, err);
                resultCallback(APIUtil.APIResult("code_2028", null, null));
                return;
            }

            var loc_result = MemberBalanceService.balanceCalculate(balance);
            var loc_rankHis = balance.incomeRankHis;
            var loc_rankHisDest = [];
            for(var i = !loc_rankHis ? 0 : loc_rankHis.length - 1, loc_cnt = 0; i >= 0 && loc_cnt < 3; i--, loc_cnt++){
                loc_rankHisDest.push({
                    dataDate : loc_rankHis[i].dataDate.getTime(),
                    percentYield : loc_rankHis[i].percentYield
                });
            }
            loc_result.incomeRankHis = loc_rankHisDest.reverse();

            MemberBalanceService.getRanking(balance, function(err, rank){
                if(err){
                    console.error("查询会员收益率排名信息失败！", err);
                    resultCallback(APIUtil.APIResult("code_2028", null, null));
                    return;
                }
                loc_result.incomeRank = rank;
                resultCallback(APIUtil.APIResult(null, loc_result, null));
            });
        });
    },

    /**
     * 保证金(占用资金)计算
     * @param productCode     产品编号
     * @param openPrice       开仓价
     * @param volume          手数
     * @param contractPeriod  合约单位
     * @param leverageRatio   杠杆倍数
     * 1、贵金属及部分外汇  公式一 保证金=现价*手数*合约单位/杠杆倍数
     * 2、另外一部分外汇    公式二  保证金=手数*合约单位合约单位/杠杆倍数
     */
    _calcEarnestMoney : function(productCode,openPrice,volume,contractPeriod,leverageRatio){
        var one = ["101","103","105","106"]; //101  欧元美元 103  英镑美元  105  澳元美元 106  纽元美元
        var two =  ["102","104","107","119"]; //102  美元日元 104  美元瑞郎  107  美元加元 119  美元人民币
        if(one.indexOf(productCode) != -1){    //公式一
            return  Utils.numToFixed(Utils.accDiv(Utils.accMul(Utils.accMul(openPrice,volume),contractPeriod), leverageRatio).toString(),2);
        }else if(two.indexOf(productCode) != -1){  //公式二
            return Utils.numToFixed(Utils.accDiv(Utils.accMul(volume,contractPeriod), leverageRatio).toString(),2);
        }else{  //贵金属计算公式
            return Utils.numToFixed(Utils.accDiv(Utils.accMul(Utils.accMul(openPrice,volume),contractPeriod), leverageRatio).toString(),2);
        }
    },

    /**
     * 盈亏计算
     * @param productCode       产品编号
     * @param tradeDirection    多头或空头(tradeDirection值为2,代表为空头)
     * @param openPrice         开仓价
     * @param closePrice        平仓价
     * @param volume            手数
     * @param contractPeriod    合约单位
     * 1、贵金属及部分外汇
     *   多头平仓
     *       盈亏 =（平仓价一开仓价）*手数*合约单位；
     *   空头平仓
     *       盈亏 =（开仓价一平仓价）*手数*合约单位
     * 2、另外一部分外汇
     *   多头平仓
     *       盈亏 =（平仓价一开仓价）/现价(平仓价)*手数*合约单位；
     *   空头平仓
     *       盈亏 =（开仓价一平仓价）/现价(平仓价)*手数*合约单位
     *
     */
    _calcProfitLoss : function(productCode,tradeDirection,openPrice,closePrice,volume,contractPeriod){
        var one = ["101","103","105","106"]; //101  欧元美元 103  英镑美元  105  澳元美元 106  纽元美元
        var two =  ["102","104","107","119"]; //102  美元日元 104  美元瑞郎  107  美元加元 119  美元人民币
        if(one.indexOf(productCode) != -1){    //公式一
            if(tradeDirection === 2){
                return Utils.numToFixed(Utils.accMul(Utils.accMul(Utils.accSub(openPrice, closePrice), volume),contractPeriod).toString(),2);
            }else{
                return Utils.numToFixed(Utils.accMul(Utils.accMul(Utils.accSub(closePrice, openPrice), volume),contractPeriod).toString(),2);
            }
        }else if(two.indexOf(productCode) != -1){  //公式二
            if(tradeDirection === 2){
                return Utils.numToFixed(Utils.accMul(Utils.accMul(Utils.accDiv(Utils.accSub(openPrice, closePrice),closePrice),volume),contractPeriod).toString(),2);
            }else{
                return Utils.numToFixed(Utils.accMul(Utils.accMul(Utils.accDiv(Utils.accSub(closePrice, openPrice),closePrice), volume),contractPeriod).toString(),2);
            }
        }else{  //贵金属计算公式
            if(tradeDirection === 2){
                return Utils.numToFixed(Utils.accMul(Utils.accMul(Utils.accSub(openPrice, closePrice), volume),contractPeriod).toString(),2);
            }else{
                return Utils.numToFixed(Utils.accMul(Utils.accMul(Utils.accSub(closePrice, openPrice), volume),contractPeriod).toString(),2);
            }
        }
    }
};

module.exports = financeTradeService;

