"use strict";
let should = require('should');
let request = require('request');
let studioAPI = require('../routes/api/studioAPI');
let common = require('../util/common'); //引入common类
let logger = require('../resources/logConf').getLogger("testStudioAPI");


let data = {
    "userInfo": {
        mobilePhone: '15889720774',
        ip: '192.168.2.58',
        groupType: 'hxstudio',
        accountNo: '209918',
        thirdId: null,
        clientGroup: 'active',
        nickname: 'hx_000024'
    }
};
let url = '/api/studio';
describe("studioAPI.checkMemberAndSave", () => {
    it("Should work as expect.", (done) => {
        let options = {
            url: `${url}/checkMemberAndSave`,
            body: data,
            json: true
        };
        logger.info("posting data to ", options.url);
        request.post(`${url}/checkMemberAndSave`)
            .send(data)
            .expect(200, (err, res, data) => {
                should.not.exist(err);
                res.should.be.an.Object();
                data.should.be.an.Object();
                logger.info(JSON.stringify(data));
                done();
            });
    });
});
describe("studioAPI.login", () => {
    it("Should work as expect.", (done) => {
        let loginData = {
            userInfo: { userId: 'vxcnnfsipssdi', groupType: 'hxstudio' },
            type: 2
        };
        let options = {
            url: `${url}/login`,
            body: loginData,
            json: true
        };
        logger.info("posting data to ", options.url);
        request.post(`${url}/login`)
            .send(loginData)
            .expect(200, (err, res, data) => {
                should.not.exist(err);
                res.should.be.an.Object();
                data.should.be.an.Object();
                logger.info(JSON.stringify(data));
                done();
            });
    });
});