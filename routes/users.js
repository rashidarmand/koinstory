const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

// Show Registration View
router.get('/register', (req, res) => {
	res.render('register');
});

// Show Login View
router.get('/login', (req, res) => {
	res.render('login');
});

// Register the New User
router.post('/register', (req, res) => {
	const { firstName, lastName, email, username, password, password2 } = req.body;

	// Validations
	req.checkBody('firstName', 'First Name is required').notEmpty();
	req.checkBody('lastName', 'Last Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	// Capture Validation Errors
	const errors = req.validationErrors();

	// If errors exist, show them, otherwise, create the user
	if(errors) {
		res.render('register', { errors : errors });
	} else {
		const newUser = new User({
			firstName,
			lastName,
			username,
			email,
			password,
			portfolio: []
		}); 

		User.createUser(newUser, (error, user) => {
			console.log(user);
			if(error) throw(error);
		});

		req.flash('success_message', 'You are registered and can now log in!');
		res.redirect('/users/login');
	}
});

// Authenticate user and log them in.
router.post('/login',
	passport.authenticate('local', { successRedirect: '/', successFlash: true, failureRedirect: '/users/login', failureFlash: true }),
	(req, res) => {
		res.redirect('/');
	});

// Let user log out
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success_message', 'You are logged out!');
	res.redirect('/users/login');
});

// Create strategy for authenticating user via Passport JS
passport.use(new LocalStrategy(
	(username, password, done) => {
		User.getUserByUsername(username, (error, user) => {
			if (error) throw error;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}

			User.comparePassword(password, user.password, (error, isMatch) => {
				if (error) throw error;
				if (isMatch) {
					return done(null, user, { message: `Welcome ${user.username}!`});
				} else {
					return done(null, false, { message: 'Invalid Password' });
				}
			});
		});
	})
);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.getUserById(id, (error, user) => {
		done(error, user);
	});
});

module.exports = router;

