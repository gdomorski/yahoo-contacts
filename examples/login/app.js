var express = require('express')
  , passport = require('passport')
  , YahooStrategy = require('../../lib/passport-yahoo-contacts/index.js').Strategy
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , session = require('express-session');


var YAHOO_CONSUMER_KEY = "--insert-key-here--"
var YAHOO_CONSUMER_SECRET = "--insert-secret-here--";


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Yahoo profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new YahooStrategy({
  clientID: YAHOO_CONSUMER_KEY,
  clientSecret: YAHOO_CONSUMER_SECRET,
  callbackURL: "http://www.greg.com/auth/yahoo/callback",
  passReqToCallback: true,
  },
  function(request, token, tokenSecret, profile, done) {
    request.session.yahoo = { queryCode: request.query.code }
    return done(null, profile, 'HELLO WORLD')
  }
));

var app = express();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser());
app.use(cookieParser());
app.use(session({
    secret: 'blah'
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/yahoo
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Yahoo authentication will involve redirecting
//   the user to yahoo.com.  After authorization, Yahoo will redirect the user
//   back to this application at /auth/yahoo/callback
app.get('/auth/yahoo',
  passport.authenticate('yahoo'),
  function(req, res){

  });

// GET /auth/yahoo/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/yahoo/callback',
  passport.authenticate('yahoo',
  function(req, res){
    // The request will be redirected to Microsoft Graph for authentication, so
    // this function will not be called.
  }
))


app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(80);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
