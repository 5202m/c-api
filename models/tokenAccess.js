let mongoose = require('./commonMongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    tokenAccessSchema = new Schema({
        "_id": ObjectId,
        "tokenAccessId": { type: String, index: true },
        "platform": String,
        "appId": String,
        "appSecret": String,
        "expires": { type: Number, default: 0 },
        "valid": { type: Number, default: 1 },
        "status": { type: Number, default: 1 },
        "createUser": String,
        "createIp": String,
        "createDate": Date,
        "updateUser": String,
        "updateIp": String,
        "updateDate": Date,
        "remark": String
    });
module.exports = mongoose.model('tokenAccess', tokenAccessSchema, 'tokenAccess');