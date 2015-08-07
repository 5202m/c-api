/**
 * 内容数据实体类
 * author：alan.wu
 * date:2015/4/3
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    ,chatMessageSchema=new Schema(
    {
      _id:String,
      userId:{type:String,index:true},//用户id
      nickname:String,//用户昵称
      groupType:{type:String,index:true},//房间大类组
      userType:{type:Number, default:0},//区分系统用户还是会员，0表示会员，1表示系统用户
      groupId:{type:String,index:true},//组别Id
      content:{//内容
          msgType:String, //信息类型 text,img缩略图的值。
          value:String//默认值，
      },
      status:{type:Number, default:1}, //内容状态：0、等待审批，1、通过 ；2、拒绝
      publishTime:{type:String,index:true}, //发布日期
      createDate:Date, //创建日期
      valid:{type:Number, default:1}//是否有效，1为有效，0为无效
    });
module.exports =mongoose.model('chatMessage',chatMessageSchema,"chatMessage");