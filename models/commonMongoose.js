"use strict";
let mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.createSchema = function(definition, options) {
    definition.systemCategory = String;
    return new mongoose.Schema(definition, options);
}

module.exports = mongoose;