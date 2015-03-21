var mongoose = require('mongoose');

var viewSchema = mongoose.Schema({

   sessionId: String,
   videoId: String,
   paymentAddress: String,
   paymentUrl: String,
   paid: {type: Boolean, default: false},
   paidVideoUrl: String,
   expireDate : Date

});

module.exports = mongoose.model('View', viewSchema);
