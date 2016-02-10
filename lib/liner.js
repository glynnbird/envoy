'use strict';

// stolen from 
// http://strongloop.com/strongblog/practical-examples-of-the-new-node-js-streams-api/
var stream = require('stream');
 
module.exports = function () {

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