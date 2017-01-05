/**
 *
 * Created by Alan.wu on 2015/4/18.
 */
var config = {
    redisUrlObj:{ host: '192.168.35.236', port: 6379 },				//链接redis缓存客户端连接
    pmApiUrl:'http://localhost:3000/api',
    webUiUrl:'http://192.168.9.72:5555/webui_login_token.ucs',//webUI对应token地址
    web24kPriceUrl:'http://www.24k.hk/public/datas/24k_price.xml',
    gwApiUrl:'https://192.168.35.236:8443/GwAPI_SIT',//gwApi地址
    gwApiOauthKeys : {
        "web24k" : "YHJK786sdbbmkyusd",
        "pcui"   : "kldgdfjdYUiOPweQ",
        "webui"  : "RTyPgdsebdsedzjkl",
        "iphapp" : "Nmjjsd85ftiozwd12",
        "andrapp": "95HjbwtyzhkHDfg7L"
    },
    smsUrl : {
        pm : 'http://192.168.35.86:4448/SMS_Channel_Send.ucs?phone=${phone}&content=${content}&catalog=others&platform=24K',
        fx : 'http://192.168.75.27:4447/SMS_Channel_Send.ucs?phone=${phone}&content=${content}&catalog=others&platform=FX&country=China',
        hx : 'http://192.168.75.27:4467/SMS_Channel_Send.ucs?phone=${phone}&content=${content}&catalog=others&platform=HX'
    },
    utm : {
        smsUrl : "http://testweboa.gwfx.com:8070/das_web/smsTemplate/send", //http://dmp.gwghk.com/smsTemplate/send
        emailUrl : "http://testweboa.gwfx.com:8070/das_web/emailTemplate/send", //http://dmp.gwghk.com/emailTemplate/send
        cstGroupUrl : "http://testweboa.gwfx.com:8070/das_web/customerGroup/updateCustomer", //http://dmp.gwghk.com/customerGroup/updateCustomer
        studio : {
            sid : "fa573c78eaa8402cb6c84dabfcce7159",
            token : "8867af2616da47d7927ff0df7ea60669"
        },
        fxstudio : {
            sid : "fa573c78eaa8402cb6c84dabfcce7158",
            token : "8867af2616da47d7927ff0df7ea60668"
        },
        hxstudio : {
            sid : "fa573c78eaa8402cb6c84dabfcce7160",
            token : "8867af2616da47d7927ff0df7ea60670"
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
    fx678ApiUrl:"http://unews.fx678.com",
    noticeSocketClient:"http://localhost:3007", // socket客户端
    socketServerUrl:{webSocket:'http://192.168.35.81:3007',socketIO:'http://192.168.35.81:3007',apiSocket:'http://192.168.35.91:3007'},
    chatSocketUrl:'http://192.168.35.81:3007',  //socket 服务api地址
    symbolLongShortOpenPositionRatios: "http://192.168.75.40:8081/GwfxApi/RESTful/PublicManager" // 多空持仓比例
};
//导出常量类
module.exports =config;

