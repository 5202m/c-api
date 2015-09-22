/**
 * 媒体信息<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月16日 <BR>
 * Description :<BR>
 * <p>
 *     媒体信息服务类
 *     1.广告列表
 * </p>
 */
var Article = require('../models/article.js');
var APIUtil = require('../util/APIUtil.js');
var CommonJS = require('../util/common.js');
var Config=require('../resources/config.js');

var mediaService = {
    /**
     * 获取媒体列表
     * @param categoryId 媒体类型
     * @param platform   应用平台
     * @param callback
     */
    getList : function(categoryId, platform, callback){
        var loc_timeNow = new Date();
        APIUtil.DBFind(Article, {
            query : {
                "categoryId" : categoryId,
                "platform": CommonJS.getSplitMatchReg(platform),
                "status" : 1,
                "valid": 1,
                "publishStartDate" : {$lte : loc_timeNow},
                "publishEndDate" : {$gte : loc_timeNow}
            },
            sortAsc : ['sequence'],
            fieldEx : ["_id"]
        }, function(err, medias){
            if(err){
                console.error("查询媒体列表信息失败!", err);
                callback(APIUtil.APIResult("code_2020", null, null));
                return;
            }
            var loc_medias = [];
            var loc_media = null;
            for(var i = 0, lenI = medias == null ? 0 : medias.length; i < lenI; i++){
                loc_media = medias[i].toObject();
                loc_media.mediaUrl = loc_media.mediaUrl;
                loc_media.mediaPath = loc_media.mediaUrl;
                loc_media.publishStartDate = loc_media.publishStartDate.getTime();
                loc_media.publishEndDate = loc_media.publishEndDate.getTime();
                loc_medias.push(loc_media);
            }
            callback(APIUtil.APIResult(null, loc_medias, null));
        });
    }
};

module.exports = mediaService;

