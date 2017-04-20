"use strict";
let should = require('should');
let request = require('supertest')(require('../app'));
let chatAPI = require('../routes/api/chatAPI');
let common = require('../util/common'); //引入common类
let logger = require('../resources/logConf').getLogger("testChatAPI");

describe("chatAPI.leaveRoom", () => {
    it("Should work as expect when groupIds is empty.", (done) => {
        request.post("/api/chat/leaveRoom")
            .send({
                groupIds: null
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(0);
                res.body.errcode.should.be.equal("1000");
                done();
            });
    });
    it("Should work as expect when groupIds exists.", done => {
        request.post("/api/chat/leaveRoom")
            .send({
                groupIds: "fxstudio_50"
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "msg", "data");
                res.body.result.should.be.equal(0);
                res.body.msg.should.be.equal("OK");
                res.body.data.isOK.should.be.a.Boolean();
                res.body.data.isOK.should.be.true();
                done();
            });
    });
    it("Should work as expect when groupIds and userIds exists.", done => {
        request.post("/api/chat/leaveRoom")
            .send({
                groupIds: "fxstudio_50",
                userIds: "eugene_ana"
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "msg", "data");
                res.body.result.should.be.equal(0);
                res.body.msg.should.be.equal("OK");
                res.body.data.isOK.should.be.a.Boolean();
                res.body.data.isOK.should.be.true();
                done();
            });
    });
});


describe("chatAPI.submitPushInfo", () => {
    it("Should work as expect when infoStr is empty.", (done) => {
        request.post("/api/chat/submitPushInfo")
            .send({
                infoStr: null
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(1);
                res.body.errcode.should.be.equal("1000");
                done();
            });
    });
    it("Should work as expect when infoStr exists.", done => {
        request.post("/api/chat/submitPushInfo")
            .send({
                infoStr: '{"roomIds": "fxstudio_50"}'
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "msg", "data");
                res.body.result.should.be.equal(0);
                res.body.msg.should.be.equal("OK");
                res.body.data.isOK.should.be.a.Boolean();
                res.body.data.isOK.should.be.true();
                done();
            });
    });
});
describe("chatAPI.removePushInfo", () => {
    it("Should work as expect when ids is empty.", (done) => {
        request.post("/api/chat/removePushInfo")
            .send({
                ids: null
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(1);
                res.body.errcode.should.be.equal("1000");
                done();
            });
    });
    it("Should work as expect only ids exists.", done => {
        request.post("/api/chat/removePushInfo")
            .send({
                ids: "1,2,3,4,5"
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "msg", "data");
                res.body.result.should.be.equal(0);
                res.body.msg.should.be.equal("OK");
                res.body.data.isOK.should.be.a.Boolean();
                res.body.data.isOK.should.be.true();
                done();
            });
    });
    it("Should work as expect only ids and roomId exists.", done => {
        request.post("/api/chat/removePushInfo")
            .send({
                ids: "1,2,3,4,5",
                roomId: "fxstudio_50"
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "msg", "data");
                res.body.result.should.be.equal(0);
                res.body.msg.should.be.equal("OK");
                res.body.data.isOK.should.be.a.Boolean();
                res.body.data.isOK.should.be.true();
                done();
            });
    });
});
describe("chatAPI.noticeArticle", () => {
    it("Should work as expect when article is empty.", (done) => {
        request.post("/api/chat/noticeArticle")
            .send({
                article: null
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(1);
                res.body.errcode.should.be.equal("1000");
                done();
            });
    });
    it("Should work as expect only article exists.", done => {
        request.post("/api/chat/noticeArticle")
            .send({
                article: '{"platform": "fxstudio_50"}'
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "msg", "data");
                res.body.result.should.be.equal(0);
                res.body.msg.should.be.equal("OK");
                res.body.data.isOK.should.be.a.Boolean();
                res.body.data.isOK.should.be.true();
                done();
            });
    });
});
describe("chatAPI.showTradeNotice", () => {
    it("Should work as expect when tradeInfo is empty.", (done) => {
        request.post("/api/chat/showTradeNotice")
            .send({
                tradeInfo: null
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(1);
                res.body.errcode.should.be.equal("1000");
                done();
            });
    });
    it("Should work as expect only tradeInfo exists but not available json string.", done => {
        request.post("/api/chat/showTradeNotice")
            .send({
                tradeInfo: 'it is not a : valid JSON string.'
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(1);
                res.body.errcode.should.be.equal("10");
                done();
            });
    });
    let tradeInfo = [{
            groupType: "fx",
            boUser: {
                telephone: "18122222222"
            },
            createUser: "eugene_ana",
            createIp: "127.0.0.1"
        },
        {
            groupType: "fx",
            boUser: {
                telephone: "18133333333"
            },
            createUser: "eugene_ana",
            createIp: "127.0.0.1"
        }
    ];
    it("Should work as expect only tradeInfo exists.", done => {
        request.post("/api/chat/showTradeNotice")
            .send({
                tradeInfo: JSON.stringify(tradeInfo)
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "msg", "data");
                res.body.result.should.be.equal(0);
                res.body.msg.should.be.equal("OK");
                res.body.data.isOK.should.be.a.Boolean();
                res.body.data.isOK.should.be.true();
                done();
            });
    });
});
describe("chatAPI.modifyRuleNotice", () => {
    it("Should work as expect when ruleInfo is empty.", (done) => {
        request.post("/api/chat/modifyRuleNotice")
            .send({
                ruleInfo: null
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(1);
                res.body.errcode.should.be.equal("1000");
                done();
            });
    });
    it("Should work as expect only tradeInfo exists but not available json string.", done => {
        request.post("/api/chat/modifyRuleNotice")
            .send({
                ruleInfo: 'it is not a : valid JSON string.'
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "errcode", "errmsg");
                res.body.result.should.be.equal(1);
                res.body.errcode.should.be.equal("10");
                done();
            });
    });
    it("Should work as expect only tradeInfo exists.", done => {
        request.post("/api/chat/modifyRuleNotice")
            .send({
                ruleInfo: "{}",
                roomIds: "fxstudio_50"
            })
            .expect(200, function(err, res) {
                should.not.exist(err);
                res.should.be.an.Object();
                res.body.should.have.keys("result", "msg", "data");
                res.body.result.should.be.equal(0);
                res.body.msg.should.be.equal("OK");
                res.body.data.isOK.should.be.a.Boolean();
                res.body.data.isOK.should.be.true();
                done();
            });
    });
});