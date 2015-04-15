/**
 * 定义缓存连接的客户端
 * @type {exports}
 */
var redis = require("redis"),//引入redis
    cacheClient = redis.createClient(6379,'192.168.35.236',{});//连接redis
    cacheClient.on("error", function (err) { //错误监听
        console.log("Error " + err);
    });
module.exports =cacheClient;

