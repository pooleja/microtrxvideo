var mongoose = require('mongoose');

var videoSchema = mongoose.Schema({

   id: {type: String, required: true, unique: true},
   paymentDenomination: {type: String, default: "BTC"},
   paymentPrice: Number,
   expireHours: Number,
   restrictIpAddresses: {type: Boolean, default: false}

});

module.exports = mongoose.model('Video', videoSchema);
