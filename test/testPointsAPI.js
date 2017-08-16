"use strict";
const should = require('should');
const request = require('request');
const pointsAPI = require('../routes/api/pointsAPI');
const tokenService = require('../service/tokenService');
const qs = require('querystring');
const async = require("async");
const common = require('../util/common'); //引入common类
const logger = require('../resources/logConf').getLogger("testPointsAPI");


let url = 'http://localhost:3000/api';
let testIds = "13783599511";
describe("pointsAPI testing", function() {
    this.timeout(50000);
    let data = {
        groupType: 'studio',
        userId: '13824390062',
        hasJournal: "0",
        systemCategory: 'pm',
        token: null,
        appsecret: 'df1a0002'
    };
    before(function(done) {
        let options = {
            url: `${url}/token/getToken`,
            method: "POST",
            body: {
                appId: "fx_chat",
                appSecret: data.appsecret
            },
            json: true
        };
        request(options, function(err, res, result) {
            logger.log(JSON.stringify(result));
            data.token = result.token;
            done();
        });
    });
    describe("pointsAPI.pointsInfo", () => {
        it("Should work as expect.", (done) => {
            let queryObj = {
                groupType: data.groupType,
                userId: data.userId,
                systemCategory: data.systemCategory
            };

            let requestPoint = function(userId, callback) {
                logger.log("Processing userId: ", userId);
                queryObj.userId = userId;
                let options = {
                    url: `${url}/points/pointsInfo?${qs.stringify(queryObj)}`,
                    headers: {
                        'apptoken': data.token,
                        'appsecret': data.appsecret
                    },
                    json: true
                };
                request(options, (err, res, data) => {
                    should.not.exist(err);
                    res.should.be.an.Object();
                    data.should.be.an.Object();
                    callback();
                });
            }
            let userIds = testIds.split(",");
            logger.info(`Got ${userIds.length} userIds...`);
            async.each(userIds, requestPoint, function(err) {
                if (err) {
                    logger.error(err);
                } else {
                    done();
                }
            });
        });
    });
});