/**
 * 邮件配置信息
 */
var emailConfig = {
    /** 邮件发送服务器配置 */
    configs : {
        //PM
        studio : {
            server :{
                host: "smtp.qq.com",
                secure: true,
                port: 465,
                auth: {
                    user: "2807001686@qq.com",
                    pass: "opkyukikffwfdfed"
                }
            },
            from : "PM直播间<2807001686@qq.com>",
            to : "370419450@qq.com",//"expert@24k.hk",
            subject: function(data){
                return "[PM直播间]专家邮箱:" + (data.email || "");
            },
            template : "email/studio"
        },
        //FX
        fxstudio : {
            server :{
                host: "smtp.qq.com",
                secure: true,
                port: 465,
                auth: {
                    user: "2807001686@qq.com",
                    pass: "opkyukikffwfdfed"
                }
            },
            from : "FX直播间<2807001686@qq.com>",
            to : "370419450@qq.com",//"expert@gwfx.com",
            subject: function(data){
                return "[FX直播间]专家邮箱:" + (data.email || "");
            },
            template : "email/fxstudio"
        },
        //HX
        hxstudio : {
            server :{
                host: "smtp.qq.com",
                secure: true,
                port: 465,
                auth: {
                    user: "2807001686@qq.com",
                    pass: "opkyukikffwfdfed"
                }
            },
            from : "HX直播间<2807001686@qq.com>",
            to : "370419450@qq.com",//"expert@hx9999.com",
            subject: function(data){
                return "[HX直播间]专家邮箱:" + (data.email || "");
            },
            template : "email/hxstudio"
        },
        //PM email valid
        studioEmail : {
            server :{
                host: "smtp.qq.com",
                secure: true,
                port: 465,
                auth: {
                    user: "2807001686@qq.com",
                    pass: "opkyukikffwfdfed"
                }
            },
            from : "PM直播间<2807001686@qq.com>",
            to : '',//"370419450@qq.com",//"expert@24k.hk",
            subject: function(data){
                return "[PM直播间]邮箱验证:" + (data.email || "");
            },
            template : "email/studioEmail"
        }
    },
    /**获取配置*/
    get : function(key){
        if(!key || !this.configs.hasOwnProperty(key)){
            return null;
        }
        return this.configs[key];
    }
};
//导出配置
module.exports = emailConfig;

