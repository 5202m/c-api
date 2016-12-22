"use strict";
let logger =require("../../resources/logConf").getLogger("userAPI");
let express = require('express');
let router = express.Router();
let userService = require('../../service/userService');
let common = require('../../util/common');
let APIUtil = require('../../util/APIUtil.js');

router.get("/getUserInfo", (req, res) => {
    if(common.isBlank(req.query["id"])){
        logger.warn("[getUserInfo] Parameters missed! Expecting parameters: ", "id");
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
        logger.warn("[getUserInfoByUserNo] Parameters missed! Expecting parameters: ", "userNo");
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
        logger.warn("[getUserList] Parameters missed! Expecting parameters: ", "userNOs");
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
        logger.warn("[batchOfflineStatus] Parameters missed! Expecting parameters: ", "roomId");
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
router.post("/verifyRule", (req, res) => {
    let requires = ["clientGroup", "nickname", "isWh", "userType", "groupId", "content"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[verifyRule] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.verifyRule(
        req.body["clientGroup"],
        req.body["nickname"],
        req.body["isWh"], 
        req.body["userType"],
        req.body["groupId"],   
        req.body["content"],         
        (data) => {
            res.json(APIUtil.APIResultFromData(data));
        }
    );
});
router.get("/getMemberList", (req, res) => {
    if(common.isBlank(req.query["id"])){
        logger.warn("[getMemberList] Parameters missed! Expecting parameters: ", "id");
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
        logger.warn("[getAuthUsersByGroupId] Parameters missed! Expecting parameters: ", "groupId");
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
    let requires = ["groupType", "groupId", "accountNo", "mobilePhone"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        console.log(req.body);
        logger.warn("[createUser] Parameters missed! Expecting parameters: ", requires);
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
        logger.warn("[joinNewRoom] Parameters missed! Expecting parameters: ", requires);
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
     let requires = ["groupType", "nickname", "clientGroup", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        console.log(req.body);
        logger.warn("[updateMemberInfo] Parameters missed! Expecting parameters: ", requires);
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
    if(common.isBlank(req.body["userInfo"])){
        logger.warn("[updateChatUserGroupStatus] Parameters missed! Expecting parameters: ", "userInfo");
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    let requires = ["userId", "groupType", "groupId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        console.log(req.body["userInfo"]);
        logger.warn("[updateChatUserGroupStatus] Parameters missed! Expecting parameters in 'userInfo': ", requires);
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
    let requires = ["userId", "groupType"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("[checkUserLogin] Parameters missed! Expecting parameters: ", requires);
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
        logger.warn("[getRoomCsUser] Parameters missed! Expecting parameters: ", "roomId");
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
        logger.warn("[getRoomCsUserList] Parameters missed! Expecting parameters: ", "roomId");
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
    let requires = ["groupId", "currCount"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("[checkRoomStatus] Parameters missed! Expecting parameters: ", requires);
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
router.post("/modifyNickname", (req, res) => {
    let requires = ["mobilePhone", "groupType", "nickname"];
    let isSatify = requires.some((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[modifyNickname] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    
    userService.modifyNickname(
        req.body["mobilePhone"],
        req.body["groupType"],
        req.body["nickname"],          
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
        logger.warn("[modifyAvatar] Parameters missed! Expecting parameters: ", requires);
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
        logger.warn("[getTeacherList] Parameters missed! Expecting parameters: ", "groupId");
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
        logger.warn("[getTeacherByUserId] Parameters missed! Expecting parameters: ", "userId");
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
        logger.warn("[modifyUserName] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType", "clientGroup", "userId"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        logger.warn("[modifyUserName] Parameters missed! Expecting parameters: ", requires);
        logger.warn("Your 'userInfo' is: ", JSON.stringify(req.body["userInfo"]));
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["userName", "ip"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["params"][name]);
    });
    if(!isSatify){
        logger.warn("[modifyUserName] Parameters missed! Expecting parameters: ", requires);
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
        logger.warn("[modifyEmail] Parameters missed! Expecting parameters: ", requires);
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
        logger.warn("[modifyPwd] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["mobilePhone", "groupType", "clientGroup", "userId"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["userInfo"][name]);
    });
    if(!isSatify){
        logger.warn("[modifyPwd] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    requires = ["password", "newPwd", "item", "ip"];
    isSatify = requires.every((name) => {
        return common.isValid(req.body["params"][name]);
    });
    if(!isSatify){
        logger.warn("[modifyPwd] Parameters missed! Expecting parameters: ", requires);
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
        logger.warn("[getClientGroupByMId] Parameters missed! Expecting parameters: ", requires);
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