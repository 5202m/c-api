/**
 * 摘要：文章资讯 Service服务类
 * author：Gavin.guo
 * date:2015/4/23
 */
var article = require('../models/article');          //引入article数据模型
var category = require('../models/category');   //引入category数据模型
var commonJs = require('../util/common');       //引入公共的js

/**
 * 定义服务类
 */
var articleService = {
    /**
     * 根据栏目code-->提取文章资讯列表
     */
    getArticleList:function(code,callback){
        var searchObj = {};
        if(!commonJs.isBlank(code)){
            this.getCategoryByCode(code,function(category){
                searchObj = {'categoryId' : category._id};
            });
        }
        article.find(searchObj,function (err,articles) {
            if(err){
                console.error(err);
                callback(null);
            }
            callback(articles);
        });
    },
    /**
     * 根据code --> 获取栏目信息
     * @param code  栏目code
     */
    getCategoryByCode : function(code,callback){
        console.info(code);
        category.findOne({'code':code},function (err,category) {
            if(err){
                console.error(err);
                callback(null);
            }
            callback(category);
        });
    }
}

//导出服务类
module.exports = articleService;

