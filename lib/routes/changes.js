'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  basicAuth = require('basic-auth'),
  auth = require('../auth'),
  liner = require('../liner'),
  stream = require('stream');

function stripAuth(obj) {
  var addComma = false;
  var chunk = obj;

  // If the line ends with a comma, this would break JSON parsing.
  if (obj.endsWith(',')) {
    chunk = obj.slice(0, -1);
    addComma = true;
  }

  try { 
    var row = JSON.parse(chunk); 
  } catch (e) {
    return obj+'\n'; // An incomplete fragment: pass along as is.
  }

  // Successfully parsed a doc line. Remove auth field.
  if (row.doc && row.doc[app.metaKey]) {
    delete row.doc[app.metaKey];
  } else {
    return null; // No doc, or doc with no metaKey.
  }

  // Repack, and add the trailling comma if required
  var retval = JSON.stringify(row);
  if (addComma) {
    retval += ',';
  }

  return retval+'\n'; // Tack on line ending which was stripped by liner()
}

function authRemover() {
  var tr = new stream.Transform({objectMode: true});
  tr._transform = function (obj, encoding, done) {
    var data = stripAuth(obj);
    if (data) {
      this.push(data);
    }
    done();
  };
  return tr;
}

// _changes

router.get('/:db/_changes', auth.isAuthenticated, function(req, res) {

  var query = req.query || {};
  if (query.filter) {
    res.status(401).send({
      error: 'unauthorized',
      reason: 'Unauthorized.'
    });
    return;
  }

  query.filter = 'filters/available';
  query.mbaasuser = basicAuth(req).name;

  // Short cut: if no include_docs, we can pipe the response as is.
  if (!query.include_docs) {
    app.cloudant.request({
      db: app.dbName,
      path: '_changes',
      qs: query,
      method: 'GET',
    }).pipe(res);
  } else {
    app.cloudant.request({
      db: app.dbName,
      path: '_changes',
      qs: query,
      method: 'GET',
    }).pipe(liner()).pipe(authRemover()).pipe(res);
  }
});

module.exports = router;
