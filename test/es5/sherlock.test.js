"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiAsPromised = require('chai-as-promised');

var _chaiAsPromised2 = _interopRequireDefault(_chaiAsPromised);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _libSherlock = require('../../lib/sherlock');

var _libSherlock2 = _interopRequireDefault(_libSherlock);

function rel(p) {
	return _path2['default'].resolve(__dirname, '' + p);
}

_chai2['default'].use(_chaiAsPromised2['default']);
var expect = _chai2['default'].expect;
var should = _chai2['default'].should();

describe('Lewis', function () {

	var sherlock;

	before(function (done) {

		sherlock = (0, _libSherlock2['default'])({
			lockKey: 'my-lock-key',
			lockTimeoutWarning: 15,
			maxLockExpiration: 30,
			maxNumAttempts: 10,
			minRetryDelay: 250,
			lockExpiration: 40,
			numAttempts: 10,
			retryDelay: 250,
			retryRandomize: false
		});

		sherlock.loader.then(function () {
			return done();
		});
	});

	after(function (done) {
		sherlock.close();
		done();
	});

	it('should be alive', function () {

		expect(sherlock.checkLock()).to.eventually.be['instanceof'](Array);
	});
});
//# sourceMappingURL=sherlock.test.js.map