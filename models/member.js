/**
 * Created by Administrator on 2015/3/4.
 */
var uniqueValidator = require('mongoose-unique-validator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    memberSchema = new Schema({ //会员Schema
        _id: ObjectId,
        mobilePhone: { type: String, index: true, unique: true, match: /[0-9]{6,11}$/ }, //手机号码应该全是数字,并且大于6位.
        valid: { type: Number, default: 1 }, //是否删除：0 、删除；1、正常
        status: { type: Number, default: 1 }, //用户状态(0:禁用 1：启用)
        createUser: { type: String, default: 'admin' }, //新增记录的用户，默认admin
        createIp: String, //新增记录的Ip
        createDate: { type: Date, default: Date.now() }, //创建日期
        updateIp: String,
        updateDate: { type: Date, default: Date.now() }, //创建日期
        loginPlatform: {
            chatUserGroup: [{
                _id: String, //组的大类别，区分是微信组、直播间
                userId: { type: String, index: true }, //用户id
                thirdId: { type: String, index: true }, //第三方id（微信openId）
                email: { type: String, index: true }, //邮箱地址
                weChatId: { type: String, index: true }, //微信登录ID
                weiboId: { type: String, index: true }, //微博登陆ID
                qqId: { type: String, index: true }, //QQ登录ID
                userName: { type: String, index: true }, //用户名
                avatar: String, //头像
                nickname: String, //昵称
                accountNo: { type: String, index: true }, //账号
                roleNo: String, //角色编号（后台用户）
                userType: { type: Number, default: 0 }, //区分系统用户还是会员，0表示会员，1表示管理员，2、分析师
                pwd: { type: String }, //用户密码
                vipUser: { type: Boolean, default: false }, //vip用户
                vipUserRemark: { type: String },
                clientGroup: { type: String }, //客户组，详请见constant.clientGroup
                createDate: Date,
                gagDate: String, //禁言时间
                gagTips: String, //禁言提示语
                gagRemark: String, //禁言备注
                defTemplate: String, //用户自行设置页面的皮肤
                rooms: [{
                    _id: String, //组id，与聊天室组对应，即是对应的房间
                    onlineStatus: { type: Number, default: 0 }, //在线状态：0 、下线 ；1、在线
                    sendMsgCount: { type: Number, default: 0 }, //发言条数统计
                    onlineDate: Date, //上线时间
                    offlineDate: Date, //下线时间
                    gagDate: String, //禁言时间
                    gagTips: String, //禁言提示语
                    gagRemark: String //禁言备注
                }]
            }]
        }
    });
memberSchema.plugin(uniqueValidator);
module.exports = mongoose.model('member', memberSchema, "member");