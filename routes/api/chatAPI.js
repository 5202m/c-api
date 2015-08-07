/**
 * 摘要：聊天室相关 API处理类
 * author:alan.wu
 * date:2015/8/7
 */
var express = require('express');
var router = express.Router();
var common = require('../../util/common');
var chatService = require('../../service/chatService');
var xml2js = require('xml2js');
/**
 * 获取聊天信息
 */
router.get(/^\/getMessageList(\.(json|xml))?$/, function(req, res) {
    var params=req.query;
    if(!params.curPageNo||params.curPageNo <= 0){
        params.curPageNo = 1;
    }
    params.pageSize=params.pageSize||15;
    if(isNaN(params.curPageNo)||isNaN(params.pageSize)){
        res.json(null);
    }else{
        chatService.getMessageList(params,function(data){
            if(data){
                var dataList=[],row=null;
                for(var i in data){
                    row=data[i];
                    dataList.push({userType:row.userType,nickname:row.nickname,content:row.content.value,publishTime:row.publishTime.replace(/_.+/,"")});
                }
                if(req.path.indexOf('.xml')!=-1){
                    var xml = new xml2js.Builder({ignoreAttrs:false,attrkey:'attr'}).buildObject(dataList);
                    xml=xml.replace(/<(\/)?(\d+)>/g,'<$1row>');
                    res.end(xml);
                }else{
                    res.json(dataList);
                }
            }else{
                res.json(null);
            }
        });
    }
});



module.exports = router;
