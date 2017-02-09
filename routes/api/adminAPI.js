/**
 * @apiDefine ParametersMissedError
 *
 * @apiError ParametersMissed 参数没有传完整，无法完成请求。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "result": "1000",
 *      "msg": "没有指定参数!"
 *  }
 */
/**
 * @apiDefine ParametersDataBrokenError
 * 
 * @apiError ParametersDataBroken 参数数据格式错误，无法完成请求。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "result": "2003",
 *      "msg": "参数数据错误！"
 *  } 
 */
/**
 * @apiDefine CommonResultDescription
 * 
 * @apiSuccess {Number} result 结果码，0 - 成功；-1 - 未知或未定义的错误；other - API系统定义的错误
 * @apiSuccess {String} errmsg  错误信息.
 * @apiSuccess {Number} errcode  错误码.
 */
const express = require('express');
const router = express.Router();
const common = require('../../util/common');
const errorMessage = require('../../util/errorMessage.js');
const adminService = require('../../service/adminService');
const APIUtil = require('../../util/APIUtil');

/**
 * @api {post} /admin/checkSystemUserInfo 获取房间的在线人数
 * @apiName checkSystemUserInfo
 * @apiGroup admin
 *
 * @apiParam {String} userNo 用户号
 * @apiParam {String} password 密码
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/admin/checkSystemUserInfo
 * @apiExample Example usage:
 *  /api/admin/checkSystemUserInfo?userNo=admin&password=11111111
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "result": 0,
 *     "errcode": "0",
 *     "errmsg": "",
 *     "data": {
 *         "userType": 0,
 *         "isOK": false,
 *         "nickname": ""
 *     }
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/checkSystemUserInfo", (req, res) => {
    let requires = ["userNo", "password"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[checkSystemUserInfo] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }

    adminService.checkSystemUserInfo(
        req.body.userNo, 
        req.body.password,         
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {post} /admin/updateMember 更新成员信息
 * @apiName updateMember
 * @apiGroup admin
 *
 * @apiParam {String} userId 用户唯一ID
 * @apiParam {String} nickname 用户昵称
 * @apiParam {String} userType 用户类型
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/admin/updateMember
 * @apiExample Example usage:
 *  /api/admin/updateMember
 * {userId: "92000871", nickname: "测试专用", userType: 0}
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/updateMember", (req, res) => {
    let requires = ["userId", "nickname", "userType"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[updateMember] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    adminService.updateMember(
        req.body,
        (isSuccess) => {
            res.json(APIUtil.APIResult(null, {isOK: isSuccess}));
        }
    );

});
/**
 * @api {get} /admin/getChatGroupListByAuthUser 根据用户名获取用户聊天组列表
 * @apiName getChatGroupListByAuthUser
 * @apiGroup admin
 *
 * @apiParam {String} userId 用户唯一ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/admin/getChatGroupListByAuthUser
 * @apiExample Example usage:
 *  /api/admin/getChatGroupListByAuthUser?userId=Eugene_ana
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "result": 0,
 *     "errcode": "0",
 *     "errmsg": "",
 *     "data": [{
 *             "_id": "fxstudio_11",
 *             "groupType": "fxstudio",
 *             "name": "GWFX在线教育"
 *         }, {
 *             "_id": "studio_42",
 *             "groupType": "studio",
 *             "name": "新手专区"
 *         }
 *     ]
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getChatGroupListByAuthUser", (req, res) => {
    let requires = ["userId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("[getChatGroupListByAuthUser] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    adminService.getChatGroupListByAuthUser(
        req.query.userId,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {get} /admin/getChatGroupRoomsList 获取聊天室列表
 * @apiName getChatGroupRoomsList
 * @apiGroup admin
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/admin/getChatGroupRoomsList
 * @apiExample Example usage:
 *  /api/admin/getChatGroupRoomsList
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "result": 0,
 *     "errcode": "0",
 *     "errmsg": "",
 *     "data": [{
 *             "_id": "D150804B000059",
 *             "code": "studio",
 *             "nameCN": "PM直播间",
 *             "nameTW": "PM直播间",
 *             "nameEN": "PM直播间",
 *             "systemCategory": "pm",
 *             "updateUser": "sys_super",
 *             "updateIp": "127.0.0.1",
 *             "updateDate": "2016-11-29T09:27:03.593Z",
 *             "sort": 2,
 *             "status": 1,
 *             "valid": 1
 *         }, {
 *             "_id": "D160601B000094",
 *             "code": "fxstudio",
 *             "nameCN": "FX直播间",
 *             "nameTW": "FX直播间",
 *             "nameEN": "FX直播间",
 *             "systemCategory": "fx",
 *             "updateUser": "sys_super",
 *             "updateIp": "127.0.0.1",
 *             "updateDate": "2016-11-29T09:27:08.663Z",
 *             "sort": 3,
 *             "status": 1,
 *             "valid": 1
 *         }
 *     ]
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getChatGroupRoomsList", (req, res) => {
    adminService.getChatGroupRoomsList(
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {post} /admin/setUserGag 设置禁言用户
 * @apiName setUserGag
 * @apiGroup admin
 *
 * @apiParam {String} userId 用户唯一ID
 * @apiParam {String} groupType 用户组类型
 * @apiParam {String} groupId 用户组唯一ID
 * @apiParam {String} gagDate 禁言日期
 * @apiParam {String} gagTips 禁言提示
 * @apiParam {String} gagRemark 用户唯一ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/admin/setUserGag
 * @apiExample Example usage:
 *  /api/admin/setUserGag
 * {
 *     userId: "92000871",
 *     groupType: "fxstudio",
 *     groupId: "fxstudio_11",
 *     gagDate: {
 *         startDate: "2017-01-23"
 *     },
 *     gagTips: "Getout",
 *     gagRemark: "xxx"
 * }
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "result": 0,
 *     "errcode": "0",
 *     "errmsg": "",
 *     "data": {isOK: true}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/setUserGag", (req, res) => {
    let requires = ["userId", "groupType", "groupId", "gagDate", "gagTips", "gagRemark"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[setUserGag] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    adminService.setUserGag(
        req.body,
        (isSuccess) => {
            res.json(APIUtil.APIResult(null, {isOK: isSuccess}));
        }
    );
});
/**
 * @api {post} /admin/setVisitorGag 设置禁言游客临时用户
 * @apiName setVisitorGag
 * @apiGroup admin
 *
 * @apiParam {String} userId 用户唯一ID
 * @apiParam {String} groupType 用户组类型
 * @apiParam {String} groupId 用户组唯一ID
 * @apiParam {String} type 规则类型 - speak_not_allowed
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/admin/setVisitorGag
 * @apiExample Example usage:
 *  /api/admin/setVisitorGag
 * {
 *     userId: "visitor_92000871",
 *     groupType: "fxstudio",
 *     groupId: "fxstudio_11"
 *     type: "speak_not_allowed"
 * }
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "result": 0,
 *     "errcode": "0",
 *     "errmsg": "",
 *     "data": {isOk: false, isIn: true, msg: '已存在禁言列表中'}
 * }
 *
 * @apiUse ParametersMissedError
 */
router.post("/setVisitorGag", (req, res) => {
    let requires = ["groupType", "groupId", "userId", "type"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.body[name]);
    });
    if(!isSatify){
        logger.warn("[setVisitorGag] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    adminService.setVisitorGag(
        req.body,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});
/**
 * @api {get} /admin/getUserGag  获取禁言设置数据
 * @apiName getUserGag
 * @apiGroup admin
 *
 * @apiParam {String} userId 用户唯一ID
 * @apiParam {String} groupType 用户组类型
 * @apiParam {String} groupId 用户组唯一ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/admin/getUserGag
 * @apiExample Example usage:
 *  /api/admin/getUserGag?userId=pxnxidpuxpcpv&groupType=studio&groupId=studio_teach
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "result": 0,
 *     "errcode": "0",
 *     "errmsg": "",
 *     "data": {
 *         "_id": "studio_teach",
 *         "onlineDate": "2016-01-26T08:23:31.653Z",
 *         "gagDate": "{\"beginDate\":\"2015-09-01\",\"endDate\":\"2015-09-01\",\"weekTime\":[{\"week\":\"\",\"beginTime\":\"10:08:57\",\"endTime\":\"10:15:01\"}]}",
 *         "gagTips": "当哑巴",
 *         "gagRemark": "",
 *         "offlineDate": "2016-02-25T10:15:18.196Z",
 *         "sendMsgCount": 22,
 *         "onlineStatus": 0
 *     }
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getUserGag", (req, res) => {
    let requires = ["groupType", "groupId", "userId"];
    let isSatify = requires.every((name) => {
        return common.isValid(req.query[name]);
    });
    if(!isSatify){
        logger.warn("[getUserGag] Parameters missed! Expecting parameters: ", requires);
        res.json(APIUtil.APIResult("code_1000", null));
        return;
    }
    adminService.getUserGag(
        req.query,
        (data) => {
            res.json(APIUtil.APIResult(null, data));
        }
    );
});

module.exports = router;