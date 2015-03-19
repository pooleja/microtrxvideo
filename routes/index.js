var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express', sessionID: req.sessionID });
});

/**
 * Handler will check to see if payment has been made.  Will retry until timeout is 0 if specified.
 */
router.get('/videos/:videoId', function(req, res) {


});

module.exports = router;
