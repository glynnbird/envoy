'use strict';

var app = require('../app');

function stripAndSendJSON(data, res) {
  // 1. remove the authentication metadata
  // 2. return the remaining JSON
  // Should we strip the _rev, too?
  if (data && data[app.metaKey]) {
    delete data[app.metaKey];
  }
  res.json(data);
}
exports.stripAndSendJSON = stripAndSendJSON;

function sendError(err, res) {
  //console.error(err);
  res.status(err.statusCode).send({
    error: err.error,
    reason: err.reason
  });
}
exports.sendError = sendError;

// helper method to write a json object to cloudant
function writeDoc(db, data, req, res) {
  db.insert(data, req.params.id, function(err, body) {
    if (err) {
      sendError(err, res);
    } else {
      res.json(body);
    }
  });
}
exports.writeDoc = writeDoc;

exports.dmp = function (msg, obj) {
  console.log(msg, JSON.stringify(obj, null, 2));
};
