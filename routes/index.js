/**
 * 主页
 */
var express = require('express');
var router = express.Router();

/**
 * 跳转到主页
 */
router.get('/', function(req, res) {
    res.render('index',{title: 'api启动'});
});
module.exports = router;
