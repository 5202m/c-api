/**
 * 摘要：媒体Service服务类
 * author:Alan.wu
 * date:2015/7/3
 */
var media = require('../models/media');	//引入advertisement数据模型
var common = require('../util/common');       //引入公共的js
/**
 * 定义媒体Service类
 */
var mediaService = {
    /**
     * 功能：获取对应平台的媒体
     * @param platform   平台
     */
    getMediaByPlatform : function(categoryId,platform,lang,callback){
        var currDate=new Date(),searchObj={};
        if(common.isBlank(lang)){
            searchObj = {valid:1,platform:eval('/'+platform+'/'),categoryId : categoryId,status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
        }else{
            searchObj = {valid:1,platform:eval('/'+platform+'/'),categoryId: categoryId,'detailList.lang' : lang,status:1,publishStartDate:{"$lte":currDate},publishEndDate:{"$gte":currDate}};
        }
        media.find(searchObj,'categoryId mediaUrl mediaImgUrl linkUrl detailList.$',function(err,rows){
            callback(rows);
        });
    }
};

//导出服务类
module.exports = mediaService;

