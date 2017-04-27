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
        } else return { isOK: true };
    } catch (e) {
        console.error(token, "invalid!");
        return { isOK: false, error: errorMessage.code_5001 };
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
        return 'tokenAccess:' + tokenAccessById;
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
     * 创建新的tokenAccess
     * @param model
     */
    createTokenAccess: function(model, callback) {
        var currDate = new Date();
        cacheClient.hmset(this.formatTokenAccessById(model.appId + '_' + model.appSecret),
            'platform', model.platform,
            'appId', model.appId,
            'token', model.token || '',
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
    },
    /**
     * 更新tokenAccess
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
     * 更新tokenAccess
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
     * 查询tokenAccess
     * @param model
     */
    getTokenAccessList: function(model, callback) {
        cacheClient.keys('tokenAccess:*', function(err, keys) {
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
     * 查询tokenAccess
     * @param model
     */
    getTokenAccessByPlatform: function(platform, callback) {
        cacheClient.keys('tokenAccess:*', function(err, keys) {
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
     * 查询tokenAccess
     * @param model
     */
    getTokenAccessById: function(tokenAccessById, callback) {
        cacheClient.hgetall(tokenAccessById, function(err, result) {
            if (err || !result) {
                callback(null);
            } else {
                result.tokenAccessId = tokenService.formatTokenAccessById(result.appId + '_' + result.appSecret);
                callback(result);
            }
        });
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
        tokenService.getTokenAccessById(this.formatTokenAccessById(appId + "_" + appSecret), function(row) {
            if (!row) {
                logger.warn("getToken fail,please check!");
                callback(errorMessage.code_1001);
                return;
            }
            var token = row.token,
                expires = parseFloat(row.expires);
            if (common.isValid(token) && expires > 0) {
                cacheClient.hgetall(tokenService.formatTokenKey(token), (err, result) => {
                    if (result) {
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
                    callback(newTokenObject); //返回token
                });
            }
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
        row.token = token;
        //更新TokenAccess
        tokenService.createTokenAccess(row, function(result) {
            //更新Token
            var key = tokenService.formatTokenKey(token);
            cacheClient.hmset(key,
                'expires', expires,
                'beginTime', beginTime,
                'appId', row.appId
            );
            callback({ token: token, expires: expires, beginTime: beginTime, appId: row.appId }); //返回token
        });
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