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

router.get('/videos/embedded/:videoId', function(req, res) {
  res.render('embedded', { video: req.params.videoId });
});

router.get('/videos/embedded/:videoId/example', function(req, res) {
  res.render('embedded/example', { video: req.params.videoId });
});

router.get('/stats/:videoId', function(req, res) {
  service.getVideoStats(req.params.videoId, function(error, videoData){
    res.render('history', { data : videoData });
  });
});

router.get('/api/videos/:videoId', function(req, res) {

  console.log("Getting information from API for video " + req.params.videoId + " for session " + req.sessionID + " with timeout " + req.query.timeout);

  service.getVideoInfo(req.sessionID, req.params.videoId, req.query.timeout, function(error, videoInfo){

    // Check for failure
    if(error){
      console.log("API call failed " + error);
      res.json ( {success : false, error: error});
      return;
    }

    console.log("API call succeeded " + JSON.stringify(videoInfo));

    // Success
    res.json({success : true, result: videoInfo });

  });
});



module.exports = router;
