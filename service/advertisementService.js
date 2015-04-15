/**
 * 摘要：广告Service服务类
 * author:Gavin.guo
 * date:2015/4/15
 */
var advertisement = require('../models/advertisement');	//引入advertisement数据模型
var commonJs = require('../util/common'); 	 	//引入公共的js

/**
 * 定义广告Service类
 */
var advertisementService = {
    /**
     * 功能：获取对应平台的广告
     * @param platform   平台
     */
    getAdvertisementByPlatform : function(platform,callback){
    	advertisement.findById(platform ,function (err,advertisement) {
            if(err!=null){
                callback(null);
            }
            callback(advertisement);
        });
    }
}

//导出服务类
module.exports = advertisementService;

