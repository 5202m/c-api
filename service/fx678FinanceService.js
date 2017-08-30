/**
 * 汇通财经数据同步服务类<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2017 by Jade<BR>
 * Author : Jade <BR>
 * Date : 2017年07月21日 <BR>
 * Description :<BR>
 * <p>
 *  财经日历 + 假期预告 + 财经大事
 * </p>
 */
var Logger = require('../resources/logConf').getLogger("fx678FinanceService");
var ZxFinanceDataCfg = require('../models/zxFinanceDataCfg.js');
var ZxFinanceData = require('../models/zxFinanceData.js');
var ZxFinanceEvent = require('../models/zxFinanceEvent.js');
var Async = require('async');//引入async
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var Request = require('request');
var Config=require('../resources/config.js');
var Utils = require('../util/Utils');
var Common = require('../util/common');
var noticeService = require('./noticeService');
let Deferred = Common.Deferred;

var fx678FinanceService = {
  /**
   * 格式化请求URL
   * @param path
   */
  formatUrl : function(path){
    return Config.fx678ApiUrl + path;
  },

  /**
   * 从fx678获取财经日历数据
   * @param date 2015-11-09
   * @param callback
   */
  getDataFromFx678 : function(date, callback){
    if(!date){
      Logger.warn("/Calendar/liebiao error: date为空!");
      callback(true, null);
      return;
    }
    date = date.replace(/\-/g, "");
    Request.get(fx678FinanceService.formatUrl("/Calendar/liebiao/d/" + date), function(err, res, data){
      if(err){
        Logger.warn("/Calendar/liebiao error[URL=" + this.uri.href + "]：" + err);
        callback(err, null);
        return;
      }
      var result = [];
      if(data){
        try{
          data = JSON.parse(data);
          result = data.data instanceof Array ? data.data : [];
        }catch(e){
          Logger.warn("/Calendar/liebiao error[URL=" + this.uri.href + "]：" + e);
          callback(e, null);
          return;
        }
      }
      callback(null, result);
    });
  },

  /**
   * 从fx678获取财经日历详情数据
   * @param basicIndexId 20
   * @param callback
   */
  getDetailFromFx678 : function(basicIndexId, callback){
    if(!basicIndexId){
      Logger.warn("/Calendar/detail/id/ error: id为空!");
      callback(null);
      return;
    }
    Request.get(fx678FinanceService.formatUrl("/Calendar/detail/id/" + basicIndexId), function(err, res, data){
      if(err){
        Logger.warn("/Calendar/detail/id/ error[URL=" + this.uri.href + "]：" + err);
        callback(null);
        return;
      }
      var result = null;
      if(data){
        try{
          data = JSON.parse(data);
          result = (data.data instanceof Array && data.data.length > 0) ? data.data[0] : null;
        }catch(e){
          Logger.warn("/Calendar/detail/id/ error[URL=" + this.uri.href + "]：" + e);
          callback(e, null);
          return;
        }
      }
      callback(null, result);
    });
  },

  /**
   * 从fx678获取财经大事数据
   * @param date 2015-11-09
   * @param type 1、假期预告 2、国债发行预告 3、财经大事
   * @param callback
   */
  getEventFromFx678 : function(date, type, callback){
    if(!date){
      Logger.warn("/Calendar/eventholiday error: date为空!");
      callback(true, null);
      return;
    }
    date = date.replace(/\-/g, "");
    Request.get(fx678FinanceService.formatUrl("/Calendar/eventholiday/date/" + date + "/type/" + type), function(err, res, data){
      if(err){
        Logger.warn("/Calendar/eventholiday error[URL=" + this.uri.href + "]：" + err);
        callback(err, null);
        return;
      }
      var result = [];
      if(data){
        try{
          data = JSON.parse(data);
          result = data.data instanceof Array ? data.data : [];
        }catch(e){
          Logger.warn("/Calendar/eventholiday error[URL=" + this.uri.href + "]：" + e);
        }
      }
      callback(null, result);
    });
  },

  /**
   * 按照财经日历列表，查询配置MAP
   * @param datas
   * @param callback
   */
  getDataConfigs : function(datas, callback){
    if (!datas || !datas instanceof Array || datas.length == 0)
    {
      callback({});
    }
    var basicIndexIds = {};
    for (var i = 0, lenI = datas.length; i < lenI; i++)
    {
      basicIndexIds[datas[i].basicIndexId] = "";
    }
    APIUtil.DBFind(ZxFinanceDataCfg, {
      query : {"_id" : { $in : Object.keys(basicIndexIds) }}
    }, function(err, configs){
      if(err || !configs){
        callback({});
        return;
      }
      var loc_result = {};
      for(var i = 0, lenI = configs.length; i < lenI; i++){
        loc_result[configs[i]._id] = configs[i];
      }

      callback(loc_result);
    });
  },

  /**
   * 获取财经数据列表
   * @param date 数据日期
   * @param callback (err, datas)
   */
  queryDataList : function(date, callback){
    APIUtil.DBFind(ZxFinanceData, {
      query : {date : date}
    }, function(err, datas){
      if(err){
        Logger.error("<<queryDataList:查询财经日历信息出错，[errMessage:%s]", err);
        callback(err, null);
        return;
      }
      callback(null, datas);
    });
  },

  /**
   * 获取财经事件列表
   * @param date 数据日期
   * @param type 3、假期预告 2、国债发行预告 1、财经大事
   * @param callback (err, events)
   */
  queryEventList : function(date, type, callback){
    ZxFinanceEvent.find({date: date, type: type}, function(err, events){
      if(err){
        Logger.error("<<queryEventList:查询财经事件信息出错，[errMessage:%s]", err);
        callback(err, null);
        return;
      }
      callback(null, events);
    });
  },

  /**
   * 批量保存财经数据配置
   * @param cfgs
   * @param callback
   */
  saveDataCfgs : function(cfgs, callback){
    if(!cfgs || cfgs.length == 0){
      callback();
      return;
    }
    var cfgsArr = [], step = 1000;
    for(var i = 0, lenI = cfgs.length; i < lenI; i+= step){
      cfgsArr.push(cfgs.slice(i, i + step));
    }
    Async.forEach(cfgsArr, function(cfgsTmp, callbackTmp){
      ZxFinanceDataCfg.collection.insert(cfgsTmp, function(errTmp){
        if(errTmp){
          Logger.error("saveDataCfgs error: " + errTmp);
        }
        callbackTmp();
      });
    }, function(err){
      if(err){
        Logger.error("saveDataCfgs error: " + err);
        callback(true);
      }else{
        callback();
      }
    });
  },

  /**
   * 批量保存财经数据
   * @param datas
   * @param callback
   */
  saveDatas : function(datas, callback){
    if(!datas || datas.length == 0){
      callback(null);
      return;
    }
    var datasArr = [], step = 1000;
    for(var i = 0, lenI = datas.length; i < lenI; i+= step){
      datasArr.push(datas.slice(i, i + step));
    }
    Async.forEach(datasArr, function(datasTmp, callbackTmp){
      ZxFinanceData.collection.insert(datasTmp, function(errTmp){
        if(errTmp){
          Logger.error("saveDatas error: " + errTmp);
        }
        callbackTmp(null);
      });
    }, function(err){
      if(err){
        Logger.error("saveDatas error: " + err);
        callback(err);
      }else{
        callback(null);
      }
    });
  },

  /**
   * 批量保存财经事件
   * @param events
   * @param callback
   */
  saveEvents : function(events, callback){
    if(!events || events.length == 0){
      callback(null);
      return;
    }
    var eventsArr = [], step = 1000;
    for(var i = 0, lenI = events.length; i < lenI; i+= step){
      eventsArr.push(events.slice(i, i + step));
    }
    Async.forEach(eventsArr, function(eventsTmp, callbackTmp){
      ZxFinanceEvent.collection.insert(eventsTmp, function(errTmp){
        if(errTmp){
          Logger.error("saveEvents<< error: " + errTmp);
        }
        callbackTmp(null);
      });
    }, function(err){
      if(err){
        Logger.error("saveEvents<< error: " + err);
        callback(err);
      }else{
        callback(null);
      }
    });
  },

  /**
   * 转化重要性：low-1、mid-2、high-3
   * @param importance
   * @returns {number}
   */
  formatImportance : function(importance){
    if ("high" == importance){
      return 3;
    }else if ("mid" == importance) {
      return 2;
    }else if ("low" == importance) {
      return 1;
    }
    return 0;
  },

  /**
   * 计算默认的重要级别
   * @param importance
   */
  getDefImportanceLevel : function(importance){
    var result = 0;
    switch(importance){
      case 1:
        result = 1;
        break;

      case 2:
        result = Math.random() >= 0.5 ? 2 : 3;
        break;

      case 3:
        result = Math.random() >= 0.5 ? 4 : 5;
        break;

      default:
        break;
    }
    return result;
  },

  /**
   * 描述：默认WH_ZX_U_U_U
   * 预期影响：正向，预期值>前值 利多;预期值<前值 利空;预期值=前值 持平;
   *         反向，预期值>前值 利空;预期值<前值 利多;预期值=前值 持平;
   *         前值或预期值无效 未知
   * 实际影响：正向，公布值>前值 利多;公布值<前值 利空;公布值=前值 持平;
   *         反向，公布值>前值 利空;公布值<前值 利多;公布值=前值 持平;
   *         前值或公布值无效 未知
   * 影响力度：前值为0，影响度 = |公布值| * 重要级数
   *         前值不为0，影响度 = |(公布值-前值)/前值| * 重要级数
   *         影响度[0,20%）LV1;[20%,50%）LV2;[50%,∞）LV3;
   *         前值或公布值无效 未知
   * @param data
   */
  getDescription : function(data){
    var description = data.description;
    if (!description){
      description = "WH_ZX_U_U_U";//默认是外汇正向
    }
    //计算前值、预期值、公布值
    var numRegExp = /^[+-]?\d+(\.\d+)?$/;
    var strRegExp = /[^0-9\-\.]/g;
    var predictValue = null;	//预期值
    var lastValue = null;     //前值
    var value = null;         //公布值
    var valTemp;
    valTemp = data.predictValue;
    if(valTemp){
      valTemp = valTemp.replace(strRegExp, "");
      if(numRegExp.test(valTemp)){
        predictValue = parseFloat(valTemp);
      }
    }
    valTemp = data.lastValue;
    if(valTemp){
      valTemp = valTemp.replace(strRegExp, "");
      if(numRegExp.test(valTemp)){
        lastValue = parseFloat(valTemp);
      }
    }
    valTemp = data.value;
    if(valTemp){
      valTemp = valTemp.replace(strRegExp, "");
      if(numRegExp.test(valTemp)){
        value = parseFloat(valTemp);
      }
    }

    //计算预期影响、实际影响、影响力度
    var comp = 0;
    var isZX = false;
    var srcArr = description.split(",");
    var lenI = srcArr.length;
    var destArr = new Array(lenI);
    var descs = null;
    for(var i = 0; i < lenI; i++){
      description = srcArr[i];
      descs = description.split("_");
      isZX = "ZX" == descs[1];
      if (lastValue == null){
        descs[2] = "U";
        descs[3] = "U";
        descs[4] = "U";
      }else {
        if (predictValue == null)
        {
          descs[2] = "U";
        }else{
          comp = predictValue - lastValue;
          if (comp == 0){
            descs[2] = "FLAT";
          }else if((comp > 0 && isZX) || (comp < 0 && !isZX)){
            descs[2] = "GOOD";
          }else{
            descs[2] = "BAD";
          }
        }
        if (value == null)
        {
          descs[3] = "U";
          descs[4] = "U";
        }else{
          comp = value - lastValue;
          if (comp == 0)
          {
            descs[3] = "FLAT";
          }else if((comp > 0 && isZX) || (comp < 0 && !isZX)){
            descs[3] = "GOOD";
          }else{
            descs[3] = "BAD";
          }
          //影响力度
          var rate = lastValue == 0 ? value : ((value - lastValue) / lastValue);
          rate = Math.abs(rate) * data.importanceLevel;
          if(rate < 0.2){
            descs[4] = "LV1";
          }else if(rate < 0.5){
            descs[4] = "LV2";
          }else{
            descs[4] = "LV3";
          }
        }
      }
      destArr[i] = descs.join("_");
    }
    return destArr.join(",");
  },

  /**
   * 获取公布频率
   * @param publishDate
   * @param updatePeriod
   * @return {{frequncy: string, nextTime: string}}
   */
  getPublishFrequncy : function(publishDate, updatePeriod){
    let publish = {frequncy:'', nextTime: ''};
    switch (updatePeriod){
      case '1':
        publish.frequncy = '每日';
        publish.nextTime = publishDate;
        break;
      case '2':
        publish.frequncy = '每周';
        publish.nextTime = Common.DateAdd('w', 1, new Date(publishDate));
        break;
      case '3':
        publish.frequncy = '每月';
        publish.nextTime = Common.DateAdd('M', 1, new Date(publishDate));
        break;
      case '4':
        publish.frequncy = '每季';
        publish.nextTime = Common.DateAdd('q', 1, new Date(publishDate));
        break;
      case '5':
        publish.frequncy = '每年';
        publish.nextTime = Common.DateAdd('y', 1, new Date(publishDate));
        break;
      default :
        break;
    }
    return publish;
  },

  /**
   * 获取指标影响
   * @param actual
   * @param surver
   * @param res
   * @return {string}
   */
  getInfluence : function(actual, surver, res){
    let influence = '';
    if(Common.isValid(res)) {
      res = res.split('|');
    }else {
      res = ['','',''];
    }
    if(Common.isValid(actual) && Common.isValid(surver)){
      if(actual > surver){
        influence = '实际值>预期值';
      }else if(actual < surver){
        influence = '实际值<预期值';
      }
    }
    if(Common.isValid(res[0])){
      influence += '=利多 '+ res[0];
    }
    if(Common.isValid(res[1])){
      if(Common.isValid(res[0])) {
        influence += ' 利空 ' + res[1];
      }else{
        influence += '=利空 ' + res[1];
      }
    }
    if(Common.isValid(res[2])){
      influence += res[2];
    }
    return influence;
  },

  /**
   * 通过API数据刷新财经日历数据
   * @param dbData
   * @param apiData
   * @returns {*}
   */
  refreshData : function(dbData, apiData){
    if(!dbData){
      dbData = {};
    }
    let deferred = new Deferred();
    if(!apiData){
      Logger.error("refreshData Error: apiData is null", apiData);
      deferred.reject(dbData);
    } else {
      let cbFn = function (err, detailData) {
        if (err) {
          //获取数据出错，中断当前日期数据更新
          Logger.error("refreshData Error:", err);
          deferred.reject(dbData);
        }
        var year = 0, date = "", time = "";
        if (apiData.PUBLISH_TIME) {
          date = apiData.PUBLISH_TIME.substring(0, 10);
          time = apiData.PUBLISH_TIME.substring(11, 19);
          year = parseInt(date.substring(0, 4), 10);
          if (isNaN(year)) {
            year = 0;
          }
        }
        if(detailData === null){
          deferred.reject(dbData);
        }else {
          let publishFT = fx678FinanceService.getPublishFrequncy(apiData.PUBLISH_TIME, detailData.UPDATE_PERIOD);
          dbData.name = apiData.TITLE;
          dbData.country = apiData.COUNTRY_CN;
          dbData.basicIndexId = apiData.ID;
          dbData.period = apiData.IDX_PERIOD;
          dbData.importance = Common.parseInt(apiData.IDX_RELEVANCE);//fx678FinanceService.formatImportance(apiData.IDX_RELEVANCE);
          dbData.importanceLevel = fx678FinanceService.getDefImportanceLevel(dbData.importance); //默认重要等级
          dbData.predictValue = Common.isBlank(apiData.SURVEY_PRICE) ? apiData.SURVEY_PRICE : apiData.SURVEY_PRICE + apiData.UNIT;//预期值
          dbData.lastValue = Common.isBlank(apiData.PREVIOUS_PRICE) ? apiData.PREVIOUS_PRICE : apiData.PREVIOUS_PRICE + apiData.UNIT;//前值
          dbData.value = Common.isBlank(apiData.ACTUAL_PRICE) ? apiData.ACTUAL_PRICE : apiData.ACTUAL_PRICE + apiData.UNIT;//公布值
          dbData.year = year;
          dbData.positiveItem = "";
          dbData.negativeItem = "";
          dbData.level = "";
          dbData.url = "";
          dbData.date = date;
          dbData.time = time;
          dbData.unit = apiData.UNIT;
          dbData.interpretation = detailData.PIC_INTERPRET;
          dbData.publishOrg = detailData.PUBLISH_ORG;
          dbData.publishFrequncy = publishFT.frequncy;
          dbData.statisticMethod = "";//detailData.PARAGHRASE;
          dbData.explanation = detailData.PARAGHRASE;
          dbData.influence = fx678FinanceService.getInfluence(apiData.ACTUAL_PRICE, apiData.SURVEY_PRICE, apiData.Res);//apiData.influence;
          dbData.nextPublishTime = publishFT.nextTime;
          dbData.valid = 1;
          deferred.resolve(dbData);
        }
      };
      fx678FinanceService.getDetailFromFx678(apiData.ID, cbFn);
    }
    return deferred.promise;
  },

  /**
   * 通过API数据刷新财经大事数据
   * @param type
   * @param dbEvent
   * @param apiEvent
   * @returns {*}
   */
  refreshEvent : function(type, dbEvent, apiEvent){
    if(!dbEvent){
      dbEvent = {};
    }
    let date , time;
    if(apiEvent.EVENT_TIME){
      date = apiEvent.EVENT_TIME.substring(0, 10);
      time = apiEvent.EVENT_TIME.substring(11, 19);
    }
    dbEvent.status     = "";
    dbEvent.type       = type;
    dbEvent.country    = apiEvent.COUNTRY;
    dbEvent.region     = apiEvent.AREA;
    dbEvent.importance = Common.parseInt(apiEvent.IMPORTANCE);
    dbEvent.content    = apiEvent.EVENT_DESC;
    dbEvent.title      = apiEvent.EVENT_DESC;
    dbEvent.link       = "";
    dbEvent.date       = date;
    dbEvent.time       = time;
    return dbEvent;
  },

  /**
   * 直接更新数据库里面的数据
   * @param results
   */
  updateDataFn: function(results){
    var compareFn = function(dataDb, dataApi){
      return dataDb && dataApi && dataDb.basicIndexId == dataApi.ID;
    };
    var dataDbIndex, isPush=false;
    //ADP、非农、CPI、PPI、PCE、GDP、议息、LMCI
    let name = '', nameHas = false;
    var currDate = new Date(), currDateStr = Common.formatterDate(currDate,'-');
    let dataForUpdateInDB = [], dataDbIndexInDB = [];
    results.api.forEach(item => {
      dataDbIndex = Common.searchIndexArray(results.db, item, compareFn);
      if(dataDbIndex != -1){
        dataDbIndexInDB.push(dataDbIndex);
        dataForUpdateInDB.push(item);
      }
    });
    let updateToDB = function(dataApi, dataDbIndex){
      let dataDb = results.db[dataDbIndex];
      results.db[dataDbIndex] = null; //标记已经处理
      name = dataDb.name.toUpperCase();
      nameHas =  name.indexOf('ADP') > -1 || name.indexOf('CPI') > -1
          || name.indexOf('PPI') > -1 || name.indexOf('PCE') > -1
          || name.indexOf('GDP') > -1 || name.indexOf('LMCI') > -1
          || name.indexOf('非农') > -1 || name.indexOf('议息') > -1 /*|| name.indexOf('美元') > -1*/;
      isPush = dataDb && dataDb.date == currDateStr && dataDb.value != dataApi.value && dataDb.country == '美国' && nameHas;
      fx678FinanceService.refreshData(dataDb, dataApi).then(newDataDB => {
        newDataDB.description = fx678FinanceService.getDescription(dataDb);
        newDataDB.updateDate = currDate;
        if(newDataDB.valid == 2){
          //汇通数据接口删除数据后，valid为2; 重新添加数据后，valid再次修正为1
          newDataDB.valid = 1;
        }
        newDataDB.save(function(err){
          if(err){
            Logger.error("importDataFromFx678 <<1<< 保存财经数据出错: " + err);
          }
        });
        if(isPush){
          fx678FinanceService.pushFinanceData(newDataDB);
        }
      });
      //数据更新的直接用现有数据更新描述，不需要查询配置信息，因为配置更新的时候会更新所有数据
    };
    dataForUpdateInDB.forEach(function(dataApi, i){
      updateToDB(dataApi, dataDbIndexInDB[i]);
    });
  },
  /**
   * 根据列表中的ID取财经日历详情
   * @param results
   * @return {*}
   */
  importDataFn : function(results){
    let deferred = new Deferred();
    var compareFn = function(dataDb, dataApi){
      return dataDb && dataApi && dataDb.basicIndexId == dataApi.ID;
    };
    var dataDbIndex;
    var newDatas = [];
    var currDate = new Date();
    let dataForDB = [];
    let dataForUpdateInDB = [];
    results.api.forEach(item => {
      dataDbIndex = Common.searchIndexArray(results.db, item, compareFn);
      if(dataDbIndex == -1){
        dataForDB.push(item);
      } else {
        dataForUpdateInDB.push(item);
      }
    });
    Async.each(dataForDB, function(dataApi, cb){
      dataDbIndex = Common.searchIndexArray(results.db, dataApi, compareFn);
      if(dataDbIndex == -1){
        //接口新数据
        fx678FinanceService.refreshData(null, dataApi)
        .then(dbData => {
          dbData.createDate = currDate;
          dbData.updateDate = currDate;
          newDatas.push(dbData);
          cb();
        }).catch(e => {
          cb(e);
        });
      }
    }, function(err){
      if(err){
        deferred.reject(err);
       return;
      }
      deferred.resolve(newDatas);
    });
    return deferred.promise;
  },

  /**
   * 保存财经日历数据及配置信息
   * @param configs
   * @param newDatas
   * @param callbackTmp
   */
  saveDataAndConfig: function(configs, newDatas, callbackTmp){
    var newConfigs = [];
    var configTmp = null;
    var description = null;
    var newDataTmp = null;
    var currDate = new Date(), currDateStr = Common.formatterDate(currDate,'-');
    for(var i = 0, lenI = newDatas.length; i < lenI; i++){
      newDataTmp = newDatas[i];
      if(configs.hasOwnProperty(newDataTmp.basicIndexId)){
        configTmp = configs[newDataTmp.basicIndexId];
        description = configTmp.description;
        description = description.replace(/,/g, "_U_U_U,") + "_U_U_U";
        newDataTmp.importanceLevel = configTmp.importanceLevel;
        newDataTmp.description     = description;
        newDataTmp.description     = fx678FinanceService.getDescription(newDataTmp);
        newDataTmp.valid           = configTmp.valid;
        newDataTmp.dataType        = configTmp.dataType;
      }else{
        newDataTmp.importanceLevel = fx678FinanceService.getDefImportanceLevel(newDataTmp.importance); //默认重要等级
        newDataTmp.dataType = 0; //默认数据类型
        newDataTmp.valid = 1; //默认有效性
        newDataTmp.description = fx678FinanceService.getDescription(newDataTmp);
        //不存在配置，自动新增一个默认配置
        configTmp = {};
        configTmp._id             = newDataTmp.basicIndexId;
        configTmp.country         = newDataTmp.country;
        configTmp.createDate      = currDate;
        configTmp.dataType        = newDataTmp.dataType;
        configTmp.description     = "WH_ZX"; //默认是外汇正向
        configTmp.importanceLevel = newDataTmp.importanceLevel;
        configTmp.name            = newDataTmp.name;
        configTmp.updateDate      = currDate;
        configTmp.valid           = newDataTmp.valid;
        newConfigs.push(configTmp);
        configs[configTmp._id] = configTmp;
      }
      //ADP、非农、CPI、PPI、PCE、GDP、议息、LMCI
      let name = newDataTmp.name.toUpperCase();
      let nameHas = name.indexOf('ADP') > -1 || name.indexOf('CPI') > -1
          || name.indexOf('PPI') > -1 || name.indexOf('PCE') > -1
          || name.indexOf('GDP') > -1 || name.indexOf('LMCI') > -1
          || name.indexOf('非农') > -1 || name.indexOf('议息') > -1 /*|| name.indexOf('美元') > -1*/;
      let isPush = newDataTmp.date == currDateStr && Common.isValid(newDataTmp.value) && newDataTmp.country == '美国' && nameHas;
      if(isPush){
        fx678FinanceService.pushFinanceData(newDataTmp);
      }
    }
    //批量保存配置信息
    fx678FinanceService.saveDataCfgs(newConfigs, function(errCfgs){
      if(errCfgs){
        Logger.error("importDataFromFx678 <<批量保存财经数据配置出错: " + errCfgs);
      }
      //批量保存财经数据
      fx678FinanceService.saveDatas(newDatas, function(errDatas){
        if(errDatas){
          Logger.error("importDataFromFx678 <<批量保存财经数据出错: " + errDatas);
        }
        callbackTmp(null);
      });
    });
  },

  /**
   * 从fx678获取财经日历数据并更新到本地数据库
   * @param dates
   * @param callback
   */
  importDataFromFx678 : function(dates, callback){
    let _this = this;
    if(!dates || (dates instanceof Array && dates.length == 0)){
      callback(true);
      return;
    }
    dates = typeof dates === "string" ? [dates] : dates;
    //从汇通API中获取最新财经数据
    Async.forEach(dates, function(dateTmp, callbackTmp){
      Async.parallel({
        api : function(cbFn){
          //从接口获取当日财经日历
          fx678FinanceService.getDataFromFx678(dateTmp, cbFn);
        },
        db : function(cbFn){
          //从数据库获取当日财经日历
          fx678FinanceService.queryDataList(dateTmp, cbFn);
        }
      }, function(err, results) {
        if (err) {
          //获取数据出错，中断当前日期数据更新
          callbackTmp(null);
          return;
        }
        _this.importDataFn(results)
        .then(newDatas => {
          if(newDatas.length == 0){
            callbackTmp(null);
            return;
          }
          //批量保存新增财经数据
          _this.getDataConfigs(newDatas, function(configs){
            _this.saveDataAndConfig(configs, newDatas, callbackTmp);
          });
        })
        .catch(e => {
          Logger.error(e);
        });
        /*var currDate = new Date();
        //针对所有未处理数据库中的财经数据，状态标记
        results.db.forEach(dbItem => {
          if(dbItem && dbItem.valid == 1){
            //金汇接口删除数据，valid设置为2，但是针对于mis设置无效数据，则不修改该值
            dbItem.valid = 2;
            dbItem.updateDate = currDate;
            dbItem.save(function(err){
              if(err){
                Logger.error("importDataFromFx678 <<2<< 保存财经数据出错: " + err);
              }
            });
          }
        });*/
        _this.updateDataFn(results);
      });
    }, function(err){
      if(err){
        Logger.error("importDataFromFx678 << " + err);
      }
      callback(true);
    });
  },

  /**
   * 从fx678获取财经事件并更新到本地数据库
   * @param dates
   * @param type 1、假期预告 2、国债发行预告 3、财经大事
   * @param callback
   */
  importEventFromFx678 : function(dates, type, callback){
    if(!dates || (dates instanceof Array && dates.length == 0)){
      callback(true);
      return;
    }
    dates = typeof dates === "string" ? [dates] : dates;
    let insertDbType = '1';
    switch (type){
      case '1':
        insertDbType = '3';
        break;
      case '2':
        insertDbType = '2';
        break;
      case '3':
        insertDbType = '1';
        break;
    }
    Async.forEach(dates, function(dateTmp, callbackTmp){
      Async.parallel({
        api : function(cbFn){
          //从接口获取当日财经事件
          fx678FinanceService.getEventFromFx678(dateTmp, type, cbFn);
        },
        db : function(cbFn){
          //从数据库获取当日财经事件
          fx678FinanceService.queryEventList(dateTmp, insertDbType, cbFn);
        }
      }, function(err, results){
        if(err){
          //获取数据出错，中断当前日期数据更新
          callbackTmp(null);
          return;
        }
        var compareFn = function(eventDb, eventApi){
          return eventDb
              && eventDb.type == insertDbType
              && eventDb.title == eventApi.EVENT_DESC;
        };
        var i, lenI, eventApi, eventDbIndex, eventDb;
        var newEvents = [];
        var currDate = new Date();
        for(i = 0, lenI = !results.api ? 0 : results.api.length; i < lenI; i++){
          eventApi = results.api[i];
          eventDbIndex = Common.searchIndexArray(results.db, eventApi, compareFn);
          if(eventDbIndex == -1){
            //接口新数据
            eventDb = fx678FinanceService.refreshEvent(insertDbType, null, eventApi);
            eventDb.valid = 1;
            eventDb.importanceLevel = fx678FinanceService.getDefImportanceLevel(eventDb.importance);
            eventDb.dataType = 0;
            eventDb.createDate = currDate;
            eventDb.updateDate = currDate;
            newEvents.push(eventDb);
          }else{
            eventDb = results.db[eventDbIndex];
            results.db[eventDbIndex] = null; //标记已经处理
            eventDb = fx678FinanceService.refreshEvent(type, eventDb, eventApi);
            eventDb.updateDate = currDate;
            if(eventDb.valid == 2){
              //汇通数据接口删除数据后，valid为2; 重新添加数据后，valid再次修正为1
              eventDb.valid = 1;
            }
            eventDb.save(function(err){
              if(err){
                Logger.error("importEventFromFx678 <<1<<保存财经大事出错: " + err);
              }
            });
          }
        }
        //针对所有未处理数据库中的财经大事，状态标记
        /*for(i = 0, lenI = !results.db ? 0 : results.db.length; i < lenI; i++){
          eventDb = results.db[i];
          if(eventDb != null && eventDb.valid == 1){
            //汇通接口删除数据，valid设置为2，但是针对于mis设置无效数据，则不修改该值
            eventDb.valid = 2;
            eventDb.updateDate = currDate;
            eventDb.save(function(err){
              if(err){
                Logger.error("importEventFromFx678 <<2<<保存财经大事出错: " + err);
              }
            });
          }
        }*/
        //批量保存财经数据
        fx678FinanceService.saveEvents(newEvents, function(err){
          if(err){
            Logger.error("importEventFromFx678 <<批量保存财经大事出错: " + err);
          }
          callbackTmp(null);
        });
      });
    }, function(err) {
      if(err){
        Logger.error("importEventFromFx678 << " + err);
      }
      callback(true);
    });
  },
  /**
   * 推送财经日历数据
   * @param type
   * @param data
   */
  pushFinanceData:function(data){
    noticeService.send('financeData', {'review' : null, 'finance' : data});
  },

  /**
   * 推送到APP
   * @param data
   * @param reviewData
   */
  pushToApps : function(data, reviewData){
    var pushObj = {
      dataid : 0,
      lang : "zh",
      title : data.country + data.name,
      content : "",
      type : "2#5",
      channel : "PCUI:2|WEBUI:2|IPHONE:3|ANDROID:3",
      toclient : "*", //全部设备
      sendtime : "",  //立即发送
      url : ""
    };
    if(!reviewData){// 公布数据
      pushObj.content = "预期值:" + (data.predictValue || "--") + "; "
          + "前值:" + (data.lastValue || "--") + "; "
          + "公布值:" + (data.value || "--") + "。";
    }else{// 点评数据
      pushObj.content = "预期值:" + (data.predictValue || "--") + "、 "
          + "前值:" + (data.lastValue || "--") + "、 "
          + "公布值:" + (data.value || "--") + "; "
          + (data.userName || "") + "点评:"
          + (data.comment || "") + "。";
    }
    if(pushObj.content){
      //TODO 推送给Android
      noticeService.pushToApps("andrapp", pushObj, function(isOk, resultObj){});
    }
  }
};

//导出服务类
module.exports =fx678FinanceService;