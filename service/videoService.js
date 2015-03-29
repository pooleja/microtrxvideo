var fs = require('fs');
var cf = require('cloudfront-private-url-creator');

var request = require('request');

var mongoose = require('mongoose');
var View = require('../models/view.js');
var Video = require('../models/video.js');

var Env = require('../config/env.js');

function VideoService(){

}

VideoService.prototype.getVideoStats = function(videoId, callback){

  View.where({videoId : videoId}).count(function (err, count) {
    if (err) return callback(err);
    var totalCount = count;

    View.where({videoId : videoId, paid : true}).count(function (err, count) {
      if (err) return callback(err);
      var paidCount = count;

      View.where({videoId : videoId}).count(function (err, count) {
        if (err) return callback(err);
        var unpaidCount = count;

        callback(null,
          {
            totalRequests : totalCount,
            unpaidRequests : unpaidCount,
            paidRequests : paidCount
          });
      });
    });
  });


};

VideoService.prototype.getVideoInfo = function(sessionId, videoId, timeout, callback){

  var timeoutSeconds = 0;

  if(timeout && timeout > 0 && timeout <= 30)
    timeoutSeconds = timeout;

  // Get the info for the video requested
  Video.findOne({ id : videoId }, function(err, foundVideo){

    // Verify that we found a video with that ID
    if(err || !foundVideo){
       console.log("Failed to find video " + videoId + " with error " + err);
       callback("Failed to find video " + videoId);
       return;
    }

    // Find a video view object that was previously created
    View.findOne({ sessionId: sessionId, videoId: videoId }, function(err, foundView){

        // Validate no errors were encountered
        if(err){
           console.log("Failed to find video view for video " + videoId + " with session " + sessionId + "with error " + err);
           callback("Failed to find video viewing info for video " + videoId);
           return;
        }

        // Check to see if a record already exists
        if(foundView){

          console.log("Found view in db already for video " + videoId + " and session " + sessionId);

          handleFoundView(foundVideo, foundView, timeoutSeconds, callback);

        } else {

          console.log("No existing view in db already for video " + videoId + " and session " + sessionId);

          handleNewView(sessionId, foundVideo, timeoutSeconds, callback);
        }

    });

  });

};

function generatePreviewUrl(videoId){
  return Env.PREVIEW_VIDEO_PREFIX_URL + videoId + ".mp4";
}

function getPriceInfo(video, callback){

  if(video.paymentDenomination == "BTC"){

    // Price was specified in BTC - just use that
    var priceInfo = {
      btcPrice : video.paymentPrice,
      displayPrice : "" + video.paymentPrice + " BTC"
    };

    callback(null, priceInfo);

  }else{

    // Get the USD price
    var priceUrl = "https://api.coinbase.com/v1/prices/spot_rate";

    request({url: priceUrl, json: true}, function (error, response, priceInfo) {

      if (error || response.statusCode != 200) {
          console.log("Error: " + JSON.stringify(error));
          console.log("Response: " + JSON.stringify(response));
          callback("Error getting price info request for new view.");
          return;
      }

      var priceInfo = {
        btcPrice : (video.paymentPrice / Number(priceInfo.amount)).toFixed(6),
        displayPrice : "$" + video.paymentPrice + " USD"
      };

      callback(null, priceInfo);

    });
  }
}

function getNewPaymentInfo(video, callback){

  getPriceInfo(video, function(error, priceInfo){

    if(error)
      callback(error);

    var requestUrl = Env.MICROTRX_ADDR + "api/v1/simple/payments?publicKey=" + Env.PUBKEY + "&amountRequested=" + priceInfo.btcPrice;

    request({url: requestUrl, json: true}, function (error, response, paymentInfo) {

      if (error || response.statusCode != 200 || paymentInfo.success != "true") {
          console.log("Error: " + JSON.stringify(error));
          console.log("Response: " + JSON.stringify(response));
          console.log("ReturnVal: " + JSON.stringify(paymentInfo));
          callback("Error getting payment request for new view.");
          return;
      }

      callback(null, paymentInfo.result, priceInfo);

    });

  });

}

function checkPaymentStatus(address, timeout, callback){

  var requestUrl = Env.MICROTRX_ADDR + "api/v1/simple/payments/" + address + "?timeout=" + timeout;

  request({url: requestUrl, json: true}, function (error, response, paymentInfo) {

    if (error || response.statusCode != 200 || paymentInfo.success != "true") {
        console.log("Error: " + JSON.stringify(error));
        console.log("Response: " + JSON.stringify(response));
        console.log("ReturnVal: " + JSON.stringify(paymentInfo));
        callback("Error getting payment status for " + address);
        return;
    }

    callback(null, paymentInfo.result);

  });
}


function loadPrivateKey(cb) {
  fs.realpath('./config/pk-' + Env.KEYPAIR_ID + '.pem.txt', function (err, resolvedPath) {
    if (err) {
      return cb(err);
    }

    fs.readFile(resolvedPath, function (err, data) {
      if (err) {
        return cb(err);
      }
      cb(null, data);
    });
  });
}

function generatePaidVideoUrl(videoId, expireDate, callback){

  var videoUrl = Env.PAID_VIDEO_PREFIX_URL + videoId + ".mp4";

  console.log("Expriring link at time: " + expireDate.getTime());

  loadPrivateKey(function privateKeyCb(err, keyContents) {
    if (err) {
      console.error(err);
      callback(err);
      return;
    }
    var config = {
      privateKey: keyContents,
      keyPairId: Env.KEYPAIR_ID,
      dateLessThan: expireDate
    };

    callback(null, cf.signUrl(videoUrl, config));
  });

}

function handleFoundView(foundVideo, foundView, timeoutSeconds, callback){

  var returnData = {
    videoId : foundVideo.id,
    paymentPrice : foundView.paymentPrice,
    displayPrice : foundView.displayPrice,
    paymentAddress : foundView.paymentAddress,
    paymentUrl : foundView.paymentUrl,
    paid : foundView.paid,
    previewVideoUrl : generatePreviewUrl(foundVideo.id),
    paidVideoUrl : foundView.paidVideoUrl,
    expireDate : foundView.expireDate,
  };

  // Check to see if the user already paid
  if(foundView.paid){

    console.log("View has already been paid for.  Returning immediately.")

    // The user already paid, so return data immediately
    callback(null, returnData);
    return;
  }

  // Payment was not yet paid, so check current status then return data to client
  checkPaymentStatus(foundView.paymentAddress, timeoutSeconds, function(error, paymentInfo){

    if(error){
      console.log("Failed to get payment status for" + foundView.paymentAddress + " with error " + error);
      callback(error);
      return;
    }

    // Customer has paid for the view of the video since we last checked
    if(paymentInfo.paid){

      console.log("According to payment gateway, payment has already been made.");

      var expireDate = new Date();
      expireDate.setHours(expireDate.getHours() + foundVideo.expireHours);

      generatePaidVideoUrl(foundVideo.id, expireDate, function(error, paidUrl){

        if(error){
          console.log("Failed to generate paid URL for video " + foundVideo.id + " with error " + error);
          callback(error);
          return;
        }

        foundView.paid = paymentInfo.paid;
        foundView.paidVideoUrl = paidUrl;
        foundView.expireDate = expireDate;

        // Update the view in the DB
        foundView.save(function(error){

          if(error){
            console.log("Failed to save video view info for " + foundView.paymentAddress + " with error " + error);
            callback(error);
            return;
          }

          // Update with the latest payment status and give them the paid link
          returnData.paid = foundView.paid;
          returnData.paidVideoUrl = foundView.paidVideoUrl;
          returnData.expireDate = foundView.expireDate;

          callback(null, returnData);
          return;
        });

      });

    } else {

      console.log("According to payment gateway, payment has NOT already been made.");

      // Customer still hasn't paid
      callback(null, returnData);
      return;

    }

  });
}


function handleNewView(sessionId, foundVideo, timeoutSeconds, callback){

  // No existing video view information found.  Request new payment info and create a new view object
  getNewPaymentInfo(foundVideo, function(error, paymentInfo, priceInfo){

    if(error){
      console.log("Failed to get payment info for video" + foundVideo.id + " with errro " + error);
      callback(error);
      return;
    }

    var createdView = {
      sessionId: sessionId,
      videoId: foundVideo.id,
      paymentAddress: paymentInfo.paymentAddress,
      paymentUrl: paymentInfo.paymentUrl,
      paid: false,
      displayPrice: priceInfo.displayPrice,
      paymentPrice: priceInfo.btcPrice
    }

    View(createdView).save(function(error){
      if(error){
        console.log("Failed to create payment info for video" + foundVideo.id + " with errro " + error);
        callback(error);
        return;
      }

      var returnData = {
        videoId : foundVideo.id,
        paymentPrice : createdView.paymentPrice,
        paymentAddress : createdView.paymentAddress,
        paymentUrl : createdView.paymentUrl,
        paid : createdView.paid,
        previewVideoUrl : generatePreviewUrl(foundVideo.id),
        displayPrice: createdView.displayPrice
      };

      callback(null, returnData);
      return;
    });

  });
}

module.exports = VideoService;
