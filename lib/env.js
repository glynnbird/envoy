var _ = require('underscore');

// helper function to find credentials from environment variables
function getCredentials() {
  var databaseName = process.env.MBAAS_DATABASE_NAME;
  if (!databaseName) {
    throw('Missing env variable - must supply MBAAS_DATABASE_NAME');
  }
  var opts = {};
  if (process.env.VCAP_SERVICES) {
    
    // this will throw an exception if VCAP_SERVICES is not valid JSON
    var services = JSON.parse(process.env.VCAP_SERVICES); 
    
    // extract Cloudant credentials from VCAP_SERVICES
    if (!_.isArray(services.cloudantNoSQLDB) || 
        _.isEmpty(services.cloudantNoSQLDB) || 
        !_.isObject(services.cloudantNoSQLDB[0].credentials)) {
      throw('No cloudantNoSQLDB credentials found in VCAP_SERVICES');
    }
    var bluemixOpts = services.cloudantNoSQLDB[0].credentials;
    opts.couchHost = 'https://' +
      encodeURIComponent(bluemixOpts.username) + ':' +
      encodeURIComponent(bluemixOpts.password) + '@' +
      encodeURIComponent(bluemixOpts.username) + '.cloudant.com';
    opts.databaseName = databaseName;
    
    // bluemix/cloudfoundry config
    var cfenv = require('cfenv');
    var appEnv = cfenv.getAppEnv();
    opts.port = appEnv.port;
    opts.url = appEnv.url;
    
  } else {
    // piecemeal environment variables
    opts =  { 
      couchHost: process.env.COUCH_HOST,
      databaseName: databaseName,
      port: process.env.PORT, 
      url: 'localhost:' + process.env.PORT
    };   
    if (!opts.couchHost || !opts.port) {
      throw('Missing env variable - ' +
            'must supply COUCH_HOST & PORT');
    }
  }
  return opts;
}

module.exports = {
  getCredentials: getCredentials
};