var bitcore = require('bitcore');

// Configure the bitcoin network to use - this drives other config
var bitcoinNetwork = bitcore.Networks.testnet;  // change to livenet if in production

// Set default values for livenet
var currentConnectionString = 'mongodb://localhost/microtrxvideo';
var navigationBarColor = '#000000;';
var secureCookies = true;
var microtrxGatewayAddr = "http://www.microtrx.com/";

// Override values if in testnet
if(bitcoinNetwork == bitcore.Networks.testnet){
  currentConnectionString = 'mongodb://localhost/testnet_microtrxvideo';
  navigationBarColor = '#32CD32;';
  secureCookies = false; // should be set to true for SSL only
  microtrxGatewayAddr = "http://testnet.microtrx.com/";
}

exports.NETWORK = bitcoinNetwork;
exports.MONGO_CONNECTION_STRING = currentConnectionString;
exports.NAV_BAR_COLOR = navigationBarColor;
exports.SECURE_COOKIES = secureCookies;

// Per installation difference
exports.COOKIE_SECRET = "asdfasdfasdfasdfasdf2342342342444";
exports.PREVIEW_VIDEO_PREFIX_URL = "http://dld2u7esv81t2.cloudfront.net/";
exports.PAID_VIDEO_PREFIX_URL = "http://d3bhyilt0yfkpg.cloudfront.net/";
exports.MICROTRX_ADDR = microtrxGatewayAddr;
exports.PUBKEY = "xpub67ujJDAmJod4LCTGWBvXy6M47yhgmi1de2uNN6V7qoBptMgttCEUZQbQRwsEnFLTgzb7TvH1D18ZShssKxrvFowrrALv99C81aF9zBB58ym";
exports.KEYPAIR_ID = "APKAIKKYDAY3GY7BD66A";
