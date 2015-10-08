var Schedule = require("node-schedule");//引入定时器
var tokenService=require("../service/tokenService");//引入tokenService
var QuotationService = require("../service/quotationService.js");//引入quotationService
var MemberBalanceService = require("../service/memberBalanceService.js");//引入quotationService

/** 任务服务类
 * Created by Alan.wu on 2015/3/4.
 */
var taskService = {
    /**
     * 开启任务
     */
    start:function(){
        this.autoClearQuotationPredict();//清理行情预测数据，将数据转移到历史表
        this.autoUpdateMemberBalance();  //自动更新会员统计的相关字段
        this.autoStatisticMemberRank();//自动统计会员收益率排名
    },
    /**
     * 自动注销过期的token值
     */
    autoDestoryToken:function(){
    	 var rule = new Schedule.RecurrenceRule();
         rule.hour=1;
         rule.minute=0;
         rule.second=0;
         var j = Schedule.scheduleJob(rule, function(){
             console.log("系统开始自动执行任务==>每天凌晨1点自动注销过期的token值!");
             tokenService.destroyToken(new Date(),function(isOk){
                 if(isOk){
                     console.log("自动注销过期的token值==》执行成功！");
                 }else{
                     console.log("自动注销过期的token值==》执行失败！");
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
            console.log("系统开始自动执行任务==>每天0点自动清理行情预测数据(将数据转移到历史表)!");
            QuotationService.clearPredict(function(err, cnt){
                if(err){
                    console.err("自动清理行情预测数据==>执行失败！", err);
                }else{
                    console.log("自动清理行情预测数据==>执行成功,共转移%d条数据！", cnt);
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
            console.log("系统开始自动执行任务==>每天23点30自动更新会员统计信息!");
            MemberBalanceService.updateMemberBalance(function(result){
                if(result){
                    console.info("成功更新会员统计信息！");
                }else{
                    console.err("更新会员统计信息失败！");
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
            console.log("系统开始自动执行任务==>每月01日 00:10:00自动统计会员收益率排名!");
            MemberBalanceService.rankStatistic(function(err, cnt){
                if(err){
                    console.err("自动统计会员收益率排名==>执行失败！", err);
                }else{
                    console.log("自动统计会员收益率排名==>执行成功,共更新%d条数据！", cnt);
                }
            });
        });
    }
};
//导出服务类
module.exports =taskService;

