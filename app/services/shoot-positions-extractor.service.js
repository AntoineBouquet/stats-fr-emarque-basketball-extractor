const Utils = require('../utils/utils');
ExtractorHandler = require('./extractor-handler.service');

const utils = new Utils();

function ShootPositionsExtractor() {}

ShootPositionsExtractor.prototype.extract = function(file) {
  // TODO EXTRACT SHOOT POSITION
  console.log("ShootPositionsExtractor to implement");

  return Promise.resolve([]);
};

module.exports = ShootPositionsExtractor;