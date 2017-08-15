"use strict";
let should = require('should');
let request = require('request');
let pointsAPI = require('../routes/api/pointsAPI');
let common = require('../util/common'); //引入common类
let logger = require('../resources/logConf').getLogger("testPointsAPI");


let data = {
  groupType: 'studio',
  userId: '13824390062',
  hasJournal: true,
  systemCategory: 'pm',
  token:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjaGF0UGxhdGZvcm0iLCJleHAiOjE1MDI3Njk3MTQ2NDd9.6544tcCjRxjYrU5a24dxC20LSrj2mm3DSu-cEv8a-nI',
  appsecret:'3b970000'
};
let url = '/api/points';
describe("pointsAPI.pointsInfo", () => {
  it("Should work as expect.", (done) => {
    let options = {
      url: `${url}/pointsInfo`,
      body: data,
      json: true
    };
    logger.info("posting data to ", options.url);
    request.get(`${url}/pointsInfo`)
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
/*describe("studioAPI.login", () => {
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
});*/