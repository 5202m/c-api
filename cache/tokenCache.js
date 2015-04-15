var cacheClient = require("../cache/cacheClient");//引入缓存连接的客户端
var uuid=require("node-uuid");//引入uuid

/** token缓存类
 * Created by Alan.wu on 2015/4/14.
 */
var tokenCache = {
    /**
     * 缓存token
     */
    setToken:function(time,callback){
        var tokenVal=uuid.v4().replace(/-/g,'');
        var tokenObj={token:tokenVal};
        cacheClient.set(tokenVal, tokenVal);
        if(time!=null) {
            cacheClient.expire(tokenVal, time);
        }
        callback(tokenObj);
    },
    /**
     * 提取token
     * @param id
     * @param callback
     */
    getToken:function(key,callback){
        cacheClient.get(key, function (err, value){
            if (err||value==null){
                callback(null);
            } else{
                callback(value);
            }
            cacheClient.end();
        });
    }
};
//导出类
module.exports =tokenCache;

