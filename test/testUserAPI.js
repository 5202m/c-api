"use strict";
let should = require('should');
let request = require('request');
let userAPI = require('../routes/api/userAPI');
let common = require('../util/common'); //引入common类
let logger = require('../resources/logConf').getLogger("testUserAPI");
let url = 'http://localhost:3000/api/user';
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
});

describe("userAPI.getTeacherFollowers", () => {
    it("Should work as expect", done => {
        request({ url: `${url}/getTeacherFollowers?userNo=hxjls&groupType=hxstudio`, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            data.result.should.equal(0);
            data.data.should.be.an.Array();
            logger.info(JSON.stringify(data));
            done();
        });
    });
    it("Should work as expect when teacher doesn't exist", done => {
        request({ url: `${url}/getTeacherFollowers?userNo=notExist&groupType=hxstudio`, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            data.result.should.equal(0);
            data.data.should.be.empty();
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
            data.result.should.equal(0);
            data.data.should.be.an.Array();
            logger.info(JSON.stringify(data));
            done();
        });
    });
    it("Should work as expect when the user doesn't exist", done => {
        request({ url: `${url}/getFollowedTeachers?userId=notExist`, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            data.result.should.equal(0);
            data.data.should.be.empty();
            logger.info(JSON.stringify(data));
            done();
        });
    });
});

describe("userAPI.getMemberInfo", () => {
    it("Should work as expect", done => {
        request({ url: `${url}/getMemberInfo?userId=fxnxiiiiuuuuc&groupType=hxstudio`, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            data.result.should.equal(0);
            data.data.should.be.an.Object();
            data.data.rooms.should.be.an.Array();
            logger.info(JSON.stringify(data));
            done();
        });
    });
});

describe("userAPI.getMemberListByUserNos", () => {
    it("Should work as expect", done => {
        request({ url: `${url}/getMemberListByUserNos?userNos=pxnxiiiiuuuuu,pxnxiipcvfnvx&groupType=fxstudio`, json: true }, (err, res, data) => {
            should.not.exist(err);
            res.should.be.an.Object();
            data.should.be.an.Object();
            data.result.should.equal(0);
            data.data.should.be.an.Array();
            logger.info(JSON.stringify(data));
            done();
        });
    });
});