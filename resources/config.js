/**
 *
 * Created by Alan.wu on 2015/4/18.
 */
var config = {
    studioThirdUsed:{//第三方引用直播间默认房间
        platfrom:'webui,app',
        groupType:'studio',
        roomId:'studio_market'
    },
    redisUrlObj:{ host: '192.168.35.236', port: 6379 },				//链接redis缓存客户端连接
    webUiUrl:'http://192.168.9.72:5555/webui_login_token.ucs',//webUI对应token地址
    web24kPriceUrl:'http://www.24k.hk/public/datas/24k_price.xml',
    gwApiUrl:'https://192.168.35.236:8443/GwAPI_SIT/restweb',//gwApi地址
    smsUrl : 'http://192.168.35.136:5555',                  //短信地址
    //图片等文件访问域名
    filesDomain: 'http://192.168.35.91:8090',
    uploadBasePath :'upload',
    pmfilesRootPath : 'D:/workspaces/workspace4.4/pm_api',
    //FTP上传
    uploadTempPath : "D:/workspaces/workspace4.4/pm_api",
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
    fxgoldApiUrl: "http://api.fxgold.com"  //金汇财经接口
};
//导出常量类
module.exports =config;

