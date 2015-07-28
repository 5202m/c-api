/**
 * 摘要：文章资讯 Service服务类
 * author：Gavin.guo
 * date:2015/4/23
 */
var article = require('../models/article');          //引入article数据模型
var category = require('../models/category');   //引入category数据模型
var common = require('../util/common');       //引入公共的js

/**
 * 定义服务类
 */
var articleService = {
    /**
     * 根据栏目code-->提取文章资讯列表
     * @param  code  栏目code
     * @param  lang  语言
     * @param  curPageNo 当前页数
     * @param  pageSize  每页显示条数
     */
    getArticleList:function(params,callback){
        var searchObj = {},selectField={};
        var currDate=new Date();
        if(common.isBlank(params.lang)){
            selectField={platform:1,sequence:1,mediaUrl:1,mediaImgUrl:1,linkUrl:1,'createDate' : 1,'detailList' : 1};
            searchObj = {valid:1,platform:common.getSplitMatchReg(params.platform),categoryId:params.code,status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
        }else{
            selectField={platform:1,sequence:1,mediaUrl:1,mediaImgUrl:1,linkUrl:1,'createDate' : 1,'detailList.$' : 1};
            searchObj = {valid:1,platform:common.getSplitMatchReg(params.platform),categoryId:params.code,'detailList.lang' : params.lang,status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
        }
        if(params.curPageNo <= 0){
            params.curPageNo = 1;
        }
        var from = (params.curPageNo-1) * params.pageSize;
        var query = article.find(searchObj);
        var orderByJsonObj={createDate: -1 };
        if(common.isValid(params.orderByJsonStr)){
            orderByJsonObj=JSON.parse(params.orderByJsonStr);
        }
        query.skip(from)
            .limit(params.pageSize)
            .sort(orderByJsonObj)
            .select(selectField)
            .exec('find',function (err,articles) {
                if(err){
                    console.error(err);
                    callback(null);
                }else{
                    callback(articles);
                }
            });
    }
};

//导出服务类
module.exports = articleService;

