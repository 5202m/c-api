/**
 * 摘要：推送消息实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/9/1
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var pushMessageSchema = new Schema({
    _id : String,
    dataid: String,                        //数据Id
    title: {type:String,index:true} ,   //标题
    lang: String,                        //语言
    platform : String,                  //应用平台
    tipType : String,                   //通知方式(1:系统通知中心  2:小秘书 3:首次登陆时弹窗  备注：可以选择多个,之间使用#连接)
    messageType : Number,                 //消息类型(1:自定义 2：系统通知 3：关注订阅 4：评论提醒)
    content : String,                     //消息内容(当消息类型为1,该字段有值)
    url : String,                       //外部url
    categoryId : String,                //栏目Id
    fullCategoryId : String,            //完整栏目Id(包括父级Id,父ID与子ID用#连接)
    articleId : String,                  //文章Id
    publishStartDate : {type : Date, default : new Date()},           // 发布开始时间
    publishEndDate : {type : Date, default : new Date()},             //发布结束时间
    pushDate : {type : Date, default : new Date()},                    //推送时间
    pushStatus : Number,                 //推送状态(0为未推送 1为待推送  2为发送成功  3为发送失败 4为取消推送)
    pushMember : String,                 //推送人(如果为'',向所有人推送,如果多个人，用#连接)
    valid : Number,                       //是否有效(1为有效，0为无效）
    isDeleted : Number,                   //是否删除(0：删除 1：未删除)
    msgId : Number,                         //推送消息后返回的消息Id
    createDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('pushMessage',pushMessageSchema,'pushMessage');