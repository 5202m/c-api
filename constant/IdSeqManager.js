/**
 * 序列号<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月16日 <BR>
 * Description :<BR>
 * <p>
 *     序列号管理器，请注意与pm_mis中的IdSeq.java保持一致。
 * </p>
 */

var IdSeqModel = require('../models/idSeq.js');
var Utils = require('../util/Utils.js');

var CHAR_ARRAY = ['A', 'B', 'C', 'D',
    'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ];

var IdSeq = function(name, prefix, startNum){
    /**名称*/
    this.name = name;

    /**前缀*/
    this.prefix = prefix;

    /**起始值*/
    this.startNum = startNum;
};

/**
 * 生成一个序列号
 *  请注意此方法和pm_mis中com.gwghk.mis.common.dao.MongoDBBaseDao.getNextSeqId方法逻辑保持一致。
 * @param idSeq '{_id : string, seq : number}'
 * @param callback (err, seq)
 */
var getSeq = function(idSeq, callback){
    var loc_date = Utils.dateFormat(new Date(), "yyMMdd");
    var jobNo = Utils.accMod(idSeq.seq, (CHAR_ARRAY.length * this.startNum));
    var charArrayIndex = Utils.numToInt(Utils.accDiv(jobNo, this.startNum));
    var loc_result = this.prefix
        + loc_date
        + CHAR_ARRAY[charArrayIndex]
        + (Utils.accMod(jobNo, this.startNum + this.startNum)).toString().substring(1);
    callback(null, loc_result);
};

/**
 * 生成一个序列号
 *  请注意此方法和pm_mis中com.gwghk.mis.common.dao.MongoDBBaseDao.getNextSeqId方法逻辑保持一致。
 * @param idSeq '{_id : string, seq : number}'
 * @param callback (err, seq)
 */
var getSeqOnly = function(idSeq, callback){
    var loc_date = Utils.dateFormat(new Date(), "yyMMdd");
    var jobNo = Utils.accMod(idSeq.seq, (CHAR_ARRAY.length * this.startNum));
    var charArrayIndex = Utils.numToInt(Utils.accDiv(jobNo, this.startNum));
    var loc_result = this.prefix
        + charArrayIndex
        + (Utils.accMod(jobNo, this.startNum + this.startNum)).toString().substring(1);
    callback(null, loc_result);
};

/**获取下一个序列值*/
IdSeq.prototype.getNextSeqId = function(callback,isHasPrefix){
    var loc_this = this;
    IdSeqModel.findOneAndUpdate({'_id' : this.name}, {'$inc' : {'seq' : 1}}, {'new' : true}, function(err, idSeq){
        if(err){
            callback(err, null);
            return;
        }
        if(idSeq != null){
            if(isHasPrefix){
                getSeqOnly.call(loc_this, idSeq, callback);
            }else{
                getSeq.call(loc_this, idSeq, callback);
            }
        }else{
            new IdSeqModel({
                _id : loc_this.name,
                seq : loc_this.startNum
            }).save(function(err, idSeq){
                    if(err){
                        callback(err, null);
                        return;
                    }
                    if(isHasPrefix){
                        getSeqOnly.call(loc_this, idSeq, callback);
                    }else{
                        getSeq.call(loc_this, idSeq, callback);
                    }
                });
        }
    });
};

//导出类
module.exports = {
    User                  : new IdSeq("User", "U", 1000000),
    Role                  : new IdSeq("Role", "R", 1000000),
    Menu                  : new IdSeq("Menu", "M", 1000000),
    Log                   : new IdSeq("Log", "L", 1000000),
    Dict                  : new IdSeq("Dict", "D", 1000000),
    AppCategory           : new IdSeq("AppCategory", "AC", 1000000),
    App                   : new IdSeq("App", "AP", 1000000),
    Advertisement         : new IdSeq("Advertisement", "AD", 1000000),
    Account               : new IdSeq("Account", "AC", 1000000),
    Category              : new IdSeq("Category", "", 1),
    Article               : new IdSeq("Article", "", 10000000),
    ChatGroupRule         : new IdSeq("ChatGroupRule", "CGR", 1000),
    TokenAccess           : new IdSeq("TokenAccess", "TA", 1000000),
    Product               : new IdSeq("Product", "PD", 1000000),
    SubjectType           : new IdSeq("SubjectType", "ST", 1000000),
    Topic                 : new IdSeq("Topic", "TP", 1000000),
    Reply                 : new IdSeq("Reply", "RP", 1000000),
    FinanceProductSetting : new IdSeq("FinanceProductSetting", "FPS", 1000000),
    FinanceTradeOrder     : new IdSeq("FinanceTradeOrder", "FTO", 1000000),
    FinancePosition       : new IdSeq("FinancePosition", "FP", 1000000),
    FinanceTradeRecord    : new IdSeq("FinanceTradeRecord", "FTR", 1000000),
    FinanceQuotaRecord    : new IdSeq("FinanceQuotaRecord", "FQR", 1000000),
    PushMessage    : new IdSeq("PushMessage", "PM", 1000000)
};