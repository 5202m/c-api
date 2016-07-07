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
var express = require('express');
var router = express.Router();
var Formidable  = require('formidable');
var APIUtil = require('../../util/APIUtil.js');
var Config = require('../../resources/config.js');
var Constant = require('../../constant/constant.js');
var Utils = require('../../util/Utils.js');
var CommonJS = require('../../util/common.js');
var UploadService = require('../../service/uploadService.js');

/**
 * 文件上传
 */
router.post('/uploadFile', function (req, res) {
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
        var loc_fileName = Utils.dateFormat(loc_timeNow, 'yyyyMMddhhmmss');

        if(Config.uploadUseFtp){
            UploadService.ftpUpload(files, loc_filePath, loc_fileName, function(result){
                res.json(result);
            });
        }else{
            UploadService.upload(files, loc_filePath, loc_fileName, function(result){
                res.json(result);
            });
        }
    });
});

module.exports = router;