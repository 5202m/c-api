/**
 * 内容数据实体类
 * author：alan.wu
 * date:2015/4/3
 */
let mongoose = require('./commonMongoose');
let Schema = mongoose.Schema;
let chatMessageSchema = new Schema({
    _id: String,
    userId: { type: String, index: true }, //用户id
    nickname: String, //用户昵称
    mobilePhone: String, //手机号码
    accountNo: String, //用户账号
    avatar: String, //用户头像
    groupType: { type: String, index: true }, //房间大类组
    position: String, //职位
    clientGroup: String, //客户组
    userType: { type: Number, default: 0 }, //区分系统用户还是会员，0表示会员，1表示系统用户
    approvalUserArr: [], //需要审核用户编号
    approvalUserNo: String, //审核人编号
    groupId: { type: String, index: true }, //组别Id
    toUser: { //@或私聊目标用户
        userType: { type: Number, default: 0 }, //区分系统用户还是会员，0表示会员，1表示系统用户
        userId: String,
        nickname: String,
        talkStyle: { type: Number, default: 0 }, //聊天方式，0公聊，1私聊
        question: String,
        publishTime: String, //发布日期
        questionId: String //问题id
    },
    content: { //内容
        msgStatus: { type: Number, default: 1 }, //信息状态，0 离线信息 1、在线信息，默认为在线信息
        msgType: String, //信息类型 txt,img缩略图的值。
        value: String, //默认值，
        maxValue: String, //如img大图值
        needMax: { type: Number, default: 0 } //是否需要最大值(0 表示不需要，1 表示需要）
    },
    fromPlatform: String, //平台来源
    status: { type: Number, default: 1 }, //记录整体状态：0、等待审批，1、通过 ；2、拒绝
    publishTime: { type: String, index: true }, //发布日期
    createUser: { type: String, default: 'admin' }, //新增记录的用户，默认admin
    createIp: String, //新增记录的Ip
    createDate: Date, //创建日期
    valid: { type: Number, default: 1 } //是否有效，1为有效，0为无效
});
let key = "chatMessage_" + new Date().getFullYear();
module.exports = {
    db: (year) => {
        let key = "chatMessage_" + new Date().getFullYear();
        if (year) {
            key = "chatMessage_" + year;
        }
        return mongoose.model(key, chatMessageSchema, key);
    }
};