let uniqueValidator = require('mongoose-unique-validator');
let mongoose = require('./commonMongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    tokenAccessSchema = new Schema({
        "_id": ObjectId,
        "tokenAccessId": { type: String, unique: true, index: true, match: /^TokenAccess/ },
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
tokenAccessSchema.plugin(uniqueValidator);
module.exports = mongoose.model('tokenAccess', tokenAccessSchema, 'tokenAccess');