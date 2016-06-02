'use strict';

process.env.MBAAS_DATABASE_NAME = 
  (process.env.MBAAS_DATABASE_NAME || 'mbaas') +
	(new Date().getTime());

var testsDir = process.env.TESTS_DIR || './tmp';
var exec = require('child_process').exec;
function cleanup() {
  // Remove test databases
  exec('rm -r ' + testsDir);
}
exec('mkdir -p ' + testsDir, function () {
  process.on('SIGINT', cleanup);
  process.on('exit', cleanup);
});

var app = require('../app');

// ensure server is started before running any tests
before(function(done) {
  this.timeout(10000);
  app.events.on('listening', function() {
    console.log('[OK]  Server is up');
    done();
  });
});

global.testUtils = require('./utils.js');
global.username = 'foo';
global.password = require('../lib/utils').sha1(global.username);