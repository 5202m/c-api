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
var Common = require('../util/common');
var ChatPoints = require('../models/chatPoints.js');
var ChatPointsConfig = require('../models/chatPointsConfig.js');
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
    getPointsInfo : function(groupType, userId, hasJournal, callback){
        chatPointsService.getChatPoints(groupType, userId, function(err, pointsInfo){
            if(err || !pointsInfo){
                callback(null);
            }else{
                var result = pointsInfo.toObject();
                delete result["isDeleted"];
                if(!hasJournal){
                    delete result["journal"];
                }else{
                    var journals = result["journal"],journal,journalArr=[];
                    for(var i = 0, lenI = journals == null ? 0 : journals.length; i < lenI; i++){
                        journal = journals[i];
                        if(journal.isDeleted != 1){
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
    getChatPoints : function(groupType, userId, callback){
        APIUtil.DBFindOne(ChatPoints, {
            query : {
                groupType : groupType,
                userId : userId,
                isDeleted : 0
            }
        }, function(err, config){
            if(err){
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
    getConfig : function(item, groupType, callback){
        APIUtil.DBFindOne(ChatPointsConfig, {
            query : {
                item : item,
                groupType : groupType,
                isDeleted : 0,
                status : 1
            }
        }, function(err, config){
            if(err){
                logger.error("<<getConfig:查询积分配置信息出错，[errMessage:%s]", err);
            }
            callback(err, config);
        })
    },

    /**
     * 添加积分
     * @param params {{groupType:String, userId:String, item:String, val:Number, isGlobal:Boolean, remark:String, opUser:String, opIp:String}}
     * @param callback
     */
    add : function(params, callback){
        if(!params.groupType || !params.userId || !params.item){
            callback(APIUtil.APIResult("code_1000", null));
            return;
        }
        params.opUser = params.opUser || params.userId;
        chatPointsService.getConfig(params.item, params.groupType, function(err, config){
            if(err){
                callback(APIUtil.APIResult("code_10", null));
            }else if(!params.val && !config){
                callback(APIUtil.APIResult("积分配置信息不存在！", null));
            }else{
                chatPointsService.getChatPoints(params.groupType, params.userId, function(err, pointsInfo){
                    if(err){
                        callback(APIUtil.APIResult("code_10", null));
                    }else{
                        chatPointsService.savePoints(pointsInfo, config, params, callback);
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
    savePoints : function(pointsInfo, config, params, callback){
        if(!pointsInfo){
            pointsInfo = new ChatPoints({
                "_id" : new ObjectId(),
                "groupType" : params.groupType,
                "userId" : params.userId,
                "pointsGlobal" : 0,
                "points" : 0,
                "remark" : "",
                "isDeleted" : 0,
                "journal" : [],
                "createUser" : params.opUser,
                "createIp" : params.opIp,
                "createDate" : new Date(),
                "updateUser" : params.opUser,
                "updateIp" : params.opIp,
                "updateDate" : new Date()
            });
        }else if(!pointsInfo.journal){
            pointsInfo.journal = [];
        }
        var journal = {
            "_id" : new ObjectId(),
            "item" : params.item,
            "before" : 0,
            "change" : params.val,
            "after" : 0,
            "opUser" : params.opUser,
            "date" : new Date(),
            "remark" : params.remark,
            "isDeleted" : 0
        };
        var chkResult = chatPointsService.checkLimit(config, pointsInfo, journal);
        if(chkResult){
            journal.before = pointsInfo.points;
            if(params.isGlobal || journal.change > 0){
                pointsInfo.pointsGlobal += journal.change;
            }
            pointsInfo.points += journal.change;
            journal.after = pointsInfo.points;
            pointsInfo.journal.push(journal);
            pointsInfo.save(function(err) {
                if (err) {
                    //保存信息失败，不影响短信发送，仅打印错误日志。
                    logger.error("保存积分信息错误, error：" + err);
                    callback(APIUtil.APIResult("code_10", null));
                }else{
                    callback(APIUtil.APIResult(null, true));
                }
            });
        }else{
            callback(APIUtil.APIResult("积分已达上限!", null));
        }
    },

    /**
     * 上限检查
     * @param config
     * @param pointsInfo
     * @param journal
     */
    checkLimit : function(config, pointsInfo, journal){
        if(!config){//积分配置不存在
            if(journal.change){
                return true; //指定积分值，有效
            }else{
                return false; //不指定积分值，无效
            }
            return;
        }
        var result = true;
        var loc_val = journal.change || config.val;
        if(loc_val + pointsInfo.points < 0){ //有效积分不足
            result = false;
        }else if(!config.limitUnit){ //无上限
            result = true;
        }else if(config.limitVal < 0){ //上限值小于0
            result = false;
        }else{
            var limitDate = chatPointsService.getLimitDate(config.limitUnit);
            var statistics = chatPointsService.statisticsPoints(pointsInfo, journal.item, limitDate);
            switch(config.limitUnit){
                case "A":
                case "B":
                    if(statistics.val + loc_val > config.limitVal){
                        result = false;
                    }
                    break;
                case "C":
                case "D":
                    if(statistics.cnt >= config.limitVal){
                        result = false;
                    }
                    break;
                default :
                    result = false;
            }
        }
        if(result){
            journal.change = loc_val;
        }
        return result;
    },

    /**
     * 获取限制开始时间
     */
    getLimitDate : function(limitUnit){
        var result = null;
        switch(limitUnit){
            case "A":
            case "C":
                result = false;
                break;

            case "B":
            case "D":
                var now = new Date();
                result = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;

            default :
                result = false;
        }
        return result;
    },

    /**
     * 统计积分
     * @param pointsInfo
     * @param item
     * @param date
     */
    statisticsPoints : function(pointsInfo, item, date){
        var result = {
            val : 0,
            cnt : 0
        };
        var journals = pointsInfo && pointsInfo.journal;
        var journal = null;
        for(var i = journals == null ? -1 : journals.length - 1; i >= 0; i--){
            journal = journals[i];
            if(journal.item == item && (!date || journal.date > date)){
                result.val += journal.change;
                result.cnt ++;
            }
        }
        return result;
    }
};

//导出服务类
module.exports =chatPointsService;