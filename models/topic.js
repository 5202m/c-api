/**
 * 摘要：帖子实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/7/1
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;
var topicSchema = new Schema({
    _id : String,
    memberId : String,                                    //会员Id(外键)
    publishTime : {type : Date, default : new Date()},   //发布时间
    topicAuthority : Number,            //发帖权限(0：正常  1：禁止发帖)
    isRecommend: Number,                //是否推荐帖子(0: 否   1:是)
    device : String,                    //发帖设备
    subjectType: String ,               //主题分类
    expandAttr : Object,                //扩展属性，用于保存跟当前帖子有关联的信息，比如喊单贴需要保存产品名称和订单号
    infoStatus : Number,                //信息状态(1：有效 2：无效)
    publishLocation :Number,            //发布位置(1：发现-关注  2：解盘-直播  3：其他)
    title : String,                     //标题
    content : String,                   //内容
    isTop : Number,                     //是否置顶(0：否  1：是)
    isDeleted : Number,                 //是否删除(0：删除 1：未删除)
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('topic',topicSchema,"topic");