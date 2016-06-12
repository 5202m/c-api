/**
 * 摘要：文章资讯实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/4/23
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , articleSchema = new Schema({
        _id : String,
        categoryId: {type:String,index:true} ,   	/**栏目*/
        status: {type:Number, default:1}, 			/**状态*/
        platform : {type:String,index:true},      	/**应用平台*/
        createDate : Date,       					/**创建时间*/
        publishStartDate: {type:Date,index:true},
        publishEndDate:{type:Date,index:true},
        valid:{type:Number, default:1}, 			/**是否有效*/
        sequence: {type:Number, default:1},
        mediaUrl:String,							/**媒体地址路径*/
        mediaImgUrl:String,					    /** 媒体图片（视频专用字段）*/
        linkUrl:String,								/** 点击媒体链接的路径*/
        detailList : [{     						/**文章资讯详细信息*/
            lang: {type:String,index:true} ,        /**语言*/
            title: String ,         /**标题*/
            content:String,         /**内容*/
            tag:String,     		/**标签*/
            authorInfo:{
            	userId:String, 		/**作者Id*/
            	name:String, 		/**作者名字*/
            	avatar:String, 		/**作者头像*/
            	position:String    /**作者职称*/
            },
            remark:String 			/**简介*/
        }]
    });
module.exports = mongoose.model('article',articleSchema,'article');