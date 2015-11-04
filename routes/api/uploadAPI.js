/**
 * 文件上传<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年07月20日 <BR>
 * Description :<BR>
 * <p>
 *     文件上传
 * </p>
 */
var logger =require("../../resources/logConf").getLogger("uploadAPI");
var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var Formidable  = require('formidable');
var Ftp = require('ftp');
var APIUtil = require('../../util/APIUtil.js');
var Config = require('../../resources/config.js');
var Constant = require('../../constant/constant.js');
var Utils = require('../../util/Utils.js');
var CommonJS = require('../../util/common.js');
var IteratorUtil = require('../../util/IteratorUtil.js');

/**
 * 文件上传
 */
router.post('/upload', function (req, res) {
    APIUtil.logRequestInfo(req, "uploadAPI");
    var form = new Formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = Config.uploadTempPath;
    form.keepExtensions = true;

    form.parse(req, function(err, fields, files) {
        if (err) {
            logger.error("文件上传失败，解析表单错误！", err);
            res.json(APIUtil.APIResult("code_1004", null, null));
            return;
        }
        var loc_fileDir = fields['fileDir'];
        if(!loc_fileDir || (!(CommonJS.startsWith(loc_fileDir,Constant.FileDirectory.pic.code) != -1)
                            && !(CommonJS.startsWith(loc_fileDir,Constant.FileDirectory.video.code) != -1))){
            res.json(APIUtil.APIResult("code_1003", null, null));
            return;
        }
        var loc_timeNow = new Date();
        var loc_filePath = loc_fileDir + "/" + Utils.dateFormat(loc_timeNow, 'yyyyMM');

        var FtpClient = new Ftp();
        FtpClient.on('ready', function() {
            FtpClient.mkdir(loc_filePath, true, function(err){
                if (err) {
                    logger.error("文件上传失败，创建FTP目录失败！", err);
                    res.json(APIUtil.APIResult("code_1004", null, null));
                    return;
                }
                //异步迭代FTP上传文件列表
                IteratorUtil.asyncObject(files, function(filekey, file, callback){
                    var loc_fileName = Utils.dateFormat(loc_timeNow, 'yyyyMMddhhmmss');
                    loc_fileName += "_";
                    for(var j = 0; j < 8; j++){
                        loc_fileName += parseInt(Math.random() * 10, 10).toString()
                    }
                    loc_fileName += path.extname(file.name);
                    //FTP上传文件
                    FtpClient.put(file.path, Config.filesFtpBasePath + "/" + loc_filePath + "/" + loc_fileName, function(err){
                        if (err) {
                            logger.error("文件上传失败，FTP上传出错:" + loc_filePath + "/" + loc_fileName, err);
                            callback(err, null);
                        }else{
                            //删除本地文件
                            fs.unlink(file.path, function(err){
                                if(err){
                                    logger.warn("文件上传--删除临时文件失败:" + file.path);
                                }
                            });
                            callback(null, "/" + Config.uploadBasePath + "/" + loc_filePath + "/" + loc_fileName);
                        }
                    });
                }, function(err, fileResults){
                    if(err){
                        logger.error("文件上传失败！", err);
                        res.json(APIUtil.APIResult("code_1004", null, null));
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
                    res.json(APIUtil.APIResult(null, loc_results, null));
                });
            });
        });

        FtpClient.connect({
            host : Config.filesFtpHost,
            port : Config.filesFtpPort,
            user : Config.filesFtpUser,
            password : Config.filesFtpPWD
        });
    });
});

module.exports = router;