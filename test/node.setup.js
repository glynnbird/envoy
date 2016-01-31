"use strict";

var auth = require('../lib/auth');

process.env.MBAAS_DATABASE_NAME = process.env.MBAAS_DATABASE_NAME +
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
  app.events.on('listening', function() {
    console.log('[OK]  Server is up');
    done();
  });
});


global.testUtils = require('./utils.js');
global.username = 'foo';
global.password = auth.sha1(global.username);




