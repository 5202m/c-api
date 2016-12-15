"use strict";
let logger =require("../../resources/logConf").getLogger("syllabusAPI");
let express = require('express');
let router = express.Router();
let syllabusService = require('../../service/syllabusService');
let common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

router.get("/getSyllabus", (req, res) => {
    let requires = ["groupType", "today"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let nowDay = new Date(req.query["today"] - 0);
    syllabusService.getSyllabus(
        req.query["groupType"],
        req.query["groupId"],
        nowDay,         
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getCourseInfo", (req, res) => {
    let requires = ["groupType", "groupId", "startTime", "endTime", "authorId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let startTime = new Date(req.query["startTime"] - 0);
    let endTime = new Date(req.query["endTime"] - 0);
    syllabusService.getCourseInfo(
        {
            groupType: req.query["groupType"],
            groupId: req.query["groupId"],
            day: req.query["day"],
            startTime: startTime,
            endTime: endTime,
            authorId: req.query["authorId"]
        },
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getSyllabusHis", (req, res) => {
    if(common.isBlank(req.query["groupType"])){
        logger.warn("Parameters missed! Expecting parameter 'groupType': ", req.query["groupType"]);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    syllabusService.getSyllabusHis(
        req.query["groupType"],
        req.query["groupId"],
        req.query["date"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;