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
            return { isOK: false, error: errorMessage.code_5002 };
        }
        if (decode.iss !== result.appId) {
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
        TokenAccess.find().then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    }
    getByQuery(query) {
        let deferred = new common.Deferred();
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
    update(tokenAccessId, model) {
        let deferred = new common.Deferred();
        let _this = this;
        let updateFieldsByModel = (row) => {
            row = row ? row : {};
            row.platform = model.platform || row.platform;
            row.appId = model.appId || row.appId;
            row.appSecret = model.appSecret || row.appSecret;
            row.tokenAccessId = model.appId && model.appSecret ? `TokenAccess:${model.appId}_${model.appSecret}` : row.tokenAccessId;
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
                    _this.save(row).then(deferred.resolve).catch(deferred.reject);
                } else {
                    row.save().then(deferred.resolve).catch(deferred.reject);
                    // TokenAccess.findOneAndUpdate({ tokenAccessId: tokenAccessId }, model, (err, data) => {
                    //     if (err) {
                    //         logger.error(err);
                    //     }
                    //     console.log(data);
                    // });
                }
            }).catch(e => {
                logger.error(e);
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
    resyncTokenAccess: function() {
        let tokenAccessOnDB = new TokenAccessOnDB();
        let _this = this;
        let doResync = (listOnDB, listOnRedis) => {
            let dbUpdater = item => {
                return tokenAccessOnDB.update(item.tokenAccessId, item);
            };
            let redisUpdater = item => {
                let deferred = new common.Deferred();
                _this.updateTokenAccess(item, result => {
                    if (result.isOK) {
                        deferred.resolve(result);
                    } else {
                        deferred.reject(result);
                    }
                });
                return deferred.promise;
            };
            let seriesUpdate = (list, updater) => {
                async.eachSeries(list, function(item, callbackTmp) {
                    updater(item).then(callbackTmp).catch(e => {
                        logger.error(e);
                    });
                }, function(result) {
                    logger.info(result);
                });
            };
            seriesUpdate(listOnDB, redisUpdater);
            seriesUpdate(listOnRedis, dbUpdater);
        };
        this.getTokenAccessList(null, listOnRedis => {
            tokenAccessOnDB.getAll().then(listOnDB => {
                doResync(listOnDB, listOnRedis);
            }).catch(logger.error);
        });
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
        // tokenAccessOnDB.update(model.appId + '_' + model.appSecret, model).then(() => {
        //     callback({ isOK: true, error: null });
        // }).catch(e => {
        //     callback({ isOK: false, error: e });
        // });
    },
    /**
     * 更新TokenAccess
     * @param model
     */
    deleteTokenAccess: function(ids, callback) {
        var ids = ids.split(",");
        async.eachSeries(ids, function(item, callbackTmp) {
            cacheClient.del(item, function(err) {
                callbackTmp(err);
            });
        }, function(err) {
            callback(!err);
        });
    },
    /**
     * 更新TokenAccess
     * @param model
     */
    updateTokenAccess: function(model, callback) {
        cacheClient.hgetall(model.tokenAccessId, function(err, row) {
            if (err || !row) {
                logger.error("updateTokenAccess fail:" + err);
                callback({ isOK: false, error: errorMessage.code_11 });
            } else {
                common.copyObject(row, model);
                row.updateDate = new Date();
                tokenService.createTokenAccess(row, function(isOK) {
                    callback({ isOK: true, error: null });
                });
            }
        });
    },
    /**
     * 查询TokenAccess
     * @param model
     */
    getTokenAccessList: function(model, callback) {
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
            }, function(err) {
                callback(tokenAccessList);
            });
        });
    },
    /**
     * 查询TokenAccess
     * @param model
     */
    getTokenAccessByPlatform: function(platform, callback) {
        cacheClient.keys('TokenAccess:*', function(err, keys) {
            var resultTmp = null;
            async.eachSeries(keys, function(item, callbackTmp) {
                cacheClient.hgetall(item, function(err, result) {
                    if (result.platform == platform) {
                        result.tokenAccessId = tokenService.formatTokenAccessById(result.appId + '_' + result.appSecret);
                        resultTmp = result;
                    }
                    callbackTmp(err);
                });
            }, function(err) {
                callback(resultTmp);
            });
        });
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
        tokenService.getTokenAccessById(this.formatTokenAccessById(appId + "_" + appSecret)).then(function(row) {
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