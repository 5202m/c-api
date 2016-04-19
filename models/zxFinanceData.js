/**
 * 财经日历数据<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年03月25日 <BR>
 * Description :<BR>
 * <p>
 *     财经日历数据
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var ZxFinanceDataSchema = new Schema({
    _id : ObjectId, //财经日历ID
    name : String, //指标名称
    country : String, //指标国家
    basicIndexId :  {type : String, index : true},//指标ID 财经日历详情页查询参数
    period : String,// 指标时期
    importance : Number,// 指标重要性[low-1、mid-2、high-3]
    predictValue : String,// 预期值
    lastValue : String,// 前值
    value : String,// 公布值
    year : Number,// 年份
    positiveItem : String,// 利多项
    negativeItem : String,// 利空项
    level : String,// 指标级数
    url : String,// 指标内页链接
    date : {type : String, index : true},// 指标日期
    time : String,// 指标时间
    unit : String,// 数据单位
    interpretation : String,// 说明
    publishOrg : String,// 发布机构
    publishFrequncy : String,// 发布频率
    statisticMethod : String,// 计算方法
    explanation : String,// 数据释义
    influence : String,// 指标影响
    nextPublishTime : String,// 指标最新公布时间
    importanceLevel : Number,// 重要指数
    description : String,// 描述
    dataType : {type : Number, index : true},// 数据类型(0：所有 1：外汇 2：贵金属 )
    valid : Number,// 是否有效(0：无效 1：有效 2：金汇删除)
    createUser : String,
    createIp : String,
    createDate : {type : Date, default : new Date()},
    updateUser : String,
    updateIp : String,
    updateDate : {type : Date, default : new Date()}
});
module.exports = mongoose.model('zxFinanceData',ZxFinanceDataSchema,"zxFinanceData");