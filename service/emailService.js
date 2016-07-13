/**
 * 邮件服务类<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年04月11日 <BR>
 * Description :<BR>
 * <p>
 *  邮件服务类：自动化发送电子邮件
 * </p>
 */
var Logger = require('../resources/logConf').getLogger("emailService");
var Nodemailer = require("nodemailer");
var EmailConfig = require('../resources/emailConfig');
var ApiResult = require('../util/ApiResult');

var emailService = {
    /**邮件发送器缓存*/
    transporters : {},

    /**
     * 发送邮件
     * @param key 邮件类型配置
     * @param data
     * @param callback
     */
    send : function(key, data, callback){
        var config = EmailConfig.get(key);
        if(!config){
            callback(ApiResult.result("邮件配置信息不存在：" + key, false));
            return;
        }
        var mailOps = {
            from : config.from,
            to : config.to,
            subject: config.subject,
            template : config.template,
            data : data || {}
        };
        emailService.preSend(key, config.server, mailOps, callback);
    },

    /**
     * 准备发送电子邮件
     * @param key
     *    配置信息key值，用做transporter缓存key
     * @param server
     *      host - 发件服务器，"smtp.126.com"
     *      secure - 是否使用SSL，true/false
     *      port - 发件服务器端口，25/645
     *      auth
     *          user - 发件人邮箱 "flying_l@126.com"
     *          pass - 发件人密码 "XXXXXXXXX"
     * @param mailOptions
     *      from - 发件人，必须包含发件人地址，"flying_l@126.com"/"Flying_L<flying_l@126.com>"
     *      to - 收件人地址列表，多个使用分号号分隔， "370419450@qq.com;flying_l@126.com"
     *      template - 邮件模板，如果该字段为空，直接使用配置发送，否则使用模板配置发送， "studio",
     *      data - 渲染模板文件所需要的数据， {name:flying_l, accountNo:"123456"}
     *      subject - 邮件主题，可以是一个function(data)，"这是一封测试邮件"
     *      text - 邮件文本内容， "这是邮件的文本内容。"
     *      html - 邮件html内容，如果同时存在text，则以html内容为准。 "<p>这是邮件的html内容。</p>"
     *      attachments - 附件数组，可多种方式，具体请参考官方文档， [{filename: "EmailService", path :"D:/workspaces/workspace4.4/pm_api_2f/service/emailService.js"}]
     * @param callback
     */
    preSend : function(key, server, mailOptions, callback){
        if(!mailOptions){
            Logger.error("preSend >> mail options is not defined!");
            callback(ApiResult.result("邮件信息不完整！", false));
            return;
        }
        var transporter = emailService.getTransporter(key, server);
        if(typeof mailOptions.subject == "function"){
            mailOptions.subject = mailOptions.subject.apply(mailOptions, [mailOptions.data]);
        }
        if(mailOptions.template){
            var temp = mailOptions.template;
            delete mailOptions.template;
            var data = mailOptions.data;
            delete mailOptions.data;
            require('../app').render(temp, data, function(err, html){
                if(err){
                    Logger.error("preSend >> send email error:" + err);
                    callback(ApiResult.result("加载邮件模板出错！", false));
                    return;
                }
                else{
                    mailOptions.html = html;
                    emailService.doSend(transporter, mailOptions, callback);
                }
            });
        }else{
            emailService.doSend(transporter, mailOptions, callback);
        }
    },

    /**
     * 获取transporter
     * @param key
     * @param server
     * @returns {*}
     */
    getTransporter : function(key, server){
        var result = null;
        if(key){
            if(emailService.transporters.hasOwnProperty(key)){
                result = emailService.transporters[key];
            }else{
                result = Nodemailer.createTransport(server);
                emailService.transporters[key] = result;
            }
        }else{
            result = Nodemailer.createTransport(server);
        }
        return result;
    },

    /**
     * 发送邮件
     * @param transporter
     * @param mailOps
     * @param callback
     */
    doSend : function(transporter, mailOps, callback){
        transporter.sendMail(mailOps, function(error, info){
            if(error){
                Logger.error("doSend >> send email error:" + error, info);
                callback(ApiResult.result("发送邮件错误！", false));
                return;
            }
            callback(ApiResult.result(null, true));
        });
    }
};

//导出服务类
module.exports =emailService;