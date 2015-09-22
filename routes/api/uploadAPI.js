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
var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var Formidable  = require('formidable');
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
    form.uploadDir = Config.pmfilesRootPath + "/" + Config.uploadBasePath;
    form.keepExtensions = true;

    form.parse(req, function(err, fields, files) {
        if (err) {
            console.error("文件上传失败，解析表单错误！", err);
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
        var loc_filePath = "/";
        loc_filePath += Config.uploadBasePath;
        loc_filePath += "/";
        loc_filePath += loc_fileDir;
        loc_filePath += "/";
        loc_filePath += Utils.dateFormat(loc_timeNow, 'yyyyMM');
        loc_filePath += "/";

        //递归创建文件目录
        var mkdirsFunc = function(dirpath, callback) {
            fs.exists(dirpath, function(exists) {
                if(exists) {
                    callback(null);
                } else {
                    //尝试创建父目录，然后再创建当前目录
                    mkdirsFunc(path.dirname(dirpath), function(err){
                        if(err){
                            callback(err);
                            return;
                        }
                        fs.mkdir(dirpath, callback);
                    });
                }
            });
        };

        mkdirsFunc(Config.pmfilesRootPath + loc_filePath, function(err){
            if(err){
                console.error("文件上传失败，创建文件夹出错！", err);
                res.json(APIUtil.APIResult("code_1004", null, null));
                return;
            }
            //异步迭代文件列表，重命名文件
            IteratorUtil.asyncObject(files, function(filekey, file, callback){
                var loc_fileName = Utils.dateFormat(loc_timeNow, 'yyyyMMddhhmmss');
                loc_fileName += "_";
                for(var j = 0; j < 8; j++){
                    loc_fileName += parseInt(Math.random() * 10, 10).toString()
                }
                loc_fileName += file.name.substring(file.name.lastIndexOf("."));

                fs.rename(file.path, Config.pmfilesRootPath + loc_filePath + loc_fileName, function (err) {
                    if (err) {
                        console.log(Config.pmfilesRootPath + loc_filePath + loc_fileName);
                        console.error("文件上传失败，重命名出错！", err);
                        callback(err, null);
                    }else{
                        callback(null, loc_filePath + loc_fileName);
                    }
                });

            }, function(err, fileResults){
                if(err){
                    console.error("文件上传失败！", err);
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
                res.json(APIUtil.APIResult(null, loc_results, null));
            });
        });
    });
});

module.exports = router;