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

let generateToken = (appId, appSecret, hours) => {
    let expires = moment().add(hours, 'hours').valueOf();
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
        TokenAccess.findOne(query).then(deferred.resolve).catch(deferred.reject);
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
            'expires': (model.expires ? model.expires : 2),
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
            row.expires = model.expires || row.expires;
            row.valid = model.valid || row.valid;
            row.status = model.status || row.status;
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
                let isCreate = !row;
                row = updateFieldsByModel(row);
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
    resyncTokenAccesses: function() {
        let tokenAccessOnDB = new TokenAccessOnDB();
        let _this = this;
        let seriesUpdate = (list, updater) => {
            if (list.length === 0) {
                return;
            }
            async.each(list, function(item, callbackTmp) {
                updater(item).then((err, data) => callbackTmp(data))
                    .catch(e => {
                        logger.error(e);
                        callbackTmp(e);
                    });
            }, function(err, result) {
                if (err) {
                    logger.error(err);
                } else {
                    logger.info("Updated", list.length, "tokens");
                }
            });
        };
        this.getTokenAccessList(null).then(listOnRedis => {
            logger.debug("Got", listOnRedis.length, "tokens from redis.");
            tokenAccessOnDB.getAll().then(listOnDB => {
                logger.debug("Got ", listOnDB.length, "tokens from DB.");

                logger.debug("Doing the token async from DB to redis.");
                seriesUpdate(listOnDB, _this.updateTokenAccess.bind(_this));

                logger.debug("Doing the token async from redis to DB.");
                seriesUpdate(listOnRedis, tokenAccessOnDB.update.bind(tokenAccessOnDB));
            }).catch(e => logger.error(e));
        }).catch(e => logger.error(e));
    },
    /**
     * 创建新的TokenAccess
     * @param model
     */
    createTokenAccess: function(model, callback) {
        var currDate = new Date();
        let tokenAccessOnDB = new TokenAccessOnDB();
        cacheClient.hmset(this.formatTokenAccessById(model.appId + '_' + model.appSecret),
            'platform', model.platform,
            'appId', model.appId,
            'appSecret', model.appSecret,
            'expires', (model.expires ? model.expires : 2),
            'valid', 1,
            'status', 1,
            'createUser', model.createUser || "",
            'createIp', model.createIp || "",
            'createDate', model.createDate || currDate,
            'updateUser', model.updateUser || (model.createUser || ""),
            'updateIp', model.updateIp || (model.createIp || ""),
            'updateDate', model.updateDate || currDate,
            'remark', model.remark || ""
        );
        callback({ isOK: true, error: null });
        tokenAccessOnDB.update(model)
            .then(logger.debug.bind(logger)).catch(logger.error.bind(logger));
    },
    /**
     * 更新TokenAccess
     * @param model
     */
    deleteTokenAccess: function(ids, callback) {
        var ids = ids.split(",");
        let tokenAccessOnDB = new TokenAccessOnDB();
        async.eachSeries(ids, function(id, callbackTmp) {
            cacheClient.del(id, function(err) {
                callbackTmp(err);
                tokenAccessOnDB.update({ valid: 0, status: 0, tokenAccessId: id })
                    .then(logger.debug.bind(logger)).catch(logger.error.bind(logger));
            });
        }, function(err) {
            callback(!err);
        });
    },
    /**
     * 更新TokenAccess
     * @param model
     */
    updateTokenAccess: function(model) {
        let deferred = new common.Deferred();
        let tokenAccessOnDB = new TokenAccessOnDB();
        cacheClient.hgetall(model.tokenAccessId, function(err, row) {
            if (err) {
                logger.error("updateTokenAccess to redis fail:", err, row);
                deferred.reject({ isOK: false, error: errorMessage.code_11 });
            } else if (!row) {
                tokenService.createTokenAccess(model, function(isOK) {
                    deferred.resolve({ isOK: true, error: null });
                });
            } else {
                common.copyObject(row, model);
                row.updateDate = new Date();
                tokenService.createTokenAccess(row, function(isOK) {
                    deferred.resolve({ isOK: true, error: null });
                });
            }
        });
        return deferred.promise;
    },
    /**
     * 查询TokenAccess
     * @param model
     */
    getTokenAccessList: function(model) {
        let deferred = new common.Deferred();
        cacheClient.keys('TokenAccess:*', function(err, keys) {
            var tokenAccessList = [];
            async.eachSeries(keys, function(item, callbackTmp) {
                cacheClient.hgetall(item, function(err, result) {
                    result.tokenAccessId = tokenService.formatTokenAccessById(result.appId + '_' + result.appSecret);
                    if (model) {
                        if (model.appId == result.appId || model.appSecret == result.appSecret || result.platform == model.platform) {
                            tokenAccessList.push(result);
                        }
                    } else {
                        tokenAccessList.push(result);
                    }
                    callbackTmp(err);
                });
            }, function(err, result) {
                if (err) {
                    logger.error(err);
                    deferred.reject(err);
                    return;
                }
                deferred.resolve(tokenAccessList);
            });
        });
        return deferred.promise;
    },
    /**
     * 查询TokenAccess
     * @param model
     */
    getTokenAccessById: function(tokenAccessById) {
        let deferred = new common.Deferred();
        cacheClient.hgetall(tokenService.formatTokenAccessById(tokenAccessById), function(err, result) {
            if (err || !result) {
                logger.error("getTokenAccessById failure:", tokenAccessById, err);
                deferred.reject(err);
            } else {
                result.tokenAccessId = tokenService.formatTokenAccessById(result.appId + '_' + result.appSecret);
                deferred.resolve(result);
            }
        });
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
                }
                callback(verifyAccessToken(token, appSecret, result));
            });
        }
    },
    /**
     * 提取token
     * @param expires 0:一次有效  1:1个小时  2:2个小时
     */
    getToken: function(appId, appSecret, callback) {
        tokenService.getTokenAccessById(this.formatTokenAccessById(appId + "_" + appSecret))
            .then(function(row) {
                var token = row.token,
                    expires = parseFloat(row.expires);
                if (common.isValid(token) && expires > 0) {
                    cacheClient.hgetall(tokenService.formatTokenKey(token), (err, result) => {
                        let verify = verifyAccessToken(token, appSecret, result);
                        if (verify.isOK) {
                            result.token = token;
                            callback(result);
                            return;
                        }
                        tokenService.destroyToken(token, function() {
                            tokenService.createToken(expires, row, function(newTokenObject) {
                                callback(newTokenObject); //返回token
                            });
                        });
                    });

                } else {
                    tokenService.createToken(expires, row, function(newToken) {
                        callback(newToken); //返回token
                    });
                }
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
        var beginTime = 0,
            endTime = 0,
            time = 0;
        if (expires > 0) {
            beginTime = new Date().getTime();
            time = expires * 3600;
        } else {
            time = 0.1 * 3600; //如果是零，即一次性使用，默认给6分钟有效
        }
        let token = generateToken(row.appId, row.appSecret, expires);
        var key = tokenService.formatTokenKey(token);
        cacheClient.hmset(key,
            'expires', expires,
            'beginTime', beginTime,
            'appId', row.appId
        );
        callback({ token: token, expires: expires, beginTime: beginTime, appId: row.appId }); //返回token
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