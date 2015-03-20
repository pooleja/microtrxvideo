var express = require('express');
var router = express.Router();
var VideoService = require('../service/videoService');
var service = new VideoService();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('video', { video: '1'});
});

router.get('/videos/:videoId', function(req, res) {
  res.render('video', { video: req.params.videoId });
});

router.get('/api/videos/:videoId', function(req, res) {

  service.getVideoInfo(req.sessionId, req.params.videoId, req.query.timeout, function(error, verification){

    // Check for failure
    if(error){
       res.json ( {success : false, error: error});
       return;
    }

    // Success
    res.json({success : true, result: verification});

  });
});

module.exports = router;
