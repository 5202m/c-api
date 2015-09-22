/**
 * 投资社区产品<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月10日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  产品API
 *     1.产品列表查询
 * </p>
 */
var express = require('express');
var router = express.Router();
var APIUtil = require('../../util/APIUtil.js');
var productService = require('../../service/productService.js');

/**
 * 获取产品List
 */
router.get('/listAll', function(req, res) {
    APIUtil.logRequestInfo(req, "productAPI");
    productService.getListWithType(function(apiResult){
        res.json(apiResult);
    });
});


/**
 * 按照产品类别获取产品List
 */
router.get('/list', function(req, res) {
    APIUtil.logRequestInfo(req, "productAPI");
    var loc_prodType = req.query["prodType"];

    productService.getList(loc_prodType, function(apiResult){
        res.json(apiResult);
    });
});


module.exports = router;