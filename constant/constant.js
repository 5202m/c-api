/**
 * 摘要：常量公共类
 * author：Gavin.guo
 * date:2015/4/15
 */
var constant = {
    fromPlatform:{//来源平台,区分系统用户登录来源
        pm_mis:'pm_mis',//后台
        wechat:'wechat',//黄金微解盘
        fxchat:'fxchat',//外汇微解盘
        studio:'studio',//pm直播间
        fxstudio:'fxstudio',//fx直播间
        hxstudio:'hxstudio'//hx直播间
    },
    'lang' : 'zh',
    'curPageNo' : 1,
    'pageSize' : 50,
    FileDirectory : {
        pic : {code : 'pic', description: '图片' },
        video : {code : 'video', description: '视频' }
    },
    studioGroupType:{
        wechat : "wechat",  //pm微解盘
        fxchat : "fxchat",  //fx微解盘
        studio : "studio",  //pm直播间
        fxstudio:"fxstudio" //fx直播间
    },
    studioDefRoom:{
        studio : "studio_teach",  //pm直播间
        fxstudio:"fxstudio_11", //fx直播间
        hxstudio:"hxstudio_26" //hx直播间
    },
    studioThirdUsed:{//第三方引用直播间默认房间
        pm : {
            web24k : {       //PM官网
                groupType : "studio",    //房间组别
                roomId : "studio_teach", //房间ID
                flag : 'S'      //是否只取一次课，用于课程安排接口
            },
            webui : {       //webui
                groupType : "studio",    //房间组别
                roomId : "studio_teach", //房间ID
                flag : 'D'     //一天的课程
            },
            app : {         //APP Android+IOS
                groupType : "studio",    //房间组别
                roomId : "studio_teach", //房间ID
                flag : 'D'   //一天的课程
            },
            pc : {          //PC ui
                groupType : "studio",    //房间组别
                roomId : "studio_teach", //房间ID
                flag : 'D'     //一天的课程
            }
        },
        fx : {
            gwfx : {        //FX官网
                groupType : "fxstudio",  //房间组别
                roomId : "fxstudio_11",  //房间ID
                    flag : 'S'      //是否只取一次课，用于课程安排接口，一节课
            },
            uce : { //客户中心
                groupType : "fxstudio",  //房间组别
                roomId : "fxstudio_11",  //房间ID
                flag : 'W'      //一周课程
            },
            webui : {       //webui
                groupType : "fxstudio",    //房间组别
                roomId : "fxstudio_11",    //房间ID
                flag : 'D'       //一周课程
            }
        },
        hx : {
        	uce : { //客户中心
                groupType : "hxstudio",  //房间组别
                roomId : "hxstudio_26",  //房间ID
                flag : 'W'     //一周课程
            },
            webui : {       //webui
                groupType : "hxstudio",    //房间组别
                roomId : "hxstudio_26",    //房间ID
                flag : 'D' //一周课程
            }
        },
        getConfig : function(type, platform){
            type = type || "pm";
            if(this.hasOwnProperty(type) && this[type].hasOwnProperty(platform)){
                return this[type][platform];
            }
            return null;
        }
    },
    clientGroup:{//客户类别
      vip:'vip',
      active : 'active', //真实客户-激活
      notActive : 'notActive', //真实客户-未激活
      real:'real',//真实用户
      simulate:'simulate',//模拟用户
      register:'register',//注册用户
      visitor:'visitor'//游客
    },
    clientGroupSeq:{//客户类别序列
        vip:7,
        active : 6, //真实客户-激活
        notActive : 5, //真实客户-未激活
        real:4,//真实用户
        simulate:3,//模拟用户
        register:2,//注册用户
        visitor:1//游客
    },
    pwdKey:'pm_chat_pwd',//密码加密key
    roleUserType:{ //角色与聊天室用户类别对应关系
        visitor:-1,
        member:0,//前台会员
        admin:1,//管理员
        analyst:2, //分析师
        cs:3, //客服
        navy:4//水军
    },
    chatPraiseType:{//点赞类型
        user:'user',//用户
        article:'article'//文章
    },
    //积分折扣
    pointsRate : {
        studio : {
            vip:0.3,
            active : 0.3,
            notActive : 0.6,
            real:0.6,
            simulate:0.8
            //register:1,
            //visitor:1
        }
    }
};


//导出类
module.exports = constant;
