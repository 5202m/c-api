"use strict";
let should = require('should');
let request = require('request');
let subscribeAPI = require('../routes/api/subscribeAPI');
let common = require('../util/common'); //引入common类
let logger = require('../resources/logConf').getLogger("subscribeAPI");
let url = 'http://handanapi.hx9999.com/api/subscribe';


describe("subscribeAPI.getSubscribeNum", () => {
    let path = `${url}/getSubscribeNum?groupType=hxstudio&analystId=fox`;
    it("Should work as expect without subscribeTypes", done => {
        request({ url: path, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            data.result.should.equal(0);
            data.data.should.be.an.Object();
            logger.info(JSON.stringify(data));
            done();
        });
    });

    it("Should work as expect with subscribeTypes", done => {
        request({ url: `${path}&&subscribeTypes=daily_quotation,live_reminder`, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            data.result.should.equal(0);
            data.data.should.be.an.Object();
            logger.info(JSON.stringify(data));
            done();
        });
    });
});