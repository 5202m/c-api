/**
 * 投资社区--行情<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年07月22日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区--行情Service
 *     1.看多看空
 *     2.查询产品行情预测统计
 * </p>
 */
var ObjectId = require('mongoose').Types.ObjectId;
var QuotationPredict = require('../models/quotationPredict.js');
var QuotationPredictHis = require('../models/quotationPredictHis.js');
var FinanceUserService = require('../service/financeUserService.js');
var APIUtil = require('../util/APIUtil.js');

var QuotationService = {
    /**
     * 增加一个行情预测
     * @param predict
     * @param callback
     */
    addPredict : function(predict, callback){
        APIUtil.DBFindOne(QuotationPredict, {
            query : {
                memberId : predict.memberId,
                prodCode : predict.prodCode
            }
        }, function(err, dbPredict){
            if(err){
                console.error("查询行情预测失败！", err);
                callback(APIUtil.APIResult("code_2039", null, null));
                return;
            }
            if(!!dbPredict){
                console.error("该会员当日已参与看多/看空！", dbPredict);
                callback(APIUtil.APIResult(dbPredict.type === 1 ? "code_2041" : "code_2045", null, null));
                return;
            }
            var loc_predict = new QuotationPredict({
                _id: new ObjectId(),
                memberId : predict.memberId,
                prodCode : predict.prodCode,
                type : predict.type,
                createDate : new Date()
            });
            loc_predict.save(function(err){
                if(err){
                    console.error("保存行情预测失败！", err);
                    callback(APIUtil.APIResult("code_2039", null, null));
                    return;
                }
                FinanceUserService.modifyById(predict.memberId , {$inc : {"loginPlatform.financePlatForm.commentCount" : 1}}, function(err){
                    if(err){
                        console.error("更新用户评论数失败！", err);
                        callback(APIUtil.APIResult("code_2054", null, null));
                        return;
                    }
                    callback(APIUtil.APIResult(null, null, null));
                });
            });
        });
    },

    /**
     * 统计行情预测数  看多X人，看空Y人
     * @param prodCode
     * @param callback
     */
    predictStatis : function(prodCode, callback){
        QuotationPredict.aggregate()
            .match({prodCode : prodCode})
            .group({
                _id:"$type",
                cnt : {$sum : 1}
            })
            .exec(function(err, predictStatis){
                if(err){
                    console.error("查询产品行情预测统计数据失败！", err);
                    callback(APIUtil.APIResult("code_2040", null, null));
                    return;
                }
                var loc_result = {
                    bullish : 0,
                    bearish : 0
                };
                for(var i = 0, lenI = !predictStatis ? 0 : predictStatis.length; i < lenI; i++){
                    if(predictStatis[i]._id === 1){
                        //看多
                        loc_result.bullish = predictStatis[i].cnt;
                    }else if(predictStatis[i]._id === 2){
                        //看空
                        loc_result.bearish = predictStatis[i].cnt;
                    }
                }
                callback(APIUtil.APIResult(null, loc_result, null));
            });
    },

    /**
     * 清空行情预测数据——转移到His表中
     * @param callback err, cnt
     */
    clearPredict : function(callback){
        APIUtil.DBFind(QuotationPredict, {}, function(err, predicts){
            if(err){
                console.error("清空行情预测数据失败--查询当前行情预测数据失败！", err);
                callback(err, 0);
                return;
            }
            if(!predicts || predicts.length === 0){
                callback(null, 0);
                return;
            }
            QuotationPredictHis.create(predicts, function(err){
                if(err){
                    console.error("清空行情预测数据失败--添加历史行情预测数据失败！", err);
                    callback(err, 0);
                    return;
                }
                QuotationPredict.remove({}, function(err){
                    if(err){
                        console.error("清空行情预测数据失败--删除当前行情预测数据失败！", err);
                        callback(err, 0);
                    }
                    callback(null, predicts.length);
                });
            });
        });
    }
};

module.exports = QuotationService;

