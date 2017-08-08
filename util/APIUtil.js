/**
 * API工具类<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年06月10日 <BR>
 * Description :<BR>
 * <p>
 *     提供API相关操作的方法
 * </p>
 */
var logger = require('../resources/logConf').getLogger("APIUtil");
var HTTP = require("http");
var URL = require("url");
var Constant = require('../constant/constant.js');
var ErrorMessage = require('../util/errorMessage.js');
var CommonJS = require('../util/common.js');
var fs = require('fs');
var path = require('path');

/**
 * 测试接口工具
 *  示例：APIUtil.TestAPIRequest(formatUrl("product/list"), {}, "POST");
 * @param url
 * @param param
 * @param method
 * @param callback
 * @constructor
 */
var TestRequest = function(url, param, method, callback) {
    /**url*/
    this.url = url;
    /**参数*/
    this.param = param;
    /**method: post/get*/
    this.method = method;
    /**回调，有两个参数，第一个为error，第二个为data*/
    this.callback = callback;

    this.init();
};
//测试接口工具(原型)--初始化
TestRequest.prototype.init = function() {
    if (typeof this.url !== "string" || this.url === "") {
        logger.error("url is error: " + this.url);
        throw new Error("url is error: " + this.url);
    }

    if (!this.param) {
        this.param = "";
    }

    if (typeof this.method !== "string" || this.method === "") {
        this.method = "POST";
    } else {
        this.method = this.method.toUpperCase();
    }

    if (typeof this.callback !== "function") {
        this.callback = function(error, data) {
            if (error) {
                logger.error(error);
                throw error;
            } else {
                logger.info("[RESULT]: ", data);
            }
        }
    }
};
//测试接口工具(原型)--请求
TestRequest.prototype.request = function() {
    var urlObj = URL.parse(this.url);

    var options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.path,
        method: this.method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    var thatCallback = this.callback;
    var req = HTTP.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(data) {
            thatCallback(null, data);
        });
    });

    req.on('error', function(err) {
        thatCallback(err, null);
    });
    if (typeof this.param === "object" && this.method === "POST") {
        req.write(JSON.stringify(this.param) + "\r\n");
    }
    req.end();
};
//文件上传
TestRequest.prototype.upload = function() {
    var boundaryKey = Math.random().toString(16);
    var urlObj = URL.parse(this.url);

    var options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.path,
        method: "POST",
        headers: {
            'Content-Type': 'multipart/form-data; boundary=--' + boundaryKey
        }
    };

    var thatCallback = this.callback;
    var req = HTTP.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(data) {
            thatCallback(null, data);
        });
    });

    req.on('error', function(err) {
        thatCallback(err, null);
    });

    if (typeof this.param === "object") {
        for (var key in this.param) {
            if (key === "files") {
                continue;
            }
            req.write('\r\n----' + boundaryKey +
                '\r\nContent-Disposition: form-data; name="' + key + '"\r\n\r\n' +
                this.param[key].toString());
        }
        var loc_submitOneFile = function(index, len, fileKeys, files, req, callback) {
            if (index >= len) {
                callback(null);
                return;
            }
            var loc_filePath = files[fileKeys[index]];
            var loc_fileName = path.basename(loc_filePath);
            req.write(
                '\r\n----' + boundaryKey +
                '\r\nContent-Type: application/octet-stream' +
                '\r\nContent-Disposition: form-data; name="' + fileKeys[index] + '"; filename="' + loc_fileName + '"' +
                '\r\n' + 'Content-Transfer-Encoding: binary\r\n\r\n'
            );
            //设置1K的缓冲区
            var fileStream = fs.createReadStream(loc_filePath, { bufferSize: 1024 });
            fileStream.pipe(req, { end: false });
            fileStream.on('error', function(err) {
                callback(err);
            });
            fileStream.on('end', function() {
                loc_submitOneFile(++index, len, fileKeys, files, req, callback);
            });
        };

        var loc_fileKeys = Object.keys(this.param.files);
        var lenFile = loc_fileKeys.length;
        if (lenFile > 0) {
            loc_submitOneFile(0, lenFile, loc_fileKeys, this.param.files, req, function(err) {
                if (err) {
                    thatCallback(err, null);
                }
                req.write('\r\n----' + boundaryKey + '--');
                req.end();
            });
        } else {
            req.end();
        }
    } else {
        req.end();
    }
};

//测试接口工具(类方法)--请求
TestRequest.request = function(url, param, method, callback) {
    new TestRequest(url, param, method, callback).request();
};
//测试接口工具(类方法)--post请求
TestRequest.post = function(url, param, callback) {
    TestRequest.request(url, param, 'POST', callback);
};
//测试接口工具(类方法)--get请求
TestRequest.get = function(url, callback) {
    TestRequest.request(url, null, 'GET', callback);
};
//测试接口工具(类方法)--get请求
TestRequest.upload = function(url, param, callback) {
    new TestRequest(url, param, "POST", callback).upload();
};

/**
 * 获取一个API结果对象
 * @param error 错误
 * @param data 数据信息
 * @param [page] 分页信息
 */
var APIResult = function(error, data, page) {
    var loc_result = {
        result: 0,
        errcode: "0",
        errmsg: "",

        data: null
    };
    if (data) {
        loc_result.data = data;
    }
    if (page) {
        loc_result.page = page;
    }
    if (error === null || error === undefined) {
        return loc_result;
    }

    if (typeof error === "object" && error instanceof Error) {
        loc_result.result = 1;
        loc_result.errcode = "-1";
        loc_result.errmsg = error.message;
        return loc_result;
    }

    loc_result.result = 1;
    var loc_error = ErrorMessage[error];
    if (loc_error) {
        loc_result.errcode = loc_error.errcode;
        loc_result.errmsg = loc_error.errmsg;
    } else {
        loc_result.errcode = "-1";
        loc_result.errmsg = typeof error == "string" ? error : "未知错误";
    }
    //logger.info("[APIResult] %s", JSON.stringify(loc_result));

    return loc_result;
};

var APIResultFromData = function(data) {
    if (!data) {
        return APIResult();
    }
    if ("isOK" in data && "msg" in data) {
        if (data["isOK"]) {
            return APIResult(null, data["msg"]);
        }
        return APIResult(data["msg"]);
    } else {
        return APIResult(null, data);
    }
};

/***
 * 将字符串数组转化为对象。
 *  [str1, str2, str3] ==> {str1: value, str2: value, str3: value}
 * @param target 目标，最开始为{}
 * @param arr 字段名数组
 * @param value 每一个元素的值
 * @returns {*}
 */
var convertField = function(target, arr, value) {
    for (var i = 0, lenI = arr.length; i < lenI; i++) {
        target[arr[i]] = value;
    }
    return target;
};

/**
 * 数据库查询
 *  注修改查询逻辑时注意与DBPage同步
 * @param schema
 * @param options 包含query、sortAsc、sortDesc、fieldIn、fieldEx
 * @param callback 回调，包含error和data两个参数, 如果没有错误信息，error为null。
 */
var DBFind = function(schema, options, callback) {
    try {
        var defaultOp = {
            //查询条件
            query: {},
            //正序字段名数组
            sortAsc: [],
            //逆序字段名数组
            sortDesc: [],
            //包含字段名数组
            fieldIn: [],
            //排除字段名数组
            fieldEx: []
        };
        var loc_op = null;
        if (options) {
            loc_op = {};
            var keys = Object.keys(defaultOp);
            for (var i = 0, lenI = keys.length; i < lenI; i++) {
                loc_op[keys[i]] = options.hasOwnProperty(keys[i]) ? options[keys[i]] : defaultOp[keys[i]];
            }
        } else {
            loc_op = defaultOp;
        }

        var loc_fields = convertField({}, loc_op.fieldIn, 1);
        loc_fields = convertField(loc_fields, loc_op.fieldEx, 0);
        var loc_sorts = convertField({}, loc_op.sortAsc, 1);
        loc_sorts = convertField(loc_sorts, loc_op.sortDesc, -1);

        var loc_query = schema.find(loc_op.query);
        if (Object.keys(loc_sorts).length > 0) {
            loc_query.sort(loc_sorts);
        }
        if (Object.keys(loc_fields).length > 0) {
            loc_query.select(loc_fields);
        }
        loc_query.exec('find', function(err, data) {
            if (err != null) {
                callback(err, null);
                return;
            }
            callback(null, data);
        });
    } catch (err) {
        logger.error(err);
        callback(err, null);
    }
};

/**
 * 数据库查询，与DBFind不同之处在于回调参数只有一个APIResult
 * @param schema
 * @param options
 * @param callback
 * @constructor
 */
var DBFindAPIResult = function(schema, options, callback) {
    DBFind(schema, options, function(error, data) {
        callback(APIResult(error, data, null));
    });
};

/**
 * 初始化分页信息
 * @param pageLast
 * @param pageSize
 *
 * @return {{pageLast : String, pageSize : Number, totalCnt : Number, totalPageCnt : Number}}
 */
var getPageInfo = function(pageLast, pageSize) {
    var loc_result = {
        //当前请求页码
        pageLast: '',
        //每页记录数
        pageSize: Constant.pageSize,
        totalCnt: 0,
        totalPageCnt: 0
    };
    if (typeof pageLast === "string" && pageLast !== "") {
        loc_result.pageLast = pageLast;
    }
    var loc_pageSize = parseInt(pageSize, 10);
    if (typeof loc_pageSize === "number" && loc_pageSize > 0) {
        loc_result.pageSize = loc_pageSize;
    }
    return loc_result;
};

/**
 * 按照分页信息获取当前页列表
 * @param arr 目标数组
 * @param page 分页信息
 * @param isDesc 是否降序，true时，分页的顺序从后往前, 默认false
 * @param IdGetter Id获取器，参数为arr的元素，默认直接返回Id元素
 */
var getPageListByArr = function(arr, page, isDesc, IdGetter) {
    var loc_isDesc = !(isDesc !== true);
    var lenArr = arr instanceof Array ? arr.length : 0;
    page.totalCnt = lenArr;
    page.totalPageCnt = parseInt((page.totalCnt - 1) / page.pageSize + 1, 10);
    if (lenArr === 0) {
        return [];
    }
    if (typeof IdGetter !== "function") {
        IdGetter = function(item) {
            return item;
        }
    }
    var loc_isFirst = !page.pageLast;
    var loc_start = 0,
        loc_end = 0,
        loc_result = [];
    var i = 0;

    if (loc_isDesc) {
        //降序
        loc_end = lenArr;
        if (loc_isFirst === false) {
            //非首页
            loc_end = 0;
            for (i = lenArr - 1; i >= 0; i--) {
                if (IdGetter(arr[i]) === page.pageLast) {
                    loc_end = i;
                    break;
                }
            }
        }
        loc_start = Math.max(loc_end - page.pageSize, 0);
        loc_result = arr.slice(loc_start, loc_end).reverse();
        page.pageLast = IdGetter(arr[loc_start]);
    } else {
        //升序
        loc_start = 0;
        if (loc_isFirst === false) {
            //非首页
            loc_start = lenArr;
            for (i = 0; i < lenArr; i++) {
                if (IdGetter(arr[i]) === page.pageLast) {
                    loc_start = i + 1;
                    break;
                }
            }
        }
        loc_end = Math.min(loc_start + page.pageSize, lenArr);
        loc_result = arr.slice(loc_start, loc_end);
        page.pageLast = IdGetter(arr[loc_end - 1]);
    }
    return loc_result;
};

/**
 * 数据库分页查询
 *  注修改查询逻辑时注意与DBFind同步
 * @param schema
 * @param options 包含query、sortAsc、sortDesc、fieldIn、fieldEx、pageLast、pageSize、pageId、pageDesc
 * @param callback 回调，包含error和data, page三个参数, 如果没有错误信息，error为null。
 */
var DBPage = function(schema, options, callback) {
    var loc_pageInfo = getPageInfo(options["pageLast"], options["pageSize"]);
    var loc_page = {
        //总记录数
        totalCnt: 0,
        //总页数
        totalPageCnt: 0,
        //当前请求页码
        pageLast: loc_pageInfo.pageLast,
        //每页记录数
        pageSize: loc_pageInfo.pageSize
    };
    try {
        var defaultOp = {
            //查询条件
            query: {},
            //包含字段名数组
            fieldIn: [],
            //排除字段名数组
            fieldEx: []
        };
        var loc_op = null;
        if (options) {
            loc_op = {};
            var keys = Object.keys(defaultOp);
            for (var i = 0, lenI = keys.length; i < lenI; i++) {
                loc_op[keys[i]] = options.hasOwnProperty(keys[i]) ? options[keys[i]] : defaultOp[keys[i]];
            }
        } else {
            loc_op = defaultOp;
        }

        //计算总数
        schema.count(loc_op.query, function(err, cnt) {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            try {
                loc_page.totalCnt = cnt;
                loc_page.totalPageCnt = parseInt((loc_page.totalCnt - 1) / loc_page.pageSize + 1, 10);

                var loc_pageDesc = !(options["pageDesc"] !== true);
                var loc_pageId = !options["pageId"] ? "_id" : options["pageId"];
                if (!!loc_pageInfo.pageLast) {
                    if (loc_pageDesc) {
                        loc_op.query[loc_pageId] = { $lt: loc_pageInfo.pageLast };
                    } else {
                        loc_op.query[loc_pageId] = { $gt: loc_pageInfo.pageLast };
                    }
                }

                var loc_fields = convertField({}, loc_op.fieldIn, 1);
                loc_fields = convertField(loc_fields, loc_op.fieldEx, 0);
                var loc_sorts = {};
                loc_sorts[loc_pageId] = loc_pageDesc ? -1 : 1;

                var loc_query = schema.find(loc_op.query);
                loc_query.limit(loc_page.pageSize);
                if (Object.keys(loc_sorts).length > 0) {
                    loc_query.sort(loc_sorts);
                }
                if (Object.keys(loc_fields).length > 0) {
                    loc_query.select(loc_fields);
                }
                loc_query.exec('find', function(err, data) {
                    if (err != null) {
                        callback(err, null, null);
                        return;
                    }
                    if (data && data.length > 0) {
                        loc_page.pageLast = data[data.length - 1][loc_pageId];
                    }
                    callback(null, data, loc_page);
                });
            } catch (err) {
                logger.error(err);
                callback(err, null, null);
            }
        });
    } catch (err) {
        logger.error(err);
        callback(err, null, null);
    }
};

/**
 * 数据库查询，与DBFind不同之处在于回调参数只有一个APIResult
 * @param schema
 * @param options
 * @param callback
 * @constructor
 */
var DBPageAPIResult = function(schema, options, callback) {
    DBPage(schema, options, function(error, data, page) {
        callback(APIResult(error, data, page));
    });
};


/**
 * 数据库查询(单个查询)
 * @param schema
 * @param options 包含query、fieldIn、fieldEx
 * @param callback 回调，包含error和data两个参数, 如果没有错误信息，error为null。
 */
var DBFindOne = function(schema, options, callback) {
    try {
        var defaultOp = {
            //查询条件
            query: {},
            //包含字段名数组
            fieldIn: [],
            //排除字段名数组
            fieldEx: []
        };
        var loc_op = null;
        if (options) {
            loc_op = {};
            var keys = Object.keys(defaultOp);
            for (var i = 0, lenI = keys.length; i < lenI; i++) {
                loc_op[keys[i]] = options.hasOwnProperty(keys[i]) ? options[keys[i]] : defaultOp[keys[i]];
            }
        } else {
            loc_op = defaultOp;
        }

        var loc_fields = convertField({}, loc_op.fieldIn, 1);
        loc_fields = convertField(loc_fields, loc_op.fieldEx, 0);
        schema.findOne(loc_op.query, loc_fields, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, data);
        });
    } catch (err) {
        logger.error(err);
        callback(err, null);
    }
};

/**
 * 数据库查询(单个查询)，与DBFindOne不同之处在于回调参数只有一个APIResult
 * @param schema
 * @param options
 * @param callback
 * @constructor
 */
var DBFindOneAPIResult = function(schema, options, callback) {
    DBFind(schema, options, function(error, data) {
        callback(APIResult(error, data, null));
    });
};

/**
 * 打印请求日志信息
 * @param req
 * @param fileName
 */
var logRequestInfo = function(req, fileName) {
    fileName = !fileName ? "" : fileName;
    var loc_method = req.method;
    var loc_params = "POST" === loc_method ? JSON.stringify(req.body) : JSON.stringify(req.query);
    logger.info("[%s] ip=%s, method=%s, url=%s, param=%s", fileName, CommonJS.getClientIp(req), loc_method, req.originalUrl, loc_params);
};

let pathList = [
    "/common/*",
    "/message/*",
    "/token/*",
    "/upload/*",
    "/chat/getMessageList",
    "/article/getGroupArticles",
    "/article/getArticleCount",
    "/article/getArticleList",
    "/showTrade/getShowTradeList",
    "/chat/getAnalysts",
    "/chat/getMemberInfo",
    "/chat/getShowTrade",
    "/chat/praiseAnalyst",
    "/zxFinanceData/*"
];
let pathFromAppList = [
    "/showTrade/*"
];
var isSkipTokenVerification = function(list) {
    return url => list.some(path => new RegExp(path).test(url));
}

module.exports = {
    /**
     * 测试相关方法
     */
    TestAPIRequest: TestRequest.request,
    TestAPIPost: TestRequest.post,
    TestAPIGet: TestRequest.get,
    TestAPIUpload: TestRequest.upload,

    /**
     * 获取分页信息
     */
    getPageInfo: getPageInfo,
    getPageListByArr: getPageListByArr,

    /**
     * API结果
     */
    APIResult: APIResult,
    APIResultFromData: APIResultFromData,

    /**
     * 数据库操作相关
     */
    DBFind: DBFind,
    DBFindAPIResult: DBFindAPIResult,
    DBPage: DBPage,
    DBPageAPIResult: DBPageAPIResult,
    DBFindOne: DBFindOne,
    DBFindOneAPIResult: DBFindOneAPIResult,

    /**
     * 日志相关
     */
    logRequestInfo: logRequestInfo,

    /**
     * Token 认证相关
     */
    isUrlSkipTokenAccess: isSkipTokenVerification(pathList),
    isUrlSkipTokenForApp: isSkipTokenVerification(pathFromAppList)
};