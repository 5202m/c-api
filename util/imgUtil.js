var Images = require('images');//引入images
/**
 * 图片处理通用方法
 * create by alan.wu
 * 2015-5-8
 */
var imgUtil = {
    /**
     * 重置图片大小
     * @param imgPath 原图片路径
     * @param options {{width:Number, height:Number, quality: Number, output:String}}
     *          width : 压缩图片的宽度，width不给定height也不给定，不压缩图片宽高，height给定，按照原图大小等比压缩
     *          height : 压缩图片的高度，
     *          quality : 压缩图片的质量
     *          output : 压缩图片的目标文件名，不给定，覆盖原图
     */
    zipImg:function(imgPath, options){
        if(!options){
            return;
        }
        var exName = /\.(\w+)$/.exec(imgPath)[1];
        if(exName){
            exName = exName.toLowerCase();
        }
        if(exName != "gif" && exName != "png" && exName != "jpg"){
            console.log("image file type not support:" + exName);
            return;
        }
        var img = Images(imgPath);
        //缩放
        if(options.width && options.height){
            img = img.size(options.width, options.height);
        }else if(!options.width && options.height){
            img = img.size(img.width() * options.height / img.height());
        }else if(options.width && !options.height){
            img = img.size(options.width);
        }else{
            //不缩放
        }
        //保存
        var saveCfg = null;
        if(options.quality){
            saveCfg = {quality : options.quality};
        }
        var output = options.output || imgPath;
        if(exName == "gif"){
            // output = output.replace(/\.\w+$/, ".png");
            img.save(output, "png", saveCfg);
        }else{
            img.save(output, saveCfg);
        }
    }
};
//导出类
module.exports = imgUtil;