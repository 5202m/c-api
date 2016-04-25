var logger = require('../resources/logConf').getLogger("taskService");
var Schedule = require("node-schedule");//引入定时器
var tokenService=require("../service/tokenService");//引入tokenService
var QuotationService = require("../service/quotationService.js");//引入quotationService
var MemberBalanceService = require("../service/memberBalanceService.js");//引入quotationService
var ZxFinanceService = require("../service/zxFinanceService.js");//引入zxFinanceService
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
        //this.autoClearQuotationPredict();//清理行情预测数据，将数据转移到历史表
        //this.autoUpdateMemberBalance();  //自动更新会员统计的相关字段
        //this.autoStatisticMemberRank();  //自动统计会员收益率排名
        this.autoFinanceData();  //财经日历
        this.autoFinanceEvent(); //财经事件
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
     * 清理行情预测数据，将数据转移到历史表
     * 每天 00:00:00
     */
    autoClearQuotationPredict:function(){
        var rule = new Schedule.RecurrenceRule();
        rule.hour=0;
        rule.minute=0;
        rule.second=0;
        Schedule.scheduleJob(rule, function(){
            logger.info("【定时任务】每天0点自动清理行情预测数据(将数据转移到历史表)!");
            QuotationService.clearPredict(function(err, cnt){
                if(err){
                    logger.error("自动清理行情预测数据==>执行失败！", err);
                }else{
                    logger.info("自动清理行情预测数据==>执行成功,共转移%d条数据！", cnt);
                }
            });
        });
    },

    /**
     * 自动更新会员统计的相关字段
     */
    autoUpdateMemberBalance : function(){
        var rule = new Schedule.RecurrenceRule();
        rule.hour=23;
        rule.minute=30;
        rule.second=0;
        Schedule.scheduleJob(rule, function(){
            logger.info("【定时任务】每天23点30自动更新会员统计信息!");
            MemberBalanceService.updateMemberBalance(function(result){
                if(result){
                    logger.info("成功更新会员统计信息！");
                }else{
                    logger.error("更新会员统计信息失败！");
                }
            });
        });
    },

    /**
     * 自动统计会员收益率排名
     * 每月01日 00:10:00
     */
    autoStatisticMemberRank : function(){
        var rule = new Schedule.RecurrenceRule();
        rule.date = 1;
        rule.hour=0;
        rule.minute=10;
        rule.second=0;
        Schedule.scheduleJob(rule, function(){
            logger.info("【定时任务】每月01日 00:10:00自动统计会员收益率排名!");
            MemberBalanceService.rankStatistic(function(err, cnt){
                if(err){
                    logger.error("自动统计会员收益率排名==>执行失败！", err);
                }else{
                    logger.info("自动统计会员收益率排名==>执行成功,共更新%d条数据！", cnt);
                }
            });
        });
    },

    /**
     * 财经日历——定时从金汇接口更新财经日历数据
     */
    autoFinanceData : function(){
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
        ruleToday.second=0;
        Schedule.scheduleJob(ruleToday, function(){
            logger.info("【定时任务】财经日历:每2分钟更新当天数据!");
            var dateToday = [Utils.dateFormat(new Date(), "yyyy-MM-dd")];
            ZxFinanceService.importDataFromFxGold(dateToday,function(isOK){
                logger.debug("【定时任务】财经日历更新当天数据" + (isOK ? "成功" : "失败"));
            });
        });

        var ruleBefore = new Schedule.RecurrenceRule();
        ruleBefore.hour=hourBefore;
        ruleBefore.minute=1;
        ruleBefore.second=0;
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
        ruleAfter.second=0;
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
        ruleToday.second=0;
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
        ruleBefore.second=0;
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
        ruleAfter.second=0;
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
    }
};

//导出服务类
module.exports =taskService;

