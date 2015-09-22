/**
 * 摘要：文章资讯 Service服务类
 * author：Gavin.guo
 * date:2015/4/23
 */
var article = require('../models/article');          //引入article数据模型
var category = require('../models/category');   //引入category数据模型
var ApiResult = require('../util/ApiResult');
var commonJs = require('../util/common');       //引入公共的js
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var FinanceUserService = require('../service/financeUserService.js');
var ReplyService = require('../service/replyService.js');
var TopicStatisticalService = require('../service/topicStatisticalService.js');
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
        selectField="categoryId platform sequence mediaUrl mediaImgUrl linkUrl createDate";
        if(commonJs.isBlank(params.lang)){
            if("1"==params.hasContent){
                selectField+=" detailList";
            }else{
                selectField+=" detailList.title detailList.remark detailList.tag detailList.lang";
            }
            searchObj = {valid:1,platform:commonJs.getSplitMatchReg(params.platform),categoryId:{$in:categoryIdArr},status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
        }else{
            if("1"==params.hasContent){
                selectField+=" detailList.$";
            }else{
                selectField+=" detailList.title detailList.author detailList.remark detailList.tag detailList.lang";
            }
            searchObj = {valid:1,platform:commonJs.getSplitMatchReg(params.platform),categoryId:{$in:categoryIdArr},'detailList' : {$elemMatch:{lang:params.lang}},status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
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
                                console.error(err);
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
        article.findById(id,"categoryId platform mediaUrl mediaImgUrl linkUrl createDate detailList",function(err,row){
            callback(row);
        });
    },
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
                var currDate=new Date();
                if(commonJs.isBlank(lang)){
                    searchObj = {platform:platform,categoryId : category._id,status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
                }else{
                    searchObj = {platform:platform,categoryId: category._id,'detailList.lang' : lang,status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
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
     * @param callback
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
    },

    /**
     * 功能：获取文章列表
     * @param  params {{platform : "平台", code: "栏目"}}
     * @param  pageLast
     * @param  pageSize    每页显示条数
     * @param  callback
     */
    getArticleListWithRely : function(params, pageLast, pageSize, callback){
        var currDate=new Date();
        var searchObj = {
            platform : commonJs.getSplitMatchReg(params.platform),
            valid : 1,
            status : 1,
            publishStartDate:{"$lte":currDate},
            publishEndDate:{"$gte":currDate}
        };
        if(params.code){
            searchObj.categoryId = params.code;
        }

        APIUtil.DBPage(article, {
            pageLast : pageLast,
            pageSize : pageSize,
            pageId : "_id",
            pageDesc : true,
            query : searchObj
        },function(err, articles, page){
            if(err){
                console.error("查询文章列表失败!", err);
                callback(APIUtil.APIResult("code_2046", null, null));
                return;
            }
            var loc_articles = [];
            for(var i = 0, lenI = !articles ? 0 : articles.length; i < lenI; i++){
                loc_articles.push(articleService.convertArticle(articles[i].toObject()));
            }

            articleService.completeArticleInfo(loc_articles, function(err, articles){
                if(err){
                    callback(APIUtil.APIResult("code_2046", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, articles, page));
            });
        });
    },

    /**
     * 完善文章信息： 文章统计信息 + 文章回复信息(首条) + 文章回复人信息
     * @param articles
     * @param callback
     */
    completeArticleInfo : function(articles, callback){
        var loc_articles = [];
        var loc_article = null;
        for(var i = 0, lenI = !articles ? 0 : articles.length; i < lenI; i++){
            loc_article = articles[i];
            loc_article.publishTime = loc_article.publishTime.getTime();
            loc_article.content = commonJs.filterContentHTML(loc_article.content);
            loc_articles.push(loc_article);
        }

        if(loc_articles.length === 0){
            callback(null, []);
            return;
        }

        //查询文章统计信息
        TopicStatisticalService.getStatisticals(loc_articles, function(err, articleStatisticals){
            if(err){
                console.error("查询文章统计信息失败!", err);
                callback(err, null);
                return;
            }

            //查询文章首条回帖信息
            ReplyService.getFirstReplyByTopics(articleStatisticals, function(err, articleReplys){
                if(err){
                    console.error("查询回帖信息失败!", err);
                    callback(err, null);
                    return;
                }
                var loc_memberIds = [];
                var loc_article = null;
                for(var i = 0, lenI = articleReplys.length; i < lenI; i++){
                    loc_article = articleReplys[i];
                    if(loc_article.reply){
                        loc_memberIds.push(loc_article.reply.memberId);
                    }
                }
                //查询发帖人，回帖人信息
                FinanceUserService.getMemberInfoByMemberIds(loc_memberIds, function(err, members){
                    if(err){
                        console.error("查询发帖人信息失败!", err);
                        callback(err, null);
                        return;
                    }

                    var loc_article = null;
                    var lenJ = !members ? 0 : members.length;
                    var j, loc_member = null;
                    for(var i = 0, lenI = articleReplys.length; i < lenI; i++){
                        loc_article = articleReplys[i];
                        loc_article.memberAvatar = "";
                        loc_article.memberName = "";
                        loc_article.memberAttentionCnt = 0;
                        if(loc_article.reply){
                            for(j = 0; j < lenJ; j++){
                                loc_member = members[j];
                                if(loc_article.reply.memberId === loc_member._id.toString()){
                                    loc_article.reply.memberAvatar = loc_member.loginPlatform.financePlatForm.avatar;
                                    loc_article.reply.memberName = loc_member.loginPlatform.financePlatForm.nickName;
                                    loc_article.reply.memberAttentionCnt = loc_member.loginPlatform.financePlatForm.beAttentions.length;
                                    break;
                                }
                            }
                            if(j === lenJ){
                                loc_article.reply.memberAvatar = "";
                                loc_article.reply.memberName = "";
                                loc_article.reply.memberAttentionCnt = 0;
                            }
                        }
                    }
                    callback(null, articleReplys);
                });
            });
        });
    },

    /**
     * 根据Id查询文章列表
     * @param articleIds
     * @param platform
     * @param callback
     */
    getArticleByIds : function(articleIds, platform, callback){
        if(!articleIds || articleIds.length === 0){
            callback(null, []);
            return;
        }
        var currDate=new Date();
        var searchObj = {
            platform : commonJs.getSplitMatchReg(platform),
            valid : 1,
            status : 1,
            publishStartDate:{"$lte":currDate},
            publishEndDate:{"$gte":currDate},
            _id : {$in : articleIds}
        };
        APIUtil.DBFind(article,
            {
                query : searchObj,
                fieldIn : ["categoryId", "createDate", "detailList"]
            },
            function (err, articles) {
                if(err){
                    console.error("查询文章列表失败!", err);
                    callback(err, null);
                    return;
                }
                callback(null, articles);
            }
        );
    },


    /**
     * 获取文章详情 :分页信息用于文章的回复列表
     * @param opType 1-查询文章详情，以及最新指定数量的文章回复信息，2-仅按照分页信息查询文章回复信息
     * @param articleId
     * @param pageLast
     * @param pageSize
     * @param callback
     */
    getArticleDetail : function(opType, articleId, pageLast, pageSize, callback){
        if(opType === 2){
            ReplyService.getReplysWithMember(articleId, 2, pageLast, pageSize, function(err, replys, page){
                if(err){
                    console.error("查询文章回复信息失败！", err);
                    callback(APIUtil.APIResult("code_2047", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, {"_id" : articleId, "replys" : replys}, page));
            });
        }
        else if(opType === 1){
            APIUtil.DBFindOne(article,
                {
                    query : {
                        valid : 1,
                        status : 1,
                        _id : articleId
                    }
                },
                function(err, article){
                    if(err){
                        console.error("查询文章详情失败！", err);
                        callback(APIUtil.APIResult("code_2047", null, null));
                        return;
                    }
                    if(!article){
                        callback(APIUtil.APIResult(null, null, null));
                        return;
                    }
                    //文章被点击时，阅读数加1
                    TopicStatisticalService.read(articleId , 2 ,null, function(apiResult){
                        console.info("文章被阅读！", articleId);
                    });
                    var loc_article = articleService.convertArticle(article.toObject());
                    loc_article.publishTime = loc_article.publishTime instanceof Date ? loc_article.publishTime.getTime() : 0;
                    TopicStatisticalService.getStatistical(loc_article._id, 2, function(err, statistical){
                        if(err){
                            console.error("查询文章详情--文章统计信息失败！", err);
                            callback(APIUtil.APIResult("code_2047", null, null));
                            return;
                        }
                        if(statistical){
                            loc_article.praiseCounts = statistical.praiseCounts;
                            loc_article.replyCounts = statistical.replyCounts;
                        }else{
                            loc_article.praiseCounts = 0;
                            loc_article.replyCounts = 0;
                        }
                        loc_article.memberAvatar = "";
                        loc_article.memberName = "";
                        loc_article.memberAttentionCnt = 0;
                        //获取回复列表
                        ReplyService.getReplysWithMember(articleId, 2, pageLast, pageSize, function(err, replys, page){
                            if(err){
                                console.error("查询文章回帖信息失败！", err);
                                callback(APIUtil.APIResult("code_2047", null, null));
                                return;
                            }
                            loc_article.replys = replys;
                            callback(APIUtil.APIResult(null, loc_article, page));
                        });
                    });
                });
        }
    },

    /**
     * 将文章转化为帖子数据结构
     * @param article
     * @returns {*}
     */
    convertArticle : function(article){
        if(!article){
            return null;
        }
        var loc_result = {
            _id: article._id,
            type: 2,
            memberId: "",
            publishTime: article.createDate,
            topicAuthority: 1,
            isRecommend: 0,
            device: "",
            expandAttr: null,
            subjectType: article.categoryId,
            infoStatus: 1,
            publishLocation: 3,
            title: "",
            content: "",
            isTop: 0
        };

        if(article.detailList && article.detailList.length > 0){
            loc_result.title = article.detailList[0].title;
            loc_result.content = article.detailList[0].content;
            loc_result.author = article.detailList[0].author;
        }
        return loc_result;
    }
};

//导出服务类
module.exports = articleService;

