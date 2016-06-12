/**
 * 摘要：文章资讯 Service服务类
 * author：Gavin.guo
 * date:2015/4/23
 */
var logger = require('../resources/logConf').getLogger("articleService");
var article = require('../models/article');          //引入article数据模型
var category = require('../models/category');   //引入category数据模型
var ApiResult = require('../util/ApiResult');
var commonJs = require('../util/common');       //引入公共的js
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var async = require('async');//引入async

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
    getArticlePage:function(params,callback){
        var searchObj = {},selectField="";
        var currDate=new Date();
        var categoryIdArr=[];
        if(params.code.indexOf(",")!=-1){
            categoryIdArr=params.code.split(",");
        }else{
            categoryIdArr.push(params.code);
        }
        selectField="categoryId platform sequence mediaUrl mediaImgUrl linkUrl createDate publishStartDate publishEndDate";
        if(commonJs.isBlank(params.lang)){
            if("1"==params.hasContent){
                selectField+=" detailList";
            }else{
                selectField+=" detailList.title detailList.authorInfo detailList.remark detailList.tag detailList.lang";
            }
            searchObj = {valid:1,platform:commonJs.getSplitMatchReg(params.platform),categoryId:{$in:categoryIdArr},status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
        }else{
            if("1"==params.hasContent){
                selectField+=" detailList.$";
            }else{
                selectField+=" detailList.title detailList.authorInfo detailList.remark detailList.tag detailList.lang";
            }
            var deList={lang:params.lang};
            if(commonJs.isValid(params.authorId)){
                deList["authorInfo.userId"] = params.authorId;
            }
            searchObj = {valid:1,platform:commonJs.getSplitMatchReg(params.platform),categoryId:{$in:categoryIdArr},'detailList' : {$elemMatch:deList},status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
        }
        var from = (params.pageNo-1) * params.pageSize;
        var orderByJsonObj={createDate: 'desc' };
        if(commonJs.isValid(params.orderByJsonStr)){
            orderByJsonObj=JSON.parse(params.orderByJsonStr);
        }
        async.parallel({
                list: function(callbackTmp){
                    article.find(searchObj).skip(from)
                            .limit(params.pageSize)
                            .sort(orderByJsonObj)
                            .select(selectField)
                            .exec('find',function (err,articles) {
                            if(err){
                                logger.error(err);
                                callbackTmp(null,null);
                            }else{
                                callbackTmp(null,articles);
                            }
                     });
                },
                totalSize: function(callbackTmp){
                    article.find(searchObj).count(function(err,rowNum){
                        callbackTmp(null,rowNum);
                    });
                }
            },
           function(err, results) {
             callback(ApiResult.page(params.pageNo,params.pageSize,results.totalSize,results.list));
          }
        );
    },
    /**
     * 提取文档信息
     * @param id
     * @param callback
     */
    getArticleInfo:function(id,callback){
        article.findById(id,"categoryId platform mediaUrl mediaImgUrl linkUrl createDate publishStartDate publishEndDate detailList",function(err,row){
            callback(row);
        });
    }
};

//导出服务类
module.exports = articleService;

