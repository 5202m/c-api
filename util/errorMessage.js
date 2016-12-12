﻿/**
 * 摘要：错误码公共类
 * author：Gavin.guo
 * date:2015/4/8
 */
var errorMessage = {
    "code_10" : {'errcode' : '10','errmsg' : '操作异常!'},
    "code_11" : {'errcode' : '11','errmsg' : '查无记录!'},
    "code_15" : {'errcode' : '15','errmsg' : '没有访问权限'},
    "code_1000" : {'errcode' : '1000','errmsg' : '没有指定参数!'},
    "code_1001" : {'errcode' : '1001','errmsg' : 'appId或appSecret参数不对!'},
    "code_1002" : {'errcode' : '1002', 'errmsg' : '验证码发送失败！'},
    "code_1003" : {'errcode' : '1003', 'errmsg' : '目录不存在,请重新确认参数！'},
    "code_1004" : {'errcode' : '1004', 'errmsg' : '文件上传失败'},
    "code_1005" : {'errcode' : '1005', 'errmsg' : '短信发送受限，请联系客服！'},
    "code_1006" : {'errcode' : '1006', 'errmsg' : '手机验证码已使用！'},
    "code_1007" : {'errcode' : '1007', 'errmsg' : '手机验证码已失效，请使用最新的验证码！'},
    "code_2001" : {'errcode' : "2001", 'errmsg' : "缺少参数！"},
    "code_2002" : {'errcode' : "2002", 'errmsg' : "参数类型错误！"},
    "code_2003" : {'errcode' : "2003", 'errmsg' : "参数数据错误！"},
    "code_2004" : {'errcode' : "2004", 'errmsg' : "用户名或密码错误！"},
    "code_2005" : {'errcode' : "2005", 'errmsg' : "数据操作异常，生成序列号失败！"},
    "code_2006" : {'errcode' : "2006", 'errmsg' : "保存持仓单信息失败！"},
    "code_2007" : {'errcode' : "2007", 'errmsg' : "保存交易记录信息失败！"},
    "code_2008" : {'errcode' : "2008", 'errmsg' : "查询持仓单失败！"},
    "code_2009" : {'errcode' : "2009", 'errmsg' : "查询交易记录失败！"},
    "code_2010" : {'errcode' : "2010", 'errmsg' : "查询账户信息失败！"},
    "code_2011" : {'errcode' : "2011", 'errmsg' : "查询产品列表失败!"},
    "code_2012" : {'errcode' : "2012", 'errmsg' : "查询产品配置信息失败!"},
    "code_2013" : {'errcode' : "2013", 'errmsg' : "持仓单不存在!"},
    "code_2014" : {'errcode' : "2014", 'errmsg' : "平仓数大于持仓数!"},
    "code_2015" : {'errcode' : "2015", 'errmsg' : "用户被禁言!"},
    "code_2016" : {'errcode' : "2016", 'errmsg' : "保存额度记录信息失败！"},
    "code_2017" : {'errcode' : "2017", 'errmsg' : "修改持仓信息失败！"},
    "code_2018" : {'errcode' : "2018", 'errmsg' : "删除持仓信息失败！"},
    "code_2019" : {'errcode' : "2019", 'errmsg' : "更新会员资产信息失败！"},
    "code_2020" : {'errcode' : "2020", 'errmsg' : "查询媒体信息失败！"},
    "code_2021" : {'errcode' : "2021", 'errmsg' : "查询帖子列表失败！"},
    "code_2022" : {'errcode' : "2022", 'errmsg' : "删除帖子失败！"},
    "code_2023" : {'errcode' : "2023", 'errmsg' : "收藏失败！"},
    "code_2024" : {'errcode' : "2024", 'errmsg' : "取消收藏失败！"},
    "code_2025" : {'errcode' : "2025", 'errmsg' : "点赞失败！"},
    "code_2026" : {'errcode' : "2026", 'errmsg' : "查询收藏列表失败！"},
    "code_2027" : {'errcode' : "2027", 'errmsg' : "该用户已经存在！"},
    "code_2028" : {'errcode' : "2028", 'errmsg' : "查询会员资产信息失败！"},
    "code_2029" : {'errcode' : "2029", 'errmsg' : "新用户注册失败！"},
    "code_2030" : {'errcode' : "2030", 'errmsg' : "更新用户信息失败！"},
    "code_2031" : {'errcode' : "2031", 'errmsg' : "取消关注失败！"},
    "code_2032" : {'errcode' : "2032", 'errmsg' : "添加关注失败！"},
    "code_2033" : {'errcode' : "2033", 'errmsg' : "查询帖子详情失败！"},
    "code_2034" : {'errcode' : "2034", 'errmsg' : "发帖失败！"},
    "code_2035" : {'errcode' : "2035", 'errmsg' : "回帖失败！"},
    "code_2036" : {'errcode' : "2036", 'errmsg' : "用户昵称重复！"},
    "code_2037" : {'errcode' : "2037", 'errmsg' : "查询会员反馈信息失败！"},
    "code_2038" : {'errcode' : "2038", 'errmsg' : "添加会员反馈信息失败！"},
    "code_2039" : {'errcode' : "2039", 'errmsg' : "添加行情预测信息失败！"},
    "code_2040" : {'errcode' : "2040", 'errmsg' : "查询产品行情预测统计数据失败！"},
    "code_2041" : {'errcode' : "2041", 'errmsg' : "您今天已参与看多！"},
    "code_2042" : {'errcode' : "2042", 'errmsg' : "开仓失败,可用资金不足！"},
    "code_2043" : {'errcode' : "2043", 'errmsg' : "修改帖子失败！"},
    "code_2044" : {'errcode' : "2044", 'errmsg' : "查询资讯/策略列表失败！"},
    "code_2045" : {'errcode' : "2045", 'errmsg' : "您今天已参与看空！"},
    "code_2046" : {'errcode' : "2046", 'errmsg' : "查询文章列表失败！"},
    "code_2047" : {'errcode' : "2047", 'errmsg' : "查询文章详情失败！"},
    "code_2048" : {'errcode' : "2048", 'errmsg' : "举报失败！"},
    "code_2049" : {'errcode' : "2049", 'errmsg' : "阅读失败！"},
    "code_2050" : {'errcode' : "2050", 'errmsg' : "产品配置信息被禁用！"},
    "code_2051" : {'errcode' : "2051", 'errmsg' : "保存推送消息到数据库失败！"},
    "code_2052" : {'errcode' : "2052", 'errmsg' : "查询推送消息列表失败！"},
    "code_2053" : {'errcode' : "2053", 'errmsg' : "更新用户回帖数失败！"},
    "code_2054" : {'errcode' : "2054", 'errmsg' : "更新用户评论数失败！"},
    "code_2055" : {'errcode' : "2055", 'errmsg' : "更新用户喊单数失败！"},
    "code_2056" : {'errcode' : "2056", 'errmsg' : "原密码输入错误！"},
    "code_3000" : {'errcode' : "3000", 'errmsg' : "积分配置信息不存在！"},
    "code_3001" : {'errcode' : "3001", 'errmsg' : "积分已达上限!"},
    "code_3002" : {'errcode' : "3002", 'errmsg' : "增加积分失败！"},
    "code_3003" : {'errcode' : "3003", 'errmsg' : "查询积分配置信息失败！"},
    "code_3004" : {'errcode' : "3004", 'errmsg' : "有效积分不足!"},
    "code_3005" : {'errcode' : "3005", 'errmsg' : "您操作该培训班的权限受限，请联系客服!"},
    "code_3006" : {'errcode' : "3006", 'errmsg' : "该培训班已结束!"},
    "code_3007" : {'errcode' : "3007", 'errmsg' : "很遗憾，您未通过审核，请关注下期培训班！"/*"您的报名还在审批中....."*/},
    "code_3008" : {'errcode' : "3008", 'errmsg' : "报名已结束，请关注下期培训班！"/*"您没有访问该房间的权限，请联系客服！"*/},
    "code_3009" : {'errcode' : "3009", 'errmsg' : "培训班名单正在审批中，请稍后！"},
    "code_3010" : {'errcode' : "3010", 'errmsg' : "报名已结束，请关注下期培训班！"},
    "code_3011" : {'errcode' : "3011", 'errmsg' : "培训班开放时间{time}，请稍后再进！"}
};
//导出类
module.exports = errorMessage;
