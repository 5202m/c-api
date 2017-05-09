/**
 * API请求控制类
 * Created by Jade.zhu on 2016/11/21.
 */
/**
 * @apiDefine ParameterNotAvailableJSONError
 *
 * @apiError ParameterNotAvailableJSONError 参数数据不是合法的JSON字符串。
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 1,
 *          "errcode": "10",
 *          "errmsg": "操作异常!",
 *          "data": null
 *      }
 */
/**
 * @apiDefine CommonResultDescription
 *
 * @apiSuccess {Number} result 结果码，0 - 成功；-1 - 未知或未定义的错误；other - API系统定义的错误
 * @apiSuccess {String} errmsg  错误信息.
 * @apiSuccess {Number} errcode  错误码.
 */
var express = require('express');
var router = express.Router();
var noticeService = require('../../service/noticeService');
var common = require('../../util/common');
var errorMessage = require('../../util/errorMessage');
var constant = require('../../constant/constant');

/**
 * @api {post} /notice/zxFinanceReviewNotice 财经日历点评提示，socket方式推送至前台
 * @apiName zxFinanceReviewNotice
 * @apiGroup notice
 *
 * @apiParam {String} reviewData 财经日历点评内容json字符串
 * @apiParam {String} fData 财经日历内容json字符串，必填
 *
 * @apiUse CommonResultDescription
 * @apiSuccess {Object} data  返回的数据
 *
 * @apiSampleRequest /api/notice/zxFinanceReviewNotice
 * @apiParamExample {json} Request-Example:
 *     {
 *       "reviewData": "{}",
 *       "fData": "{}"
 *     }
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "result": 0,
 *          "errcode": "0",
 *          "errmsg": "",
 *          "data": {
 *          	...
 *          }
 *      }
 *
 * @apiUse ParametersMissedError
 */
router.post('/zxFinanceReviewNotice', function(req, res) {
    var data = req.body['reviewData'],
        financeData = req.body['fData'];
    var result = { isOK: false, error: null };
    if (common.isBlank(data) || common.isBlank(financeData)) {
        result.error = errorMessage.code_1000;
    } else {
        try {
            financeData = JSON.parse(financeData);
            data = JSON.parse(data);
        } catch (e) {
            result.error = errorMessage.code_10;
            res.json(result);
            return;
        }
        noticeService.send('financeData', { 'review': data, 'finance': financeData });
        result.isOK = true;
    }
    res.json(result);
});

module.exports = router;