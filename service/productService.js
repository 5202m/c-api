/**
 * 投资社区--产品<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月10日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  产品服务类
 * </p>
 */
var logger = require('../resources/logConf').getLogger("productService");
var Product = require('../models/product.js');
var ProductSetting = require('../models/productSetting.js');
var APIUtil = require('../util/APIUtil.js');

var productService = {
    /**
     * 获取所有有效的产品列表
     * @param callback
     */
    getListWithType : function(callback){
        var searchObj = {
            isDeleted : 1,
            status : 1
        };
        APIUtil.DBFind(Product, {
            query : searchObj,
            sortAsc : ['sort'],
            fieldIn : ['code', 'name', 'sort', 'children.code', 'children.name', 'children.sort']
        }, function(err, prods){
            if(err){
                logger.error("查询产品列表失败!", err);
                callback(APIUtil.APIResult("code_2011", null, null));
                return;
            }
            productService.getProdSettingInfo(prods, function(err, prods){
                if(err){
                    callback(APIUtil.APIResult(err, null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, prods, null));
            });
        });
    },

    /**
     * 按照产品类别 获取有效的产品列表
     * @param prodType
     * @param callback
     */
    getList : function(prodType, callback){
        var searchObj = {
            isDeleted : 1,
            status : 1
        };
        if(prodType){
            searchObj.code = prodType;
        }
        APIUtil.DBFind(Product, {
            query : searchObj,
            sortAsc : ['sort'],
            fieldIn : ['children.code', 'children.name', 'children.sort','children.status']
        }, function(err, prods){
            if(err){
                logger.error("查询产品列表失败!", err);
                callback(APIUtil.APIResult("code_2011", null, null));
                return;
            }
            productService.getProdSettingInfo(prods, function(err, prods){
                if(err){
                    callback(APIUtil.APIResult(err, null, null));
                    return;
                }
                var loc_result = [];
                var loc_args = [];
                for(var i = 0, lenI = prods.length; i < lenI; i++){
                    loc_args.push(prods[i]["products"]);
                }
                loc_result = Array.prototype.concat.apply(loc_result, loc_args);
                callback(APIUtil.APIResult(null, loc_result, null));
            });
        });
    },

    /**
     * 数据转换，将产品配置信息补全
     * @param prods
     * @param callback
     */
    getProdSettingInfo : function(prods, callback){
        if(!prods){
            callback(null, []);
            return ;
        }
        var loc_products = [];
        var loc_prodCodes = [];
        var prod = null;
        var loc_prodType = null;
        for(var i = 0, lenI = prods.length; i < lenI; i++){
            prod = prods[i].toObject();
            loc_prodType = productService.getProdInfo(prod, null, true);
            var loc_children = prod.children;
            for(var j = 0, lenJ = !loc_children ? 0 : loc_children.length; j < lenJ; j++){
                if(loc_children[j].status == 1){
                    loc_prodCodes.push(loc_children[j].code);
                }
            }
            loc_products.push(loc_prodType);
        }
        productService.getProdSetting(loc_prodCodes, function(err, prodSettings){
            if(err){
                logger.error("查询产品配置信息失败!", err);
                callback("code_2012", null);
            }
            var loc_prodSettings = [];
            var i;
            for(i = 0, lenI = !prodSettings ? 0 : prodSettings.length; i < lenI; i++){
                loc_prodSettings.push(prodSettings[i].toObject());
            }
            var lenK = loc_prodSettings.length;
            for(i = 0, lenI = loc_products.length; i < lenI; i++){
                for(var j = 0, lenJ = loc_products[i].products.length; j < lenJ; j++){
                    var loc_prodTmp = loc_products[i].products[j];
                    for(var k = 0; k < lenK; k++){
                        if(loc_prodSettings[k].productCode === loc_prodTmp.code){
                            loc_products[i].products[j] = productService.getProdInfo(loc_prodTmp, loc_prodSettings[k], false);
                            break;
                        }
                    }
                    if(k === lenK){
                        loc_products[i].products[j] = productService.getProdInfo(loc_prodTmp, null, false);
                    }
                }
            }
            callback(null, loc_products);
        });
    },

    /**
     * 获取产品配置信息
     * @param prodCodes
     * @param callback
     */
    getProdSetting : function(prodCodes, callback){
        APIUtil.DBFind(ProductSetting,
            {
                query: {
                    isDeleted : 1,
                    productCode : {$in : prodCodes}
                },
                fieldIn: ['productCode', 'priceDecimal', 'leverageRatio','contractPeriod','minTradeHand', 'tradeModel','status']
            },
            callback
        );
    },

    /**
     * 根据code-->获取产品配置信息
     * @param code
     * @param callback
     */
    getProdSettingByCode : function(code, callback){
        APIUtil.DBFindOne(ProductSetting,{
            query : {
                isDeleted : 1,
                productCode : code
            }
        }, callback);
    },

    /**
     * 获取一个产品信息
     * @param prod
     * @param prodSetting
     * @param isProdType
     * @returns *
     */
    getProdInfo : function(prod, prodSetting, isProdType){
        var loc_prod = {
            code : prod.code,
            name : prod.name,
            sort : prod.sort
        };
        if(isProdType){
            var loc_products = [],loc_children  = prod.children;
            for(var j = 0, lenJ = !loc_children ? 0 : loc_children.length; j < lenJ; j++){
                if(loc_children[j].status == 1){
                    loc_products.push(loc_children[j]);
                }
            }
            loc_prod["products"] = !loc_children ? [] : loc_products;
        }else{
            if(prodSetting){
                loc_prod.status = prodSetting.status;
                loc_prod.priceDecimal = prodSetting.priceDecimal;
                loc_prod.leverageRatio = prodSetting.leverageRatio;
                loc_prod.contractPeriod = prodSetting.contractPeriod;
                loc_prod.minTradeHand = prodSetting.minTradeHand;
                loc_prod.tradeModel = prodSetting.tradeModel;
            }else{
                loc_prod.status = 1;
                loc_prod.priceDecimal = 0;
                loc_prod.leverageRatio = 1;
                loc_prod.contractPeriod = 1;
                loc_prod.minTradeHand = 0;
                loc_prod.tradeModel = 0;
            }
        }
        return loc_prod;
    }
};

module.exports = productService;

