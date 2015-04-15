/**
 * 摘要：广告实体类 (主要用于查询)
 * author: Gavin.guo
 * date: 2015/4/15
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var advertisementSchema = new Schema({
    _id : String,
    code: String ,
    title: String,
    img : String,
    imgUrl : String,
    platform:Number,
    status:Number,
    valid : Number
});
module.exports = mongoose.model('advertisement',advertisementSchema,'advertisement');