/** 用户服务类
 * Created by Alan.wu on 2015/3/4.
 */
var uuid=require("node-uuid");//引入uuid
var http = require('http');//引入http
var common = require('../util/common');
var logger=require('../resources/logConf').getLogger('tokenService');//引入log4js
var errorMessage = require('../util/errorMessage');
var cacheClient=require('../cache/cacheClient');
var async = require('async');//引入async
/**
 * 定义token服务类
 */
var tokenService = {
    /**
     * 格式TokenAccessById
     * @param tokenAccessById
     * @returns {string}
     */
    formatTokenAccessById:function(tokenAccessById){
       return 'tokenAccess:'+tokenAccessById;
    },
    /**
     * 格式TokenKey
     * @param token
     * @returns {string}
     */
    formatTokenKey:function(token){
        return 'token:'+token;
    },
    /**
     * 创建新的tokenAccess
     * @param model
     */
    createTokenAccess:function(model,callback) {
        var currDate = new Date();
        cacheClient.hmset(this.formatTokenAccessById(model.appId+'_'+model.appSecret),
            'platform',model.platform,
             'appId',model.appId,
             'token',model.token||'',
             'appSecret',model.appSecret,
             'expires',(model.expires?model.expires:2),
             'valid',1,
             'status',1,
             'createUser',model.createUser||"",
             'createIp',model.createIp||"",
             'createDate',model.createDate||currDate,
             'updateUser',model.updateUser||(model.createUser||""),
             'updateIp',model.updateIp||(model.createIp||""),
             'updateDate',model.updateDate||currDate,
             'remark',model.remark||""
        );
        callback({isOK:true,error:null});
    },
    /**
     * 更新tokenAccess
     * @param model
     */
    deleteTokenAccess:function(ids,callback){
        var ids=ids.split(",");
        async.eachSeries(ids, function (item, callbackTmp) {
            cacheClient.del(item,function(err){
                callbackTmp(err);
            });
        }, function (err) {
            callback(!err);
        });
    },
    /**
     * 更新tokenAccess
     * @param model
     */
    updateTokenAccess:function(model,callback){
        cacheClient.hgetall(model.tokenAccessId,function(err,row){
            if(err || !row){
                logger.error("updateTokenAccess fail:"+err);
                callback({isOK:false,error:errorMessage.code_11});
            }else{
                common.copyObject(row,model);
                row.updateDate=new Date();
                tokenService.createTokenAccess(row,function(isOK){
                    callback({isOK:true,error:null});
                });
            }
        });
    },
    /**
     * 查询tokenAccess
     * @param model
     */
    getTokenAccessList:function(model,callback){
        cacheClient.keys('tokenAccess:*', function (err, keys) {
            var tokenAccessList=[];
            async.eachSeries(keys, function (item, callbackTmp) {
                cacheClient.hgetall(item,function(err,result){
                    result.tokenAccessId=tokenService.formatTokenAccessById(result.appId+'_'+result.appSecret);
                    if(model){
                        if(model.appId==result.appId ||model.appSecret==result.appSecret || result.platform==model.platform){
                            tokenAccessList.push(result);
                        }
                    }else{
                        tokenAccessList.push(result);
                    }
                    callbackTmp(err);
                });
            }, function (err) {
               callback(tokenAccessList);
            });
        });
    },
    /**
     * 查询tokenAccess
     * @param model
     */
    getTokenAccessByPlatform:function(platform,callback){
        cacheClient.keys('tokenAccess:*', function (err, keys) {
            var resultTmp=null;
            async.eachSeries(keys, function (item, callbackTmp) {
                cacheClient.hgetall(item,function(err,result){
                    if(result.platform==platform){
                        result.tokenAccessId=tokenService.formatTokenAccessById(result.appId+'_'+result.appSecret);
                        resultTmp=result;
                    }
                    callbackTmp(err);
                });
            }, function (err) {
                callback(resultTmp);
            });
        });
    },
    /**
     * 查询tokenAccess
     * @param model
     */
    getTokenAccessById:function(tokenAccessById,callback){
        cacheClient.hgetall(tokenAccessById,function(err,result){
            if(err || !result){
                callback(null);
            }else{
                result.tokenAccessId=tokenService.formatTokenAccessById(result.appId+'_'+result.appSecret);
                callback(result);
            }
        });
    },
    /**
     * 验证token
     * @param token
     */
    verifyToken:function(token,callback){
        if(common.isBlank(token)){
            callback(false);
        }else{
            cacheClient.hgetall(tokenService.formatTokenKey(token),function(err,result){
                callback(!err && result);
            });
        }
    },
    /**
     * 提取token
     * @param expires 0:一次有效  1:1个小时  2:2个小时
     */
    getToken:function(appId,appSecret,callback){
        tokenService.getTokenAccessById(this.formatTokenAccessById(appId+"_"+appSecret),function(row){
            if(!row){
                logger.warn("getToken fail,please check!");
                callback(errorMessage.code_1001);
                return;
            }
            var token=row.token,expires=parseFloat(row.expires);
            if(common.isValid(token)){
                tokenService.destroyToken(function(){
                    tokenService.createToken(expires,row,function(newToken){
                        callback({token:newToken,expires :expires*3600});//返回token
                    });
                });
            }else{
                tokenService.createToken(expires,row,function(newToken){
                    callback({token:newToken,expires :expires*3600});//返回token
                });
            }
        });
    },
    /**
     * 新增token
     * @param expires
     * @param row
     */
    createToken:function(expires,row,callback){
        var beginTime=0,endTime= 0,time=0;
        if(expires>0) {
            beginTime=new Date().getTime();
            time=expires*3600;
        }else{
            time=0.1*3600;//如果是零，即一次性使用，默认给6分钟有效
        }
        var token=uuid.v4().replace(/-/g,'');
        row.token=token;
        //更新TokenAccess
        tokenService.createTokenAccess(row,function(result){
            //更新Token
            var key=tokenService.formatTokenKey(token);
            cacheClient.hmset(key,
                'expires',expires,
                'beginTime',beginTime
            );
            cacheClient.expire(key,time);
            callback(token);//返回token
        });
    },
    /**
     * 注销token
     * @param token
     */
    destroyToken:function(token,callback){
        cacheClient.del(this.formatTokenKey(token),function(err,row){
            callback(!err && row>0);
        });
    }
};

//导出服务类
module.exports =tokenService;

