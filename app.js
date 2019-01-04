// Require Packages
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongo = require('mongodb');
const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://localhost/koinstory', { useNewUrlParser: true });
const db = mongoose.connection;

const routes = require('./routes/index');
const users = require('./routes/users');

// Initialize App
const app = express();

// Set a folder called 'views to handle my views'
app.set('views', path.join(__dirname, 'views'));

// Set handlebars as the engine for the app, 
// set the default layout as 'layout.handlebars', 
// and define helpers to be used later
app.set('view engine', 'handlebars'); // Set view engine to handlebars
app.engine('handlebars', exphbs({
	defaultLayout:'layout', 
	helpers: {
		isLoss(value, options) { 
			return value[0] === '-'
				? options.fn(this)
				: options.inverse(this);
		},
		inPortfolio(portfolio, value, options) {
			if(portfolio.every(coin => coin.symbol !== value)) {
				return options.fn(this);
			}
		}
	}
})); 

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Enable use of DELETE / PUT methods in HTML forms
app.use(methodOverride('_method'));

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public'))); // set public folder to be used for holding static files
app.use('/scripts', express.static(__dirname + '/node_modules/chart.js/dist/')); // create a custom path to give access to chart.js in the node modules

// Express Sessions
app.use(session({
	secret: 'koinStory',
	saveUninitialized: true,
	resave: true
}));

// Initialize Passport 
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
	errorFormatter: (param, msg, value) => {
		let namespace = param.split('.');
		let root = namespace.shift();
		let formParam = root;

		while(namespace.length) {
			formParam += `[${ namespace.shift() }]`;
		}
		return {
			param : formParam,
			msg   : msg,
			value : value
		};
	}
}));

// Connect Flash Messages
app.use( flash() );

// Global Variables for Flash Messages
app.use( (req, res, next) => {
	res.locals.success_message = req.flash('success_message');
	res.locals.error_message = req.flash('error_message');
	res.locals.error = req.flash('error'); // For Passport's Flash Messages
	res.locals.user = req.user || null;
	next();
});

// Use these routes
app.use('/', routes);
app.use('/users', users);

// Set Port
//app.set('port', (process.env.PORT || 3000)); // Set port to whatever is in the environment variable PORT, or 3000 if there's nothing there.
const port = process.env.PORT || 3000;

// Create Server
app.listen( port, () => {
	console.log(`Server is live on ${port}`);
});



