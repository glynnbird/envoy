// This file contains functions that checks the database exists and set
// up the views that need to be in place on the Cloudant side.
//
// Exported functions should take a callback as their sole
// parameter, which will be passed an error (which can be
// null) and an optional result:
//
// callback(err, result)
//
// Calling the callback with a non-null 'err' will terminate
// the startup process.

var request = require('request'),
  url = require('url'),
  path = require('path'),
  app = require('../app'),
  fs = require('fs'),
  env = require('./env');

// Read the 'views/' dir, and look for files named 'ddoc-view.js' which
// is assumed to be the map function for the view 'view' in the design
// document '_design/ddoc' and try to install this on the remote DB.
function installSystemViews(callback/*(err, result)*/) {
  fs.readdir('views', function(err, files) {
    files.forEach(function (filename) {
      var data = /^([^-]+)-([^.]+)\.js$/.exec(filename);
      if (data === null) {
        callback(true, '[ERR] installSystemViews: unknown '+
          'file "views/'+filename+'". Files should be named '+
          'following the format "ddocname-viewname.js"');
        return;
      }
      var ddocName = data[1];
      var viewName = data[2];
      fs.readFile('views/'+filename, 'utf8', function (err, map) {
        if (err) {
          callback(err, '[ERR] installSystemViews: an error '+
            'occurred reading view map file "views/'+filename+'"');
          return;
        }
        var ddoc = {
          _id: '_design/'+ddocName,
          views: { },
        };
        ddoc.views[viewName] = { map: map };
        installView(ddoc, callback);
      });
    });
  });
}
exports.installSystemViews = installSystemViews;

function installView(doc, callback/*(err, result)*/) {
  app.cloudant.request({
    db: app.dbName,
    path: doc._id,
    method: 'PUT',
    body: doc
  },
  function (error, body) {
    if (error) {
      if (error.error === 'conflict') {
        callback(null, '[OK]  installSystemViews: system ' +
          'view already present');
      } else if (error.error === 'invalid_design_doc') {
        callback(true, '[ERR] installSystemViews: map function invalid');
      } else {
        callback(error, '[ERR] installSystemViews: an error occurred');
      }
    } else {
      callback(null, '[OK]  installSystemViews: system view installed');
    }
  });
}

function createDB(callback/*(err, result)*/) {
  var e = env.getCredentials();

  request({
    uri: e.couchHost + '/' + e.databaseName,
    method: 'PUT'
  }, function(err, resp, body) {
    // 201 response == created
    // 412 response == already exists
    if(err || (resp.statusCode !== 201 && resp.statusCode !== 412)) {
      callback(err || body);
      return;
    }

    callback(null, '[OK]  Created database ' + e.databaseName);
  });
}
exports.createDB = createDB;

function verifyDB(callback/*(err, result)*/) {
  var dburl = url.parse(app.db.config.url);
  dburl.pathname = '/' + app.dbName;
  dburl.auth = '';

  app.db.get('', function(err, body) {
    if (err) {
      var errorMsg = '[ERR] verifyDB: ' +
        'please create the database on: ' + dburl.format() +
        '\n\n\t curl -XPUT ' + dburl.format() + ' -u KEY:PASS';

      if (err.statusCode === 404) {
        createDB(function(err) {
          if(err) {
            callback(err.statusCode, errorMsg);
          }
          else {
            callback(null, '[OK]  verifyDB: database found "' +
        app.dbName + '"');
          }
        });
      }
      else {
        callback(err.statusCode, errorMsg);
      }
    }
    else {
      callback(null, '[OK]  verifyDB: database found "' +
          app.dbName + '"');
    }
  });
}
exports.verifyDB = verifyDB;

function verifySecurityDoc(callback/*(err, result)*/) {
  // NOTE the cloudant library has a get_security() function
  // but due to a bug in wilson it doesn't work when accessed
  // with an API key:
  // https://cloudant.fogbugz.com/f/cases/59877/Wilson-returns-500-when-using-API-key

  app.cloudant.request({
    db: app.dbName,
    path: '_security'
  },
  function (error, body) {
    if (error) {
      var dburl = url.parse(app.db.config.url);
      dburl.pathname = '/' + app.dbName;
      dburl.auth = '';
      callback(error.statusCode, '[ERR] verifySecurityDoc: ' +
        'Couldn’t confirm security permissions in \n\n\t' +
        dburl.format() + '\n\n' +
        JSON.stringify(error) + '\n\n' +
        body + '\n\n\t' +
        'Please check permissions for the ' +
        'specified key. Admin rights required.');
    } else {
      callback(null, '[OK]  verifySecurityDoc: permissions good');
    }
  });
}

exports.verifySecurityDoc = verifySecurityDoc;
