//var createError = require('http-errors');
var express = require('express'); 
var path = require('path'); 
var logger = require('morgan'); 
var cookieParser = require('cookie-parser'); 
var bodyParser = require('body-parser'); 
var routes = require('./routes/index'); 
var users = require('./routes/users');
//var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');
var session=require('express-session'); 
var app = express(); 

var cors = require('cors');
	app.use(cors());



// view engine setup
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs'); 

app.use(logger('dev')); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(cookieParser("An")); 
app.use(session({ 
    secret:'an', 
	resave:false, 
    saveUninitialized:true 
})); 
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/', routes); 
app.use('/users', users); 
// catch 404 and forward to error handler 
app.use(function(req, res, next) { 
    var err = new Error('Not Found'); 
    err.status = 404; 
    next(err); 
});

// error handler
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

module.exports = app; 
