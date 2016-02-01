var _ = require('underscore');

// helper function to find credentials from environment variables
function getCredentials() {
  var databaseName = process.env.MBAAS_DATABASE_NAME;
  if (!databaseName) {
    throw('Missing env variable - must supply MBAAS_DATABASE_NAME');
  }
  var opts = null;
  if (process.env.VCAP_SERVICES) {
    
    // this will throw an exception if VCAP_SERVICES is not valid JSON
    var services = JSON.parse(process.env.VCAP_SERVICES); 
    
    // extract Cloudant credentials from VCAP_SERVICES
    if (!_.isArray(services.cloudantNoSQLDB) || 
        _.isEmpty(services.cloudantNoSQLDB) || 
        !_.isObject(services.cloudantNoSQLDB[0].credentials)) {
      throw('No cloudantNoSQLDB credentials found in VCAP_SERVICES');
    }
    opts = services.cloudantNoSQLDB[0].credentials;
    opts.account = opts.username;
    opts.databaseName = databaseName;
    opts.key = null;
    
    // bluemix/cloudfoundry config
    var cfenv = require('cfenv');
    var appEnv = cfenv.getAppEnv();
    opts.port = appEnv.port;
    opts.url = appEnv.url;
    
  } else {
    // piecemeal environment variables
    opts =  { 
      account: process.env.ACCOUNT, 
      key: process.env.API_KEY, 
      password: process.env.API_PASSWORD, 
      port: process.env.PORT, 
      url: 'localhost:' + process.env.PORT, 
      databaseName: databaseName
    };   
    console.log('DEBUG', JSON.stringify(opts, null, 2));
    if (!opts.account || !opts.key || !opts.password || !opts.port) {
      throw('Missing env variable - ' +
            'must supply ACCOUNT, API_KEY, API_PASSWORD & PORT');
    }
  }
  return opts;
}

module.exports = {
  getCredentials: getCredentials
};