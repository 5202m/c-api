"use strict";
let logger =require("../../resources/logConf").getLogger("studioAPI");
let express = require('express');
let router = express.Router();
let studioService = require('../../service/studioService');
let common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

router.get("/getIndexLoadData", (req, res) => {
    let requires = ["groupType", "userId", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let isGetRoomList = req.query["isGetRoomList"] || false,
        isGetSyllabus = req.query["isGetSyllabus"] || false,
        isGetMember = req.query["isGetMember"] || false;
    
    studioService.getIndexLoadData(
        req.query["userId"],
        req.query["groupType"],
        req.query["groupId"], 
        isGetRoomList,
        isGetSyllabus,  
        isGetMember,        
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getRoomList", (req, res) => {
    if(common.isBlank(req.query["groupType"])){
        logger.warn("Parameters missed! Expecting parameters: ", "groupType");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    studioService.getRoomList(
        req.query["groupType"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getClientGroupList", (req, res) => {
    if(common.isBlank(req.query["groupType"])){
        logger.warn("Parameters missed! Expecting parameters: ", "groupType");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    studioService.getClientGroupList(
        req.query["groupType"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.post("/resetPwd", (req, res) => {
    //groupType,mobilePhone,newPwd
    let requires = ["groupType", "mobilePhone", "newPwd"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.resetPwd(
        req.query["groupType"],
        req.query["mobilePhone"],
        req.query["newPwd"],     
        req.query["oldPwd"] || "",          
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getStudioByGroupId", (req, res) => {
    if(common.isBlank(req.query["groupId"])){
        logger.warn("Parameters missed! Expecting parameters: ", "groupId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    studioService.getStudioByGroupId(
        req.query["groupId"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/checkGroupAuth", (req, res) => {
    let requires = ["groupId", "clientGroup", "userId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.checkGroupAuth(
        req.query["groupId"],       
        req.query["clientGroup"],
        req.query["userId"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getDefaultRoom", (req, res) => {
    let requires = ["groupType", "clientGroup"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.getDefaultRoom(
        req.query["groupType"],       
        req.query["clientGroup"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/studioRegister", (req, res) => {
    let requires = ["userInfo", "clientGroup"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "nickname", "groupId"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed in 'userInfo'! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.studioRegister(
        req.body["userInfo"],       
        req.body["clientGroup"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.post("/checkMemberAndSave", (req, res) => {
    if(!req.body["userInfo"]){
        logger.warn("Parameters missed! Expecting parameters: ", "userInfo");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let requires = ["mobilePhone", "groupType", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.checkMemberAndSave(
        req.body["userInfo"],
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/checkNickName", (req, res) => {
    if(common.isBlank(req.query["groupType"])){
        logger.warn("Parameters missed! Expecting parameters: ", "groupType");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.checkNickName(
        req.query,   
        (err, isExist) => {
            res.json(APIUtil.APIResult(null, {isExist: isExist}));
        }
    );
});
router.post("/login", (req, res) => {
    let requires = ["userInfo", "type"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    switch(req.body["type"]){
        case 1 : 
            requires = ["mobilePhone", "groupType"];
            break;
        case 2 : 
            requires = ["userId", "groupType"];
            break;
        case 3 : 
            requires = ["thirdId", "groupType"];
            break;
        case 4 : 
            requires = ["mobilePhone", "password", "groupType"];
            break;
        default : {
            logger.warn("Unexpecting parameter value of 'type': ", req.body["type"]);
            res.json(APIUtil.APIResult("code_1000", null));
            return;
        }
    };
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed in 'userInfo'! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.login(
        req.body["userInfo"],       
        req.body["type"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/updateClientGroup", (req, res) => {
    let requires = ["groupType", "mobilePhone", "newClientGroup", "accountNo"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.updateClientGroup(
        req.body["groupType"],       
        req.body["mobilePhone"],     
        req.body["newClientGroup"],     
        req.body["accountNo"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/setUserGroupThemeStyle", (req, res) => {
    let requires = ["userInfo", "defTemplate"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed in 'userInfo'! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    try{
        JSON.parse(req.body["defTemplate"]);
    } catch(e){
        logger.warn("Parameters 'defTemplate' error! Expecting JSON String: ", req.body["defTemplate"]);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    };
    studioService.setUserGroupThemeStyle(
        req.body["userInfo"],       
        req.body["defTemplate"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getTrainRoomList", (req, res) => {
    if(common.isBlank(req.query["groupType"])){
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    studioService.getTrainRoomList(
        req.query["groupType"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getUserInfoByUserNo", (req, res) => {
    let requires = ["groupType", "userNo"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.getUserInfoByUserNo(
        req.query["groupType"],       
        req.query["userNo"],
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getShowTeacher", (req, res) => {
    let requires = ["groupType", "groupId", "authorId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    studioService.getShowTeacher(
        {
            groupType: req.query["groupType"],
            groupId: req.query["groupId"],
            authorId: req.query["authorId"]
        },
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;