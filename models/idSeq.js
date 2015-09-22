/**
 * 序号管理器<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月10日 <BR>
 * Description :<BR>
 * <p>
 *     ID序号配置实体类
 * </p>
 */
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var IdSeqSchema = new Schema({
    _id: String ,
    seq: Number
});
module.exports = mongoose.model('idSeq',IdSeqSchema,"sequenceId");