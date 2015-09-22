/**
 * 投资社区--行情预测<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年07月22日 <BR>
 * Description :<BR>
 * <p>
 *     投资社区  行情预测 看多/看空
 * </p>
 */
var mongoose = require('mongoose')
    , ObjectId = mongoose.Schema.ObjectId
    , Schema = mongoose.Schema;

var quotationPredict = new Schema({
    _id : ObjectId,
    memberId : {type : String, index : true},   //客户Id
    prodCode : {type : String, index : true},   //产品码
    type : {type : Number},                     //类型： 1-看多 2-看空
    createDate : {type : Date, default : new Date()}    //时间
});
module.exports = mongoose.model('quotationPredict', quotationPredict, "quotationPredict");