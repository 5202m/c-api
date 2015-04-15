/** 用户服务类
 * Created by Alan.wu on 2015/3/4.
 */
var member = require('../models/member');//引入member数据模型

/**
 * 定义用户服务类
 * @type {{getMemberList: Function, updateMemberInfo: Function}}
 */
var userService = {
    /**
     * 提取会员信息
     */
    getMemberList:function(id,callback){
        member.findById(id,function (err,members) {
            if(err!=null){
                callback(null);
            }
            callback(members);
        });
    }
};

//导出服务类
module.exports =userService;

