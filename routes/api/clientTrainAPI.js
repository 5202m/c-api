let express = require('express');
let router = express.Router();
let common = require('../../util/common');
let clientTrainService = require('../../service/clientTrainService');
let APIUtil = require('../../util/APIUtil.js');

router.post("/saveTrain", (req, res) => {//groupId,userId,nickname
    let requires = ["groupId","userId","nickname"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    clientTrainService.saveTrain(
        req.body["groupId"], 
        req.body["userId"], 
        req.body["nickname"], 
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
    
});
router.post("/addClientTrain", (req, res) => {
    let requires = ["groupId", "userId", "nickname", "clientGroup"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    clientTrainService.addClientTrain(
        {
            groupId: req.body["groupId"],
            nickname: req.body["nickname"]
        }, 
        {
            userId: req.body["userId"],
            clientGroup: req.body["clientGroup"]
        }, 
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getTrainAndClientNum", (req, res) => {
    let requires = ["groupType", "teachId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    clientTrainService.getTrainAndClientNum(
        req.query["groupType"], 
        req.query["teachId"], 
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getTrainList", (req, res) => {
    let requires = ["groupType", "teachId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    clientTrainService.getTrainList(
        req.query["groupType"], 
        req.query["teachId"],
        req.query["isAll"] || false,
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.post("/addSignin", (req, res) => {
    let requires = ["mobilePhone", "groupType", "avatar", "clientip"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    clientTrainService.addSignin(
        {
            mobilePhone: req.body["mobilePhone"],
            groupType: req.body["groupType"],
            avatar: req.body["avatar"]
        }, 
        req.body["clientip"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getSignin", (req, res) => {
    let requires = ["mobilePhone", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    clientTrainService.getSignin(
        {
            mobilePhone: req.query["mobilePhone"], 
            groupType: req.query["groupType"]
        },
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});

module.exports = router;