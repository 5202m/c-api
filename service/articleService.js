/**
 * 摘要：文章资讯 Service服务类
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
var async = require('async');//引入async

/**
 * 定义服务类
 */
var articleService = {
    /**
     * 根据栏目code-->提取文章资讯列表
     * @param params {{platform, code, isAll, lang, hasContent, authorId, orderByJsonStr, pageNo, pageSize, pageLess, pageKey}}
     * @param callback
     */
    getArticlePage:function(params,callback){
        var searchObj = {
            valid:1,
            platform:commonJs.getSplitMatchReg(params.platform),
            status:1
        },selectField="";
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
        selectField="categoryId platform sequence mediaUrl mediaImgUrl linkUrl createDate publishStartDate publishEndDate praise downloads";
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
     * 提取当前日期文档条数
     * @param params
     * @param callback
     */
    getCountByDate:function(params,callback){
        var currDate=params.dateTime?new Date(params.dateTime):new Date();
        var startTime=commonJs.formatterDate(currDate)+" 00:00:00";
        article.find({status:1,valid:1,categoryId:params.code,platform:commonJs.getSplitMatchReg(params.platform),publishStartDate:{"$lte":currDate,"$gt":new Date(startTime)}}).count(function(err,rowNum){
            callback({count:rowNum});
        });
    },
    /**
     * 根据栏目code-->提取文章资讯列表
     * @param  code  栏目code
     * @param  lang  语言
     * @param  curPageNo 当前页数
     * @param  pageSize  每页显示条数
     */
    getListByGroup:function(params,callback){
        var searchObj={status:1,valid:1,categoryId:params.code,platform:commonJs.getSplitMatchReg(params.platform)};
        var days=params.days||6;//默认前6天
        var o = {};
        o.map = function () {
            var month=this.publishStartDate.getMonth()+1,date=this.publishStartDate.getDate();
            month=month<10?'0'+month:month;
            date=date<10?'0'+date:date;
            emit((this.publishStartDate.getFullYear()+"-"+(month)+"-"+date),this.detailList);
        };
        o.query=searchObj;
        o.reduce = function (k, doc) {
            var list=[];
            doc.forEach(function(row) {
                list.push(row[0]);
            });
            return {count:doc.length,detailList:list};
        };
        o.out = { replace: 'detailList'};
        o.verbose = false;
        article.mapReduce(o, function (err, model, stats) {
            model.find().sort({_id:'desc'}).limit(days).exec(function (err, docs) {
                docs.forEach(function(row) {
                    if(row.value.length==1){
                        row.value={"count":1,"detailList":[row.value[0]]};
                    }
                });
                callback(docs);
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
     * 添加文章
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
                    logger.error("保存文章失败！", err);
                    callback({isOK:false, id:0, msg:err});
                    return;
                }
                callback({isOK: true, id: result._id, createDate:loc_timeNow.getTime(),msg:''});
            });
        }, true);
    },
    /**
     * 更新文章
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

