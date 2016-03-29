/**
 * api结果返回集合
 * @param error
 * @param data
 * @param [dataType] 返回的数据类型
 * @returns {{result: number}}
 * create by alan.wu
 * 2014-8-13
 */
var apiResult = function(error,data,dataType){
    var resultObj={result:0,msg:'OK'};
    if(error){
        if(typeof error === "object" && error.errcode){
            resultObj.result=error.errcode;
            resultObj.msg=error.errmsg;
        }else{
            resultObj.result=1;
            resultObj.msg=error;
        }
    }else{
        if(data && typeof data === "object" && data.pageNo){
            resultObj.pageNo=data.pageNo;
            resultObj.pageSize=data.pageSize;
            resultObj.totalRecords=data.totalRecords;
            resultObj.data=data.list;
        }else{
            resultObj.data=data;
        }
    }
    if(dataType=="xml"){
        var xml2js = require('xml2js');
        var xml = new xml2js.Builder({ignoreAttrs:false,attrkey:'attr'}).buildObject(resultObj);
        xml=xml.replace(/<(\/)?(\d+)>/g,'<$1row>');
        return xml;
    }else{
        return resultObj;
    }
};
var pageObj=function(pageNo,pageSize,totalRecords,data){
    return {pageNo:pageNo,pageSize:pageSize,totalRecords:totalRecords,list:data}
};
//导出类
module.exports = {
    result : apiResult,
    page:pageObj,//分页对象
    dataType:{ //数据类型
        xml:'xml',
        json:'json'
    }
};
