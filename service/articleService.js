/**
 * 摘要：文档资讯 Service服务类
 * author：Gavin.guo
 * date:2015/4/23
 */
var logger = require('../resources/logConf').getLogger("articleService");
var article = require('../models/article');          //引入article数据模型
var IdSeqManager = require('../constant/IdSeqManager.js');  //引入序号生成器js
var category = require('../models/category');   //引入category数据模型
var ApiResult = require('../util/ApiResult');
var commonJs = require('../util/common');       //引入公共的js
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var Utils = require('../util/Utils'); 	 	            //引入工具类js
var async = require('async');//引入async

/**
 * 定义服务类
 */
var articleService = {
    /**
     * 查询单个文档信息（按照创建时间逆序）
     * @param code
     * @param platform
     * @param tag
     * @param isAll
     * @param callback
     */
    findArticle : function(code, platform, tag, isAll, callback){
        var searchObj = {
            valid:1,
            platform:commonJs.getSplitMatchReg(platform),
            status:1,
            categoryId:code
        };
        if(tag){
            searchObj["detailList.tag"] = tag;
        }
        if(!isAll){
            var currDate=new Date();
            searchObj.publishStartDate = {"$lte":currDate};
            searchObj.publishEndDate = {"$gte":currDate};
        }
        article.find(searchObj)
            .sort({"createDate":-1})
            .limit(1)
            .exec('find', function(err,articles) {
                if(err || !articles || articles.length == 0){
                    if(err){
                        logger.error(err);
                    }
                    callback(null);
                }else{
                    callback(articles[0]);
                }
            });
    },
    /**
     * 根据栏目code-->提取文档资讯列表
     * @param params {{platform, code, isAll, lang, hasContent, authorId, orderByJsonStr, pageNo, pageSize, pageLess, pageKey}}
     * @param callback
     */
    getArticlePage:function(params,callback){
        var searchObj = {
            valid:1,
            platform:commonJs.getSplitMatchReg(params.platform),
            status:1
        };
        if(params.code.indexOf(",")!=-1){
            searchObj.categoryId = {$in:params.code.split(",")};
        }else{
            searchObj.categoryId = params.code;
        }
        if(!params.isAll){
            var currDate=new Date();
            searchObj.publishStartDate = {"$lte":currDate};
            searchObj.publishEndDate = {"$gte":currDate};
        }
        if(params.pageKey){
            if(params.pageLess){
                searchObj._id = {"$lt" : params.pageKey};
            }else{
                searchObj._id = {"$gt" : params.pageKey};
            }
        }
        var selectField="categoryId platform sequence mediaUrl mediaImgUrl linkUrl createDate publishStartDate publishEndDate praise downloads point";
        if(commonJs.isBlank(params.lang)){
            if("1"==params.hasContent){
                selectField+=" detailList";
            }else{
                selectField+=" detailList.title detailList.authorInfo detailList.remark detailList.tag detailList.lang";
            }
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
            if(commonJs.isValid(params.tag)){
                deList["tag"] = params.tag;
            }
            searchObj.detailList = {$elemMatch:deList};
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
                                for(var i in articles) {
                                    articles[i] = articles[i].toObject();
                                }
                                articles = articleService.formatArticles(articles, params.format);
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
     * 格式化
     * @param articles
     * @param type
     */
    formatArticles : function(articles, type){
        if(!articles || articles.length == 0){
            return articles;
        }
        if(type == "live"){
            var article, detail, author;
            var imgReg = /<img\s+[^>]*src=['"]([^'"]+)['"][^>]*>/,
                tagRegAll = /<[^>]+>|<\/[^>]+>/g,
                matches,content,contentImg;
            for(var i in articles){
                article = articles[i];
                detail = article.detailList && article.detailList[0];

                article.publishStartDate = Utils.dateFormat(article.publishStartDate, "yyyy-MM-dd hh:mm:ss");
                article.publishEndDate = Utils.dateFormat(article.publishEndDate, "yyyy-MM-dd hh:mm:ss");
                article.createDate = Utils.dateFormat(article.createDate, "yyyy-MM-dd hh:mm:ss");
                article.praise = article.praise || 0;
                if(detail){
                    //基本信息
                    author = detail.authorInfo || {};
                    article.title = detail.title || "";
                    article.tag = detail.tag || "";
                    article.remark = detail.remark || "";
                    //内容
                    content = detail.content || "";
                    contentImg = "";
                    matches = imgReg.exec(content);
                    if(matches){
                        contentImg = matches[1];
                    }
                    content = content.replace(tagRegAll, "");
                    article.content = content;
                    article.contentImg = contentImg;
                    //作者
                    if(author){
                        article.authorId = author.userId || "";
                        article.authorAvatar = author.avatar || "";
                        article.authorPosition = author.position || "";
                        article.authorName = author.name || "";
                    }
                }
                delete article["detailList"];
                articles[i] = article;
            }
        }
        return articles;
    },
    /**
     * 提取当前日期文档条数
     * @param params
     * @param callback
     */
    getCountByDate:function(params,callback){
        var endDate=params.dateTime?new Date(params.dateTime):new Date();
        var startDate=null;
        if(params.duration){
            startDate=new Date(endDate.getTime() - params.duration);
        }else{
            startDate=new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        }
        var searchObj = {
            status: 1,
            valid: 1,
            categoryId: params.code,
            platform: commonJs.getSplitMatchReg(params.platform),
            createDate: {"$lte": endDate, "$gt": startDate}
        };
        if(params.tag){
            searchObj["detailList.tag"] = params.tag;
        }
        article.count(searchObj, function(err,rowNum){
            if(err){
                logger.error("文档数量查询异常！", err);
                callback(null);
                return;
            }
            callback({count:rowNum});
        });
    },
    /**
     * 根据栏目code-->提取文档资讯列表
     * @param  params  参数
     * @param  callback
     */
    getListByGroup:function(params,callback){
        //仅筛选最近一个月的文档分组，注意和days的关系。 分组函数的性能调优
        var dateStart = new Date().getTime();
        dateStart = new Date(dateStart - 86400000 * 31);

        var searchObj= {
            status: 1,
            valid: 1,
            categoryId: params.code,
            platform: commonJs.getSplitMatchReg(params.platform),
            publishStartDate : {$gte : dateStart}
        };
        var days=params.days||6;//默认前6天
        var o = {
            //映射方法
            map : function () {
                var month=this.createDate.getMonth()+1,date=this.createDate.getDate();
                month=month<10?'0'+month:month;
                date=date<10?'0'+date:date;
                emit((this.createDate.getFullYear()+"-"+(month)+"-"+date),this);
            },
            //查询条件
            query : searchObj,
            //排序
            sort : {"createDate": -1},
            //简化
            reduce : function (k, doc) {
                return {articles:doc};
            },
            //将统计结果输出到articleDataMap集合中，如果存在则replace
            out : {
                replace: 'articleDateMap'
            },
            //是否产生更加详细的服务器日志
            verbose : false
        };
        article.mapReduce(o, function (err, model, stats) {
            if(err){
                logger.error("文档分组异常！", err);
                callback(null);
                return;
            }
            model.find().sort({_id:'desc'}).limit(days).exec(function (err, docs) {
                if(err){
                    logger.error("文档分组查询异常！", err);
                    callback(null);
                    return;
                }
                var result = [];
                var format = params.format;
                docs.forEach(function(row) {
                    if(row.value.hasOwnProperty("articles") == false){
                        result.push({
                            date : row._id,
                            articles : articleService.formatArticles([row.value], format)
                        });
                    }else{
                        result.push({
                            date : row._id,
                            articles : articleService.formatArticles(row.value.articles, format)
                        });
                    }
                });
                callback(result);
            });
        });
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
    },
    
    /**
     * 添加文档
     * @param articleParam
     * @param callback
     */
    addArticle: function(articleParam, callback){
        IdSeqManager.Article.getNextSeqId(function(err, articleId){
            var loc_timeNow = new Date();
            var loc_article = new article({
                _id: articleId,
                template: articleParam.template,
                categoryId: articleParam.categoryId,
                status: articleParam.status,
                platform: articleParam.platform,
                createDate: loc_timeNow,
                publishStartDate: articleParam.publishStartDate,
                publishEndDate: articleParam.publishEndDate,
                valid: articleParam.valid,
                sequence: articleParam.sequence,
                mediaUrl: articleParam.mediaUrl,
                mediaImgUrl: articleParam.mediaImgUrl,
                linkUrl: articleParam.linkUrl,
                detailList: articleParam.detailList
            });
            loc_article.save(function(err, result){
                if(err){
                    logger.error("保存文档失败！", err);
                    callback({isOK:false, id:0, msg:err});
                    return;
                }
                callback({isOK: true, id: result._id, createDate:loc_timeNow.getTime(),msg:''});
            });
        }, true);
    },
    /**
     * 更新文档
     * @param query
     * @param field
     * @param updater
     * @param callback
     */
    modifyArticle: function(query, field, updater, callback){
        article.find(query, field, function(err, row){
            if(err){
                logger.error("modifyArticle->fail!:"+err);
                callback({isOK:false, msg:'更新失败'});
            } else {
                if (row) {
                    article.findOneAndUpdate(query, updater, function(err1, row1){
                        if (err1) {
                            logger.error('modifyArticle=>fail!' + err1);
                            callback({isOK: false, msg: '更新失败'});
                        }
                        callback({isOK:true, msg:''});
                    });
                }else {
                    callback({isOk: false,  msg: '更新失败'});
                }
            }
        });
    },
    /**
     * 更新点赞数或下载次数
     * @param _id
     * @param type
     * @param callback
     */
    modifyPraiseOrDownloads: function(_id, type, callback){
        article.findOne({'_id':_id}, function(err, row){
            if(err){
                logger.error("modifyPraiseOrDownloads->fail!:"+err);
                callback({isOK:false, msg:'更新失败'});
            } else {
                if (row) {
                    if(type=='praise') {
                        if(commonJs.isBlank(row.praise)){
                            row.praise = 1;
                        }else {
                            row.praise += 1;
                        }
                    }else if(type=='downloads'){
                        if(commonJs.isBlank(row.downloads)){
                            row.downloads = 1;
                        }else {
                            row.downloads += 1;
                        }
                    }
                    row.save(function(err1, rowTmp){
                        if (err1) {
                            logger.error('modifyPraiseOrDownloads=>fail!' + err1);
                            callback({isOK: false, msg: '更新失败'});
                            return;
                        }
                        var num = 0;
                        if(type=='praise') {
                            num = rowTmp.praise;
                        }else if(type=='downloads'){
                            num = rowTmp.downloads;
                        }
                        callback({isOK:true, msg:'', num: num});
                    });
                }else {
                    callback({isOk: false,  msg: '更新失败'});
                }
            }
        });
    }
};

//导出服务类
module.exports = articleService;

