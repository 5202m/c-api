/**
 * 积分信息管理<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年9月14日 <BR>
 * Description :<BR>
 * <p>
 *
 * </p>
 */
var logger = require('../resources/logConf').getLogger("chatPointsService");
var ChatPoints = require('../models/chatPoints.js');
var ChatPointsConfig = require('../models/chatPointsConfig.js');
var Constant = require('../constant/constant.js');
var APIUtil = require('../util/APIUtil');
var ObjectId = require('mongoose').Types.ObjectId;

var chatPointsService = {
    /**
     * 查询一个用户积分信息
     * @param groupType
     * @param userId
     * @param hasJournal
     * @param callback
     */
    getPointsInfo: function(groupType, userId, hasJournal, callback) {
        chatPointsService.getChatPoints(groupType, userId, function(err, pointsInfo) {
            if (err || !pointsInfo) {
                callback(null);
            } else {
                var result = pointsInfo.toObject();
                delete result["isDeleted"];
                if (!hasJournal) {
                    delete result["journal"];
                } else {
                    var journals = result["journal"],
                        journal, journalArr = [];
                    for (var i = 0, lenI = journals == null ? 0 : journals.length; i < lenI; i++) {
                        journal = journals[i];
                        if (journal.isDeleted != 1) {
                            journal.date = journal.date instanceof Date ? journal.date.getTime() : 0;
                            delete journal["isDeleted"];
                            journalArr.push(journal);
                        }
                    }
                    result["journal"] = journalArr;
                }
                delete result["createUser"];
                delete result["createIp"];
                delete result["createDate"];
                delete result["updateUser"];
                delete result["updateIp"];
                delete result["updateDate"];
                callback(result);
            }
        });
    },

    /**
     * 查询一个用户积分信息
     * @param groupType
     * @param userId
     * @param callback (err, config)
     */
    getChatPoints: function(groupType, userId, callback) {
        APIUtil.DBFindOne(ChatPoints, {
            query: {
                groupType: groupType,
                userId: userId,
                isDeleted: 0
            }
        }, function(err, config) {
            if (err) {
                logger.error("<<getConfig:查询积分配置信息出错，[errMessage:%s]", err);
            }
            callback(err, config);
        })
    },

    /**
     * 查询一个积分配置信息
     * @param item
     * @param groupType
     * @param callback (err, config)
     */
    getConfig: function(item, groupType, clientGroup, callback) {
        ChatPointsConfig.findOne({
            query: {
                item: item,
                groupType: groupType,
                clientGroup: {
                    $in: [clientGroup]
                },
                isDeleted: 0,
                status: 1
            }
        }, function(err, config) {
            if (err) {
                logger.error("<<getConfig:查询积分配置信息出错，[errMessage:%s]", err);
                callback(APIUtil.APIResult("code_3003", null));
            }
            callback(err, config);
        });
    },

    /**
     * 添加积分
     * @param params {{groupType:String, clientGroup:String, userId:String, item:String, val:Number, isGlobal:Boolean, remark:String, opUser:String, opIp:String}}
     * @param callback
     */
    add: function(params, callback) {
        if (!params.groupType || !params.userId || !params.item ||
            !params.clientGroup) {
            callback(APIUtil.APIResult("code_1000", null));
            return;
        }
        params.opUser = params.opUser || params.userId;
        chatPointsService.getConfig(params.item, params.groupType,
            params.clientGroup,
            function(err, config) {
                if (err) {
                    callback(APIUtil.APIResult("code_10", null));
                } else if (!config) {
                    callback(APIUtil.APIResult("code_3003", null));
                } else {
                    chatPointsService.getChatPoints(params.groupType,
                        params.userId,
                        function(err, pointsInfo) {
                            if (err) {
                                callback(APIUtil.APIResult("code_10", null));
                            } else {
                                chatPointsService.savePoints(
                                    pointsInfo, config, params,
                                    callback);
                            }
                        });
                }
            });
    },

    /**
     * 保存积分流水
     * @param pointsInfo
     * @param config
     * @param params
     * @param callback
     */
    savePoints: function(pointsInfo, config, params, callback) {
        if (!pointsInfo) {
            pointsInfo = new ChatPoints({
                "_id": new ObjectId(),
                "groupType": params.groupType,
                "userId": params.userId,
                "pointsGlobal": 0,
                "points": 0,
                "remark": "",
                "isDeleted": 0,
                "journal": [],
                "createUser": params.opUser,
                "createIp": params.opIp,
                "createDate": new Date(),
                "updateUser": params.opUser,
                "updateIp": params.opIp,
                "updateDate": new Date()
            });
        } else if (!pointsInfo.journal) {
            pointsInfo.journal = [];
        }
        var journal = {
            "_id": new ObjectId(),
            "item": params.item,
            "tag": params.tag,
            "before": 0,
            "change": params.val,
            "after": 0,
            "opUser": params.opUser,
            "date": new Date(),
            "remark": params.remark,
            "isDeleted": 0
        };
        var rate = 1;
        if (params.clientGroup &&
            Constant.pointsRate.hasOwnProperty(params.groupType) &&
            Constant.pointsRate[params.groupType].hasOwnProperty(params.clientGroup)) {
            rate = Constant.pointsRate[params.groupType][params.clientGroup];
        }
        var chkResult = chatPointsService.checkLimit(config, pointsInfo, journal, rate);
        if (journal.change == 0) {
            //积分变化为0不记录积分流水
            callback(APIUtil.APIResult(null, journal));
        } else if (!chkResult) {
            journal.before = pointsInfo.points;
            if (params.isGlobal || journal.change > 0) {
                pointsInfo.pointsGlobal += journal.change;
            }
            pointsInfo.points += journal.change;
            journal.after = pointsInfo.points;
            if (config && config.tips && !journal.remark) {
                journal.remark = config.tips;
            }
            pointsInfo.journal.push(journal);
            pointsInfo.save(function(err) {
                if (err) {
                    //保存信息失败，不影响短信发送，仅打印错误日志。
                    logger.error("保存积分信息错误, error：" + err);
                    callback(APIUtil.APIResult("code_10", null));
                } else {
                    callback(APIUtil.APIResult(null, journal));
                }
            });
        } else {
            callback(APIUtil.APIResult(chkResult, null));
        }
    },

    /**
     * 上限检查
     * @param config
     * @param pointsInfo
     * @param journal
     * @param rate
     */
    checkLimit: function(config, pointsInfo, journal, rate) {
        if (!config) { //积分配置不存在
            journal.change = 0;
            return null;
        }
        var result = null;
        var loc_val = journal.change || config.val;
        if (loc_val < 0) {
            loc_val = Math.round(loc_val * rate);
        }
        if (loc_val + pointsInfo.points < 0) { //有效积分不足
            result = "code_3004";
        } else if (!config.limitUnit) { //无上限
            result = null;
        } else if (config.limitVal < 0) { //上限值小于0
            result = "code_3001";
        } else {
            var limitDate = chatPointsService.getLimitDate(config.limitUnit);
            var statistics = chatPointsService.statisticsPoints(pointsInfo, config, journal, limitDate);
            switch (config.limitUnit) {
                case "A":
                case "B":
                    if (statistics.val + loc_val > config.limitVal) {
                        result = "code_3001";
                    }
                    break;
                case "C":
                case "D":
                    if (statistics.cnt >= config.limitVal) {
                        result = "code_3001";
                    }
                    break;
                default:
                    result = "code_3001";
            }
        }
        if (!result) {
            journal.change = loc_val;
        }
        return result;
    },

    /**
     * 获取限制开始时间
     */
    getLimitDate: function(limitUnit) {
        var result = null;
        switch (limitUnit) {
            case "A":
            case "C":
                result = false;
                break;

            case "B":
            case "D":
                var now = new Date();
                result = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;

            default:
                result = false;
        }
        return result;
    },

    /**
     * 统计积分
     * @param pointsInfo
     * @param config
     * @param journal
     * @param date
     */
    statisticsPoints: function(pointsInfo, config, journal, date) {
        var item = journal.item;
        var checkTag = config.limitArg == "tag";
        var tag = journal.tag;
        var result = {
            val: 0,
            cnt: 0
        };
        var journals = pointsInfo && pointsInfo.journal;
        var journal = null;
        for (var i = journals == null ? -1 : journals.length - 1; i >= 0; i--) {
            journal = journals[i];
            if (journal.item == item && (!date || journal.date > date) && (!checkTag || journal.tag == tag)) {
                result.val += journal.change;
                result.cnt++;
            }
        }
        return result;
    },

    /**
     * 查询积分配置表
     * @param usrInfo
     * @param callback
     */
    getChatPointsConfig: function(params, callback) {
        var searchObj = { "groupType": params.groupType, "type": params.type, "item": params.item, isDeleted: 0, status: 1 };
        if (params.item instanceof Array) {
            searchObj = { "groupType": params.groupType, "type": params.type, "item": { $in: params.item }, isDeleted: 0, status: 1 };
        }
        ChatPointsConfig.find(searchObj, "", function(err, row) {
            if (err) {
                logger.error("获取积分配置表失败! >>getChatPointsConfig:", err);
                callback(null);
            } else {
                if (params.item instanceof Array) {
                    callback(row);
                } else {
                    callback(row[0]);
                }
            }
        })
    }
};

//导出服务类
module.exports = chatPointsService;