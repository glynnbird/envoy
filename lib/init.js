// This file contains functions that create database and set
// up the views that need to be in place on the Cloudant side.
// This gets run from app.js, so can't rely on the exports
// which would not yet be available.
//
// Exported functions should take a callback as their sole
// parameter, which will be passed an error (which can be
// null) and an optional result:
//
// callback(err, result)
//
// Calling the callback with a non-null 'err' will terminate
// the startup process.

var request = require('request');
var url = require('url');
var path = require('path');
var fs = require('fs');

var account = process.env.ACCOUNT;
var key = process.env.API_KEY;
var password = process.env.API_PASSWORD;
var databaseName = process.env.MBAAS_DATABASE_NAME;

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
  var urlstr = url.format({
    protocol: 'https',
    auth: key + ':' + password,
    hostname: account + '.cloudant.com',
    pathname: databaseName + '/' + doc._id
  });

  request(
    {
      url: urlstr,
      method: 'PUT',
      json: doc
    },
    function (error, response, body) {
      if (error) {
        callback(error, '[ERR] installSystemViews: an ' +
          'error occurred');
      } else if (body.error === 'conflict') {
        callback(null, '[OK]  installSystemViews: system ' +
          'view already present');
      } else if (body.error === 'invalid_design_doc') {
        callback(true, '[ERR] installSystemViews: map function invalid');
      } else {
        callback(null, '[OK]  installSystemViews: system ' +
          'view installed');
      }
    }
);
}

function verifyDB(callback/*(err, result)*/) {
  var urlstr = url.format({
    protocol: 'https',
    auth: key + ':' + password,
    hostname: account + '.cloudant.com',
    pathname: databaseName
  });

  request(urlstr, function (error, response, body) {
    var dburl = url.format({ // Note: no auth!
      protocol: 'https',
      hostname: account + '.cloudant.com',
      pathname: databaseName
    });
    if (error) {
      callback(error, '[ERR] verifyDB: ' +
        'an error occurred for database: ' + dburl);
    } else if (response.statusCode !== 200) {
      callback(response.statusCode, '[ERR] verifyDB: ' +
        'please create the database on: ' + dburl +
        '\n\n\t curl ' + dburl + ' -u KEY:PASS');
    } else {
      callback(null, '[OK]  verifyDB: database found "' +
        databaseName + '"');
    }
  });
}
exports.verifyDB = verifyDB;

function verifySecurityDoc(callback/*(err, result)*/) {
  var urlstr = url.format({
    protocol: 'https',
    auth: key + ':' + password,
    hostname: account + '.cloudant.com',
    pathname: databaseName + '/_security'
  });

  request(urlstr, function (error, response, body) {
    var dburl = url.format({ // Note: no auth!
      protocol: 'https',
      hostname: account + '.cloudant.com',
      pathname: databaseName + '/_security'
    });
    if (error) {
      callback(error, '[ERR] verifySecurityDoc: ' +
        'an error occurred for database: ' + dburl);
    } else if (response.statusCode !== 200) {
      callback(response.statusCode, '[ERR] verifySecurityDoc: ' +
        'Couldn’t confirm security permissions in \n\n\t' +
        dburl + '\n\nPlease check permissions for the ' +
        'specified key. Admin rights required.');
    } else {
      callback(null, '[OK]  verifySecurityDoc: permissions good');
    }
  });
}
exports.verifySecurityDoc = verifySecurityDoc;
