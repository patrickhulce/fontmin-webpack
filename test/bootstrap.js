var chai = require('chai');
var sinon = require('sinon');

chai.use(require('sinon-chai'));

global.sinon = sinon;
global.expect = chai.expect;
global.relativeRequire = file => require('../lib/' + file);
global.defineTest = (file, func) => {
  describe(file, function () {
    func(require('../lib/' + file));
  });
};
