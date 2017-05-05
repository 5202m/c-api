var logger = require('../resources/logConf').getLogger("redis");
var config = require("../resources/config");
/**
 * 定义缓存连接的客户端
 * @type {exports}
 */
var redis = require("redis"), //引入redis
    cacheClient = redis.createClient(config.redisUrlObj.port, config.redisUrlObj.host, {}); //连接redis

cacheClient
    .on("ready", () => {
        logger.info(`Connected to redis ready: ${config.redisUrlObj.host}:${config.redisUrlObj.port}`);
    }).on("error", function(err) { //错误监听
        logger.info("Connect to redis has error:" + err);
    });
module.exports = cacheClient;