var EventEmitter = require('events').EventEmitter;

/**
 * 迭代器工具类<BR>
 * ------------------------------------------<BR>
 * <BR>
 * Copyright© : 2015 by Dick<BR>
 * Author : Dick <BR>
 * Date : 2015年08月07日 <BR>
 * Description :<BR>
 * <p>
 *     1.异步迭代一个数组
 *     2.异步迭代一个对象
 *     3.同步迭代一个数组
 *     4.同步迭代一个对象
 * </p>
 */
var IteratorUtil = {
    /**
     * 异步迭代一个数组，将数组的每一个元素传递给处理函数（异步），在所有处理结束之后调用回调。
     * 举例:
     *      Iterator.asyncArray(
     *          [1,2,3,4,5],
     *          function(index, item, callback){
     *              setTimeout(function(){
     *                  //console.log(index);
     *                  if(item % 2 == 0){
     *                      callback(new Error("偶数"), null);
     *                  }else{
     *                      callback(null, index * item);
     *                  }
     *              }, Math.random() * 100);
     *          },
     *          function(errArr, dataArr){
     *              //errArr=[null, Error, null, Error, null]
     *              //dataArr=[0,   null,  6,    null,  20]
     *              console.log(errArr, dataArr);
     *      });
     * @param items 待迭代的对象
     * @param processFun 节点处理函数，三个参数:索引、节点、回调（err,data）
     * @param callback 最终回调，在迭代节点处理函数全部完成之后，将所有结果传递给最终回调。有两个参数：（errArr,dataArr）
     *          如果没有错误，返回一个null，如果存在错误，则错误是一个数组。
     */
    asyncArray : function(items, processFun, callback){
        if(items instanceof Array === false || typeof processFun !== "function" || typeof callback !== "function" ){
            throw new Error("parameter is invalid!", arguments);
        }

        var loc_len = items.length;
        var loc_index = loc_len;
        var loc_errFlag = false;
        var loc_errArr = [];
        var loc_dataArr = [];

        if(loc_len === 0){
            callback(null, []);
            return;
        }
        var processCallback = function(index){
            return function(err, data){
                if(err){
                    loc_errFlag = true;
                }
                loc_errArr[index] = err;
                loc_dataArr[index] = data;
                loc_index--;
                if(loc_index <= 0){
                    if(loc_errFlag === false){
                        loc_errArr = null;
                    }
                    callback(loc_errArr, loc_dataArr);
                }
            }
        };
        for(var i = 0; i < loc_len; i++){
            processFun(i, items[i], processCallback(i));
        }
    },

    /**
     * 异步迭代一个对象，将对象的每一个属性传递给处理函数（异步），在所有处理结束之后调用回调。
     * 举例:
     *      Iterator.asyncObject(
     *          {
     *              score1 : 49,
     *              score2 : 69,
     *              score3 : 79,
     *              score4 : 59,
     *              score5 : 89
     *          },
     *          function(key, value, callback){
     *              setTimeout(function(){
     *                  console.log(key);
     *                  if(value < 60){
     *                      callback(new Error("未及格"), null);
     *                  }else{
     *                      callback(null, "科目"+key+":"+value);
     *                  }
     *              }, Math.random() * 100);
     *          },
     *          function(errArr, dataArr){
     *              //errArr={score1:Error, score2:null, score3:null, score4:Error, score5:null}
     *              //dataArr={score1:null, score2:"科目score2:69", score3:"科目score3:79", score4:null, score5:"科目score5:99"}
     *              console.log(errArr, dataArr);
     *          });
     * @param items 待迭代的对象
     * @param processFun 节点处理函数，三个参数:属性名、属性值、回调（err,data）
     * @param callback 最终回调，在迭代节点处理函数全部完成之后，将所有结果传递给最终回调。有两个参数：（errObj,dataObj）
     *          如果没有错误，返回一个null，如果存在错误，则错误是一个对象
     */
    asyncObject : function(items, processFun, callback){
        if(typeof items !== "object" || typeof processFun !== "function" || typeof callback !== "function" ){
            throw new Error("parameter is invalid!", arguments);
        }

        var loc_keys = Object.keys(items);
        var loc_len = loc_keys.length;
        var loc_index = loc_len;
        var loc_errFlag = false;
        var loc_errObj = {};
        var loc_dataObj = {};

        if(loc_len === 0){
            callback(null, {});
            return;
        }
        var processCallback = function(key){
            return function(err, data){
                if(err){
                    loc_errFlag = true;
                }
                loc_errObj[key] = err;
                loc_dataObj[key] = data;
                loc_index--;
                if(loc_index <= 0){
                    if(loc_errFlag === false){
                        loc_errObj = null;
                    }
                    callback(loc_errObj, loc_dataObj);
                }
            }
        };
        var loc_key = null;
        for(var i = 0; i < loc_len; i++){
            loc_key = loc_keys[i];
            processFun(loc_key, items[loc_key], processCallback(loc_key));
        }
    },

    /**
     * 同步迭代一个数组，将数组的每一个元素传递给处理函数（同步），在所有处理结束之后调用回调。
     * 举例:
     *      Iterator.syncArray(
     *          [1,2,3,4,5],
     *          function(index, item, callback){
     *              setTimeout(function(){
     *                  //console.log(index);
     *                  if(item % 2 == 0){
     *                      callback(new Error("偶数"), null);
     *                  }else{
     *                      callback(null, index * item);
     *                  }
     *              }, Math.random() * 100);
     *          },
     *          function(errArr, dataArr){
     *              //errArr=[null, Error, null, Error, null]
     *              //dataArr=[0,   null,  6,    null,  20]
     *              console.log(errArr, dataArr);
     *      });
     * @param items 待迭代的对象
     * @param processFun 节点处理函数，三个参数:索引、节点、回调（err,data）
     * @param callback 最终回调，在迭代节点处理函数全部完成之后，将所有结果传递给最终回调。有两个参数：（errArr,dataArr）
     *          如果没有错误，返回一个null，如果存在错误，则错误是一个数组。
     */
    syncArray : function(items, processFun, callback){
        if(items instanceof Array === false || typeof processFun !== "function" || typeof callback !== "function" ){
            throw new Error("parameter is invalid!", arguments);
        }

        var loc_len = items.length;
        var loc_errFlag = false;
        var loc_errArr = [];
        var loc_dataArr = [];

        if(loc_len === 0){
            callback(null, []);
            return;
        }
        var loc_emitter = new EventEmitter();
        loc_emitter.on("next", function(index){
            if(index >= loc_len){
                if(loc_errFlag === false){
                    loc_errArr = null;
                }
                callback(loc_errArr, loc_dataArr);
                return;
            }
            processFun(index, items[index], function(err, data){
                if(err){
                    loc_errFlag = true;
                }
                loc_errArr[index] = err;
                loc_dataArr[index] = data;
                loc_emitter.emit("next", index+1);
            });
        });

        loc_emitter.emit("next", 0);
    },

    /**
     * 同步迭代一个对象，将对象的每一个属性传递给处理函数（异步），在所有处理结束之后调用回调。
     * 举例:
     *      Iterator.syncObject(
     *          {
     *              score1 : 49,
     *              score2 : 69,
     *              score3 : 79,
     *              score4 : 59,
     *              score5 : 89
     *          },
     *          function(key, value, callback){
     *              setTimeout(function(){
     *                  console.log(key);
     *                  if(value < 60){
     *                      callback(new Error("未及格"), null);
     *                  }else{
     *                      callback(null, "科目"+key+":"+value);
     *                  }
     *              }, Math.random() * 100);
     *          },
     *          function(errArr, dataArr){
     *              //errArr={score1:Error, score2:null, score3:null, score4:Error, score5:null}
     *              //dataArr={score1:null, score2:"科目score2:69", score3:"科目score3:79", score4:null, score5:"科目score5:99"}
     *              console.log(errArr, dataArr);
     *          });
     * @param items 待迭代的对象
     * @param processFun 节点处理函数，三个参数:属性名、属性值、回调（err,data）
     * @param callback 最终回调，在迭代节点处理函数全部完成之后，将所有结果传递给最终回调。有两个参数：（errObj,dataObj）
     *          如果没有错误，返回一个null，如果存在错误，则错误是一个对象
     */
    syncObject : function(items, processFun, callback){
        if(typeof items !== "object" || typeof processFun !== "function" || typeof callback !== "function" ){
            throw new Error("parameter is invalid!", arguments);
        }

        var loc_keys = Object.keys(items);
        var loc_len = loc_keys.length;
        var loc_errFlag = false;
        var loc_errObj = {};
        var loc_dataObj = {};

        if(loc_len === 0){
            callback(null, {});
            return;
        }
        var loc_emitter = new EventEmitter();
        loc_emitter.on("next", function(index){
            if(index >= loc_len){
                if(loc_errFlag === false){
                    loc_errObj = null;
                }
                callback(loc_errObj, loc_dataObj);
                return;
            }
            var loc_attr = loc_keys[index];
            processFun(loc_attr, items[loc_attr], function(err, data){
                if(err){
                    loc_errFlag = true;
                }
                loc_errObj[loc_attr] = err;
                loc_dataObj[loc_attr] = data;
                loc_emitter.emit("next", index + 1);
            });
        });

        loc_emitter.emit("next", 0);
    }
};
module.exports = IteratorUtil;