/** 用户服务类
 * Created by Alan.wu on 2015/3/4.
 */
const jwt = require('jwt-simple');
const moment = require('moment');
const http = require('http'); //引入http
const common = require('../util/common');
const logger = require('../resources/logConf').getLogger('tokenService'); //引入log4js
const errorMessage = require('../util/errorMessage');
const cacheClient = require('../cache/cacheClient');
const TokenAccess = require('../models/tokenAccess');
const ObjectId = require('mongoose').Types.ObjectId;
const async = require('async'); //引入async

let generateToken = (appId, appSecret, seconds) => {
    let expires = moment().add(seconds, 's').valueOf();
    let token = jwt.encode({
            iss: appId,
            exp: expires
        },
        appSecret
    );
    return token;
};
let verifyAccessToken = (token, appSecret, result) => {
    try {
        let decode = jwt.decode(token, appSecret);
        if (decode.exp < Date.now()) { //expired
            logger.debug("token expired: ", appSecret, token);
            return { isOK: false, error: errorMessage.code_5002 };
        }
        if (decode.iss !== result.appId) {
            logger.debug("token unmatched: ", appSecret, token);
            return { isOK: false, error: errorMessage.code_5001 };
        } else return { isOK: true, appId: result.appId };
    } catch (e) {
        console.error(token, "invalid!");
        return { isOK: false, error: errorMessage.code_5001 };
    }
};

class TokenAccessOnDB {
    constructor() {}
    getAll() {
        let deferred = new common.Deferred();
        TokenAccess.find({ valid: 1, status: 1 })
            .then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    }
    getByQuery(query) {
        let deferred = new common.Deferred();
        query = Object.assign({ valid: 1, status: 1 }, query);
        TokenAccess.find(query).then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    }
    save(model) {
        let currDate = new Date();
        let deferred = new common.Deferred();
        let tokenAccess = new TokenAccess({
            '_id': new ObjectId(),
            'tokenAccessId': 'TokenAccess:' + model.appId + '_' + model.appSecret,
            'platform': model.platform,
            'appId': model.appId,
            'appSecret': model.appSecret,
            'expires': (model.expires !== undefined ? model.expires : 2),
            'valid': 1,
            'status': 1,
            'createUser': model.createUser || "",
            'createIp': model.createIp || "",
            'createDate': model.createDate || currDate,
            'updateUser': model.updateUser || (model.createUser || ""),
            'updateIp': model.updateIp || (model.createIp || ""),
            'updateDate': model.updateDate || currDate,
            'remark': model.remark || ""
        });
        tokenAccess.save().then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    }
    update(model, tokenAccessId) {
        model.tokenAccessId = model.tokenAccessId ? model.tokenAccessId : `TokenAccess:${model.appId}_${model.appSecret}`;
        tokenAccessId = tokenAccessId ? tokenAccessId : model.tokenAccessId;
        let deferred = new common.Deferred();
        let _this = this;
        let updateFieldsByModel = (row) => {
            row = row ? row : {};
            row.platform = model.platform || row.platform;
            row.appId = model.appId || row.appId;
            row.appSecret = model.appSecret || row.appSecret;
            row.tokenAccessId = tokenAccessId;
            row.expires = 'expires' in model ? model.expires : row.expires;
            row.valid = 'valid' in model ? model.valid : row.valid;
            row.status = 'status' in model ? model.status : row.status;
            row.createUser = model.createUser || row.createUser;
            row.createIp = model.createIp || row.createIp;
            row.createDate = model.createDate || row.createDate;
            row.updateUser = model.updateUser || row.updateUser;
            row.updateIp = model.updateIp || row.updateIp;
            row.updateDate = model.updateDate || row.updateDate;
            row.remark = model.remark || row.remark;
            return row;
        };
        this.getByQuery({ tokenAccessId: tokenAccessId })
            .then(row => {
                let isCreate = row.length === 0;
                row = updateFieldsByModel(row[0]);
                if (isCreate) {
                    logger.debug("Saving new token access to DB with tokenAccessId of", tokenAccessId);
                    _this.save(row).then(deferred.resolve).catch(deferred.reject);
                } else {
                    logger.debug("Updating token access with tokenAccessId of", tokenAccessId);
                    row.save().then(deferred.resolve).catch(deferred.reject);
                }
            }).catch(e => {
                logger.error(e);
                deferred.reject(e);
            });
        return deferred.promise;
    }
};

/**
 * 定义token服务类
 */
var tokenService = {

    /**
     * 格式TokenAccessById
     * @param tokenAccessById
     * @returns {string}
     */
    formatTokenAccessById: function(tokenAccessById) {
        if (/^TokenAccess:/.test(tokenAccessById)) {
            return tokenAccessById;
        }
        return 'TokenAccess:' + tokenAccessById;
    },
    /**
     * 格式TokenKey
     * @param token
     * @returns {string}
     */
    formatTokenKey: function(token) {
        return 'token:' + token;
    },
    /**
     * 创建新的TokenAccess
     * @param model
     */
    createTokenAccess: function(model, callback) {
        let tokenAccessOnDB = new TokenAccessOnDB();
        tokenAccessOnDB.save(model)
            .then(() => callback({ isOK: true, error: null }))
            .catch(e => callback({ isOK: false, error: e }));
    },
    /**
     * 更新TokenAccess
     * @param model
     */
    deleteTokenAccess: function(ids, callback) {
        var ids = ids.split(",");
        let tokenAccessOnDB = new TokenAccessOnDB();
        async.eachSeries(ids, function(id, callbackTmp) {
            tokenAccessOnDB.update({ valid: 0, status: 0, tokenAccessId: id })
                .then(() => callbackTmp(true))
                .catch((e) => {
                    logger.error(e);
                    callbackTmp(false);
                });
        }, () => callback({ isOK: true, error: null }));
    },
    /**
     * 更新TokenAccess
     * @param model
     */
    updateTokenAccess: function(model) {
        let deferred = new common.Deferred();
        let tokenAccessOnDB = new TokenAccessOnDB();
        tokenAccessOnDB.update(model)
            .then(deferred.resolve.bind(deferred))
            .catch(deferred.reject.bind(deferred));
        return deferred.promise;
    },
    /**
     * 查询TokenAccess
     * @param model
     */
    getTokenAccessList: function(model) {
        let deferred = new common.Deferred();
        let tokenAccessOnDB = new TokenAccessOnDB();
        tokenAccessOnDB.getByQuery(model)
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    },
    /**
     * 验证token
     * @param token
     */
    verifyToken: function(token, appSecret, callback) {
        if (common.isBlank(token)) {
            logger.error("token is null");
            callback({ isOK: false, error: errorMessage.code_5003 });
        } else {
            cacheClient.hgetall(tokenService.formatTokenKey(token), function(err, result) {
                if (err) {
                    logger.error("get Token from cacheClient failure", err);
                    callback({ isOK: false, error: errorMessage.code_5003 });
                    return;
                }
                if (common.isBlank(result)) {
                    logger.debug("the token had been deleted or expired", token);
                    callback({ isOK: false, error: errorMessage.code_5002 });
                    return;
                }
                logger.debug("token found: ", result);
                let verifyResult = verifyAccessToken(token, appSecret, result);
                if (result.expires == 0) {
                    tokenService.destroyToken(token, (isDeleted) => {
                        if (isDeleted) {
                            logger.info("One-off token had been destroyed: ", result);
                        } else {
                            logger.error("One-off token isn't destroyed: ", appSecret, result);
                        }
                        callback(verifyResult);
                    });
                } else {
                    callback(verifyResult);
                }
            });
        }
    },
    /**
     * 提取token
     * @param expires 0:一次有效  1:1个小时  2:2个小时
     */
    getToken: function(appId, appSecret, callback) {
        tokenService.getTokenAccessList({ tokenAccessId: this.formatTokenAccessById(appId + "_" + appSecret) })
            .then(function(rows) {
                let row = rows[0];
                if (!row) {
                    logger.error("getToken failure, no such appId and appSecret:", appId, appSecret);
                    callback(errorMessage.code_11);
                    return;
                }
                var token = row.token,
                    expires = parseFloat(row.expires);
                tokenService.createToken(expires, row, function(newToken) {
                    callback(newToken); //返回token
                });
            }).catch(e => {
                logger.error("getToken failure, due to: ", e);
                callback(errorMessage.code_1001);
            });
    },
    /**
     * 新增token
     * @param expires
     * @param row
     */
    createToken: function(expires, row, callback) {
        let endTime = 0,
            time = 0;
        let beginTime = new Date().getTime();
        if (expires > 0) {
            time = expires * 60 * 60;
        } else {
            time = 6 * 60; //如果是零，即一次性使用，默认给6分钟有效
        }
        endTime = beginTime + time;
        let token = generateToken(row.appId, row.appSecret, time);
        let key = tokenService.formatTokenKey(token);
        cacheClient.hmset(key,
            'expires', expires,
            'beginTime', beginTime,
            'appId', row.appId
        );
        if (expires != -1) {
            cacheClient.expire(key, time);
        }
        callback({ token: token, expires: expires, beginTime: beginTime, endTime: endTime, appId: row.appId }); //返回token
    },
    /**
     * 注销token
     * @param token
     */
    destroyToken: function(token, callback) {
        cacheClient.del(this.formatTokenKey(token), function(err, row) {
            callback(!err && row > 0);
        });
    }
};

//导出服务类
module.exports = tokenService;