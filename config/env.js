var bitcore = require('bitcore');

// Configure the bitcoin network to use - this drives other config
var bitcoinNetwork = bitcore.Networks.testnet;  // change to livenet if in production

var cookieSecret = "alksdfjakjsdfnlkjj3kl34kl5jl35";  // change on actual deployed server

// Set default values for livenet
var currentConnectionString = 'mongodb://localhost/microtrxvideo';
var navigationBarColor = '#000000;';
var secureCookies = true;

// Override values if in testnet
if(bitcoinNetwork == bitcore.Networks.testnet){
  currentConnectionString = 'mongodb://localhost/testnet_microtrxvideo';
  navigationBarColor = '#32CD32;';
  secureCookies = false; // should be set to true for SSL only
}

exports.NETWORK = bitcoinNetwork;
exports.MONGO_CONNECTION_STRING = currentConnectionString;
exports.NAV_BAR_COLOR = navigationBarColor;
exports.SECURE_COOKIES = secureCookies;
exports.COOKIE_SECRET = cookieSecret;
