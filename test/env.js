var env = require('../lib/env.js');
var assert = require('assert');

describe('environment variable tests - Bluemix mode', function() {
  
  before(function(done) {
    process.env.VCAP_SERVICES = '{"cloudantNoSQLDB":[{"name":"cloudant","label":"cloudantNoSQLDB","plan":"Shared","credentials":{"username":"theusername","password":"thepassword","host":"theusername.cloudant.com","port":443,"url":"https://theusername:thepassword@thehost.cloudant.com"}}]}'
    process.env.PORT = '8080';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    done();
  });
  
  // parses VCAP_SERVICES successfully
  it('parse VCAP_SERVICES', function(done) {
    var e = env.getCredentials();
    assert.equal(e.account, 'theusername');
    assert.equal(e.password, 'thepassword');
    assert.equal(e.username, 'theusername');
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
    delete process.env.VCAP_SERVICES;
    done();
  });
  
});

describe('environment variable tests - Piecemeal mode', function() {
  
  before(function(done) {
    process.env.ACCOUNT = 'thehost';
    process.env.API_PASSWORD = 'thepassword';
    process.env.API_KEY = 'thekey';
    process.env.PORT = '8080';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    done();
  });
  
  
  // parses VCAP_SERVICES successfully
  it('piecemeal mode successful', function(done) {
    var e = env.getCredentials();
    assert.equal(e.account, 'thehost');
    assert.equal(e.password, 'thepassword');
    assert.equal(e.key, 'thekey');
    assert.equal(e.port, 8080);
    assert.equal(e.databaseName, 'mydb');
    done();
  });
  
  // try missing ACCOUNT value
  it('throw exception when missing ACCOUNT', function(done) {
    delete process.env.ACCOUNT;;
    process.env.API_PASSWORD = 'thepassword';
    process.env.API_KEY = 'thekey';
    process.env.PORT = '8080';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    assert.throws( function() {
      var e = env.getCredentials();
    });
    done();
  });
  
  // try missing API_PASSWORD value
  it('throw exception when missing API_PASSWORD', function(done) {
    process.env.ACCOUNT = 'thehost';
    process.env.API_KEY = 'thekey';
    process.env.PORT = '8080';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    delete process.env.API_PASSWORD;
    assert.throws( function() {
      var e = env.getCredentials();
    });
    done();
  });
  
  // try missing API_KEY value
  it('throw exception when missing API_KEY', function(done) {
    process.env.ACCOUNT = 'thehost';
    process.env.API_PASSWORD = 'thepassword';
    process.env.PORT = '8080';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    delete process.env.API_KEY;
    assert.throws( function() {
      var e = env.getCredentials();
    });
    done();
  });
  
  // try missing PORT value
  it('throw exception when missing PORT', function(done) {
    process.env.ACCOUNT = 'thehost';
    process.env.API_PASSWORD = 'thepassword';
    process.env.API_KEY = 'thekey';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    delete process.env.PORT;
    assert.throws( function() {
      var e = env.getCredentials();
    });
    done();
  });
  
  // try invalid PORT value
  it('throw exception when non-numeric PORT', function(done) {
    process.env.ACCOUNT = 'thehost';
    process.env.API_PASSWORD = 'thepassword';
    process.env.API_KEY = 'thekey';
    process.env.MBAAS_DATABASE_NAME = 'mydb';
    process.env.port = "49a";
    assert.throws( function() {
      var e = env.getCredentials();
    });
    done();
  });
  
  after(function(done) {
    delete process.env.VCAP_SERVICES;
    delete process.env.ACCOUNT;
    delete process.env.API_PASSWORD;
    delete process.env.API_KEY;
    delete process.env.PORT;
    done();
  });
  
});


