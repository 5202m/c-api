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
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage.js');
var chatService = require('../../service/chatService');
var userService = require('../../service/userService');
var ApiResult = require('../../util/ApiResult');

/**
 * @api {get} /chat/getMessageList 获取聊天信息
 * @apiName getMessageList
 * @apiGroup chat
 *
 * @apiParam {Number} pageNo 需要获取的分页.
 * @apiParam {String} [pageSize] 每页的大小.
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Array} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getMessageList.json
 * @apiExample Example usage:
 *  /api/chat/getMessageList.json?pageNumber=1
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "msg": "OK",
 *          "pageNo": 1,
 *          "pageSize": 15,
 *          "totalRecords": 0,
 *          "data": [
 *          ]
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.get(/^\/getMessageList(\.(json|xml))?$/, function(req, res) {
    var params=req.query;
    if(!params.pageNo||params.pageNo <= 0){
        params.pageNo = 1;
    }
    params.pageNo=parseInt(params.pageNo);
    params.pageSize=parseInt(params.pageSize)||15;
    if(isNaN(params.pageNo)||isNaN(params.pageSize)){
        if(req.path.indexOf('.xml')!=-1){
            res.end(ApiResult.result(errorMessage.code_1000,null,ApiResult.dataType.xml));
        }else{
            res.json(ApiResult.result(errorMessage.code_1000));
        }
    }else{
        chatService.getMessagePage(params,function(page){
            if(req.path.indexOf('.xml')!=-1){
                res.end(ApiResult.result(null,page,ApiResult.dataType.xml));
            }else{
                res.json(ApiResult.result(null,page));
            }
        });
    }
});



/**
 * @api {get} /chat/getMemberInfo 获取成员信息。
 * @apiName getMemberInfo
 * @apiGroup chat
 *
 * @apiParam {String} groupType 成员类型，如果此参数为空，mobilePhone和userId就必须不为空。
 * @apiParam {String} [mobilePhone] 手机号码，此参数必须与userId任选其一。
 * @apiParam {String} [userId] 成员的用户ID，此参数必须与mobilePhone任选其一。
 *
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getMemberInfo
 * @apiExample Example usage:
 *  /api/chat/getMemberInfo?groupType=studio&mobilePhone=18122056986
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *     "mobilePhone": "18122056986",
 *     "groupType": "studio",
 *     "userId": "uxnxiipcvfnvi",
 *     "avatar": "http://192.168.35.91:8090/upload/pic/header/chat/front/201612/20161227165127_54726532.jpg",
 *     "nickname": "无码救赎",
 *     "userType": 0,
 *     "vipUser": false,
 *     "clientGroup": "register",
 *     "createDate": 1481527079817,
 *      - "rooms": [
 *          - {
 *             "roomId": "studio_teach",
 *             "onlineStatus": 1,
 *             "sendMsgCount": 0,
 *             "onlineDate": 1484545992220,
 *             "offlineDate": 1484545990928
 *         },
 *          - {
 *             "roomId": "studio_42",
 *             "onlineStatus": 0,
 *             "sendMsgCount": 0,
 *             "onlineDate": 1482904540821,
 *             "offlineDate": 1482904667222
 *         }
 *     ]
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getMemberInfo", function(req, res) {
    var params = {
        groupType : req.query["groupType"],
        mobilePhone : req.query["mobilePhone"],
        userId : req.query["userId"]
    };
    if(common.isBlank(params.groupType)||(common.isBlank(params.mobilePhone)&&common.isBlank(params.userId))){
        res.json(ApiResult.result(errorMessage.code_1000));
    }else{
        userService.getMemberInfo(params, function(err, member){
            res.json(member);
        });
    }
});

/**
 * @api {get} /chat/getRoomOnlineTotalNum 获取房间的在线人数
 * @apiName getRoomOnlineTotalNum
 * @apiGroup chat
 *
 * @apiParam {String} groupId 分组ID
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Number} data  返回的数据
 *
 * @apiSampleRequest /api/chat/getRoomOnlineTotalNum
 * @apiExample Example usage:
 *  /api/chat/getRoomOnlineTotalNum?groupId=fxstudio_11
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": 0,
 *  "msg": "OK",
 *  "data": 0
 * }
 *
 * @apiUse ParametersMissedError
 */
router.get("/getRoomOnlineTotalNum", function(req, res) {
    var groupId = req.query["groupId"];
    if(!groupId){
        res.json(ApiResult.result(errorMessage.code_1000, null));
        return;
    }
    chatService.getRoomOnlineTotalNum(groupId, function(data){
        res.json(ApiResult.result(null, data));
    });
});

module.exports = router;
