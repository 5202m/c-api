/**
 * 投资社区账户<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月15日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  账户API：
 *     1.账户基本信息查询。
 *     2.账户信息登录验证。
 *     3.新用户注册
 *     4.用户信息修改：基本资料修改+密码修改
 * </p>
 */
var express = require('express');
var router = express.Router();
var APIUtil = require('../../util/APIUtil.js');
var CommonJS = require('../../util/common.js');
var FinanceUserService = require('../../service/financeUserService.js');
var TopicService = require('../../service/topicService.js');
var MemberBalanceService = require('../../service/memberBalanceService.js');


/**
 * 查询账户基本信息
 */
router.get('/info', function(req, res) {
    APIUtil.logRequestInfo(req, "financeUserAPI");
    var loc_memberId = req.query["memberId"];
    if(!loc_memberId){
        //缺少参数
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_memberId !== "string"){
        //参数类型错误
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    FinanceUserService.getInfo(loc_memberId, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 用户登录
 */
router.post('/login', function(req, res) {
    APIUtil.logRequestInfo(req, "financeUserAPI");
    var loc_loginName = req.body["loginName"];
    var loc_loginAuth = req.body["loginAuth"];
    if(!loc_loginName){
        //缺少参数
        console.error("loginName is invalid! ", loc_loginName);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_loginName !== "string"){
        //参数类型错误
        console.error("loginName is invalid! ", loc_loginName);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    FinanceUserService.login(loc_loginName, loc_loginAuth, function(apiResult){
        res.json(apiResult);
    });
});


/**
 * 判定手机号是否存在
 */
router.post('/checkMobile', function(req, res){
    APIUtil.logRequestInfo(req, "financeUserAPI");
    var loc_mobilePhone = req.body["mobilePhone"];
    if(!loc_mobilePhone){
        //缺少参数
        console.error("mobilePhone is invalid! ", loc_mobilePhone);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_mobilePhone !== "string"){
        //参数类型错误
        console.error("mobilePhone is invalid! ", loc_mobilePhone);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    FinanceUserService.checkMobile(loc_mobilePhone, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 新用户注册
 */
router.post('/register', function(req, res){
    APIUtil.logRequestInfo(req, "financeUserAPI");
    var loc_mobilePhone = req.body["mobilePhone"];
    if(!loc_mobilePhone){
        //缺少参数
        console.error("mobilePhone is invalid! ", loc_mobilePhone);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_mobilePhone !== "string"){
        //参数类型错误
        console.error("mobilePhone is invalid! ", loc_mobilePhone);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    var loc_ip = CommonJS.getClientIp(req);

    FinanceUserService.register({
        mobilePhone : loc_mobilePhone,
        ip : loc_ip
    }, function(apiResult){
        res.json(apiResult);
    });
});

/**
 * 用户信息修改
 */
router.post('/modify', function(req, res){
    APIUtil.logRequestInfo(req, "financeUserAPI");
    var loc_opType = parseInt(req.body["opType"], 10);
    if(loc_opType !== 2 && loc_opType !== 3){
        loc_opType = 1;
    }

    var loc_memberId = req.body["memberId"];
    if(!loc_memberId){
        //缺少参数
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_memberId !== "string"){
        //参数类型错误
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    var loc_memberInfo = {memberId : loc_memberId};

    //性别
    var loc_sex = parseInt(req.body["sex"], 10);
    if(isNaN(loc_sex) === false){
        if(loc_sex !== 1){
            loc_sex = 0;
        }
        loc_memberInfo.sex = loc_sex;
    }

    //昵称
    var loc_nickName = req.body["nickName"];
    if(typeof loc_nickName === "string"){
        if(loc_nickName === ""){
            console.error("nickName is blank! ", loc_nickName);
            res.json(APIUtil.APIResult("code_2003", null, null));
            return;
        }
        loc_memberInfo.nickName = loc_nickName;
    }

    //真实姓名
    var loc_realName = req.body["realName"];
    if(typeof loc_realName === "string"){
        loc_memberInfo.realName = loc_realName;
    }

    //地址
    var loc_address = req.body["address"];
    if(typeof loc_address === "string"){
        loc_memberInfo.address = loc_address;
    }

    //头像URL
    var loc_avatar = req.body["avatar"];
    if(typeof loc_avatar === "string"){
        loc_memberInfo.avatar = loc_avatar;
    }

    //个性签名
    var loc_introduce = req.body["introduce"];
    if(typeof loc_introduce === "string"){
        loc_memberInfo.introduce = loc_introduce;
    }

    var loc_newPassword = req.body["newPassword"];
    if(typeof loc_newPassword === "string"){
        loc_memberInfo.newPassword = loc_newPassword;
    }

    //最开始注册时可以修改密码
    if(loc_opType === 1 && Object.keys(loc_memberInfo).length === 1){
        //参数类型错误
        console.error("there is no change any information! ", loc_memberInfo.memberId);
        res.json(APIUtil.APIResult("code_2003", null, null));
        return;
    }

    var loc_password = req.body["password"];
    if(typeof loc_password === "string"){
        loc_memberInfo.password = loc_password;
    }

    if(loc_opType === 2){
        if(!loc_memberInfo.newPassword || !loc_memberInfo.password){
            console.error("修改密码时密码和新密码均不能为空! ", loc_password, loc_newPassword);
            res.json(APIUtil.APIResult("code_2001", null, null));
            return;
        }
    }else if(loc_opType === 3){
        if(!loc_memberInfo.password){
            console.error("找回密码时密码均不能为空! ", loc_password, loc_newPassword);
            res.json(APIUtil.APIResult("code_2001", null, null));
            return;
        }
        loc_memberInfo.newPassword = loc_memberInfo.password;
        delete loc_memberInfo["password"];
    }

    loc_memberInfo.ip = CommonJS.getClientIp(req);

    FinanceUserService.modify(loc_opType, loc_memberInfo, function(apiResult){
        res.json(apiResult);
    });
});


/**
 * 关注/取消关注
 * opType 1-关注，2-取消关注，默认为1
 */
router.post('/attention', function(req, res){
    APIUtil.logRequestInfo(req, "financeUserAPI");
    var loc_memberId = req.body["memberId"];
    if(!loc_memberId){
        //缺少参数
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_memberId !== "string"){
        //参数类型错误
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    var loc_attentionId = req.body["attentionId"];
    if(!loc_attentionId){
        //缺少参数
        console.error("attentionId is invalid! ", loc_attentionId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_attentionId !== "string"){
        //参数类型错误
        console.error("attentionId is invalid! ", loc_attentionId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }

    //1-关注，2-取消关注，默认为1
    var loc_opType = parseInt(req.body["opType"], 10);
    if(loc_opType === 2){
        FinanceUserService.undoAttention(loc_memberId, loc_attentionId, function(apiResult){
            res.json(apiResult);
        });
    }else{
        FinanceUserService.doAttention(loc_memberId, loc_attentionId, function(apiResult){
            res.json(apiResult);
        });
    }
});


/**
 * 关注/取消关注
 * opType 1-关注列表，2-粉丝列表，默认为1
 */
router.get('/attentionList', function(req, res){
    APIUtil.logRequestInfo(req, "financeUserAPI");
    var loc_memberId = req.query["memberId"];
    if(!loc_memberId){
        //缺少参数
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2001", null, null));
        return;
    }
    if(typeof loc_memberId !== "string"){
        //参数类型错误
        console.error("memberId is invalid! ", loc_memberId);
        res.json(APIUtil.APIResult("code_2002", null, null));
        return;
    }
    //1-关注列表，2-粉丝列表，默认为1
    var loc_opType = parseInt(req.query["opType"], 10);
    if(loc_opType !== 2){
        loc_opType = 1;
    }
    var loc_pageLast = req.query["pageLast"];
    var loc_pageSize = req.query["pageSize"];
    TopicService.attentionList(loc_opType, loc_memberId, loc_pageLast, loc_pageSize, function(apiResult){
        res.json(apiResult);
    });
});

module.exports = router;