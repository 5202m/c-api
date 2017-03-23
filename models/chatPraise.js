/**
 * Created by Administrator on 2015/3/4.
 */
let mongoose = require('./commonMongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let chatPraiseSchema = new Schema({ //点赞Schema
    _id: ObjectId,
    praiseId: { type: String, index: true },
    praiseType: String,
    fromPlatform: String,
    praiseNum: { type: Number, default: 0 },
    remark: String
});
module.exports = mongoose.model('chatPraise', chatPraiseSchema, "chatPraise");