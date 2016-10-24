/**
 *
 * Created by Alan.wu on 2015/4/18.
 */
var config = {
    redisUrlObj:{ host: '192.168.35.236', port: 6379 },				//链接redis缓存客户端连接
    webUiUrl:'http://192.168.9.72:5555/webui_login_token.ucs',//webUI对应token地址
    web24kPriceUrl:'http://www.24k.hk/public/datas/24k_price.xml',
    gwApiUrl:'https://192.168.35.236:8443/GwAPI_SIT/restweb',//gwApi地址
    smsUrl : {
        pm : 'http://192.168.35.86:4448/SMS_Channel_Send.ucs?phone=${phone}&content=${content}&catalog=others&platform=24K',
        fx : 'http://192.168.75.27:4447/SMS_Channel_Send.ucs?phone=${phone}&content=${content}&catalog=others&platform=FX&country=China',
        hx : 'http://192.168.75.27:4467/SMS_Channel_Send.ucs?phone=${phone}&content=${content}&catalog=others&platform=HX'
    },
    utm : {
        smsUrl : "http://testweboa.gwfx.com:8088/GwUserTrackingManager_NEW/smsTemplate/send", //http://das.gwfx.com/smsTemplate/send
        emailUrl : "http://testweboa.gwfx.com:8088/GwUserTrackingManager_NEW/emailTemplate/send", //http://das.gwfx.com/emailTemplate/send
        fxstudio : {
            sid : "fa573c78eaa8402cb6c84dabfcce7158",
            token : "8867af2616da47d7927ff0df7ea60668"
        },
        studio : {
            sid : "fa573c78eaa8402cb6c84dabfcce7159",
            token : "8867af2616da47d7927ff0df7ea60669"
        }
    },
    //图片等文件访问域名
    filesDomain: 'http://192.168.35.91:8090',
    uploadBasePath :'upload',
    pmfilesRootPath : '/web/pm_files',
    uploadUseFtp : false,
    //FTP上传
    uploadTempPath : "/web/pm_api/upload",
    filesFtpHost : "192.168.35.91",
    filesFtpPort : 21,
    filesFtpUser : "pmmisftpuser",
    filesFtpBasePath : "/",
    filesFtpPWD : "pmmisftppwd123",
    //db
    dbURL:'mongodb://192.168.35.236/pm_mis',
    dbUserName:'pmmisuser',
    dbUserPWD:'pmmispwd123',
    messagePush : {appKey:'c139eac92b28b05be7d54d95',masterSecret:'bf11c36cdc35a7b52ee1131e'}, //消息推送
    fxgoldApiUrl: "http://api.fxgold.com",  //金汇财经接口
    web24k: "http://www.24k.hk/public/datas", //24k数据公用host前缀
    fx678ApiUrl:"http://unews.fx678.com"
};
//导出常量类
module.exports =config;

