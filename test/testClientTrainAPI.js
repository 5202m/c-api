"use strict";
let should = require('should');
let request = require('supertest')(require('../app'));
let clientTrainAPI = require('../routes/api/clientTrainAPI');
let common = require('../util/common'); //引入common类
let logger = require('../resources/logConf').getLogger("testClientTrainAPI");

//describe("clientTrainAPI.saveTrain");
//describe("clientTrainAPI.addClientTrain");
describe("clientTrainAPI.getTrainList", () => {
    it("Should work as expect when companyId is fx", done => {
        request.get("/api/clientTrain/getTrainList?groupType=fxstudio&isAll=true&companyId=fx")
            .expect(200, function(err, res) {
                //logger.info(res.body);
                res.body.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(0);
                res.body.data[0].should.have.keys("allowInto", "isEnd");
                res.body.data[0].openDate.should.be.an.Object();
                done();
            });
    });
    it("Should work as expect when companyId is PM", done => {
        request.get("/api/clientTrain/getTrainList?groupType=studio&isAll=true&companyId=pm")
            .expect(200, function(err, res) {
                res.body.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(0);
                res.body.data[0].should.have.keys("trainAuth");
                res.body.data[0].openDate.should.be.an.String();
                done();
            });
    });
});
describe("clientTrainAPI.getSignin", () => {
    it("Should work as expect when companyId is fx", done => {
        request.get("/api/clientTrain/getSignin?groupType=fxstudio&mobilePhone=18122223333&companyId=fx")
            .expect(200, function(err, res) {
                res.body.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg", "data");
                res.body.result.should.be.equal(0);
                res.body.data.should.have.keys("signinInfo", "signinUser");
                done();
            });
    });
    it("Should work as expect when companyId is pm", done => {
        request.get("/api/clientTrain/getSignin?groupType=studio&mobilePhone=18122223333&companyId=pm")
            .expect(200, function(err, res) {
                res.body.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg", "data");
                res.body.result.should.be.equal(0);
                res.body.data.should.have.keys("signinInfo", "signinUser");
                done();
            });
    });
});