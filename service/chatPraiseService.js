var chatPraise = require('../models/chatPraise'); //引入chatPraise数据模型
var common = require('../util/common'); //引入common类
var constant = require('../constant/constant'); //引入constant
/**
 * 聊天室点赞服务类
 * 备注：处理聊天室点赞所有信息及其管理
 * author Alan.wu
 */
var chatPraiseService = {
    /**
     * 提取点赞内容
     */
    getPraiseNum: function(params, callback) {
        let userId = params.praiseId,
            type = params.type,
            platform = params.platfrom;
        let searchObj = { praiseType: type, fromPlatform: platform };
        if (common.isValid(userId)) {
            let praiseId = userId.indexOf(',') > -1 ? userId.split(",") : userId;
            searchObj.praiseId = { $in: praiseId };
        }
        common.wrapSystemCategory(searchObj, params.systemCategory);
        chatPraise.find(searchObj, function(err, rows) {
            callback(rows);
        });
    },
    /**
     * 设置点赞
     * @param praiseId
     * @param type
     */
    setPraise: function(params, callback) {
        let praiseId = params.praiseId,
            type = params.type,
            fromPlatform = params.fromPlatform;
        let praiseQueryObj = { praiseId: praiseId, praiseType: type, fromPlatform: fromPlatform };
        common.wrapSystemCategory(praiseQueryObj, params.systemCategory);
        chatPraise.findOne(praiseQueryObj, function(err, row) {
            if (row) {
                row.praiseNum += 1;
                row.save(function(err, rowTmp) {
                    //console.log(err+";rowTmp:"+JSON.stringify(rowTmp));
                    callback({ isOK: true });
                });
            } else {
                var chatPraiseModel = new chatPraise({
                    _id: null,
                    praiseId: praiseId,
                    praiseType: type,
                    fromPlatform: fromPlatform,
                    praiseNum: 1,
                    systemCategory: params.systemCategory
                });
                chatPraiseModel.save(function(err) {
                    console.log('save chatPraiseModel success!');
                    callback({ isOK: true });
                });
            }
        });
    }
};
//导出服务类
module.exports = chatPraiseService;