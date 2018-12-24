const router = require('express').Router();
const fetch = require('node-fetch');
const numeral = require('numeral');

// If user is authenticated, continue, otherwise redirect to login and display error
const ensureAuthenticated = (req, res, next) => {
	if( req.isAuthenticated() ) {
		return next();
	} else {
		req.flash('error_message', 'Please log in!');
		res.redirect('/users/login');
	}
};

// Render the Homepage
// ** New **
router.get('/', ensureAuthenticated, (req, res) => {
	const getTop10 = async () => {
		const top10 = await fetch('https://api.coinmarketcap.com/v2/ticker/?start=1&limit=10')
			.then(res => res.json());
	
		const formattedTop10 = (({ data }) => {
			const top10CoinList = [];
			for(let coin in data) {
				top10CoinList.push({
					name: data[coin].name,
					symbol: data[coin].symbol,
					price: numeral(data[coin].quotes.USD.price).format('$0,0.00'),
					change24h: data[coin].quotes.USD.percent_change_24h + ' %'
				});
			}   
			return top10CoinList;
		});
	
		return formattedTop10(top10);
	};
	
	getTop10()
		.then( top10Coins => res.render('index', { coins: top10Coins }) )
		.catch( e => res.render('markets', { error: e }) );
});

// New
router.get('/markets', (req, res) => {
	const getTop10 = async () => {
		const top10 = await fetch('https://api.coinmarketcap.com/v2/ticker/?start=1&limit=10')
			.then(res => res.json());
	
		const formattedTop10 = (({ data }) => {
			const top10CoinList = [];
			for(let coin in data) {
				top10CoinList.push({
					name: data[coin].name,
					symbol: data[coin].symbol,
					price: numeral(data[coin].quotes.USD.price).format('$0,0.00'),
					change24h: data[coin].quotes.USD.percent_change_24h + ' %'
				});
			}   
			return top10CoinList;
		});
	
		return formattedTop10(top10);
	};
	
	getTop10()
		.then( top10Coins => res.render('markets', { coins: top10Coins }) )
		.catch( e => res.render('markets', { error: e }) );
});

//  New 
router.post('/search', ensureAuthenticated, (req, res) => {
	let query = req.body.search;

	if(query) {
		query = query.toUpperCase();

		const getSearchResults = async () => {
			// Get Price Info
			const priceInfoRequest = await fetch(`https://min-api.cryptocompare.com/data/histoday?fsym=${query}&tsym=USD&limit=1`)
				.then(res => res.json());
	
			// Destructure request
			const { open, close, high, low } = priceInfoRequest.Data[0];
	
			// Assign the priceInfo variable the properties of the request
			const priceInfo = { open, close, high, low };
	
			// Get General Info
			const generalInfoRequest = await fetch(`https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms=${query}&tsym=USD`)
				.then(res => res.json());
	
			// Destructure request
			const { 
				FullName: name,
				Name: symbol, 
				ImageUrl: image,
				Algorithm: algorithm,
				ProofType: proofType 
			} = generalInfoRequest.Data[0].CoinInfo;
	
			// Assign the generalInfo variable the properties of the request
			const generalInfo = {
				name,
				symbol,
				image: `https://www.cryptocompare.com${image}`,
				algorithm,
				proofType
			};
	
			return [ generalInfo, priceInfo ];
		};

		getSearchResults(query)
			.then( ([ general, prices ]) => {
				res.render('results', { general, prices });
			})
			.catch( e => { 
				console.log(e) ;
				res.render('index', { error : `Sorry, could not find any information on ${query}` });
			});
	} else {
		req.flash('error_message', 'Try entering a ticker symbol like "BTC" !');
		res.redirect('/');
	}
});

module.exports = router;