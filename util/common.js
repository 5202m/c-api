/**
 * 通用方法 create by alan.wu 2014-3-6
 */
var xml2js = require('xml2js');
var common = {
    /**
     * 功能：删除数组中某个下标的元素
     */
    remove : function(arr, index) {
	if (isNaN(index) || index > arr.length) {
	    return false;
	}
	arr.splice(index, 1);
    },
    toXML : function(resultObj) {
	var xml = new xml2js.Builder({
	    ignoreAttrs : false,
	    attrkey : 'attr'
	}).buildObject(resultObj);
	xml = xml.replace(/<(\/)?(\d+)>/g, '<$1row>');
	return xml;
    },
    /**
     * 链接正则
     * @returns {Object}
     */
    urlReg:function(){
        return /(http|https):\/\/[A-Za-z0-9]+\.[A-Za-z0-9].+/g;
    },
    /**
     * 通过房间id提取房间组别类型
     * 
     * @param roomId
     */
    getRoomType : function(roomId) {
	return roomId.replace(/_+.*/g, "");
    },
    /**
     * 字符拼接
     * 
     * @param val
     * @returns {string}
     */
    joinSplit : function(val) {
	return ",".concat(val).concat(",");
    },
    /**
     * 判断数组是否存在记录
     */
    checkArrExist : function(arr) {
	return arr && arr.length > 0;
    },
    /**
     * 空判断
     * 
     * @param v
     * @returns {boolean}
     */
    isBlank : function(v) {
	return v == undefined || v == null || v == 'undefined' || v == 'null'
		|| this.trim(v) == '';
    },
    /**
     * 非空判断
     * 
     * @param obj
     * @returns {boolean}
     */
    isValid : function(obj) {
	return !this.isBlank(obj);
    },
    /**
     * 是否直播间
     * 
     * @param type
     */
    isStudio : function(groupType) {
	return groupType && groupType.indexOf("studio") != -1;
    },
    /**
     * 过滤空格
     * 
     * @param val
     * @returns {XML|string|void}
     */
    trim : function(val) {
	return !val ? '' : val.toString().replace(/(^\s*)|(\s*$)/g, "");
    },
    /**
     * 字符串source以dest开头
     * 
     * @param source
     * @param dest
     */
    startsWith : function(source, dest) {
	return source.slice(0, dest.length) == dest;
    },
    /**
     * 字符串source以dest结尾
     * 
     * @param source
     * @param dest
     */
    endsWith : function(source, dest) {
	return source.slice(-dest.length) == dest;
    },
    /**
     * HTML代码转String
     * 
     * @param html
     * @returns html
     */
    escapeHtml : function(html) {
	return document.createElement('div').appendChild(
		document.createTextNode(html)).parentNode.innerHTML.replace(
		/"/g, '\\"');
    },
    /**
     * String转HTML
     * 
     * @param str
     * @returns html
     */
    encodeHtml : function(str) {
	return str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\\/g,
		"");
    },
    /**
     * 随机生成数字
     * 
     * @param _idx
     *                位数
     * @returns {string}
     */
    randomNumber : function(_idx) {
	var str = '';
	for (var i = 0; i < _idx; i++) {
	    str += Math.floor(Math.random() * 10);
	}
	return str;
    },
    /**
     * 包含字符，逗号分隔
     * 
     * @param src
     * @param subStr
     */
    containSplitStr : function(src, subStr) {
	if (common.isBlank(src) || common.isBlank(subStr)) {
	    return false;
	}
	return (',' + src + ',').indexOf((',' + subStr + ',')) != -1;
    },
    /**
     * 提取ip
     * 
     * @param req
     * @returns {*}
     */
    getClientIp : function(req) {
	if (!req) {
	    return '';
	}
	return req.headers['x-forwarded-for']
		|| req.ip
		|| req._remoteAddress
		|| (req.socket && (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress)));
    },
    /**
     * g格式化数据
     * 
     * @param xmlData
     */
    formatXML : function(xmlData) {
	if (!/<\/xml>$/g.test(xmlData)) {
	    xmlData += '</xml>';
	}
	return xmlData.replace(/\s+/g, ' ');
    },
    /**
     * 随机生成数字
     * 
     * @param _idx
     *                位数
     * @returns {string}
     */
    randomNumber : function(_idx) {
	var str = '';
	for (var i = 0; i < _idx; i++) {
	    str += Math.floor(Math.random() * 10);
	}
	return str;
    },
    /**
     * 提取分割匹配正则
     * 
     * @param val
     * @returns {Object}
     */
    getSplitMatchReg : function(val) {
	return eval('/^' + val + '|,' + val + '$|,' + val + ',/g');
    },
    /**
     * 提取md5加密密文
     * 
     * @param val
     * @returns {*}
     */
    getMD5 : function(val) {
	var md5 = require('crypto').createHash('md5');
	md5.update(val);
	return md5.digest('hex');
    },
    /**
     * 检查目标字符是否以源字符或源字符加下划线为前缀
     * 
     * @param src
     * @param target
     * @returns {boolean|*}
     */
    hasPrefix : function(src, target) {
	return common.getPrefixReg(src).test(target);
    },
    /**
     * 前缀正则
     */
    getPrefixReg : function(val) {
	return eval('/(^' + val + '$)|(^' + val + '_{1}.+)/g');
    },
    /**
     * 过滤内容，将HTML标签过滤，并且截取前150个字符。
     * 
     * @param content
     * @returns {string}
     */
    filterContentHTML : function(content) {
	if (!content) {
	    return "";
	}
	return content.replace(/<[^>]+>/g, "").substr(0, 150);
    },
    /**
     * 将html转换成字符串(去掉html标签)
     */
    html2str : function(content) {
	return content.replace(/<.*?>/ig, '');
    },
    /**
     * 对象copy
     * 
     * @param srcObj
     * @param targetObj
     */
    copyObject : function(srcObj, targetObj) {
	for ( var row in srcObj) {
	    if (common.isValid(targetObj[row])) {
		srcObj[row] = targetObj[row];
	    }
	}
    },
    /**
     * 验证是否符合手机号码格式
     * 
     * @param val
     */
    isMobilePhone : function(val) {
	return /(^[0-9]{11})$|(^86(-){0,3}[0-9]{11})$/.test(val);
    },
    /**
     * 判断客户端是否手机
     * @param userAgent
     */
    isMobile: function (userAgent) {
        if (userAgent && userAgent.headers) {
            userAgent = userAgent.headers["user-agent"];
        }
        if (!userAgent) {
            return false;
        }
        return /(iphone|ipod|ipad|android|mobile|playbook|bb10|meego)/.test(userAgent.toLowerCase());
    },
    /**
     * 在数组中查找匹配对象下标
     * 
     * @param arr
     * @param key
     * @param compareFn
     */
    searchIndexArray : function(arr, key, compareFn) {
	var item = null;
	for (var i = 0, lenI = !arr ? 0 : arr.length; i < lenI; i++) {
	    item = arr[i];
	    if (compareFn(item, key) == true) {
		return i;
	    }
	}
	return -1;
    },
    /**
     * 对象数组排序
     * 
     * @param key
     *                对象的key值
     * @param desc
     *                true 为降序，false升序
     * @returns {Function}
     */
    arraySort : function(key, desc) {
	return function(a, b) {
	    return desc ? (a[key] < b[key]) : (a[key] > b[key]);
	}
    },
    /**
     * 格式化去日期（不含时间）
     */
    formatterDate : function(date, splitChar) {
	if (!splitChar) {
	    splitChar = '-';
	}
	if (!(date instanceof Date)) {
	    date = new Date(date);
	}
	var datetime = date.getFullYear()
		+ splitChar// "年"
		+ ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : "0"
			+ (date.getMonth() + 1)) + splitChar// "月"
		+ (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());
	return datetime;
    },
    /**
     * 格式化去日期（含时间）
     */
    formatterDateTime : function(date, splitChar) {
	if (!splitChar) {
	    splitChar = '-';
	}
	if (!(date instanceof Date)) {
	    date = new Date(date);
	}
	if (date == "Invalid Date") {
	    return "";
	}
	var datetime = date.getFullYear()
		+ splitChar// "年"
		+ ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : "0"
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
     * 检查当前日期是否符合日期插件数据
     * 
     * @param dateTime
     * @param nullResult
     *                空值结果 1）对于禁言设置，空值表示没有设置禁言，即当前时间不包含在其中。传值false
     *                2）对于聊天规则设置，空值表示永久生效，即当前时间包含在其中。传值true
     * @param checkDate
     *                仅仅检查日期是否通过
     */
    dateTimeWeekCheck : function(srcDateTime, nullResult, checkDate) {
	if (this.isBlank(srcDateTime)) {
	    return !!nullResult;
	}
	var dateTime = JSON.parse(srcDateTime);
	var currDate = new Date(), isPass = false, currDateStr = this
		.formatterDate(currDate);
	isPass = this.isBlank(dateTime.beginDate)
		|| currDateStr >= dateTime.beginDate;
	if (isPass) {
	    isPass = this.isBlank(dateTime.endDate)
		    || currDateStr <= dateTime.endDate;
	}
	if (!isPass) {
	    return false;
	}
	if (checkDate) {
	    return isPass;
	}
	var weekTime = dateTime.weekTime;
	if (this.isBlank(weekTime)) {
	    return isPass;
	}
	var row = null, currTime = null, weekTimePass = false;
	for ( var i in weekTime) {
	    row = weekTime[i];
	    if (this.isValid(row.week)
		    && currDate.getDay() != parseInt(row.week)) {
		continue;
	    }
	    if (this.isBlank(row.beginTime) && this.isBlank(row.beginTime)) {
		return true;
	    }
	    currTime = this.getHHMMSS(currDate);
	    weekTimePass = this.isBlank(row.beginTime)
		    || currTime >= row.beginTime;
	    if (weekTimePass) {
		weekTimePass = this.isBlank(row.endTime)
			|| currTime <= row.endTime;
	    }
	    if (weekTimePass) {
		break;
	    }
	}
	return weekTimePass;
    },
    /**
     * 提取时分
     */
    getHHMM : function(date) {
	if (!(date instanceof Date)) {
	    date = new Date(date);
	}
	var datetime = (date.getHours() < 10 ? "0" + date.getHours() : date
		.getHours())
		+ ":"
		+ (date.getMinutes() < 10 ? "0" + date.getMinutes() : date
			.getMinutes());
	return datetime;
    },

    /**
     * 提取时分秒
     */
    getHHMMSS : function(date) {
	if (!(date instanceof Date)) {
	    date = new Date(date);
	}
	var datetime = (date.getHours() < 10 ? "0" + date.getHours() : date
		.getHours())
		+ ":"
		+ (date.getMinutes() < 10 ? "0" + date.getMinutes() : date
			.getMinutes())
		+ ":"
		+ (date.getSeconds() < 10 ? "0" + date.getSeconds() : date
			.getSeconds());
	return datetime;
    },

    Deferred : function() {
	var _resolve;
	var _reject;
	this.promise = new Promise(function(resolve, reject) {
	    _resolve = resolve;
	    _reject = reject;
	}.bind(this));
	this.resolve = function(value) {
	    _resolve.call(this.promise, value);
	};
	this.reject = function(value) {
	    _reject.call(this.promise, value);
	};
    },

    /*
     * 功能:实现VBScript的DateAdd功能. 参数:interval,字符串表达式，表示要添加的时间间隔.
     * 参数:number,数值表达式，表示要添加的时间间隔的个数. 参数:date,时间对象. 返回:新的时间对象. var now = new
     * Date(); var newDate = DateAdd( "d ",5,now); ---------------
     * DateAdd(interval,number,date) -----------------
     */
    DateAdd : function(interval, number, date) {
	switch (interval) {
	case "y":// 年
	    date.setFullYear(date.getFullYear() + number);
	    break;
	case "q":// 季度
	    date.setMonth(date.getMonth() + number * 3);
	    break;
	case "M":// 月
	    date.setMonth(date.getMonth() + number);
	    break;
	case "w":// 周
	    date.setDate(date.getDate() + number * 7);
	    break;
	case "d":// 天
	    date.setDate(date.getDate() + number);
	    break;
	case "h":// 小时
	    date.setHours(date.getHours() + number);
	    break;
	case "m":// 分钟
	    date.setMinutes(date.getMinutes() + number);
	    break;
	case "s":// 秒
	    date.setSeconds(date.getSeconds() + number);
	    break;
	default:// 默认增加天
	    date.setDate(date.getDate() + number);
	    break;
	}
	return date;
    },
    Deferred: function () {
        var _resolve;
        var _reject;
        this.promise = new Promise(function (resolve, reject) {
                _resolve = resolve;
                _reject = reject;
            }
                .bind(this));
        this.resolve = function (value) {
            _resolve.call(this.promise, value);
        };
        this.reject = function (value) {
            _reject.call(this.promise, value);
        };
    },

    /**
     * 时间对象的格式化; eg:common.formatDate(new Date(), "yyyy-MM-dd HH:mm:ss:SSS")
     * ==>2015-04-30 14:11:52:037
     * 
     * @param date
     * @param format
     * @returns {String}
     */
    formatDate : function(date, format) {
	if (!format) {
	    format = "yyyy-MM-dd HH:mm:ss:SSS";
	}
	// 获取日期指定部分
	var getPart = function(date, pattern) {
	    var loc_result = null;
	    switch (pattern) {
	    case "yyyy":
		loc_result = date.getFullYear().toString();
		break;
	    case "yy":
		loc_result = date.getFullYear().toString().substring(2);
		break;
	    case "MM":
		loc_result = date.getMonth() + 1;
		if (loc_result < 10) {
		    loc_result = "0" + loc_result;
		}
		break;
	    case "M":
		loc_result = (date.getMonth() + 1).toString();
		break;
	    case "dd":
		loc_result = date.getDate();
		if (loc_result < 10) {
		    loc_result = "0" + loc_result;
		}
		break;
	    case "d":
		loc_result = (date.getDate()).toString();
		break;
	    case "HH":
		loc_result = date.getHours();
		if (loc_result < 10) {
		    loc_result = "0" + loc_result;
		}
		break;
	    case "H":
		loc_result = date.getHours().toString();
		break;
	    case "hh":
		loc_result = date.getHours() % 12;
		if (loc_result < 10) {
		    loc_result = "0" + loc_result;
		}
		break;
	    case "h":
		loc_result = (date.getHours() % 12).toString();
		break;
	    case "mm":
		loc_result = date.getMinutes();
		if (loc_result < 10) {
		    loc_result = "0" + loc_result;
		}
		break;
	    case "m":
		loc_result = date.getMinutes().toString();
		break;
	    case "ss":
		loc_result = date.getSeconds();
		if (loc_result < 10) {
		    loc_result = "0" + loc_result;
		}
		break;
	    case "s":
		loc_result = date.getSeconds().toString();
		break;
	    case "SSS":
		loc_result = date.getMilliseconds();
		if (loc_result < 10) {
		    loc_result = "00" + loc_result;
		} else if (loc_result < 100) {
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
	var loc_patterns = [ 'yyyy', 'yy', 'MM', 'M', 'dd', 'd', 'HH', 'H',
		'hh', 'h', 'mm', 'm', 'ss', 's', 'SSS', 'S', 'q' ];
	for (var i = 0, lenI = loc_patterns.length; i < lenI; i++) {
	    if (new RegExp(loc_patterns[i]).test(loc_result)) {
		loc_result = loc_result.replace(new RegExp(loc_patterns[i],
			"gm"), getPart(date, loc_patterns[i]));
	    }
	}
	return loc_result;
    }
};

// 导出类
try {
    if (module) {
	module.exports = common;
    }
} catch (e) {
}