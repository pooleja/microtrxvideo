var mongoose = require('mongoose');

var viewSchema = mongoose.Schema({

   sessionId: String,
   videoId: String,
   paymentAddress: String,
   paid: {type: Boolean, default: false},
   clientIpAddress: String,
   paidVideoUrl: String
   
});

module.exports = mongoose.model('View', viewSchema);
