/**
 * Created by Administrator on 2015/3/4.
 */
let mongoose = require('./commonMongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    teacherFollowerSchema = new Schema({ //会员Schema
        _id: ObjectId,
        userNo: { type: String, index: true },
        followers: [],
        status: { type: Number, default: 1 }
    });
module.exports = mongoose.model('teacherFollower', teacherFollowerSchema, "teacherFollower");