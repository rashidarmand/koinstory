// const express = require('express');
// const app = express();
// const port = 3000
// app.use(express.static('public'))

// const v = require('./variables')

// app.get('/', (req,res)=>{
//   res.send(`<h1>Hello World My Name is ${v.printName('Rashid')}</h1>`)
//   console.log('Howdy Partner');
// });

// app.get('/about', (req,res)=>{
//   res.send({'page': 'About Page'})
//   console.log('Ello Mate');
// });

// app.get('/gallery', (req,res)=>{
//   res.send(`<h1>Gallery</h1>
//   <div><img src='http://www.origamigne.com/shop/wp-content/uploads/2018/02/Vegeta_origamigne_Migne_Huynh.jpg'></div>
//   `)
//   console.log('Wus Gucci');
// });

// app.listen(port, ()=>{
//   console.log(`server is live on port: ${port}`);

// });






// Login App stuff
const express = require('express');
const path = require('path');
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

mongoose.connect('mongodb://localhost/koinstory');
const db = mongoose.connection;

const routes = require('./routes/index');
const users = require('./routes/users');

// Initialize App
const app = express();

// View Engine
app.set('views', path.join(__dirname, 'views')); // Want a folder called 'views to handle my views'
app.engine('handlebars', exphbs({defaultLayout:'layout'})); // Set handlebars as the engine for the app and also set the default layout as 'layout.handlebars'
app.set('view engine', 'handlebars'); // Set view engine to handlebars

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public'))); // set public folder to be used for holding static files

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
  errorFormatter: function(param, msg, value) {
      let namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash Messages
app.use(flash());

// Global Variables for Flash Messages
app.use((req, res, next)=>{
  res.locals.success_message = req.flash('success_message');
  res.locals.error_message = req.flash('error_message');
  res.locals.error = req.flash('error'); // For Passport's Flash Messages
  res.locals.user = req.user || null;
  next();
});

app.use('/', routes);
app.use('/users', users);

// app.use(app.router);
// routes.initialize(app);


// Set Port
app.set('port', (process.env.PORT || 3000)); // Set port to whatever is in the environment variable PORT, or 3000 if there's nothing there.

// Create Server
app.listen(app.get('port'), ()=>{
	console.log(`Server is live on ${app.get('port')}`);
});



