var express = require('express');
var router = express.Router();

router.use(require('./bulk-docs'));
router.use(require('./changes'));
router.use(require('./delete-document'));
router.use(require('./get-document'));
router.use(require('./insert-document'));
router.use(require('./update-document'));

module.exports = router;
