var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var Env = require('./config/env.js');
var routes = require('./routes/index');

var app = express();

var mongoose = require('mongoose');
mongoose.connect(Env.MONGO_CONNECTION_STRING);


app.set('trust proxy', 1)
app.use(session({
  secret: Env.COOKIE_SECRET,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 day cookie expiration
    secure: Env.SECURE_COOKIES
  },
  store: new MongoStore({ mongooseConnection: mongoose.connection }) // Use mongodb to store connection info
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// Temp for generating sample db data
/*
var Video = require('./models/video.js');

// Create a registration object
   var videoRequest = {
      id : "1",
      paymentPrice : 0.0001,
      expireHours : 168
   };

   Video(videoRequest).save(function (err, tempRegistration) {
   });
*/

module.exports = app;
