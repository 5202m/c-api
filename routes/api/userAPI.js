"use strict";
let logger =require("../../resources/logConf").getLogger("userAPI");
let express = require('express');
let router = express.Router();
let userService = require('../../service/userService');
let common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

router.get("/getUserInfo", (req, res) => {
    if(common.isBlank(req.query["id"])){
        logger.warn("Parameters missed! Expecting parameters: ", "id");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getUserInfo(
        req.query["id"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getUserInfoByUserNo", (req, res) => {
    if(common.isBlank(req.query["userNo"])){
        logger.warn("Parameters missed! Expecting parameters: ", "userNo");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getUserInfoByUserNo(
        req.query["userNo"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getUserList", (req, res) => {
    if(common.isBlank(req.query["userNOs"])){
        logger.warn("Parameters missed! Expecting parameters: ", "userNOs");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getUserList(
        req.query["userNOs"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/batchOfflineStatus", (req, res) => {
    if(common.isBlank(req.query["roomId"])){
        logger.warn("Parameters missed! Expecting parameters: ", "roomId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.batchOfflineStatus(
        req.query["roomId"],       
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/verifyRule", (req, res) => {
     let requires = ["clientGroup", "nickname", "isWh", "userType", "groupId", "content"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.verifyRule(
        req.query["clientGroup"],
        req.query["nickname"],
        req.query["isWh"], 
        req.query["userType"],
        req.query["groupId"],   
        req.query["content"],         
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getMemberList", (req, res) => {
    if(common.isBlank(req.query["id"])){
        logger.warn("Parameters missed! Expecting parameters: ", "id");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getMemberList(
        req.query["id"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getAuthUsersByGroupId", (req, res) => {
    if(common.isBlank(req.query["groupId"])){
        logger.warn("Parameters missed! Expecting parameters: ", "groupId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getAuthUsersByGroupId(
        req.query["groupId"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.post("/createUser", (req, res) => {
    let requires = ["mobilePhone", "userId", "accountNo", "ip", "groupType", "nickname", "roleNo", "clientGroup", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.createUser(
        req.body,         
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/joinNewRoom", (req, res) => {
    let requires = ["mobilePhone", "userId", "groupType", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.joinNewRoom(
        req.query,         
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/updateMemberInfo", (req, res) => {
     let requires = ["mobilePhone", "userId", "accountNo", "ip", "groupType", "nickname", "roleNo", "clientGroup", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.updateMemberInfo(
        req.body,         
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/updateChatUserGroupStatus", (req, res) => {
    let requires = ["userInfo", "sendMsgCount"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["fromPlatform", "userId", "groupType", "groupId"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters in 'userInfo': ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    userService.updateChatUserGroupStatus(
        req.body["userInfo"],
        req.body["chatStatus"],
        req.body["sendMsgCount"],        
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/checkUserLogin", (req, res) => {
    let requires = ["userId", "groupType", "fromPlatform"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.checkUserLogin(
        req.query,         
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
// router.get("/getMemberByTel", (req, res) => {});
router.get("/getRoomCsUser", (req, res) => {
    if(common.isBlank(req.query["roomId"])){
        logger.warn("Parameters missed! Expecting parameters: ", "roomId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getRoomCsUser(
        req.query["roomId"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getRoomCsUserList", (req, res) => {
    if(common.isBlank(req.query["roomId"])){
        logger.warn("Parameters missed! Expecting parameters: ", "roomId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getRoomCsUserList(
        req.query["roomId"],       
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/checkRoomStatus", (req, res) => {
    let requires = ["userId", "groupId", "currCount"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.checkRoomStatus(
        req.query["userId"],
        req.query["groupId"],
        req.query["currCount"],          
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/modifyNickname", (req, res) => {
    let requires = ["mobilePhone", "groupType", "nickname"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.modifyNickname(
        req.query["mobilePhone"],
        req.query["groupType"],
        req.query["nickname"],          
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/modifyAvatar", (req, res) => {
    let requires = ["mobilePhone", "groupType", "item", "clientGroup", "userId", "ip"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.modifyAvatar(
        req.body,          
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getTeacherList", (req, res) => {
    if(common.isBlank(req.query["groupId"])){
        logger.warn("Parameters missed! Expecting parameters: ", "groupId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getTeacherList(
        req.query,          
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.get("/getTeacherByUserId", (req, res) => {
    if(common.isBlank(req.query["userId"])){
        logger.warn("Parameters missed! Expecting parameters: ", "userId");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.getTeacherByUserId(
        req.query["userId"],          
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/modifyUserName", (req, res) => {
    let requires = ["userInfo", "params"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType", "clientGroup", "userId"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        logger.warn("Your 'userInfo' is: ", JSON.stringify(req.body["userInfo"]));
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["userName", "item", "ip"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["params"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        logger.warn("Your 'params' is: ", JSON.stringify(req.body["params"]));
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.modifyUserName(
        req.body["userInfo"], req.body["params"],      
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/modifyEmail", (req, res) => {
    let requires = ["groupType", "email", "userId", "item"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    userService.modifyEmail(
        req.body,      
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
router.post("/modifyPwd", (req, res) => {
    let requires = ["userInfo", "params"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType", "clientGroup", "userId"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["password", "newPwd", "item", "ip"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["params"][name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.modifyPwd(
        req.body["userInfo"], req.body["params"],      
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getClientGroupByMId", (req, res) => {
    let requires = ["mobileArr", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    userService.getClientGroupByMId(
        req.query["mobileArr"].split(","), req.query["groupType"],      
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;