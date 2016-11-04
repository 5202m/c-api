/**
 * 摘要：常量公共类
 * author：Gavin.guo
 * date:2015/4/15
 */
var constant = {
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
