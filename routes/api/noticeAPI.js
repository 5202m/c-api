/**
 * API请求控制类
 * Created by Jade.zhu on 2016/11/21.
 */
var express = require('express');
var router = express.Router();

/*＃＃＃＃＃＃＃＃＃＃ 引入所需类 ＃＃＃＃＃＃＃＃begin */
var noticeService = require('../../service/noticeService');//引入chatService
var common = require('../../util/common'); //引入公共的js
var errorMessage = require('../../util/errorMessage');
var constant = require('../../constant/constant');//引入constant
/*＃＃＃＃＃＃＃＃＃＃ 引入所需服务类 ＃＃＃＃＃＃＃＃end */

/**
 * 财经日历点评提示
 */
router.post('/zxFinanceReviewNotice',function(req, res){
    var data = req.body['reviewData'], financeData = req.body['fData'];
    var result={isOK:false,error:null };
    if(common.isBlank(data) || common.isBlank(financeData)){
        result.error=errorMessage.code_1000;
    }else{
        try{
            financeData = JSON.parse(financeData);
            data = JSON.parse(data);
        }catch (e){
            result.error = errorMessage.code_10;
            res.json(result);
            return;
        }
        noticeService.send('financeReview',{'review':data, 'finance':financeData});
        result.isOK = true;
    }
    res.json(result);
});

module.exports = router;
