/**
 *
 * Created by Alan.wu on 2015/4/18.
 */
var config = {
    webUiUrl:'http://192.168.9.72:5555/webui_login_token.ucs',//webUI对应token地址
    web24kPriceUrl:'http://www.24k.hk/public/datas/24k_price.xml',
    //图片等文件访问域名
    filesDomain: 'http://218.213.241.84:8090',
    //db
    dbURL:'mongodb://192.168.35.236/pm_mis',
    dbUserName:'pmmisuser',
    dbUserPWD:'pmmispwd123'
};
//导出常量类
module.exports =config;

