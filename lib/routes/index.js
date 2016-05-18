'use strict';

var express = require('express'),
	router = express.Router();

router.use(require('./post-index'));
router.use(require('./find.js'));
router.use(require('./all-docs'));
router.use(require('./bulk-get'));
router.use(require('./local'));
router.use(require('./get-root'));
router.use(require('./get-database'));
router.use(require('./revs-diff'));
router.use(require('./bulk-docs'));
router.use(require('./changes'));
router.use(require('./delete-document'));
router.use(require('./get-document'));
router.use(require('./insert-document'));
router.use(require('./update-document'));


module.exports = router;
