var chatShowTrade = require('../models/chatShowTrade'); //引入chatShowTrade数据模型
var logger = require('../resources/logConf').getLogger('showTradeService'); //引入log4js
var chatPraiseService = require('../service/chatPraiseService'); //引入chatPraiseService
var userService = require('../service/userService'); //引入chatPraiseService
var chatService = require('../service/chatService'); //引入chatService
var constant = require('../constant/constant'); //引入constant
var common = require('../util/common'); //引入common类
var ObjectId = require('mongoose').Types.ObjectId;
var async = require('async'); //引入async
var ApiResult = require('../util/ApiResult');
var errorMessage = require('../util/errorMessage');
/**
 * 晒单服务类
 * 备注：查询各分析师的晒单数据
 * author Dick.guo
 */
var showTradeService = {

    /**
     * 查询分析师晒单数据
     * @param groupType
     * @param userNo 如果有多个分析师，只取第一个
     * @param callback
     */
    getShowTrade: function(params, callback) {
        let groupType = params.groupType,
            userNo = params.userNo,
            systemCategory = params.systemCategory;
        userNo = userNo.replace(/,.*$/g, "");
        chatShowTrade.find({
            "boUser.userNo": userNo,
            "groupType": groupType,
            "valid": 1,
            "tradeType": 1,
            "systemCategory": systemCategory
        }).sort({ "sorted": -1, "showDate": -1 }).exec("find", function(err, data) {
            if (err) {
                logger.error("查询晒单数据失败!>>getShowTrade:", err);
                callback(null);
                return;
            }
            var result = null;
            if (data && data.length > 0) {
                result = {
                    analyst: data[0].toObject().boUser,
                    tradeList: []
                };
                var tradeInfo = null;
                for (var i = 0, lenI = data.length; i < lenI; i++) {
                    tradeInfo = data[i].toObject();
                    delete tradeInfo["boUser"];
                    result.tradeList.push(tradeInfo);
                }
                if (result.analyst) {
                    result.analyst.praiseNum = 0;
                    chatPraiseService.getPraiseNum({
                        userId: result.analyst.userNo,
                        type: constant.chatPraiseType.user,
                        platfrom: groupType,
                        systemCategory: systemCategory
                    }, function(rows) {
                        if (rows && rows.length > 0) {
                            result.analyst.praiseNum = rows[0].praiseNum;
                        }
                        callback(result);
                    });
                    return;
                }
            }
            callback(result);
        });
    },
    /**
     * 查询指定条数数据
     * @param params
     * @param callback
     */
    getShowTradeList: function(params, callback) {
        var searchObj = {
            "groupType": params.groupType,
            "valid": 1,
            "status": 1,
            "tradeType": 2
        };
        if (common.isValid(params.userNo)) {
            searchObj = {
                "groupType": params.groupType,
                "valid": 1,
                "tradeType": (params.tradeType ? params.tradeType : 2),
                "boUser.userNo": params.userNo
            };
            if (common.isValid(params.status)) {
                searchObj.status = params.status;
            }
        }
        if (common.isValid(params.skipLimit)) {
            callback(null);
            return;
        }
        common.wrapSystemCategory(searchObj, params.systemCategory);
        async.waterfall([
                function(callbackTmp) {
                    let results = {};
                    var from = (params.pageNo - 1) * params.pageSize;
                    var orderByJsonObj = { "sorted": 'desc', "showDate": 'desc' };
                    chatShowTrade.find(searchObj)
                        .sort(orderByJsonObj)
                        .skip(from)
                        .limit(params.pageSize)
                        .exec("find", function(err, data) {
                            if (err) {
                                logger.error("查询晒单数据失败! >>getShowTradeList:", err);
                                callbackTmp(null, null);
                                return;
                            }
                            var result = { tradeList: [] };
                            if (data && data.length > 0) {
                                var tradeInfo = null;
                                for (var i = 0, lenI = data.length; i < lenI; i++) {
                                    tradeInfo = data[i].toObject();
                                    tradeInfo.user = data[i].boUser.toObject();
                                    delete tradeInfo["boUser"];
                                    result.tradeList.push(tradeInfo);
                                }
                            }
                            results.list = result;
                            callbackTmp(null, results);
                        });
                },
                function(results, callbackTmp) {
                    if (searchObj.tradeType === 1) {
                        callbackTmp(null, results);
                        return;
                    }
                    if (!results.list) {
                        callbackTmp(null, results);
                        return;
                    }
                    let mobilePhoneArray = results.list.tradeList.map(item => item.user.telephone);
                    userService.getMemberListByMobilePhones({
                        groupType: params.groupType,
                        systemCategory: params.systemCategory,
                        mobilePhones: mobilePhoneArray
                    }).then(rows => {
                        rows.forEach(row => {
                            let trades = results.list.tradeList.filter(item => item.user.telephone === row.mobilePhone);
                            if (!trades) {
                                logger.debug("Didn't find any tradeList mathced rows with mobilePhone: ",
                                    row.mobilePhone);
                                return;
                            }
                            trades.forEach(trade => {
                                trade.user.userName = row.loginPlatform.chatUserGroup[0].nickname || trade.user.userName || "";
                                trade.user.avatar = row.loginPlatform.chatUserGroup[0].avatar || trade.user.avatar || "";
                            });
                        });
                        callbackTmp(null, results);
                    }).catch(e => {
                        logger.debug(e);
                        callbackTmp(null, results);
                    });
                },
                function(results, callbackTmp) {
                    chatShowTrade.find(searchObj).count(function(err, rowNum) {
                        results.totalSize = rowNum;
                        callbackTmp(null, results);
                    });
                }
            ],
            function(err, results) {
                if (params.pageNo) {
                    callback(ApiResult.page(params.pageNo, params.pageSize, results.totalSize, results.list ? results.list.tradeList : []));
                } else {
                    callback(results.list);
                }
            }
        );
    },
    /**
     * 新增晒单
     * @param params
     * @param callback
     */
    addShowTrade: function(params, callback) {
        if (common.isBlank(params.userNo)) { // 为App而做的，根据手机号码自动生成一个UserId。
            let userId = common.isValid(params.telePhone) ? common.formatMobileToUserId(params.telePhone) : '';
            if (common.isValid(userId) && params.userNo != userId) {
                params.userNo = userId;
            }
        }

        var insertModel = {
            _id: null,
            groupType: params.groupType, //聊天室组别
            boUser: {
                _id: null, //userId
                userNo: params.userNo, //userNo
                avatar: params.avatar, //头像
                userName: params.userName, //分析师姓名
                telephone: params.telePhone, //手机号
                wechatCode: '', //分析师微信号
                wechatCodeImg: '', //分析师微信二维码
                winRate: '' //分析师胜率
            },
            showDate: new Date(), //晒单时间
            tradeImg: params.tradeImg, //晒单图片
            profit: '', //盈利
            remark: params.remark, //心得
            valid: 1, //是否删除 1-有效 0-无效
            updateDate: new Date(),
            createUser: params.userName,
            createIp: params.Ip,
            createDate: new Date(),
            title: params.title, //标题
            tradeType: params.tradeType, //类别：1 分析师晒单，2 客户晒单
            status: 0, //状态：0 待审核， 1 审核通过， -1 审核不通过
            praise: 0 //点赞数
        };
        common.wrapSystemCategory(insertModel, params.systemCategory);
        new chatShowTrade(insertModel).save(function(err, trade, updateNumber) {
            if (err) {
                logger.error("保存晒单数据失败! >>addShowTrade:", err);
                callback({ isOK: false, msg: '晒单失败' });
            } else {
                callback({ isOK: true, msg: updateNumber + '个晒单成功' });
            }
        });
    },
    /**
     * 更新点赞数
     * @param params
     * @param callback
     */
    setShowTradePraise: function(params, callback) {
        var searchObj = { _id: params.praiseId };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        chatService.checkChatPraise(params, function(isOK) {
            if (isOK) {
                chatShowTrade.findOne(searchObj, function(err, row) {
                    if (err) {
                        logger.error("查询数据失败! >>setShowTradePraise:", err);
                        callback({ isOK: false, error: errorMessage.code_2025 }); //callback({isOK: false, msg: '点赞失败'});
                    } else {
                        if (common.isBlank(row.praise)) {
                            row.praise = 1;
                        } else {
                            row.praise += 1;
                        }
                        var setObj = { '$set': { 'praise': row.praise } };
                        chatShowTrade.findOneAndUpdate(searchObj, setObj,
                            function(err1, row1) {
                                if (err1) {
                                    logger.error(
                                        'setShowTradePraise=>fail!' + err1);
                                    callback({ isOK: false, error: errorMessage.code_2025 }); //callback({isOK: false, msg: '点赞失败'});
                                } else {
                                    callback({ isOK: true, error: null }); //callback({isOK: true, msg: '点赞成功'});
                                }
                            });
                    }
                });
            } else {
                callback({ isOK: false, error: errorMessage.code_5004 }); //callback({isOK: false, msg: '当天只能点赞一次'});
            }
        });
    },
    /**
     * 根据晒单id查询晒单数据
     * @param tradeIds
     * @param callback
     */
    getShowTradeByIds: function(params, callback) {
        let tradeIds = params["tradeIds"].split(",");
        var searchObj = { _id: { $in: tradeIds } };
        common.wrapSystemCategory(searchObj, params.systemCategory);
        chatShowTrade.find(searchObj, function(err, rows) {
            if (err) {
                logger.error('查询数据失败！>>getShowTradeByIds:', err);
                callback(null);
            } else {
                callback(rows);
            }
        });
    },

    /**
     * 添加评论
     * @param id
     * @param userInfo
     * @param content
     * @param refId
     * @param callback
     */
    addComments: function(params) {
        let id = params.id,
            userInfo = params.userInfo,
            content = params.content,
            refId = params.refId;
        let defferred = new common.Deferred();
        let queryObj = {
            _id: id
        };
        common.wrapSystemCategory(queryObj, params.systemCategory);
        chatShowTrade.findOne(
            queryObj,
            function(err, row) {
                if (err || !row) {
                    logger.error("查询数据失败! >>addComments:", err);
                    defferred.reject({ isOK: false, msg: '评论失败' });
                } else {
                    if (!row.comments) {
                        row.comments = [];
                    }
                    var comment = {
                        _id: new ObjectId(),
                        userId: userInfo.mobilePhone || "",
                        userName: userInfo.nickname || "",
                        avatar: userInfo.avatar || "",
                        content: content || "",
                        dateTime: new Date(),
                        refId: refId || "",
                        valid: 1
                    };
                    row.comments.push(comment);
                    row.save(function(err) {
                        if (err) {
                            logger.error("保存数据失败! >>addComments:", err);
                            defferred.reject({ isOK: false, msg: '评论失败' });
                        } else {
                            defferred.resolve({ isOK: true });
                        }
                    });
                }
            });
        return defferred.promise;
    }
};
//导出服务类
module.exports = showTradeService;