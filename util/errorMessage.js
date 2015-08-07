/**
 * 摘要：错误码公共类
 * author：Gavin.guo
 * date:2015/4/8
 */
var errorMessage = {
    "code_10" : {'errcode' : '10','errmsg' : '操作异常!'},
    "code_11" : {'errcode' : '11','errmsg' : '查无记录!'},
    "code_1000" : {'errcode' : '1000','errmsg' : '没有指定参数!'},
    "code_1001" : {'errcode' : '1001','errmsg' : 'appId或appSecret参数不对!'},
    "code_1002" : {'errcode' : '1002', 'errmsg' : '验证码发送失败！'}
};
//导出类
module.exports = errorMessage;
