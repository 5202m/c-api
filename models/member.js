/**
 * Created by Administrator on 2015/3/4.
 */
var uniqueValidator = require('mongoose-unique-validator');
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId
    , memberSchema = new Schema({//会员Schema
        _id:ObjectId,
        mobilePhone: {type:String,index:true} ,
        valid: {type:Number, default:1}, //是否删除：0 、删除；1、正常
        status: {type:Number, default:1}, //用户状态(0:禁用 1：启用)
        createUser:{type:String,default:'admin'}, //新增记录的用户，默认admin
        createIp:String,//新增记录的Ip
        createDate:{type:Date,default:Date.now()},//创建日期
        updateIp:String,
        updateUser:{type:String,default:'admin'}, //修改记录的用户，默认admin
        updateDate:{type:Date,default:Date.now()},//创建日期
        loginPlatform:{
            chatUserGroup:[{
                _id:String,//组的大类别，区分是微信组、直播间
                userId:{type:String,index:true},
                thirdId:{type:String,index:true},//第三方用户id，对于微信，userId为微信的openId;
                email:String,
                avatar:String,//头像
                nickname:String,//昵称
                accountNo:{type:String,index:true}, //账号
                roleNo:String,//角色编号（后台用户）
                userType:{type:Number, default:0},//区分系统用户还是会员，0表示会员，1表示管理员，2、分析师
                pwd:{type:String},//用户密码
                vipUser:{type:Boolean, default:false},//vip用户
                clientGroup:{type:String},//客户组，详请见constant.clientGroup
                createDate:Date,
                rooms:[{
                    _id:String,//组id，与聊天室组对应，即是对应的房间
                    onlineStatus: {type:Number, default:0}, //在线状态：0 、下线 ；1、在线
                    sendMsgCount:{type:Number, default:0}, //发言条数统计
                    onlineDate: Date,//上线时间
                    offlineDate: Date,//上线时间
                    gagDate:String,//禁言时间
                    gagTips:String//禁言提示语
                }]
            }],
            financePlatForm : {//投资社区
                nickName : {type : String, index : true}, //昵称
                realName : String,  //真实姓名
                password : String,  //密码
                sex : Number,       //性别 0：男 1：女
                avatar : String,    //头像
                address : String,   //地址
                introduce : String, //介绍
                bindPlatformList : [{//投资社区绑定平台
                    type : {type:Number}, //类型 1:QQ 2：微信  3：微博
                    bindAccountNo : {type:String,index:true} //账号
                }],
                userGroup : Number,     //用户组别 1-普通用户 2-分析师
                isRecommend : Number,   //是否推荐用户 0-否 1-是
                registerDate : {type : Date, default : new Date()}, //注册时间
                loginSystem : String,   //登录平台
                isDeleted : Number,     //是否删除 1-正常 0-已删除
                isBack : Number,        //是否后台用户
                status : Number,        //状态 1-有效 0-无效
                attentions : [String],  //关注列表
                beAttentions : [String],//粉丝列表
                topicCount : Number,    //发帖数（发帖和删帖的时候注意修改该值）
                replyCount : Number,    //回帖数（发帖和删帖的时候注意修改该值）
                commentCount : Number,    //评论数
                shoutCount :  Number,      //喊单数
                beShoutCount :  Number,      //被跟单数
                collects : [{
                    topicId : String,   //帖子或文章Id
                    type : {type:Number}, //类型： 1-topic 2-article
                    collectDate : {type : Date, default : new Date()} //收藏时间
                }],    //收藏帖子列表
                isGag : Number          //是否禁言 1-禁言 0-非禁言
            }
        }
    });
memberSchema.plugin(uniqueValidator);
module.exports = mongoose.model('member',memberSchema,"member");