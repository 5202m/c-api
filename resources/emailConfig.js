/**
 * 邮件配置信息
 */
var emailConfig = {
    /**发送服务器配置*/
    sendServer : {
        studio : {
            host: "smtp.qq.com",
            secure: true,
            port: 465,
            auth: {
                user: "2807001686@qq.com",
                pass: "opkyukikffwfdfed"
            }
        },
        fxstudio : {
            host: "smtp.qq.com",
            secure: true,
            port: 465,
            auth: {
                user: "2807001686@qq.com",
                pass: "opkyukikffwfdfed"
            }
        },
        hxstudio : {
            host: "smtp.qq.com",
            secure: true,
            port: 465,
            auth: {
                user: "2807001686@qq.com",
                pass: "opkyukikffwfdfed"
            }
        }
    }
};

/** 邮件发送服务器配置 */
emailConfig.configs = {
    //PM
    studio : {
        server : emailConfig.sendServer.studio,
        from : "PM直播间<2807001686@qq.com>",
        to : "370419450@qq.com",//"expert@24k.hk",
        subject: function(data){
            return "[PM直播间]专家邮箱:" + (data.email || "");
        },
        template : "email/studio"
    },
    //PM email valid
    studioEmail : {
        server :emailConfig.sendServer.studio,
        from : "PM直播间<2807001686@qq.com>",
        to : '',//"370419450@qq.com",//"expert@24k.hk",
        subject: function(data){
            return "[PM直播间]邮箱验证:" + (data.email || "");
        },
        template : "email/studioEmail"
    },
    //PM 直播提醒
    studioSubscribeSyllabus : {
        server :emailConfig.sendServer.studio,
        from : "PM直播间<2807001686@qq.com>",
        to : '',//"370419450@qq.com",//"expert@24k.hk",
        subject: function(data){
            return "[PM直播间]直播提醒:[" + data.startTime + "-" + data.endTime + "]" + (data.title || "");
        },
        template : "email/studioSubscribeSyllabus"
    },
    //FX
    fxstudio : {
        server : emailConfig.sendServer.fxstudio,
        from : "FX直播间<2807001686@qq.com>",
        to : "370419450@qq.com",//"expert@gwfx.com",
        subject: function(data){
            return "[FX直播间]专家邮箱:" + (data.email || "");
        },
        template : "email/fxstudio"
    },
    //HX
    hxstudio : {
        server : emailConfig.sendServer.hxstudio,
        from : "HX直播间<2807001686@qq.com>",
        to : "370419450@qq.com",//"expert@hx9999.com",
        subject: function(data){
            return "[HX直播间]专家邮箱:" + (data.email || "");
        },
        template : "email/hxstudio"
    }
};

/**获取配置*/
emailConfig.get = function(key){
    if(!key || !this.configs.hasOwnProperty(key)){
        return null;
    }
    return this.configs[key];
};
//导出配置
module.exports = emailConfig;

