/**
 * 摘要：点赞Service服务类
 * author:Dick.guo
 * date:2015/8/4
 */
var Topic = require('../models/topic');	                    //引入topic数据模型
var APIUtil = require('../util/APIUtil'); 	 	            //引入API工具类js
var TopicStatisticalService = require('../service/topicStatisticalService.js');

/**
 * 定义点赞Service类
 */
var PraiseService = {
    /**
     * 点赞
     * @param memberId
     * @param topicId
     * @param type 1-帖子 2-文章
     * @param ip
     * @param callback
     */
    doPraise : function(memberId, topicId, type, ip, callback){
        TopicStatisticalService.praise(topicId, type, ip, function(err, data){
            if(err){
                console.error("帖子点赞失败", err);
                callback(APIUtil.APIResult("code_2025", null, null));
                return;
            }
            if(data === null){
                console.error("帖子点赞失败，帖子信息不存在或不允许点赞！");
                callback(APIUtil.APIResult("code_2025", null, null));
                return;
            }
            callback(APIUtil.APIResult(null, null, null));
        });
    }
};

//导出服务类
module.exports = PraiseService;
