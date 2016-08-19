/**
 * 工具类<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年07月16日 <BR>
 * Description :<BR>
 * <p>
 *     提供常用对象操作工具方法
 * </p>
 */
var Utils = {

    /**
     * 字符串 替换 占位符 alert("http://{0}/{1}".format("www.xxx.com", "index.html"));
     * @param str
     * @returns {String}
     */
    strFormat: function (str) {
        if (typeof str !== "string") {
            return str;
        }
        if (arguments.length == 1) return str;
        for (var s = str, i = 1; i < arguments.length; i++)
            s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
        return s;
    },

    /**
     * 字符串替换所有
     * @param str
     * @param s1
     * @param s2
     * @returns {string}
     */
    replaceAll: function (str, s1, s2) {
        if (typeof str !== "string") {
            return str;
        }
        return str.replace(new RegExp(s1, "gm"), s2);
    },

    /**
     * 左补齐字符串
     * @param str
     * @param nSize 要补齐的长度
     * @param ch 要补齐的字符
     * @return
     */
    padLeft: function (str, nSize, ch) {
        var s = str ? str : "";
        ch = ch ? ch : '0';// 默认补0

        var len = s.length;
        while (len < nSize) {
            s = ch + s;
            len++;
        }
        return s;
    },

    /**
     * 右补齐字符串
     * @param str
     * @param nSize 要补齐的长度
     * @param ch 要补齐的字符
     * @return
     */
    padRight: function (str, nSize, ch) {
        var s = str ? str : "";
        ch = ch ? ch : '0';// 默认补0

        var len = s.length;
        while (len < nSize) {
            s = s + ch;
            len++;
        }
        return s;
    },

    /**
     * 左移小数点位置（用于数学计算，相当于除以Math.pow(10,scale)）
     *
     * @param str
     * @param scale 要移位的刻度
     * @return
     */
    movePointLeft: function (str, scale) {
        var s, s1, s2, ch, ps, sign;
        ch = '.';
        sign = '';
        s = str ? str : "";

        if (scale <= 0) return s;
        ps = s.split('.');
        s1 = ps[0] ? ps[0] : "";
        s2 = ps[1] ? ps[1] : "";
        if (s1.slice(0, 1) == '-') {
            s1 = s1.slice(1);
            sign = '-';
        }
        if (s1.length <= scale) {
            ch = "0.";
            s1 = Utils.padLeft(s1,scale);
        }
        return sign + s1.slice(0, -scale) + ch + s1.slice(-scale) + s2;
    },

    /**
     * 右移小数点位置（用于数学计算，相当于乘以Math.pow(10,scale)）
     *
     * @param str
     * @param scale 要移位的刻度
     * @return
     */
    movePointRight: function (str, scale) {
        var s, s1, s2, ch, ps;
        ch = '.';
        s = str ? str : "";

        if (scale <= 0) return s.toString();
        ps = s.split('.');
        s1 = ps[0] ? ps[0] : "";
        s2 = ps[1] ? ps[1] : "";
        if (s2.length <= scale) {
            ch = '';
            s2 = Utils.padRight(s2,scale);
        }
        return s1 + s2.slice(0, scale) + ch + s2.slice(scale, s2.length);
    },

    /**
     * 移动小数点位置（用于数学计算，相当于（乘以/除以）Math.pow(10,scale)）
     *
     * @param str
     * @param scale 要移位的刻度（正数表示向右移；负数表示向左移动；0返回原值）
     * @return
     */
    movePoint: function (str, scale) {
        if (scale >= 0)
            return this.movePointRight(str, scale);
        else
            return this.movePointLeft(str, -scale);
    },


    /**
     * 将字符串转化为Date日期类型
     * @param str
     * @returns {Date}
     */
    strToDate: function (str) {
        var temp = str.toString();
        temp = temp.replace(/-/g, "/");
        return new Date(Date.parse(temp));
    },

    /**
     * 将字符串转化为数字整型
     * @param str
     * @returns {Number}
     */
    strToInt: function (str) {
        return parseInt(str.toString(), 10);
    },

    /**
     * 将字符串转化为数字浮点型
     * @param str
     * @returns {Number}
     */
    strToFloat: function (str) {
        return parseFloat(str.toString());
    },

    /**
     * 将字符串转化为数字整型
     * @param num
     * @returns {Number}
     */
    numToInt: function (num) {
        return parseInt(num, 10);
    },

    /**
     * 将字符串转化为数字浮点型
     * @param num
     * @returns {Number}
     */
    numToFloat: function (num) {
        return parseFloat(num);
    },

    /**
     * 在当前时间上加入秒数
     * d : 字符串时间，格式为 yyyy-MM-dd HH:mm:ss
     * num : 秒
     */
    dateAddSeconds : function(d , num){
        return new Date(d.getTime() + num*1000);
    },

    /**
     * 将毫秒格式化为指定的值
     * @param millSecords
     */
    formatTime : function(mills){
        var interval = "";
        var time = new Date().getTime() - mills;               // 得出的时间间隔是毫秒
        if(time/60000 < 5 && time/60000 >= 0) {  			   //如果时间间隔小于5分钟,显示为刚刚
            interval = "刚刚";
        }else if(time/3600000 < 1){							 //如果时间间隔大于5分钟小于1小时,显示为5分钟前
            interval = "5分钟前";
        }else if(time/3600000 < 24){      					 //如果时间间隔小于24小时,则显示多少小时前
            var h = time/3600000;
            interval = h + "小时前";
        }else if(time/3600000 < 48){                          //如果时间间隔大于24小时小于48小时 ,则显示2天前
            interval = "2天前";
        }else{												   //如果时间间隔大于48小时 ,则显示mm-dd
            interval = Utils.dateFormat(mills,"MM-dd");
        }
        return interval;
    },

    /**
     * 重写Number.toFixed函数，解决不同浏览器的四舍五入差异。
     * @param num
     * @param scale
     * @returns {String}
     */
    numToFixedStr: function (num, scale) {
        var s, s1, s2, start;

        s1 = num + "";
        start = s1.indexOf(".");
        s = Utils.movePoint(s1,scale);

        if (start >= 0) {
            s2 = Number(s1.substr(start + scale + 1, 1));
            if (s2 >= 5 && num >= 0 || s2 < 5 && num < 0) {
                s = Math.ceil(s); // 取大于等于指定数的最小整数
            }
            else {
                s = Math.floor(s); // 取小于等于指定数的最大整数
            }
        }
        return Utils.movePoint(s.toString(),-scale);
    },

    /**
     * 重写Number.toFixed函数，解决不同浏览器的四舍五入差异。
     * @param num
     * @param scale
     * @returns {Number}
     */
    numToFixed: function (num, scale) {
        return this.strToFloat(this.numToFixedStr(num, scale));
    },

    /**
     * 功能：删除数组中某个下标的元素
     * @param arr
     * @param index
     * @returns {Array}
     */
    removeFromArr: function (arr, index) {
        if (isNaN(index) || index > arr.length) {
            return arr;
        }
        arr.splice(index, 1);
        return arr;
    },

    /**
     * 时间对象的格式化;
     * @param {Date|Number} date
     * @param {String} format
     * @returns {String}
     */
    dateFormat: function (date, format) {

        /*
         * eg:format="yyyy-MM-dd hh:mm:ss";
         */
        var loc_date = date;
        if (date instanceof Date == false) {
            loc_date = new Date(date);
        }
        if(loc_date == "Invalid Date"){
            return "";
        }
        var o = {
            "M+": loc_date.getMonth() + 1, // month
            "d+": loc_date.getDate(), // day
            "h+": loc_date.getHours(), // hour
            "m+": loc_date.getMinutes(), // minute
            "s+": loc_date.getSeconds(), // second
            "q+": Math.floor((loc_date.getMonth() + 3) / 3), // quarter
            "S+": loc_date.getMilliseconds() // millisecond
        };

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (loc_date.getFullYear() + "")
                .substr(4 - RegExp.$1.length));
        }

        var loc_keys = Object.keys(o);
        for (var i = 0, lenI = loc_keys.length, k = ""; i < lenI, k = loc_keys[i]; i++) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
                    : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    },

    /**
     * 取模（余数）. 先移位成整型再取模再移位
     * 解决：浮点型取模存在精度问题。
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    accMod: function (x, y) {
        var r1 = 0;
        var r2 = 0;
        var m, scale;
        try {
            var n1 = x.toString();
            if (n1.indexOf('.') != -1) {
                r1 = n1.split('.')[1].length;
            }
        } catch (e) {
            r1 = 0;
        }
        try {
            var n2 = y.toString();
            if (n2.indexOf('.') != -1) {
                r2 = n2.split(".")[1].length;
            }
        } catch (e) {
            r2 = 0;
        }

        scale = Math.max(r1, r2);
        m = Math.pow(10, scale);
        return (this.accMul(Number(x), m) % this.accMul(Number(y), m)) * Math.pow(10, -scale);
    },

    /**
     * 两个浮点数求和 精确加法
     * @param num1
     * @param num2
     * @returns {number}
     */
    accAdd: function (num1, num2) {
        var r1 = 0;
        var r2 = 0;
        var m;
        try {
            var n1 = num1.toString();
            if (n1.indexOf('.') != -1) {
                r1 = n1.split('.')[1].length;
            }
        } catch (e) {
            r1 = 0;
        }
        try {
            var n2 = num2.toString();
            if (n2.indexOf('.') != -1) {
                r2 = n2.split(".")[1].length;
            }
        } catch (e) {
            r2 = 0;
        }
        m = Math.pow(10, Math.max(r1, r2));
        // return (num1*m+num2*m)/m;
        return Math.round(num1 * m + num2 * m) / m;
    },

    /**
     * 两个浮点数相减 精确减法
     * @param num1
     * @param num2
     * @returns {*|string}
     */
    accSub: function (num1, num2) {
        var r1 = 0;
        var r2 = 0;
        var m, n;

        try {
            var n1 = num1.toString();
            if (n1.indexOf('.') != -1) {
                r1 = n1.split('.')[1].length;
            }
        } catch (e) {
            r1 = 0;
        }
        try {
            var n2 = num2.toString();
            if (n2.indexOf('.') != -1) {
                r2 = n2.split(".")[1].length;
            }
        } catch (e) {
            r2 = 0;
        }
        m = Math.pow(10, Math.max(r1, r2));
        n = (r1 >= r2) ? r1 : r2;
        return (Math.round(num1 * m - num2 * m) / m).toFixed(n);
    },
    /**
     * 两数相除 精确除法
     * @param num1
     * @param num2
     * @returns {number}
     */
    accDiv: function (num1, num2) {
        var t1, t2, r1, r2;
        try {
            if (num1.toString().indexOf('.') != -1) {
                t1 = num1.toString().split('.')[1].length;
            } else {
                t1 = 0;
            }
        } catch (e) {
            t1 = 0;
        }
        try {
            if (num2.toString().indexOf('.') != -1) {
                t2 = num2.toString().split(".")[1].length;
            } else {
                t2 = 0;
            }
        } catch (e) {
            t2 = 0;
        }
        r1 = Number(num1.toString().replace(".", ""));
        r2 = Number(num2.toString().replace(".", ""));
        return (r1 / r2) * Math.pow(10, t2 - t1);
    },
    /**
     * 两数乘法 精确乘法
     * @param num1
     * @param num2
     * @returns {number}
     */
    accMul: function (num1, num2) {
        var m = 0, s1 = num1.toString(), s2 = num2.toString();
        try {
            if (s1.indexOf(".") != -1) {
                m += s1.split(".")[1].length;
            }
        } catch (e) {
        }
        try {
            if (s2.indexOf(".") != -1) {
                m += s2.split(".")[1].length;
            }
        } catch (e) {
        }
        return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
    }
};

module.exports = Utils;