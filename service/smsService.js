/**
 * 短信信息管理<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年10月28日 <BR>
 * Description :<BR>
 * <p>
 *
 * </p>
 */
var SmsInfo = require('../models/smsInfo.js');
var ObjectId = require('mongoose').Types.ObjectId;

var smsService = {
    /**
     * 增加短信记录信息
     * @param smsInfoObj
     * @param callback
     */
    add: function (smsInfoObj, callback) {
        var loc_smsInfo = new SmsInfo({
            _id: new ObjectId(),
            type: !smsInfoObj.type ? "NORMAL" : smsInfoObj.type,
            useType: smsInfoObj.useType,
            mobilePhone: smsInfoObj.mobilePhone,
            content: smsInfoObj.content,
            status: smsInfoObj.status,
            sendTime: new Date()
        });
        loc_smsInfo.save(callback);
    }
};

//导出服务类
module.exports =smsService;