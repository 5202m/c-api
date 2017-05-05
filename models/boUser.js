/**
 * Created by Administrator on 2015/3/4.
 */
var mongoose = require('./commonMongoose'),
    userSchema = mongoose.createSchema({ //会员Schema
        _id: String,
        userNo: String,
        userName: String,
        telephone: String,
        position: String,
        avatar: String,
        introductionImg: String, //简介图片
        introduction: String, //简介
        remark: String,
        wechatCode: String, //微信号
        wechatCodeImg: String, //微信图片
        winRate: String, //胜率
        earningsM: String, //月收益
        introductionImgLink: String, //介绍图片链接
        tag: String, //标签
        valid: { type: Number, default: 1 }, //是否删除：0 、删除；1、正常
        status: { type: Number, default: 0 },
        role: {
            _id: String,
            roleNo: { type: String, index: true },
            roleName: String
        }
    });
module.exports = mongoose.model('boUser', userSchema, "boUser");