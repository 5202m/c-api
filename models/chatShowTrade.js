/**
 * 晒单<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2016 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2016年06月22日 <BR>
 * Description :<BR>
 * <p>
 *     晒单
 * </p>
 */
let mongoose = require('./commonMongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

var chatShowTradeSchema = new Schema({
    _id: ObjectId,
    groupType: { type: String, index: true }, //聊天室组别
    groupId: { type: String, index: true },
    boUser: {
        _id: String, //userId
        userNo: { type: String, index: true }, //userNo
        avatar: String, //头像
        userName: String, //分析师姓名
        telephone: String, //手机号
        wechatCode: String, //分析师微信号
        wechatCodeImg: String, //分析师微信二维码
        winRate: String //分析师胜率
    },
    showDate: Date, //晒单时间
    tradeImg: String, //晒单图片
    profit: String, //盈利
    remark: String, //心得
    valid: Number, //是否删除 0-有效 1-无效
    updateDate: Date,
    createUser: String,
    createIp: String,
    createDate: Date,
    title: String, //标题
    tradeType: Number, //类别：1 分析师晒单，2 客户晒单
    status: Number, //状态：0 待审核， 1 审核通过， -1 审核不通过
    praise: Number, //点赞数
    comments: [{ //评论
        _id: ObjectId, //评论编号
        userId: String, //用户编号
        userName: String, //用户名称
        avatar: String, //头像
        content: String, //内容
        dateTime: Date, //评论时间
        refId: String, //参照编号
        valid: { type: Number, default: 1 } //是否有效
    }]
});
module.exports = mongoose.model('chatShowTrade', chatShowTradeSchema, "chatShowTrade");