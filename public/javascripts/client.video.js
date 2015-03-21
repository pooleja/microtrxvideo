
$( document ).ready(function() {

  $( "#pay-now-button" ).click(function() {

    getVideoInfo(0, function(error, info){

      // Check for API failure
      if(error){
        showError(error);
        return;
      }

      var myPlayer = videojs('video_player');
      myPlayer.pause();

      // First get payment details for the modal dialog
      generatePaymentDetails(info);

      // Show the paywall modal dialog
      $('#myModal').modal();
    });
    
  });

  // Get API info about video and whether it has already been paid for - do not wait (0 seconds timeout)
  getVideoInfo(0, function(error, info){

    // Check for API failure
    if(error){
      showError(error);
      return;
    }

    videojs("video_player", {}, function(){

      // Set controls on - initially having it on was causing problems with the page loading size
      this.controls(true);

      if(info.paid){

        console.log("Already paid");

        // If already paid for, just load the full video and wait for the user to watch
        setPaidVideoUI(this, info);


      } else {

        // If not already paid for, load the preview video
        this.src(info.previewVideoUrl);

        // Set an event for when the preview video is finished
        this.on("ended",function(){

          // First get payment details for the modal dialog
          generatePaymentDetails(info);

          // Show the paywall modal dialog
          $('#myModal').modal();
        });
      }
    });

  });

});

function setPaidVideoUI(player, info){

  player.src(info.paidVideoUrl);

  console.log("showing download link");
  $("#download-now").show();
  $("#download-now-link").attr('href', info.paidVideoUrl);

  var options = {
    weekday: "long", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit"
  };

  $("#download-now-expires").text("Video link expires on " + new Date(info.expireDate).toLocaleTimeString("en-us", options));
}

function getVideoInfo(timeout, callback){

  // Get the video ID from the player object
  var videoId = $("#video_player").data("video-id");

  $.ajax({
    type: "GET",
    url: "/api/videos/" + videoId + "?timeout=" + timeout,
    dataType: "json"
  })
  .done(function(res){

    console.log("Get Video info call complete");
    console.log(res);

    // Check for API success
    if(res.success == true){

        console.log("Got back info from video: " + JSON.stringify(res.result));

        // Call the callback function with API data
        callback(null, res.result);

    } else {
      callback(res.error, null);
    }

  })
  .fail(function(data){
    callback(data, null);
  });
}

function generatePaymentDetails(info){

    // Show the QR code
    $("#payment-qr-code").empty();
    $("#payment-qr-code").qrcode({width: 200,height: 200,text: info.paymentUrl });

    // Set the payment link href
    $("#payment-link").attr('href',info.paymentUrl);

    // Set the payment details - amount and paymentAddress
    $("#payment-details").html('<br /> BTC: ' + info.paymentPrice + '<br />Address: ' + info.paymentAddress);

    verifyPayment();
}

function verifyPayment(paymentAddress){

  // Get the payment info for this video/user and wait up to 30 seconds for payment to go through
  getVideoInfo(30, function(error, info){

    // Check for API failure
    if(error){
      showError(error);
      return;
    }

    // Check whether the user made the payment
    if(info.paid){

      // The payment has gone through, so hide the modal and show the paid video
      $('#myModal').modal('hide');

      var myPlayer = videojs('video_player');
      myPlayer.off('ended');

      setPaidVideoUI(myPlayer, info);

      myPlayer.play();

    } else {

      // Recursively poll for the payment to go through
      verifyPayment(paymentAddress);
    }
  });

}

function showError(msg){
  $("#error-message").text("Failed to get video info: " + JSON.stringify(msg));
  $("#error-message").show();
  return;
}
