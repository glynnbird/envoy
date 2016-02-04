var assert = require('assert'),
  env = require('../lib/env.js'),
  assert = require('assert');

describe('environment variable tests - Bluemix mode', function() {
  var originalEnv;
  before(function(done) {
    originalEnv = Object.assign({}, process.env);
    process.env.VCAP_SERVICES = '{"cloudantNoSQLDB":[{"name":"cloudant","label":"cloudantNoSQLDB","plan":"Shared","credentials":{"username":"theusername","password":"thepassword","host":"theusername.cloudant.com","port":443,"url":"https://theusername:thepassword@thehost.cloudant.com"}}]}'
    process.env.PORT = '8080';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    done();
  });

  // parses VCAP_SERVICES successfully
  it('parse VCAP_SERVICES', function(done) {
    var e = env.getCredentials();
    assert.equal(e.couchHost, 'https://theusername:thepassword@theusername.cloudant.com');
    assert.equal(e.databaseName, 'mydb');
    assert.equal(e.port, 8080);
    done();
  });

  // exception when missing process.env.MBAAS_DATABASE_NAME
  it('missing MBAAS_DATABASE_NAME', function(done) {
    delete process.env.MBAAS_DATABASE_NAME;
    assert.throws( function() {
      var e = env.getCredentials();
    });

    done();
  });

  // invalid VCAP_SERVICES json
  it('invalid VCAP_SERVICES JSON', function(done) {
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    process.env.VCAP_SERVICES = '{"badjson}';

    assert.throws( function() {
      var e = env.getCredentials();
    });

    done();
  });

  // valid VCAP_SERVICES json but no services
  it('valid VCAP_SERVICES JSON but no services', function(done) {
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    process.env.VCAP_SERVICES = '{"someservice":[]}';
    assert.throws( function() {
      var e = env.getCredentials();
    });

    done();
  });

  // valid VCAP_SERVICES json but no Cloudant service
  it('valid VCAP_SERVICES JSON but no Cloudant service', function(done) {
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    process.env.VCAP_SERVICES = '{"cloudantNoSQLDB":[]}';
    assert.throws( function() {
      var e = env.getCredentials();
    });

    done();
  });

  after(function(done) {
    process.env = originalEnv;
    done();
  });

});

describe('environment variable tests - Piecemeal mode', function() {

  var originalEnv;

  before(function(done) {
    // backup current env variables
    originalEnv = Object.assign({}, process.env);
    process.env.COUCH_HOST = 'https://thehost';
    process.env.PORT = '8080';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    done();
  });


  // parses VCAP_SERVICES successfully
  it('piecemeal mode successful', function(done) {
    var e = env.getCredentials();
    assert.equal(e.couchHost, 'https://thehost');
    assert.equal(e.port, 8080);
    assert.equal(e.databaseName, 'mydb');
    done();
  });

  // try missing COUCH_HOST value
  it('throw exception when missing ACCOUNT', function(done) {
    delete process.env.COUCH_HOST;
    process.env.PORT = '8080';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    assert.throws( function() {
      var e = env.getCredentials();
    });
    done();
  });

  // try missing PORT value
  it('throw exception when missing PORT', function(done) {
    process.env.COUCH_HOST = 'https://thehost';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    delete process.env.PORT;
    assert.throws( function() {
      var e = env.getCredentials();
    });
    done();
  });

  // try invalid PORT value
  it('throw exception when non-numeric PORT', function(done) {
    process.env.COUCH_HOST = 'https://thehost';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    process.env.PORT = '49a';
    assert.throws(function() {
      var e = env.getCredentials();
    });
    done();
  });

  after(function(done) {
    // restore env variables as they were before the test
    process.env = originalEnv;
    done();
  });

});
