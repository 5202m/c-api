"use strict";
const should = require('should');
const request = require('supertest')(require('../app'));
const queryString = require('querystring');
const async = require('async'); //引入async
const tokenAPI = require('../routes/api/tokenAPI');
const common = require('../util/common'); //引入common类
const errorMessage = require('../util/errorMessage');
const tokenAccess = require('../models/tokenAccess');
const logger = require('../resources/logConf').getLogger("tokenAPI");

let testParam = { appId: "test-appId", appSecret: "test-appSecret", platform: "test-platform" };
describe("tokenAPI.setTokenAccess", function() {
    this.timeout(5000);
    it("should work as expect with not enough parameters", done => {
        let expection = (callback) => {
            return (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("isOK", "error");
                res.body.error.should.have.keys("errcode", "errmsg");
                res.body.error.errcode.should.be.equal("1000");
                callback(true)
            }
        };
        let doRequest = function(param) {
            return function(callback) {
                request.post("/api/token/setTokenAccess")
                    .send(param)
                    .expect(200, expection(callback));
            };
        }
        async.parallel([
            doRequest({}),
            doRequest({ appId: testParam.appId }),
            doRequest({ appSecret: testParam.appSecret }),
            doRequest({ platform: testParam.platform }),
            doRequest({ appId: testParam.appId, appSecret: testParam.appSecret }),
            doRequest({ appId: testParam.appId, platform: testParam.platform }),
            doRequest({ appSecret: testParam.appSecret, platform: testParam.platform })
        ], result => {
            done();
        });
    });
    it("should work as expect with parameters", done => {
        request.post("/api/token/setTokenAccess")
            .send(testParam)
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("isOK", "error");
                res.body.isOK.should.be.Boolean();
                should.strictEqual(res.body.isOK, true);
                done();
            });
    });
});

describe("tokenAPI.getTokenAccessList", function() {
    this.timeout(5000);
    it("should work as expect with no parameters", done => {
        request.get("/api/token/getTokenAccessList")
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Array();
                done();
            });
    });
    it("should work as expect with parameters", done => {
        let expection = (callback) => {
            return (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Array();
                res.body[0].appId.should.equal(testParam.appId);
                res.body[0].appSecret.should.equal(testParam.appSecret);
                res.body[0].platform.should.equal(testParam.platform);
                callback(true)
            }
        };
        let doRequest = function(param) {
            return function(callback) {
                let url = "/api/token/getTokenAccessList?";
                url += queryString.stringify(param);
                request.get(url)
                    .expect(200, expection(callback));
            };
        }
        async.parallel([
            doRequest({ appId: testParam.appId }),
            doRequest({ appSecret: testParam.appSecret }),
            doRequest({ platform: testParam.platform }),
            doRequest({ appId: testParam.appId, appSecret: testParam.appSecret }),
            doRequest({ appId: testParam.appId, platform: testParam.platform }),
            doRequest({ appSecret: testParam.appSecret, platform: testParam.platform })
        ], result => {
            done();
        });
    });
});

describe("tokenAPI.getTokenAccessById", () => {
    let url = "/api/token/getTokenAccessById";
    it("should work as expect with no parameters", done => {
        request.get(url)
            .expect(200, (err, res) => {
                should.not.exist(err);
                should(res.body).be.Null();
                done();
            });
    });
    it("should work as expect with parameter", done => {
        url = `${url}?tokenAccessId=TokenAccess:${testParam.appId}_${testParam.appSecret}`;
        request.get(url)
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("tokenAccessId", "platform", "appId", "appSecret", "status", "valid");
                res.body.tokenAccessId.should.equal(`TokenAccess:${testParam.appId}_${testParam.appSecret}`);
                res.body.status.should.equal(1);
                res.body.valid.should.equal(1);
                done();
            });
    });
});

describe("tokenAPI.getTokenAccessByPlatform", () => {
    let url = "/api/token/getTokenAccessByPlatform";
    it("should work as expect with no parameters", done => {
        request.get(url)
            .expect(200, (err, res) => {
                should.not.exist(err);
                should(res.body).be.Null();
                done();
            });
    });
    it("should work as expect with parameter", done => {
        url = `${url}?platform=${testParam.platform}`;
        request.get(url)
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Array();
                res.body[0].should.have.keys("tokenAccessId", "platform", "appId", "appSecret", "status", "valid");
                res.body[0].tokenAccessId.should.equal(`TokenAccess:${testParam.appId}_${testParam.appSecret}`);
                res.body[0].status.should.equal(1);
                res.body[0].valid.should.equal(1);
                done();
            });
    });
});
describe("tokenAPI.getToken", function() {
    this.timeout(5000);
    it("should work as expect with not enough parameters", done => {
        let expection = (callback) => {
            return (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("errcode", "errmsg");
                res.body.errcode.should.be.equal("1000");
                callback(true)
            }
        };
        let doRequest = function(param) {
            return function(callback) {
                request.post("/api/token/getToken")
                    .send(param)
                    .expect(200, expection(callback));
            };
        }
        async.parallel([
            doRequest({}),
            doRequest({ appId: testParam.appId }),
            doRequest({ appSecret: testParam.appSecret })
        ], result => {
            done();
        });
    });
    it("should work as expect with parameters", done => {
        request.post("/api/token/getToken")
            .send({ appId: testParam.appId, appSecret: testParam.appSecret })
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("token", "expires", "beginTime", "endTime", "appId");
                res.body.appId.should.equal(testParam.appId);
                done();
            });
    });
});
describe("tokenAPI.verifyToken", () => {
    describe("tokenAPI.verifyToken for long term token", () => {
        let testToken = null;
        before(done => {
            request.post("/api/token/getToken")
                .send({ appId: testParam.appId, appSecret: testParam.appSecret })
                .expect(200, (err, res) => {
                    testToken = res.body;
                    done();
                });
        });
        it("should work as expect with no parameter", done => {
            request.post("/api/token/verifyToken")
                .send({})
                .expect(200, (err, res) => {
                    should.not.exist(err);
                    res.body.should.be.an.Object();
                    res.body.should.have.keys("isOK", "error");
                    should.strictEqual(res.body.isOK, false);
                    should.deepEqual(res.body.error, errorMessage.code_5003);
                    done();
                });
        });
        it("should work as expect with parameter", done => {
            request.post("/api/token/verifyToken")
                .send({ token: testToken.token, appSecret: testParam.appSecret })
                .expect(200, (err, res) => {
                    should.not.exist(err);
                    res.body.should.be.an.Object();
                    res.body.should.have.keys("isOK", "appId");
                    should.strictEqual(res.body.isOK, true);
                    should.deepEqual(res.body.appId, testParam.appId);
                    done();
                });
        });
    });
    describe("for one-off token", () => {
        let tempToken = null;
        let tempParam = { appId: "temp-appId", appSecret: "temp-appSecret", platform: "temp-platform", expires: 0 };
        before(done => {
            async.series([
                function(cb) {
                    request.post("/api/token/setTokenAccess")
                        .send(tempParam)
                        .expect(200, cb);
                },
                function(cb) {
                    request.post("/api/token/getToken")
                        .send({ appId: tempParam.appId, appSecret: tempParam.appSecret })
                        .expect(200, (err, res) => {
                            tempToken = res.body;
                            cb();
                        });
                },
            ], done);
        });
        it("should work as expect", done => {
            request.post("/api/token/verifyToken")
                .send({ token: tempToken.token, appSecret: tempParam.appSecret })
                .expect(200, (err, res) => {
                    should.not.exist(err);
                    res.body.should.be.an.Object();
                    res.body.should.have.keys("isOK", "appId");
                    should.strictEqual(res.body.isOK, true);
                    should.deepEqual(res.body.appId, tempParam.appId);
                    done();
                });
        });
        it("should be deleted after verified.", done => {
            request.post("/api/token/verifyToken")
                .send({ token: tempToken.token, appSecret: tempParam.appSecret })
                .expect(200, (err, res) => {
                    should.not.exist(err);
                    res.body.should.be.an.Object();
                    res.body.should.have.keys("isOK", "error");
                    should.strictEqual(res.body.isOK, false);
                    should.deepEqual(res.body.error, errorMessage.code_5002);
                    done();
                });
        });
        after(done => {
            tokenAccess.deleteOne({ tokenAccessId: `TokenAccess:${tempParam.appId}_${tempParam.appSecret}` }, done);
        });
    });
});
describe("tokenAPI.destroyToken", () => {
    let testToken = null;
    before(done => {
        request.post("/api/token/getToken")
            .send({ appId: testParam.appId, appSecret: testParam.appSecret })
            .expect(200, (err, res) => {
                testToken = res.body;
                done();
            });
    });
    it("should work as expect with no parameter", done => {
        request.post("/api/token/destroyToken")
            .send({})
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("isOK", "error");
                should.strictEqual(res.body.isOK, false);
                should.deepEqual(res.body.error, errorMessage.code_1000);
                done();
            });
    });
    it("should work as expect with parameter", done => {
        request.post("/api/token/destroyToken")
            .send({ token: testToken.token })
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("isOK");
                should.strictEqual(res.body.isOK, true);
                done();
            });
    });
});

describe("tokenAPI.deleteTokenAccess", () => {
    it("should work as expect with no parameters", done => {
        request.post("/api/token/deleteTokenAccess")
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("isOK", "error");
                res.body.error.should.have.keys("errcode", "errmsg");
                res.body.error.errcode.should.be.equal("1000");
                done();
            });
    });
    it("should work as expect with no parameters", done => {
        request.post("/api/token/deleteTokenAccess")
            .send({ ids: `TokenAccess:${testParam.appId}_${testParam.appSecret}` })
            .expect(200, (err, res) => {
                should.not.exist(err);
                res.body.should.be.an.Object();
                res.body.should.have.keys("isOK", "error");
                res.body.isOK.should.be.Boolean();
                res.body.isOK.should.be.equal(true);
                done();
            });
    });
    after(done => {
        tokenAccess.deleteOne({ tokenAccessId: `TokenAccess:${testParam.appId}_${testParam.appSecret}` }, done);
    });
});