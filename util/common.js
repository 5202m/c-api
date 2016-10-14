/**
 * 通用方法
 * create by alan.wu
 * 2014-3-6
 */
var common = {
    /**
     * 功能：删除数组中某个下标的元素
     */
    remove:function (arr,index) {
        if (isNaN(index) || index > arr.length) {
            return false;
        }
        arr.splice(index, 1);
    },
    /**
     * 字符拼接
     * @param val
     * @returns {string}
     */
    joinSplit:function(val) {
        return ",".concat(val).concat(",");
    },
    /**
     * 空判断
     * @param v
     * @returns {boolean}
     */
    isBlank:function(v) {
    	return v == undefined || v == null ||v=='undefined'||v=='null'|| this.trim(v) == '';
    },
    /**
     * 非空判断
     * @param obj
     * @returns {boolean}
     */
    isValid:function (obj) {
        return !this.isBlank(obj);
    },
    /**
     * 过滤空格
     * @param val
     * @returns {XML|string|void}
     */
    trim:function(val){
        return !val?'':val.toString().replace(/(^\s*)|(\s*$)/g, "");
    },
    /**
     * 字符串source以dest开头
     * @param source
     * @param dest
     */
    startsWith : function(source,dest){
        return source.slice(0, dest.length) == dest;
    },
    /**
     * 字符串source以dest结尾
     * @param source
     * @param dest
     */
    endsWith : function(source,dest){
        return source.slice(-dest.length) == dest;
    },
    /**
     * HTML代码转String
     * @param html
     * @returns html
     */
    escapeHtml:function(html) {
        return document.createElement('div').appendChild(document.createTextNode(html)).parentNode.innerHTML.replace(/"/g, '\\"');
    },
    /**
     * String转HTML
     * @param str
     * @returns html
     */
    encodeHtml:function(str) {
        return str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\\/g, "");
    },
    /**
     * 随机生成数字
     * @param _idx  位数
     * @returns {string}
     */
    randomNumber:function(_idx){
        var str = '';
        for(var i = 0; i < _idx; i++){
            str += Math.floor(Math.random() * 10);
        }
        return str;
    },
    /**
     * 包含字符，逗号分隔
     * @param src
     * @param subStr
     */
    containSplitStr:function(src,subStr){
        if(common.isBlank(src)||common.isBlank(subStr)) {
            return false;
        }
        return (','+src+',').indexOf((','+subStr+','))!=-1;
    },
    /**
     * 提取ip
     * @param req
     * @returns {*}
     */
    getClientIp:function(req){
        if(!req){
            return '';
        }
        return req.headers['x-forwarded-for'] || req.ip || req._remoteAddress ||
            (req.socket && (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress)));
    },
    /**
     * g格式化数据
     * @param xmlData
     */
    formatXML:function(xmlData){
      if(!/<\/xml>$/g.test(xmlData)){
          xmlData+='</xml>';
      }
      return xmlData.replace(/\s+/g, ' ');
    },
    /**
     * 随机生成数字
     * @param _idx  位数
     * @returns {string}
     */
    randomNumber:function(_idx){
        var str = '';
        for(var i = 0; i < _idx; i++){
            str += Math.floor(Math.random() * 10);
        }
        return str;
    },
    /**
     * 提取分割匹配正则
     * @param val
     * @returns {Object}
     */
    getSplitMatchReg:function(val){
        return eval('/^'+val+'|,'+val+'$|,'+val+',/g');
    },
    /**
     * 提取md5加密密文
     * @param val
     * @returns {*}
     */
    getMD5:function(val){
        var md5 = require('crypto').createHash('md5');
        md5.update(val);
        return md5.digest('hex');
    },
    /**
     * 过滤内容，将HTML标签过滤，并且截取前150个字符。
     * @param content
     * @returns {string}
     */
    filterContentHTML:function(content){
        if(!content){
            return "";
        }
        return content.replace(/<[^>]+>/g, "").substr(0, 150);
    },
    /**
     * 将html转换成字符串(去掉html标签)
     */
    html2str : function(content){
        return content.replace(/<.*?>/ig ,'');
    },
    /**
     * 对象copy
     * @param srcObj
     * @param targetObj
     */
    copyObject:function(srcObj,targetObj){
       for(var row in srcObj){
           if(common.isValid(targetObj[row])){
               srcObj[row]=targetObj[row];
           }
       }
    },
    /**
     * 验证是否符合手机号码格式
     * @param val
     */
    isMobilePhone:function(val){
        return /(^[0-9]{11})$|(^86(-){0,3}[0-9]{11})$/.test(val);
    },

    /**
     * 在数组中查找匹配对象下标
     * @param arr
     * @param key
     * @param compareFn
     */
    searchIndexArray : function(arr, key, compareFn){
        var item = null;
        for(var i = 0, lenI = !arr ? 0 : arr.length; i < lenI; i++){
            item = arr[i];
            if(compareFn(item, key) == true){
                return i;
            }
        }
        return -1;
    },
    /**
     * 对象数组排序
     * @param key 对象的key值
     * @param desc true 为降序，false升序
     * @returns {Function}
     */
    arraySort:function(key,desc){
       return function(a,b){
        return desc? (a[key] < b[key]) : (a[key] > b[key]);
       }
    },
    /**
     * 格式化去日期（不含时间）
     */
    formatterDate : function(date,splitChar) {
        if(!splitChar){
            splitChar='-';
        }
        if(!(date instanceof Date)){
            date=new Date(date);
        }
        var datetime = date.getFullYear()
            + splitChar// "年"
            + ((date.getMonth() + 1) >=10 ? (date.getMonth() + 1) : "0"
            + (date.getMonth() + 1))
            + splitChar// "月"
            + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());
        return datetime;
    },
    /**
     * 格式化去日期（含时间）
     */
    formatterDateTime : function(date,splitChar) {
        if(!splitChar){
            splitChar='-';
        }
        if(!(date instanceof Date)){
            date=new Date(date);
        }
        if(date == "Invalid Date"){
            return "";
        }
        var datetime = date.getFullYear()
            + splitChar// "年"
            + ((date.getMonth() + 1) >=10 ? (date.getMonth() + 1) : "0"
            + (date.getMonth() + 1))
            + splitChar// "月"
            + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
            + ' '
            + (date.getHours() < 10 ? "0" + date.getHours() : date
                .getHours())
            + ":"
            + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date
                .getMinutes())
            + ":"
            + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date
                .getSeconds());
        return datetime;
    },

    /**
     * 时间对象的格式化;
     * eg:common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss:SSS")
     *      ==>2015-04-30 14:11:52:037
     * @param date
     * @param format
     * @returns {String}
     */
    formatDate : function (date, format) {
        if(!format){
            format = "yyyy-MM-dd HH:mm:ss:SSS";
        }
        //获取日期指定部分
        var getPart = function(date, pattern){
            var loc_result = null;
            switch(pattern){
                case "yyyy":
                    loc_result = date.getFullYear().toString();
                    break;
                case "yy":
                    loc_result = date.getFullYear().toString().substring(2);
                    break;
                case "MM":
                    loc_result  = date.getMonth() + 1;
                    if(loc_result < 10){
                        loc_result = "0" + loc_result;
                    }
                    break;
                case "M":
                    loc_result = (date.getMonth() + 1).toString();
                    break;
                case "dd":
                    loc_result  = date.getDate();
                    if(loc_result < 10){
                        loc_result = "0" + loc_result;
                    }
                    break;
                case "d":
                    loc_result = (date.getDate()).toString();
                    break;
                case "HH":
                    loc_result  = date.getHours();
                    if(loc_result < 10){
                        loc_result = "0" + loc_result;
                    }
                    break;
                case "H":
                    loc_result = date.getHours().toString();
                    break;
                case "hh":
                    loc_result  = date.getHours() % 12;
                    if(loc_result < 10){
                        loc_result = "0" + loc_result;
                    }
                    break;
                case "h":
                    loc_result = (date.getHours() % 12).toString();
                    break;
                case "mm":
                    loc_result  = date.getMinutes();
                    if(loc_result < 10){
                        loc_result = "0" + loc_result;
                    }
                    break;
                case "m":
                    loc_result = date.getMinutes().toString();
                    break;
                case "ss":
                    loc_result  = date.getSeconds();
                    if(loc_result < 10){
                        loc_result = "0" + loc_result;
                    }
                    break;
                case "s":
                    loc_result = date.getSeconds().toString();
                    break;
                case "SSS":
                    loc_result  = date.getMilliseconds();
                    if(loc_result < 10){
                        loc_result = "00" + loc_result;
                    }else if(loc_result < 100){
                        loc_result = "0" + loc_result;
                    }
                    break;
                case "S":
                    loc_result = date.getMilliseconds().toString();
                    break;
                case "q":
                    loc_result = Math.floor((date.getMonth() + 3) / 3).toString();
                    break;
            }
            return loc_result;
        };
        var loc_result = format;
        var loc_patterns = ['yyyy', 'yy', 'MM', 'M', 'dd', 'd', 'HH', 'H', 'hh', 'h', 'mm', 'm', 'ss', 's', 'SSS', 'S', 'q'];
        for(var i = 0, lenI = loc_patterns.length; i < lenI; i++){
            if(new RegExp(loc_patterns[i]).test(loc_result)){
                loc_result = loc_result.replace(new RegExp(loc_patterns[i], "gm"), getPart(date, loc_patterns[i]));
            }
        }
        return loc_result;
    }
};

//导出类
try {
    if (module) {
        module.exports = common;
    }
}catch (e){
}