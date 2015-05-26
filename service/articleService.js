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
     * @param  code  栏目code
     * @param  lang  语言
     * @param  curPageNo 当前页数
     * @param  pageSize  每页显示条数
     */
    getArticleList:function(platform,code,lang,curPageNo,pageSize,callback){
        var searchObj = {};
        if(!commonJs.isBlank(code)){
            this.getCategoryByCode(code,function(category){
                if(commonJs.isBlank(lang)){
                    searchObj = {platform:platform,categoryId : category._id};
                }else{
                    searchObj = {platform:platform,categoryId: category._id,'detailList.lang' : lang};
                }
                if(curPageNo <= 0){
                    curPageNo = 1;
                }
                var from = (curPageNo-1) * pageSize;
                var query = article.find(searchObj);
                query.skip(from)
                    .limit(pageSize)
                    .sort({createDate: -1 })
                    .select({'createDate' : 1,'detailList.lang.$' : 1})
                    .exec('find',function (err,articles) {
                        if(err){
                            console.error(err);
                            callback(null);
                        }else{
                            callback(articles);
                        }
                    });
            });
        }
    },
    /**
     * 根据code --> 获取栏目信息
     * @param code  栏目code
     */
    getCategoryByCode : function(code,callback){
        category.findOne({'code':code},function (err,category) {
            if(err){
                console.error(err);
                callback(null);
            }else{
                callback(category);
            }
        });
    }
}

//导出服务类
module.exports = articleService;

