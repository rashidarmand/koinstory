const express = require('express');
const router = express.Router();

// Render the Homepage
router.get('/', ensureAuthenticated, (req, res)=>{
	res.render('index');
});

router.post('/coins', (req, res)=>{
	// User already looked up
	// Retrieve Ticker Symbols
	const tickers = [];
	
});

// If user is authenticated, continue, otherwise redirect to login and display error
const ensureAuthenticated = (req, res, next)=>{
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_message', 'Please log in!');
		res.redirect('/users/login');
	}
}

module.exports = router;