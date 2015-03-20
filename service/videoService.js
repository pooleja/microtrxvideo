var mongoose = require('mongoose');
var View = require('../models/view.js');
var Video = require('../models/video.js');

function VideoService(){

}

function generatePreviewUrl(videoId){
  return "http://dld2u7esv81t2.cloudfront.net/" + videoId + ".mp4";
}

function getNewPaymentInfo(){
  
}

function checkPaymentStatus(){

}

function generatePaidVideoUrl(){

}

VideoService.prototype.getVideoInfo = function(sessionId, videoId, timeout, callback){

  var timeoutSeconds = 0;

  if(timeout && timeout > 0 && timeout <= 30)
  timeoutSeconds = timeout;

  Video.findOne({videoId : videoId}, function(err, foundVideo){

    // Verify that we found a video with that ID
    if(err || !foundVideo){
       console.log("Failed to find video " + videoId " with error " + err);
       callback("Failed to find video " + videoId);
       return;
    }

    // Find a video view object that was previously created
    View.findOne({ sessionId: sessionId, videoId: videoId }, function(err, foundView){

        // Validate no errors were encountered
        if(err){
           console.log("Failed to find video view for video " + videoId + " with session " + sessionId "with error " + err);
           callback("Failed to find video viewing info for video " + videoId);
           return;
        }

        // Check to see if a record already exists
        if(foundView){

          var returnData = {
            videoId : videoId,
            paymentPrice : foundVideo.paymentPrice,
            paymentAddress : foundView.paymentAddress,
            paymentUrl : foundView.paymentUrl,
            paid : foundView.paid,
            previewVideoUrl : generatePreviewUrl(videoId),
            paidVideoUrl : foundView.paidVideoUrl
          };

          // Check to see if the user already paid
          if(foundView.paid){

            // The user already paid, so return data immediately
            callback(null, returnData);
            return;
          }

          // Payment was not yet paid, so check current status then return data to client
          checkPaymentStatus(foundView.paymentAddress, timeout, function(error, paymentInfo){

            if(error){
              console.log("Failed to get payment status for" + foundView.paymentAddress " with error " + error);
              callback(error);
              return;
            }

            // Customer has paid for the view of the video since we last checked
            if(paymentInfo.paid){

              foundView.paid = paymentInfo.paid;
              foundView.paidVideoUrl = generatePaidVideoUrl(videoId);

              // Update the view in the DB
              foundView.save(function(error){

                if(error){
                  console.log("Failed to save video view info for " + foundView.paymentAddress " with error " + error);
                  callback(error);
                  return;
                }

                // Update with the latest payment status and give them the paid link
                returnData.paid = foundView.paid;
                returnData.paidVideoUrl = foundView.paidVideoUrl;

                callback(null, returnData);
                return;
              });
            }

            // Payment status didn't change so let the customer know
            callback(null, returnData);
            return;
          });
        }

        // No existing video view information found.  Request new payment info and create a new view object
        getNewPaymentInfo(foundVideo.paymentPrice, function(error, paymentInfo){

          if(error){
            console.log("Failed to get payment info for video" + videoId " with errro " + error);
            callback(error);
            return;
          }

          var createdView = {
            sessionId: sessionId,
            videoId: videoId,
            paymentAddress: paymentInfo.paymentAddress,
            paymentUrl: paymentInfo.paymentUrl,
            paid: false
          }

          View(createdView).save(function(error){
            if(error){
              console.log("Failed to create payment info for video" + videoId " with errro " + error);
              callback(error);
              return;
            }

            var returnData = {
              videoId : videoId,
              paymentPrice : foundVideo.paymentPrice,
              paymentAddress : createdView.paymentAddress,
              paymentUrl : createdView.paymentUrl,
              paid : createdView.paid,
              previewVideoUrl : generatePreviewUrl(videoId),
            };

            callback(null, returnData);
            return;
          });

        });

    });

  });


};

module.exports = VideoService;
