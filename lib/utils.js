'use strict';

var app = require('../app'),
  stream = require('stream');


var isObject = function(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

var isArray = function(obj) {
  return obj instanceof Array;
};

var isString = function(str) {
  return typeof str === 'string';
};

var stripAndSendJSON = function (data, res) {
  // 1. remove the authentication metadata
  // 2. return the remaining JSON
  // Should we strip the _rev, too?
  if (data && data[app.metaKey]) {
    delete data[app.metaKey];
  }
  res.json(data);
};

var sendError = function (err, res) {
  //console.error(err);
  res.status(err.statusCode).send({
    error: err.error,
    reason: err.reason
  });
};

// helper method to write a json object to cloudant
var writeDoc = function(db, data, req, res) {
  db.insert(data, req.params.id, function(err, body) {
    if (err) {
      sendError(err, res);
    } else {
      res.json(body);
    }
  });
};



// stream transformer that removes auth details from documents
var authRemover = function(onlyuser) {
  var firstRecord = true;
  
  
  var stripAuth = function (obj, onlyuser) {
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
    if (row.doc) {
      if (row.doc[app.metaKey]) {
        var meta = row.doc[app.metaKey];
        if (onlyuser && meta.auth && meta.auth.users && 
            meta.auth.users.indexOf(onlyuser) === -1) {
          return '';
        }
        delete row.doc[app.metaKey];
      } else {
        // if doc has no metaKey, then it should not be returned
        return '';
      }
    } 
  
    // cloudant query doesn't return a .doc
    delete row[app.metaKey];

    // Repack, and add the trailling comma if required
    var retval = JSON.stringify(row);
    if (firstRecord) {
      firstRecord = false;
      return retval+'';
    } else {
      return ',\n'+retval;
    }
  };
  
  var tr = new stream.Transform({objectMode: true});
  tr._transform = function (obj, encoding, done) {
    var data = stripAuth(obj, onlyuser);
    if (data) {
      this.push(data);
    }
    done();
  };
  return tr;
};

// stream transformer that breaks incoming chunks into lines
var liner = function() {

  var liner = new stream.Transform({objectMode: true});
   
  liner._transform = function (chunk, encoding, done) {
    var data = chunk.toString('utf8');
    if (this._lastLineData) {
      data = this._lastLineData + data;
    }
     
    var lines = data.split(/\s*\n/);
    this._lastLineData = lines.splice(lines.length-1,1)[0];
    lines.forEach(this.push.bind(this));
    done();
  };
   
  liner._flush = function (done) {
    if (this._lastLineData) {
      this.push(this._lastLineData);
    }
    this._lastLineData = null;
    done();
  };

  return liner;
};

// console.log utility
var dmp = function (msg, obj) {
  console.log(msg, JSON.stringify(obj, null, 2));
};

module.exports = {
  isObject: isObject,
  isArray: isArray,
  isString: isString,
  stripAndSendJSON: stripAndSendJSON,
  sendError: sendError,
  writeDoc: writeDoc,
  authRemover: authRemover,
  liner: liner,
  dmp: dmp
};
