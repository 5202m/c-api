var Request = require("request");

/**
 * 摘要：聊天室相关 API处理类
 * author:alan.wu
 * date:2015/8/7
 */
var redirect4FXAPI = {
    //API URL
    pmApiHost : "pmapi.24k.hk",
    apiUrl4FX : "http://chatapi.gwfx.com",
    fxstudio : "fxstudio",

    /**
     * 按照房间组别判断是否需要转发
     * @param req
     * @param groupType
     * @returns {boolean}
     */
    needRedirect4Fxstudio : function(req, groupType){
        return groupType == redirect4FXAPI.fxstudio
            && req.header("host") == redirect4FXAPI.pmApiHost
    },

    /**跳转*/
    redirect : function(req, res){
        var url = redirect4FXAPI.apiUrl4FX + req.originalUrl;
        if(/^POST$/i.test(req.method)){
            Request.post(url, {form : req.body}).pipe(res);
        }else{
            Request.get(url).pipe(res);
        }
    }
};
module.exports = redirect4FXAPI;
