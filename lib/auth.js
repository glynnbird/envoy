'use strict';

var strategy = process.env.AUTH_STRATEGY || 'basic';
console.log('[OK]  auth strategy: ' + strategy);
module.exports = require('./auth/' + strategy); 