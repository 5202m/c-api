/**
 * 摘要：APP版本 Service服务类
 * author：Gavin.guo
 * date:2015/9/15
 */
var appVersion = require('../models/appVersion');       //引入app数据模型
var APIUtil = require('../util/APIUtil'); 	 	        //引入API工具类js

var appVersionService = {
    /**
     * 获取对应平台的最新应用版本信息
     */
    getAppVersion : function(platform , callback){
        var searchObj = {
            platform : platform,
            isDeleted : 1
        };
        APIUtil.DBFind(appVersion,
            {
                query : searchObj,
                sortDesc : ['versionNo']
            },
            function (err, appVersions) {
                if(err){
                    console.error("查询应用版本列表失败!", err);
                    callback(APIUtil.APIResult("code_2046", null, null));
                    return;
                }
                var appVersion = appVersions && appVersions.length > 0 ? appVersions[0] : null;
                if(appVersion != null){
                    var tempVersion ={
                        versionNo : appVersion.versionNo,
                        versionName : appVersion.versionName,
                        isMustUpdate : appVersion.isMustUpdate,  //是否强制更新
                        appPath : appVersion.appPath             //下载APP路径
                    }
                    tempVersion.remark = appVersion.remark.replace(new RegExp(/(\r\n)/g),'\n');
                    callback(APIUtil.APIResult(null, tempVersion, null));
                }else{
                    callback(APIUtil.APIResult(null, null , null));
                }
            }
        );
    }
}

//导出服务类
module.exports = appVersionService;

