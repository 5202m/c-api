/**
 * 投资社区--行情<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年07月22日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区--行情API
 *     1.看多看空
 *     2.查询产品行情预测统计
 * </p>
 */
var express = require('express');
var router = express.Router();
var APIUtil = require('../../util/APIUtil.js');
var QuotationService = require('../../service/quotationService.js');

/**
 * 增加一个行情预测：看多/看空
 */
router.post('/addPredict', function (req, res) {
    APIUtil.logRequestInfo(req, "quotationAPI");
    var loc_predict = {
        memberId : req.body["memberId"],
        type : parseInt(req.body["opType"], 10),
        prodCode : req.body["prodCode"]
    };
    if(!loc_predict.memberId
        || isNaN(loc_predict.type)
        || !loc_predict.prodCode){
        console.error("quotation predict information is invalid! ", loc_predict);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(loc_predict.type !== 1 && loc_predict.type !== 2){
        console.error("type of quotation predict is invalid! ", loc_predict.type);
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }

    QuotationService.addPredict(loc_predict, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 获取看多看空统计数据
 */
router.get('/predictStatis', function (req, res) {
    APIUtil.logRequestInfo(req, "quotationAPI");
    var loc_prodCode = req.query["prodCode"];
    if(!loc_prodCode){
        console.error("product code is invalid! ", loc_prodCode);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    QuotationService.predictStatis(loc_prodCode, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;