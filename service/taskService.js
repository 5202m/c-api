var logger = require('../resources/logConf').getLogger("taskService");
var Schedule = require("node-schedule");//引入定时器
var tokenService=require("../service/tokenService");//引入tokenService
var ZxFinanceService = require("../service/zxFinanceService.js");//引入zxFinanceService
var SyllabusService = require("../service/syllabusService.js");//引入syllabusService
var SubscribeService = require("../service/subscribeService.js");//引入subscribeService
var Fx678FinanceService = require("../service/fx678FinanceService.js");//引入fx678FinanceService
var Utils = require('../util/Utils'); //引入工具类js

/** 任务服务类
 * Created by Alan.wu on 2015/3/4.
 */
var taskService = {
    /**
     * 开启任务
     */
    start:function(){
        logger.info("系统启动==>加载定时任务配置！");
        //this.autoDestoryToken();//自动注销过期的token值
        this.autoFinanceDataFromFx678();//this.autoFinanceData();  //财经日历
        this.autoFinanceEventFromFx678();//this.autoFinanceEvent(); //财经事件
        this.bakSyllabus();      //备份课程表
        this.SubscribeSyllabus();//订阅-课程安排
    },
    /**
     * 自动注销过期的token值
     */
    autoDestoryToken:function(){
    	 var rule = new Schedule.RecurrenceRule();
         rule.hour=1;
         rule.minute=0;
         rule.second=0;
         Schedule.scheduleJob(rule, function(){
             logger.info("【定时任务】每天凌晨1点自动注销过期的token值!");
             tokenService.destroyToken(new Date(),function(isOk){
                 if(isOk){
                     logger.info("自动注销过期的token值==》执行成功！");
                 }else{
                     logger.info("自动注销过期的token值==》执行失败！");
                 }
             });
         });
    },

    /**
     * 财经日历——定时从金汇接口更新财经日历数据
     */
    autoFinanceData : function(){
        var hourBefore = [];
        var hourAfter = [];
        for(var i = 0; i < 24; i+=2){
            hourBefore.push(i);
            hourAfter.push(i);
            hourAfter.push(i+1);
        }

        var ruleSpecial = new Schedule.RecurrenceRule();
        ruleSpecial.minute=[0,29,30,59];
        ruleSpecial.second=[5,10,15,25,30,35,45,50,55];
        Schedule.scheduleJob(ruleSpecial, function(){
            logger.info("【定时任务】财经日历:特殊时间段（半点、整点）每5秒更新当天数据!");
            var dateToday = [Utils.dateFormat(new Date(), "yyyy-MM-dd")];
            ZxFinanceService.importDataFromFxGold(dateToday,function(isOK){
                logger.debug("【定时任务】财经日历更新当天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleToday = new Schedule.RecurrenceRule();
        ruleToday.second=[0, 20, 40];
        Schedule.scheduleJob(ruleToday, function(){
            logger.info("【定时任务】财经日历:每半分钟更新当天数据!");
            var dateToday = [Utils.dateFormat(new Date(), "yyyy-MM-dd")];
            ZxFinanceService.importDataFromFxGold(dateToday,function(isOK){
                logger.debug("【定时任务】财经日历更新当天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleBefore = new Schedule.RecurrenceRule();
        ruleBefore.hour=hourBefore;
        ruleBefore.minute=1;
        ruleBefore.second=30;
        Schedule.scheduleJob(ruleBefore, function(){
            logger.info("【定时任务】财经日历:每2小时更新前15天数据信息!");
            var today = new Date().getTime();
            var dateBefore = [];
            for(var i = 1; i <= 15; i++){
                dateBefore.push(Utils.dateFormat(today - i * 86400000, "yyyy-MM-dd"));
            }
            ZxFinanceService.importDataFromFxGold(dateBefore,function(isOK){
                logger.debug("【定时任务】财经日历更新前15天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleAfter = new Schedule.RecurrenceRule();
        ruleAfter.hour=hourAfter;
        ruleAfter.minute=5;
        ruleAfter.second=30;
        Schedule.scheduleJob(ruleAfter, function(){
            logger.info("【定时任务】财经日历:每1小时更新后15天数据信息!");
            var today = new Date().getTime();
            var dateAfter = [];
            for(var i = 1; i <= 15; i++){
                dateAfter.push(Utils.dateFormat(today + (16 - i) * 86400000, "yyyy-MM-dd"));
            }
            ZxFinanceService.importDataFromFxGold(dateAfter,function(isOK){
                logger.debug("【定时任务】财经日历更新后15天数据" + (isOK ? "成功" : "失败"));
            });
        });
    },

    /**
     * 财经事件——定时从金汇接口更新财经事件数据
     */
    autoFinanceEvent : function(){
        var minToday = [];
        var i;
        for(i = 0; i < 60; i+=2){
            minToday.push(i);
        }
        var hourBefore = [];
        var hourAfter = [];
        for(i = 0; i < 24; i+=2){
            hourBefore.push(i);
            hourAfter.push(i);
            hourAfter.push(i+1);
        }

        var ruleToday = new Schedule.RecurrenceRule();
        ruleToday.minute=minToday;
        ruleToday.second=5;
        Schedule.scheduleJob(ruleToday, function(){
            logger.info("【定时任务】财经事件:每2分钟更新当天数据!");
            var dateToday = [Utils.dateFormat(new Date(), "yyyy-MM-dd")];
            ZxFinanceService.importEventFromFxGold(dateToday,function(isOK){
                logger.debug("【定时任务】财经事件更新当天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleBefore = new Schedule.RecurrenceRule();
        ruleBefore.hour=hourBefore;
        ruleBefore.minute=9;
        ruleBefore.second=30;
        Schedule.scheduleJob(ruleBefore, function(){
            logger.info("【定时任务】财经事件:每2小时更新前15天数据信息!");
            var today = new Date().getTime();
            var dateBefore = [];
            for(var i = 1; i <= 15; i++){
                dateBefore.push(Utils.dateFormat(today - i * 86400000, "yyyy-MM-dd"));
            }
            ZxFinanceService.importEventFromFxGold(dateBefore,function(isOK){
                logger.debug("【定时任务】财经事件更新前15天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleAfter = new Schedule.RecurrenceRule();
        ruleAfter.hour=hourAfter;
        ruleAfter.minute=13;
        ruleAfter.second=30;
        Schedule.scheduleJob(ruleAfter, function(){
            logger.info("【定时任务】财经事件:每1小时更新后15天数据信息!");
            var today = new Date().getTime();
            var dateAfter = [];
            for(var i = 1; i <= 15; i++){
                dateAfter.push(Utils.dateFormat(today + (16 - i) * 86400000, "yyyy-MM-dd"));
            }
            ZxFinanceService.importEventFromFxGold(dateAfter,function(isOK){
                logger.debug("【定时任务】财经事件更新后15天数据" + (isOK ? "成功" : "失败"));
            });
        });
    },

    /**
     * 备份课程表
     */
    bakSyllabus : function(){
        var ruleBefore = new Schedule.RecurrenceRule();
        ruleBefore.hour=0;
        ruleBefore.minute=10;
        ruleBefore.second=0;
        Schedule.scheduleJob(ruleBefore, function(){
            logger.info("【定时任务】课程表：每天备份前一天的课程表历史!");
            var date = new Date();
            date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
            SyllabusService.bakSyllabus(date, function(isOK){
                logger.debug("【定时任务】每天备份前一天的课程表历史" + (isOK ? "成功" : "失败"));
            });
        });
    },

    /**
     * 课程安排订阅通知
     * @constructor
     */
    SubscribeSyllabus : function(){
        var ruleBefore = new Schedule.RecurrenceRule();
        ruleBefore.minute=[3, 13, 23, 33, 43, 53];
        ruleBefore.second=12;
        Schedule.scheduleJob(ruleBefore, function(){
            logger.info("【定时任务】课程安排订阅通知：每10分钟检查即将开始的课程安排通知订阅客户!");
            SubscribeService.noticeSyllabus(function(isOK){
                logger.info("【定时任务】发送课程安排通知" + (isOK ? "成功" : "失败"));
            });
        });
    },

    /**
     * 财经日历——定时从汇通接口更新财经日历数据
     */
    autoFinanceDataFromFx678 : function(){
        var hourBefore = [];
        var hourAfter = [];
        for(var i = 0; i < 24; i+=2){
            hourBefore.push(i);
            hourAfter.push(i);
            hourAfter.push(i+1);
        }

        var ruleSpecial = new Schedule.RecurrenceRule();
        ruleSpecial.minute=[0,29,30,59];
        ruleSpecial.second=[5,10,15,25,30,35,45,50,55];
        Schedule.scheduleJob(ruleSpecial, function(){
            logger.info("【定时任务】财经日历[fx678]:特殊时间段（半点、整点）每5秒更新当天数据!");
            var dateToday = [Utils.dateFormat(new Date(), "yyyy-MM-dd")];
            Fx678FinanceService.importDataFromFx678(dateToday,function(isOK){
                logger.debug("【定时任务】财经日历[fx678]更新当天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleToday = new Schedule.RecurrenceRule();
        ruleToday.second=[0, 20, 40];
        Schedule.scheduleJob(ruleToday, function(){
            logger.info("【定时任务】财经日历[fx678]:每半分钟更新当天数据!");
            var dateToday = [Utils.dateFormat(new Date(), "yyyy-MM-dd")];
            Fx678FinanceService.importDataFromFx678(dateToday,function(isOK){
                logger.debug("【定时任务】财经日历[fx678]更新当天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleBefore = new Schedule.RecurrenceRule();
        ruleBefore.hour=hourBefore;
        ruleBefore.minute=1;
        ruleBefore.second=30;
        Schedule.scheduleJob(ruleBefore, function(){
            logger.info("【定时任务】财经日历[fx678]:每2小时更新前15天数据信息!");
            var today = new Date().getTime();
            var dateBefore = [];
            for(var i = 1; i <= 15; i++){
                dateBefore.push(Utils.dateFormat(today - i * 86400000, "yyyy-MM-dd"));
            }
            Fx678FinanceService.importDataFromFx678(dateBefore,function(isOK){
                logger.debug("【定时任务】财经日历[fx678]更新前15天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleAfter = new Schedule.RecurrenceRule();
        ruleAfter.hour=hourAfter;
        ruleAfter.minute=5;
        ruleAfter.second=30;
        Schedule.scheduleJob(ruleAfter, function(){
            logger.info("【定时任务】财经日历[fx678]:每1小时更新后15天数据信息!");
            var today = new Date().getTime();
            var dateAfter = [];
            for(var i = 1; i <= 15; i++){
                dateAfter.push(Utils.dateFormat(today + (16 - i) * 86400000, "yyyy-MM-dd"));
            }
            Fx678FinanceService.importDataFromFx678(dateAfter,function(isOK){
                logger.debug("【定时任务】财经日历[fx678]更新后15天数据" + (isOK ? "成功" : "失败"));
            });
        });
    },

    /**
     * 财经事件——定时从汇通接口更新财 假期预告/国债发行预告/财经大事
     */
    autoFinanceEventFromFx678 : function(){
        var minToday = [];
        var i;
        for(i = 0; i < 60; i+=2){
            minToday.push(i);
        }
        var hourBefore = [];
        var hourAfter = [];
        for(i = 0; i < 24; i+=2){
            hourBefore.push(i);
            hourAfter.push(i);
            hourAfter.push(i+1);
        }

        var ruleToday = new Schedule.RecurrenceRule();
        ruleToday.minute=minToday;
        ruleToday.second=5;
        Schedule.scheduleJob(ruleToday, function(){
            logger.info("【定时任务】假期预告/国债发行预告/财经大事[fx678]:每2分钟更新当天数据!");
            var dateToday = [Utils.dateFormat(new Date(), "yyyy-MM-dd")];
            Fx678FinanceService.importEventFromFx678(dateToday, '1', function(isOK){
                logger.debug("【定时任务】假期预告[fx678]更新当天数据" + (isOK ? "成功" : "失败"));
            });
            Fx678FinanceService.importEventFromFx678(dateToday, '2', function(isOK){
                logger.debug("【定时任务】国债发行预告[fx678]更新当天数据" + (isOK ? "成功" : "失败"));
            });
            Fx678FinanceService.importEventFromFx678(dateToday, '3', function(isOK){
                logger.debug("【定时任务】财经大事[fx678]更新当天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleBefore = new Schedule.RecurrenceRule();
        ruleBefore.hour=hourBefore;
        ruleBefore.minute=9;
        ruleBefore.second=30;
        Schedule.scheduleJob(ruleBefore, function(){
            logger.info("【定时任务】假期预告/国债发行预告/财经大事[fx678]:每2小时更新前15天数据信息!");
            var today = new Date().getTime();
            var dateBefore = [];
            for(var i = 1; i <= 15; i++){
                dateBefore.push(Utils.dateFormat(today - i * 86400000, "yyyy-MM-dd"));
            }
            Fx678FinanceService.importEventFromFx678(dateBefore, '1', function(isOK){
                logger.debug("【定时任务】假期预告[fx678]更新前15天数据" + (isOK ? "成功" : "失败"));
            });
            Fx678FinanceService.importEventFromFx678(dateBefore, '2', function(isOK){
                logger.debug("【定时任务】国债发行预告[fx678]更新前15天数据" + (isOK ? "成功" : "失败"));
            });
            Fx678FinanceService.importEventFromFx678(dateBefore, '3', function(isOK){
                logger.debug("【定时任务】财经大事[fx678]更新前15天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleAfter = new Schedule.RecurrenceRule();
        ruleAfter.hour=hourAfter;
        ruleAfter.minute=13;
        ruleAfter.second=30;
        Schedule.scheduleJob(ruleAfter, function(){
            logger.info("【定时任务】假期预告/国债发行预告/财经大事[fx678]:每1小时更新后15天数据信息!");
            var today = new Date().getTime();
            var dateAfter = [];
            for(var i = 1; i <= 15; i++){
                dateAfter.push(Utils.dateFormat(today + (16 - i) * 86400000, "yyyy-MM-dd"));
            }
            Fx678FinanceService.importEventFromFx678(dateAfter, '1', function(isOK){
                logger.debug("【定时任务】假期预告[fx678]更新后15天数据" + (isOK ? "成功" : "失败"));
            });
            Fx678FinanceService.importEventFromFx678(dateAfter, '2', function(isOK){
                logger.debug("【定时任务】国债发行预告[fx678]更新后15天数据" + (isOK ? "成功" : "失败"));
            });
            Fx678FinanceService.importEventFromFx678(dateAfter, '3', function(isOK){
                logger.debug("【定时任务】财经大事[fx678]更新后15天数据" + (isOK ? "成功" : "失败"));
            });
        });
    }
};

//导出服务类
module.exports =taskService;

