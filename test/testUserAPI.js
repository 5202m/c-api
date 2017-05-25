"use strict";
let should = require('should');
let request = require('request');
let userAPI = require('../routes/api/userAPI');
let common = require('../util/common'); //引入common类
let logger = require('../resources/logConf').getLogger("testUserAPI");
let url = 'http://192.168.35.81:3003/api/user';
describe("userAPI.setTeacherFollower", () => {
    let data = {
        userId: "vxcnnfsipssdi",
        analystNo: "hxjls"
    };
    it("Should work as expect to add follower to teacher.", (done) => {
        let options = {
            url: `${url}/setTeacherFollower`,
            body: Object.assign({}, data),
            json: true
        };
        request.post(options, (err, res, jsonData) => {
            should.not.exist(err);
            res.should.be.an.Object();
            jsonData.should.be.an.Object();
            jsonData.data.isOK.should.be.a.Boolean();
            jsonData.data.isOK.should.be.true();
            logger.info(JSON.stringify(jsonData));
            done();
        });
    });
    it("Should work as expect to add follower to teacher again.", (done) => {
        let options = {
            url: `${url}/setTeacherFollower`,
            body: Object.assign({}, data),
            json: true
        };
        request.post(options, (err, res, jsonData) => {
            should.not.exist(err);
            res.should.be.an.Object();
            jsonData.should.be.an.Object();
            jsonData.data.isOK.should.be.a.Boolean();
            jsonData.data.isOK.should.be.false();
            logger.info(JSON.stringify(jsonData));
            done();
        });
    });
    it("Should work as expect to remove follower to teacher.", (done) => {
        let options = {
            url: `${url}/setTeacherFollower`,
            body: Object.assign({ isFollow: 0 }, data),
            json: true
        };
        request.post(options, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            logger.info(JSON.stringify(data));
            done();
        });
    });
});

describe("userAPI.getTeacherFollowers", () => {
    it("Should work as expect", done => {
        request({ url: `${url}/getTeacherFollowers?userNo=hxjls&groupType=hxstudio`, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            logger.info(JSON.stringify(data));
            done();
        });
    });
});

describe("userAPI.getFollowedTeachers", () => {
    it("Should work as expect", done => {
        request({ url: `${url}/getFollowedTeachers?userId=fxnxiiiiuuuuc`, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            logger.info(JSON.stringify(data));
            done();
        });
    });
});