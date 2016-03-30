/**
 * 财经数据API服务类<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年03月25日 <BR>
 * Description :<BR>
 * <p>
 *  财经日历 + 假期预告 + 财经大事
 * </p>
 */
var logger = require('../resources/logConf').getLogger("zxFinanceService");
var ZxFinanceData = require('../models/zxFinanceData.js');
var ZxFinanceEvent = require('../models/zxFinanceEvent.js');
var async = require('async');//引入async
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js

var zxFinanceService = {
    /**
     * 获取财经数据列表
     * @param date 数据日期
     * @param dataType 数据类型 1-外汇 2-贵金属
     * @param callback (err, datas)
     */
    getDataList : function(date, dataType, callback){
        var loc_query = {
            date : date,
            valid : 1
        };
        if(dataType==1){
            loc_query.dataType = {$in : [0,1]}
        }else if(dataType==2){
            loc_query.dataType = {$in : [0,2]}
        }
        APIUtil.DBFind(ZxFinanceData, {
            query : loc_query,
            sortAsc : ["time"]
        }, function(err, datas){
            if(err){
                logger.error("<<getDataList:查询财经日历信息出错，[errMessage:%s]", err);
                callback(null, null);
                return;
            }
            callback(null, datas);
        });
    },

    /**
     * 获取财经事件列表
     * @param date 数据日期
     * @param dataType 数据类型 1-外汇 2-贵金属
     * @param callback (err, events)
     */
    getEventList : function(date, dataType, callback){
        var loc_query = {
            date : date,
            type : {$in: ["1","3"]},
            valid : 1
        };
        if(dataType==1){
            loc_query.dataType = {$in : [0,1]}
        }else if(dataType==2){
            loc_query.dataType = {$in : [0,2]}
        }

        APIUtil.DBFind(ZxFinanceEvent, {
            query : loc_query,
            sortAsc : ["time"]
        }, function(err, events){
            if(err){
                logger.error("<<getEventList:查询财经事件信息出错，[errMessage:%s]", err);
                callback(null, null);
                return;
            }
            callback(null, events);
        });
    },

    /**
     * 获取财经数据：财经日历 + 财经事件 + 假期预告
     * @param date
     * @param dataType
     * @param callback (err, datas)
     */
    getFinanceData : function(date, dataType, callback){
        async.parallel({
            datas : function(callbackTmp){
                zxFinanceService.getDataList(date, dataType, function(err, datas){
                    var loc_datas = [];
                    var loc_data = null;
                    for(var i = 0, lenI = datas == null ? 0 : datas.length; i < lenI; i++){
                        loc_data = datas[i];
                        loc_datas.push({
                            dataId          : loc_data._id.toString(),
                            name            : loc_data.name,
                            country         : loc_data.country,
                            basicIndexId    : loc_data.basicIndexId,
                            predictValue    : loc_data.predictValue,
                            lastValue       : loc_data.lastValue,
                            value           : loc_data.value,
                            date            : loc_data.date,
                            time            : loc_data.time,
                            importanceLevel : loc_data.importanceLevel,
                            dataType        : loc_data.dataType,
                            description     : loc_data.description
                        });
                    }
                    callbackTmp(null, loc_datas);
                });
            },
            events : function(callbackTmp){
                zxFinanceService.getEventList(date, dataType, function(err, events){
                    var loc_events = {
                        events : [],
                        vacations : []
                    };
                    var loc_event = null;
                    var loc_target = null;
                    for(var i = 0, lenI = events == null ? 0 : events.length; i < lenI; i++){
                        loc_event = events[i];
                        loc_target = {
                            country         : loc_event.country,
                            region          : loc_event.region,
                            title           : loc_event.title,
                            content         : loc_event.content,
                            date            : loc_event.date,
                            time            : loc_event.time,
                            importanceLevel : loc_event.importanceLevel,
                            dataType        : loc_event.dataType
                        };
                        if(loc_event.type == "1"){
                            loc_events.events.push(loc_target);
                        }else if(loc_event.type == "2"){
                            loc_events.vacations.push(loc_target);
                        }
                    }
                    callbackTmp(null, loc_events);
                });
            }
        }, function(err, results){
            callback(null, {
                financeEvent:results.events.events,
                financeVacation:results.events.vacations,
                financeData:results.datas
            });
        });
    },

    /**
     * 获取财经日历历史数据
     * @param basicIndexId 指标编号
     * @param startTime 开始日期 yyyy-MM-dd
     * @param endTime 结束日期 yyyy-MM-dd
     * @param callback (err, data)
     */
    getFinanceDataHis : function(basicIndexId, startTime, endTime, callback){
        var loc_query = {
            basicIndexId : basicIndexId,
            valid : 1
        };
        if(startTime || endTime){
            loc_query.date = {};
            if(startTime){
                loc_query.date.$gte = startTime;
            }
            if(endTime){
                loc_query.date.$lte = endTime;
            }
        }

        APIUtil.DBFind(ZxFinanceData, {
            query : loc_query,
            sortAsc : ["date", "time"]
        }, function(err, datas){
            if(err){
                logger.error("<<getFinanceDataHis:查询财经日历历史数据信息出错，[errMessage:%s]", err);
                callback(null, null);
                return;
            }
            if(datas == null || datas.length == 0){
                callback(null, null);
                return;
            }
            var loc_result = {
                history:[]
            };
            var loc_data = null;
            for(var i = 0, lenI = datas.length - 1; i <= lenI; i++){
                loc_data = datas[i];
                if(i == lenI){
                    loc_result.detail = {
                        name            : loc_data.name,
                        country         : loc_data.country,
                        basicIndexId    : loc_data.basicIndexId,
                        positiveItem    : loc_data.positiveItem,
                        negativeItem    : loc_data.negativeItem,
                        level           : loc_data.level,
                        url             : loc_data.url,
                        unit            : loc_data.unit,
                        interpretation  : loc_data.interpretation,
                        publishOrg      : loc_data.publishOrg,
                        publishFrequncy : loc_data.publishFrequncy,
                        statisticMethod : loc_data.statisticMethod,
                        explanation     : loc_data.explanation,
                        influence       : loc_data.influence,
                        importanceLevel : loc_data.importanceLevel,
                        dataType        : loc_data.dataType
                    };
                }
                loc_result.history.push({
                    predictValue    : loc_data.predictValue,
                    lastValue       : loc_data.lastValue,
                    value           : loc_data.value,
                    year            : loc_data.year,
                    date            : loc_data.date,
                    time            : loc_data.time,
                    period          : loc_data.period,
                    nextPublishTime : loc_data.nextPublishTime
                });
            }
            callback(null, loc_result);
        });
    },

    /**
     * 获取财经日历详情数据
     * @param dataId 财经日历编号
     * @param callback (err, data)
     */
    getFinanceDataDetail : function(dataId, callback){
        var loc_query = {
            _id : dataId,
            valid : 1
        };

        APIUtil.DBFindOne(ZxFinanceData, {
            query : loc_query,
            fieldEx : ['createDate','createUser','createIp','updateDate','updateUser','updateIp']
        }, function(err, data){
            if(err){
                logger.error("<<getFinanceDataDetail:查询财经日历详情数据信息出错，[errMessage:%s]", err);
                callback(null, null);
                return;
            }
            if(!data){
                callback(null, null);
                return;
            }
            callback(null, data.toObject());
        });
    }
};

//导出服务类
module.exports =zxFinanceService;