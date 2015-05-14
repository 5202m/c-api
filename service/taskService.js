var Schedule = require("node-schedule");//引入定时器
var tokenService=require("../service/tokenService");//引入tokenService
/** 任务服务类
 * Created by Alan.wu on 2015/3/4.
 */
var taskService = {
    /**
     * 开启任务
     */
    start:function(){
       this.autoDestoryToken();//注销过期的token值
    },
    /**
     * 自动注销过期的token值
     */
    autoDestoryToken:function(){
        var rule = new Schedule.RecurrenceRule();
        rule.hour=0;
        rule.minute=0;
        rule.second=0;
        var j = Schedule.scheduleJob(rule, function(){
            console.log("系统开始自动执行任务==>每天零点自动注销过期的token值!");
            tokenService.destroyToken(new Date(),function(isOk){
                if(isOk){
                    console.log("自动注销过期的token值==》执行成功！");
                }else{
                    console.log("自动注销过期的token值==》执行失败！");
                }
            });
        });
    }
};
//导出服务类
module.exports =taskService;

