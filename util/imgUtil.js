let Canvas = require("canvas");
let Image = Canvas.Image;
let path = require('path')
let fs = require("fs");
let logger = console;

let getImgTypeFromImgPath = imgPath => {
    let exName = /\.(\w+)$/.exec(imgPath)[1];
    if(exName){
        exName = exName.toLowerCase();
    }
    exName = exName === 'jpeg' ? 'jpg' : exName;
    return exName;
};

let getImgSize = (width, height, image) => {
    let _width = image.width, _height = image.height;
    if(width && height){
        _width = width;
        _height = height;
    } else if(!width && height){
        _width = image.width * (height/image.height);
        _height = height;
    } else if(width && !height){
        _width = width;
        _height = image.height * (width/image.width);
    }
    return {
            width: _width,
            height: _height
        };
};

let drawImg = (img, options) => {
    let zipImgSize = getImgSize(options.width, options.height, img);
    let canvas = new Canvas(zipImgSize.width, zipImgSize.height);
    logger.info("Canvas created: ", canvas.inspect());
    logger.info("Canvas image Data Length without image: ", canvas.toDataURL().length);
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, zipImgSize.width, zipImgSize.height);
    logger.info("Canvas image Data Length with image: ", canvas.toDataURL().length);
    return canvas;
};

let getImageStream = (canvas, exName, quality) => {
    let imageSteam;
    if(exName === 'jpg'){
        imageSteam = canvas.jpegStream({
            bufsize: 4096, 
            quality: quality || 75
        });
    } else {
        imageSteam = canvas.pngStream();
    }
    return imageSteam;
};

let writeImageStreamToFile = (imageSteam, savePath, callback) => {
    let outStream = fs.createWriteStream(savePath, {defaultEncoding: 'base64'});
    imageSteam.pipe(outStream);
    outStream.on("error", (err) => logger.error(err));
    outStream.on("finish", () => {
        let img = new Image();
        img.src = fs.readFileSync(savePath);
        logger.info(`The image file has been saved to ${savePath} successfully!`);
        if(callback)
            callback(img);
    });
};

let supportedImgTypes = ['jpg', 'png', 'gif'];

module.exports = {
    /**
     * 重置图片大小
     * @param imgPath 原图片路径
     * @param options {{width:Number, height:Number, quality: Number, output:String}}
     *          width : 压缩图片的宽度，width不给定height也不给定，不压缩图片宽高，height给定，按照原图大小等比压缩
     *          height : 压缩图片的高度，
     *          quality : 压缩图片的质量
     *          output : 压缩图片的目标文件名，不给定，覆盖原图
     */
    zipImg: (imgPath, options, callback) => {
        let exName = getImgTypeFromImgPath(imgPath);
        if(supportedImgTypes.indexOf(exName) === -1){
            logger.error("image file type not support:" + exName);
            return;
        }
        
        let img = new Image();
        
        let imageOnLoad = () => {
            logger.info("Image loaded: ", img.inspect());
            let canvas = drawImg(img, options);
            let savePath = options.output || imgPath;
            let imageSteam = getImageStream(canvas, exName, options.quality);
            writeImageStreamToFile(imageSteam, savePath, callback);
        };
        
        img.onerror = err => {
          throw err;
        };
        
        img.onload = imageOnLoad;
        
        img.src = imgPath;
    }
};