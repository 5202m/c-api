/**
 * 投资社区--账户<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月15日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  账户服务类
 * </p>
 */
var Member = require('../models/member.js');
var APIUtil = require('../util/APIUtil.js');
var Utils = require('../util/Utils.js');
var Config=require('../resources/config.js');
var ObjectId = require('mongoose').Types.ObjectId;
var MemberBalanceService = require('../service/memberBalanceService.js');

var financeUserService = {
    /**
     * 默认会员信息
     */
    DEFAULT_USER_INFO : {
        sex : 0,
        avatar : "/upload/pic/201507/default_member_avatar.png",
        userGroup : 1,
        password : "",
        nickName : "",
        createUser : 'admin',
        updateUser : 'admin'
    },

    /**投资社区查询有效字段名*/
    queryFields : [
        "_id",
        "mobilePhone",
        "loginPlatform.financePlatForm"
    ],

    /**
     * 转化member信息
     * @param member
     */
    convertInfo : function(member){
        var loc_userInfo = {
            memberId : member._id,
            mobilePhone : member.mobilePhone
        };
        if(!!member.loginPlatform && !!member.loginPlatform.financePlatForm){
            var loc_financePlatForm = member.loginPlatform.financePlatForm;
            loc_userInfo.nickName = loc_financePlatForm.nickName;
            loc_userInfo.realName = loc_financePlatForm.realName;
            loc_userInfo.sex = loc_financePlatForm.sex;
            loc_userInfo.avatar = loc_financePlatForm.avatar;
            loc_userInfo.address = loc_financePlatForm.address;
            loc_userInfo.introduce = loc_financePlatForm.introduce;
            loc_userInfo.bindPlatformList = loc_financePlatForm.bindPlatformList;
            loc_userInfo.userGroup = loc_financePlatForm.userGroup;
            loc_userInfo.isRecommend = loc_financePlatForm.isRecommend;
            loc_userInfo.registerDate = loc_financePlatForm.registerDate instanceof Date ? loc_financePlatForm.registerDate.getTime() : 0;
            loc_userInfo.beAttentionsCount = loc_financePlatForm.beAttentions instanceof Array ? loc_financePlatForm.beAttentions.length : 0;
            loc_userInfo.attentions = loc_financePlatForm.attentions instanceof Array ? loc_financePlatForm.attentions : [];
            loc_userInfo.attentionsCount = loc_userInfo.attentions.length;
            loc_userInfo.collects = loc_financePlatForm.collects instanceof Array ? loc_financePlatForm.collects : [];
            loc_userInfo.topicCount = loc_financePlatForm.topicCount;
            loc_userInfo.replyCount = loc_financePlatForm.replyCount;
        }
        return loc_userInfo;
    },

    /**
     * 查询账户信息
     * @param memberId
     * @param callback
     */
    getInfo : function(memberId, callback){
        financeUserService.getMemberById(memberId, function(err, member){
            if(err){
                console.error("查询账户信息失败!", err);
                callback(APIUtil.APIResult("code_2010", null, null));
                return;
            }
            if(!member){
                callback(APIUtil.APIResult(null, null, null));
            }else{
                var tempMember = financeUserService.convertInfo(member.toObject());
                MemberBalanceService.find(member._id,function(err,data){
                    if(err){
                        console.error("查询会员统计信息失败！", err);
                        return;
                    }
                    tempMember.balance = data.balance;
                    tempMember.percentYield = data.percentYield;
                    tempMember.rateWin = !data.timesOpen ? 0 : Utils.accDiv(data.timesFullyProfit, data.timesOpen);
                    callback(APIUtil.APIResult(null,tempMember, null));
                });
            }
        });
    },

    /**
     * 登录校验
     * @param loginName
     * @param loginAuth
     * @param callback
     */
    login : function(loginName, loginAuth, callback){
        var searchObj = {
            valid : 1,
            status : 1,
            "loginPlatform.financePlatForm" : {$exists: true},
            "loginPlatform.financePlatForm.isDeleted" : 1,
            "loginPlatform.financePlatForm.status" : 1
        };
        //如果密码为空的时候，loginName只能传入手机号（用于动态密码登录）
        if(loginAuth){
            searchObj["loginPlatform.financePlatForm.password"] = loginAuth;
            searchObj["$or"] = [
                {"mobilePhone" : loginName},
                {"loginPlatform.financePlatForm.nickName" : loginName},
                {"loginPlatform.financePlatForm.bindPlatformList.bindAccountNo" : loginName}
            ];
        }else{
            searchObj["mobilePhone"] = loginName;
        }

        APIUtil.DBFindOne(Member, {
            query : searchObj,
            fieldIn : financeUserService.queryFields
        }, function(err, member){
            if(err){
                console.error("查询账户信息失败!", err);
                callback(APIUtil.APIResult("code_2010", null, null));
                return;
            }
            if(!member){
                //用户名密码错误
                callback(APIUtil.APIResult("code_2004", null, null));
            }else{
                var tempMember = financeUserService.convertInfo(member.toObject());
                MemberBalanceService.find(member._id,function(err,data){
                    if(err){
                        console.error("查询会员统计信息失败！", err);
                        return;
                    }
                    tempMember.balance = data.balance;
                    tempMember.percentYield = data.percentYield;
                    tempMember.rateWin = !data.timesOpen ? 0 : Utils.accDiv(data.timesFullyProfit, data.timesOpen);
                    callback(APIUtil.APIResult(null,tempMember, null));
                });
            }
        });
    },

    /**
     * 校验手机号是否存在
     * @param mobilePhone
     * @param callback
     */
    checkMobile : function(mobilePhone, callback){
        APIUtil.DBFindOne(Member, {
            query : {
                "mobilePhone" : mobilePhone,
                "valid" : 1,
                "loginPlatform.financePlatForm.isDeleted" : 1
            }
        }, function(err, member){
            if(err){
                console.error("查询账户信息失败!", err);
                callback(APIUtil.APIResult("code_2010", null, null));
                return;
            }
            var loc_resultData = {
                isExist : 0,
                memberId : ""
            };

            if(member){
                loc_resultData = {
                    isExist : 1,
                    memberId : member._id.toString()
                };
            }
            callback(APIUtil.APIResult(null, loc_resultData, null));
        });
    },

    /**
     * 用户注册
     * @param memberInfo  {{mobilePhone: string, ip: string}}
     * @param callback
     */
    register : function(memberInfo, callback){
        var searchObj = {
            "valid" : 1,
            "mobilePhone" : memberInfo.mobilePhone
        };

        APIUtil.DBFindOne(Member, {query : searchObj}, function(err, member){
            if(err){
                console.error("查询账户信息失败!", err);
                callback(APIUtil.APIResult("code_2010", null, null));
                return;
            }
            //手机号存在
            var loc_timeNow = new Date();
            if(member && member._id){
                //投资社区信息存在
                if(member && member._id && member.loginPlatform && member.loginPlatform.financePlatForm  && member.loginPlatform.financePlatForm.isDeleted === 1){
                    console.error("该手机号用户已经存在!", member._id);
                    callback(APIUtil.APIResult("code_2027", null, null));
                    return;
                }else{
                    var loc_financePlatForm = {//投资社区
                        nickName : financeUserService.DEFAULT_USER_INFO.nickName,
                        realName : '',
                        password : financeUserService.DEFAULT_USER_INFO.password,
                        sex : financeUserService.DEFAULT_USER_INFO.sex,
                        avatar : Config.filesDomain+financeUserService.DEFAULT_USER_INFO.avatar,
                        address : '',
                        introduce : '',
                        bindPlatformList : [],
                        userGroup : financeUserService.DEFAULT_USER_INFO.userGroup,
                        isRecommend : 0,
                        registerDate : loc_timeNow,
                        loginSystem : '',
                        isDeleted : 1,
                        isBack : 0,
                        status : 1,
                        attentions : [],
                        beAttentions : [],
                        topicCount : 0,
                        collects : [],
                        isGag : 0
                    };
                    Member.findOneAndUpdate({"_id" : member._id}, {
                        $set : {
                            "loginPlatform.financePlatForm" : loc_financePlatForm,
                            "status" : 1,
                            updateIp:memberInfo.ip,
                            updateUser:financeUserService.DEFAULT_USER_INFO.updateUser,
                            updateDate:loc_timeNow
                        }
                    }, function(err, member) {
                        if (err) {
                            console.error("更新用户信息失败！", err);
                            callback(APIUtil.APIResult("code_2030", null, null));
                            return;
                        }
                        if (member === null) {
                            console.error("更新用户信息失败，待更新用户信息不存在！", memberInfo);
                            callback(APIUtil.APIResult("code_2030", null, null));
                            return;
                        }
                        MemberBalanceService.rebuild(member._id.toString(), memberInfo.ip, function(err){
                            if(err){
                                console.error("更新用户信息失败--注册资产信息失败: mobilePhone=%s！", memberInfo.mobilePhone, err);
                                callback(APIUtil.APIResult("code_2030", null, null));
                                return;
                            }
                            callback(APIUtil.APIResult(null, {memberId : member._id}, null));
                        });
                    });
                }
            }else{
                var loc_member = new Member({
                    _id : new ObjectId(),
                    mobilePhone: memberInfo.mobilePhone ,
                    valid: 1,
                    status: 1,
                    createUser:financeUserService.DEFAULT_USER_INFO.createUser,
                    createIp:memberInfo.ip,
                    createDate:loc_timeNow,
                    updateIp:memberInfo.ip,
                    updateUser:financeUserService.DEFAULT_USER_INFO.updateUser,
                    updateDate:loc_timeNow,
                    loginPlatform : {
                        chatUserGroup:[],
                        financePlatForm : {//投资社区
                            nickName : financeUserService.DEFAULT_USER_INFO.nickName,
                            realName : '',
                            password : financeUserService.DEFAULT_USER_INFO.password,
                            sex : financeUserService.DEFAULT_USER_INFO.sex,
                            avatar : Config.filesDomain+financeUserService.DEFAULT_USER_INFO.avatar,
                            address : '',
                            introduce : '',
                            bindPlatformList : [],
                            userGroup : financeUserService.DEFAULT_USER_INFO.userGroup,
                            isRecommend : 0,
                            registerDate : loc_timeNow,
                            loginSystem : '',
                            isDeleted : 1,
                            isBack : 0,
                            status : 1,
                            attentions : [],
                            beAttentions : [],
                            topicCount : 0,
                            collects : [],
                            isGag : 0
                        }
                    }
                });

                loc_member.save(function(err, loc_member){
                    if(err){
                        console.error("新用户注册失败: mobilePhone=%s！", memberInfo.mobilePhone, err);
                        callback(APIUtil.APIResult("code_2029", null, null));
                        return;
                    }
                    MemberBalanceService.rebuild(loc_member._id.toString(), memberInfo.ip, function(err){
                        if(err){
                            console.error("新用户注册失败--注册资产信息失败: mobilePhone=%s！", memberInfo.mobilePhone, err);
                            callback(APIUtil.APIResult("code_2029", null, null));
                            return;
                        }
                        console.info("新用户注册成功: memberId=%s！", loc_member._id);
                        callback(APIUtil.APIResult(null, {memberId : loc_member._id}, null));
                    });
                });
            }
        });
    },

    /**
     * 关注
     * @param memberId 账户Id
     * @param attentionId 被关注账户Id
     * @param callback
     */
    doAttention : function(memberId, attentionId, callback){
        var loc_searchObj = {
            "_id" : memberId,
            "valid" : 1,
            "status" : 1,
            "loginPlatform.financePlatForm" : {$exists: true},
            "loginPlatform.financePlatForm.isDeleted" : 1,
            "loginPlatform.financePlatForm.attentions" : {$ne : attentionId}
        };
        Member.findOneAndUpdate(loc_searchObj, {$push: {"loginPlatform.financePlatForm.attentions": attentionId }}, function(err){
            if (err) {
                console.error("添加关注失败！", err);
                callback(APIUtil.APIResult("code_2032", null, null));
                return;
            }

            var loc_searchObj = {
                "_id" : attentionId,
                "valid" : 1,
                "status" : 1,
                "loginPlatform.financePlatForm" : {$exists: true},
                "loginPlatform.financePlatForm.isDeleted" : 1,
                "loginPlatform.financePlatForm.beAttentions" : {$ne : memberId}
            };
            Member.findOneAndUpdate(loc_searchObj, {$push: {"loginPlatform.financePlatForm.beAttentions": memberId }}, function(err){
                if (err) {
                    console.error("添加关注失败！", err);
                    callback(APIUtil.APIResult("code_2032", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, null, null));
            });
        });
    },

    /**
     * 取消关注
     * @param memberId 账户Id
     * @param attentionId 被关注账户Id
     * @param callback
     */
    undoAttention : function(memberId, attentionId, callback){
        var loc_searchObj = {
            "_id" : memberId,
            "valid" : 1,
            "status" : 1,
            "loginPlatform.financePlatForm" : {$exists: true},
            "loginPlatform.financePlatForm.isDeleted" : 1,
            "loginPlatform.financePlatForm.attentions" : attentionId
        };
        Member.findOneAndUpdate(loc_searchObj, {$pull: {"loginPlatform.financePlatForm.attentions": attentionId }}, function(err){
            if (err) {
                console.error("取消关注失败！", err);
                callback(APIUtil.APIResult("code_2031", null, null));
                return;
            }

            var loc_searchObj = {
                "_id" : attentionId,
                "valid" : 1,
                "status" : 1,
                "loginPlatform.financePlatForm" : {$exists: true},
                "loginPlatform.financePlatForm.isDeleted" : 1,
                "loginPlatform.financePlatForm.beAttentions" : memberId
            };
            Member.findOneAndUpdate(loc_searchObj, {$pull: {"loginPlatform.financePlatForm.beAttentions": memberId }}, function(err, data){
                if (err) {
                    console.error("取消关注失败！", err);
                    callback(APIUtil.APIResult("code_2031", null, null));
                    return;
                }
                callback(APIUtil.APIResult(null, null, null));
            });
        });
    },

    /**
     * 关注/粉丝列表
     * @param opType 1-关注列表、2-粉丝列表
     * @param memberId
     * @param pageLast
     * @param pageSize
     * @param callback
     */
    getAttentionList : function(opType, memberId, pageLast, pageSize, callback){
        financeUserService.getMemberById(memberId, function(err, member){
            if (err) {
                console.error("查询账户信息失败！", err);
                callback("code_2010", null, null);
                return;
            }
            var loc_page = APIUtil.getPageInfo(pageLast, pageSize);
            if(!member){
                callback(null, [], loc_page);
                return;
            }
            var loc_memberIds = opType === 1 ? member.loginPlatform.financePlatForm.attentions : member.loginPlatform.financePlatForm.beAttentions;
            loc_memberIds = APIUtil.getPageListByArr(loc_memberIds, loc_page, true, function(item){return item;});
            if(loc_memberIds.length === 0){
                callback(null, [], loc_page);
                return;
            }
            financeUserService.getMemberInfoByMemberIds(loc_memberIds, function(err, members){
                if (err) {
                    console.error("查询关注/粉丝列表失败！", err);
                    callback("code_2010", null, null);
                    return;
                }

                var loc_members = [];
                var loc_financePlatForm = null;
                var lenI = members ? members.length : 0;
                for(var j = 0, lenJ = loc_memberIds.length; j < lenJ; j++){
                    for(var i = 0; i < lenI; i++){
                        loc_financePlatForm = members[i].loginPlatform.financePlatForm;
                        if(members[i]._id.toString() === loc_memberIds[j]){
                            loc_members.push({
                                memberId : members[i]._id.toString(),
                                nickName : loc_financePlatForm.nickName,
                                introduce : loc_financePlatForm.introduce,
                                avatar : loc_financePlatForm.avatar,
                                beAttentionsCount : loc_financePlatForm.beAttentions instanceof Array ? loc_financePlatForm.beAttentions.length : 0,
                                attentionsCount : loc_financePlatForm.attentions instanceof Array ? loc_financePlatForm.attentions.length : 0,
                                topic : null
                            });
                            break;
                        }
                    }
                }

                callback(null, loc_members, loc_page);
            });
        });
    },

    /**
     * 按照客户ID获取客户信息
     * @param memberIds
     * @param callback
     */
    getMemberInfoByMemberIds : function(memberIds, callback){
        if((memberIds instanceof Array) === false || memberIds.length === 0){
            callback(null, []);
            return;
        }
        APIUtil.DBFind(Member,{
            query : {
                valid : 1,
                status : 1,
                _id : {$in : memberIds},
                "loginPlatform.financePlatForm" : {$exists: true},
                "loginPlatform.financePlatForm.isDeleted" : 1,
                "loginPlatform.financePlatForm.status" : 1
            },
            fieldIn : ["_id", "mobilePhone", "loginPlatform.financePlatForm"]
        }, callback);
    },

    /**
     * 按照memberId查询单个用户信息
     * @param memberId
     * @param callback
     */
    getMemberById : function(memberId, callback){
        if(!memberId){
            callback(null, null);
            return;
        }
        APIUtil.DBFindOne(Member,{
            query : {
                valid : 1,
                status : 1,
                _id : memberId,
                "loginPlatform.financePlatForm" : {$exists: true},
                "loginPlatform.financePlatForm.isDeleted" : 1,
                "loginPlatform.financePlatForm.status" : 1
            },
            fieldIn : ["_id", "mobilePhone", "loginPlatform.financePlatForm"]
        }, callback)
    },


    /**
     * 按照查询条件查询单个用户信息
     * @param query
     * @param callback
     */
    getMemberByQuery : function(query, callback){
        APIUtil.DBFindOne(Member,{
            query : query,
            fieldIn : ["_id", "mobilePhone", "loginPlatform.financePlatForm"]
        }, callback)
    },

    /**
     * 修改
     * modify
     * @param opType
     * @param memberInfo {{ip: string, memberId: string, sex: number, nickName: string, address: string, introduce: string, newPassword: string, password: string}}
     * @param callback
     */
    modify : function(opType, memberInfo, callback){
        var searchObj = {
            "_id" : memberInfo.memberId,
            "valid" : 1,
            "status" : 1,
            "loginPlatform.financePlatForm.isDeleted" : 1
        };
        if(opType === 2){
            searchObj["loginPlatform.financePlatForm.password"] = memberInfo.password;
        }
        var loc_updateObj = {$set : {
            updateIp : memberInfo.ip,
            updateUser : financeUserService.DEFAULT_USER_INFO.updateUser,
            updateDate : new Date()
        }};
        if(opType === 1){
            if(memberInfo.hasOwnProperty("sex")){
                loc_updateObj.$set["loginPlatform.financePlatForm.sex"] = memberInfo.sex;
            }
            if(memberInfo.hasOwnProperty("nickName")){
                loc_updateObj.$set["loginPlatform.financePlatForm.nickName"] = memberInfo.nickName;
            }
            if(memberInfo.hasOwnProperty("realName")){
                loc_updateObj.$set["loginPlatform.financePlatForm.realName"] = memberInfo.realName;
            }
            if(memberInfo.hasOwnProperty("address")){
                loc_updateObj.$set["loginPlatform.financePlatForm.address"] = memberInfo.address;
            }
            if(memberInfo.hasOwnProperty("avatar")){
                loc_updateObj.$set["loginPlatform.financePlatForm.avatar"] = memberInfo.avatar;
            }
            if(memberInfo.hasOwnProperty("introduce")){
                loc_updateObj.$set["loginPlatform.financePlatForm.introduce"] = memberInfo.introduce;
            }
            if(memberInfo.hasOwnProperty("newPassword")){
                loc_updateObj.$set["loginPlatform.financePlatForm.password"] = memberInfo.newPassword;
            }
        }else if(opType === 2 || opType === 3){
            loc_updateObj.$set["loginPlatform.financePlatForm.password"] = memberInfo.newPassword;
        }

        var modifyFun = function(){
            financeUserService.modifyOne(searchObj, loc_updateObj, function(err, member) {
                if (err) {
                    console.error("更新用户信息失败！", err);
                    callback(APIUtil.APIResult("code_2030", null, null));
                    return;
                }
                if (member === null) {
                    if(opType === 2){
                        console.error("原密码输入错误！", memberInfo);
                        callback(APIUtil.APIResult("code_2056", null, null));
                        return;
                    }else{
                        console.error("更新用户信息失败，待更新用户信息不存在！", memberInfo);
                        callback(APIUtil.APIResult("code_2030", null, null));
                        return;
                    }
                }
                callback(APIUtil.APIResult(null, null, null));
            });
        };
        if(memberInfo.hasOwnProperty("nickName")){
            //昵称不允许重复
            APIUtil.DBFindOne(Member, {
                query : {
                    "_id" : {$ne : memberInfo.memberId},
                    "valid" : 1,
                    "loginPlatform.financePlatForm.isDeleted" : 1,
                    "loginPlatform.financePlatForm.nickName" : memberInfo.nickName
                }
            }, function(err, member){
                if (err) {
                    console.error("查询用户信息失败！", err);
                    callback(APIUtil.APIResult("code_2010", null, null));
                    return;
                }
                if(member){
                    console.error("用户昵称不允许重复！", err);
                    callback(APIUtil.APIResult("code_2036", null, null));
                    return;
                }
                modifyFun();
            });
        }else{
            modifyFun();
        }
    },

    /**
     * 按照memberId修改用户信息
     * @param memberId
     * @param updater
     * @param callback
     */
    modifyById : function(memberId, updater, callback){
        Member.findOneAndUpdate(
            {
                _id : memberId,
                valid : 1
            },
            updater,
            {'new' : true},
            callback
        );
    },

    /**
     * 修改
     * @param query
     * @param updater
     * @param callback
     */
    modifyByUpdater : function(query, updater, callback){
        Member.update(
            query,
            updater,
            {'new' : true, multi : true},
            callback
        );
    },

    /**
     * 单个修改
     * @param query
     * @param updater
     * @param callback
     */
    modifyOne : function(query, updater, callback){
        Member.findOneAndUpdate(
            query,
            updater,
            {'new' : true},
            callback
        );
    }
};

module.exports = financeUserService;

