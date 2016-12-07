/**
 * 文件上传服务类<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年07月07日 <BR>
 * Description :<BR>
 * <p>
 *
 * </p>
 */
var logger = require('../resources/logConf').getLogger("uploadService");
var Path = require('path');
var APIUtil = require('../util/APIUtil.js');
var Config = require('../resources/config.js');
var IteratorUtil = require('../util/IteratorUtil.js');
var Ftp = require('ftp');
var FS = require('fs');
var ImgUtil = require('../util/imgUtil');

var uploadService = {
    /**
     * FTP上传
     * @param files
     * @param filePath
     * @param fileName
     * @param callback
     */
    ftpUpload : function(files, filePath, fileName, callback){
        var FtpClient = new Ftp();
        FtpClient.on('ready', function() {
            FtpClient.mkdir(filePath, true, function(err){
                if (err) {
                    logger.error("文件上传失败，创建FTP目录失败！", err);
                    callback(APIUtil.APIResult("code_1004", null, null));
                    return;
                }
                //异步迭代FTP上传文件列表
                IteratorUtil.asyncObject(files, function(filekey, file, callbackIte){
                    var loc_fileName = fileName + "_";
                    for(var j = 0; j < 8; j++){
                        loc_fileName += parseInt(Math.random() * 10, 10).toString()
                    }
                    loc_fileName += Path.extname(file.name);
                    //FTP上传文件
                    FtpClient.put(file.path, Config.filesFtpBasePath + "/" + filePath + "/" + loc_fileName, function(err){
                        if (err) {
                            logger.error("文件上传失败，FTP上传出错:" + filePath + "/" + loc_fileName, err);
                            callbackIte(err, null);
                        }else{
                            //删除本地文件
                            FS.unlink(file.path, function(err){
                                if(err){
                                    logger.warn("文件上传--删除临时文件失败:" + file.path);
                                }
                            });
                            callbackIte(null, "/" + Config.uploadBasePath + "/" + filePath + "/" + loc_fileName);
                        }
                    });
                }, function(err, fileResults){
                    if(err){
                        logger.error("文件上传失败！", err);
                        callback(APIUtil.APIResult("code_1004", null, null));
                        return;
                    }
                    var loc_keys = Object.keys(fileResults);
                    var loc_results = [];
                    for(var i = 0, lenI = loc_keys.length; i < lenI; i++){
                        loc_results.push({
                            name : loc_keys[i],
                            fileDomain : Config.filesDomain,
                            filePath : fileResults[loc_keys[i]]
                        });
                    }
                    //关闭FTP连接
                    FtpClient.end();
                    callback(APIUtil.APIResult(null, loc_results, null));
                });
            });
        });

        FtpClient.connect({
            host : Config.filesFtpHost,
            port : Config.filesFtpPort,
            user : Config.filesFtpUser,
            password : Config.filesFtpPWD
        });
    },

    /**
     * 本地上传
     * @param files
     * @param filePath
     * @param fileName
     * @param callback
     */
    upload : function(files, filePath, fileName, callback){
        FS.exists(Config.pmfilesRootPath + "/" + Config.uploadBasePath, function(exists) {
            if(!exists){
                logger.error("文件上传失败，文件目录不存在！", Config.pmfilesRootPath + "/" + Config.uploadBasePath);
                callback(APIUtil.APIResult("code_1004", null, null));
                return;
            }
            uploadService.mkdir(Config.pmfilesRootPath + "/" + Config.uploadBasePath + "/" + filePath, function(err, mkdirRes) {
                if (err || !mkdirRes) {
                    logger.error("文件上传失败，创建FTP目录失败！", err);
                    callback(APIUtil.APIResult("code_1004", null, null));
                    return;
                }
                IteratorUtil.asyncObject(files, function(filekey, file, callbackIte){
                    var loc_fileName = "/" + Config.uploadBasePath + "/" + filePath + "/" + fileName + "_";
                    for(var j = 0; j < 8; j++){
                        loc_fileName += parseInt(Math.random() * 10, 10).toString()
                    }
                    loc_fileName += Path.extname(file.name);
                    FS.rename(file.path, Config.pmfilesRootPath + loc_fileName, function(err){
                        if(err){
                            logger.error("文件上传失败，文件重命名失败:" + loc_fileName, err);
                            callbackIte(err, null);
                            return;
                        }
                        callbackIte(null, loc_fileName);
                    });
                }, function(err, fileResults){
                    if(err){
                        logger.error("文件上传失败！", err);
                        callback(APIUtil.APIResult("code_1004", null, null));
                        return;
                    }
                    var loc_keys = Object.keys(fileResults);
                    var loc_results = [];
                    for(var i = 0, lenI = loc_keys.length; i < lenI; i++){
                        loc_results.push({
                            name : loc_keys[i],
                            fileDomain : Config.filesDomain,
                            filePath : fileResults[loc_keys[i]]
                        });
                    }
                    callback(APIUtil.APIResult(null, loc_results, null));
                });
            });
        });
    },

    /**
     * 递归创建目录
     * @param path
     * @param callback
     */
    mkdir : function(path, callback){
        FS.exists(path, function(exists) {
            if(exists) {
                callback(null, true);
            } else {
                //尝试创建父目录，然后再创建当前目录
                uploadService.mkdir(Path.dirname(path), function(err){
                    if(err){
                        callback(err, false);
                    }else{
                        FS.mkdir(path, function(err){
                            callback(err, !err);
                        });
                    }
                });
            }
        });
    },

    zipConfigs : {
        "avatar" : {width : 100, quality : 50},
        "showTrade" : null
    },

    /**
     * 压缩图片
     * @param imgs
     * @param op
     */
    zipImg : function(imgs, op){
        if(uploadService.zipConfigs.hasOwnProperty(op) == false){
            return false;
        }else{
            var cfg = uploadService.zipConfigs[op];
            if(cfg){
                for(var i = 0, lenI = !imgs ? 0 : imgs.length; i < lenI; i++){
                    if(uploadService.zipConfigs.hasOwnProperty(op))
                        ImgUtil.zipImg(imgs[i].path, cfg);
                }
            }
            return true;
        }
    }
};

//导出服务类
module.exports =uploadService;