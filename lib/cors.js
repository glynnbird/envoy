var url = require('url');

// this is Express middleware
module.exports = function() {
  
  // intercept each request  
  return function(req, res, next) {

    // if the user-agent supplied an origin header (like a browser)
    if (req.headers.origin) {
      
      // send CORS HTTP headers
      var parsed = url.parse(req.headers.origin);
      res.append('Access-Control-Allow-Credentials', 'true');
      res.append('Access-Control-Allow-Origin', 
                 parsed.protocol + '//' + parsed.host);    
      res.append('Access-Control-Allow-Headers', 
                 req.headers['access-control-request-headers']);   
    }
    
    // continue to the next route handler
    next();
  };
    
};