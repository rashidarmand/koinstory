const router = require('express').Router();
const fetch = require('node-fetch');
const numeral = require('numeral');
const User = require('../models/user');


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
	// Gave me the user
	// console.log(req.user);
	const { portfolio } = req.user;
	// console.log(portfolio);

	// Calculcate Total Value of Portfolio
	// let portfolioTotal = portfolio.reduce((prev, next) => {
	// 	const coinQuantity = next.buys.reduce((prev, next) => prev + +next.quantity, 0);
	// 	const coinUSDAmount = next.buys.reduce((prev, next) => prev + +next.usd_purchase_price, 0);
	// 	const coinTotalVal = coinQuantity * coinUSDAmount;
	// 	return prev + coinTotalVal;
	// }, 0);

	// portfolioTotal = numeral(portfolioTotal).format('$0,0.00');
	// console.log('portfolio total', portfolioTotal);

	// let coinSymbols = portfolio.map(coin => coin.symbol).join();
	// console.log(coinSymbols);

	// Promise.all([])

	const calculatePortfolioTotal = async (portfolio) => {
		try {
			// Get just the symbols for each coin in the portfolio
			const coinSymbols = portfolio.map(coin => coin.symbol);
			// Join all coin symbols together for use in fetch statement
			const cS = coinSymbols.join();
			// Request the coin data
			const coinDataRequest = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${cS}&tsyms=USD`)
				.then(res => res.json());
			// Create a new array with the current price of each coin in the portfolio
			const currentPrices = coinSymbols.map(symbol => {
				return {
					symbol,
					currentPrice: coinDataRequest.RAW[`${ symbol }`].USD.PRICE
				};
			});
			// Multiply the current price of each coin by the quantity of each coin to get current portfolio value
			// @TODO: reassign currentPortfolio value to itself with numeral formatting.
			let currentPortfolioValue = portfolio.reduce((prev, next) => {
				const coinQuantity = next.buys.reduce((prev, next) => prev + +next.quantity, 0);
				const coinCurrentPrice = currentPrices.find(coin => coin.symbol === next.symbol).currentPrice;
				const coinCurrentTotalVal = coinQuantity * coinCurrentPrice;
				return prev + coinCurrentTotalVal; 
			}, 0);
			// Subtract average purchase price of each coin from current price and divide that by average purchase price to get Gain/Loss %.
			const analyzePortfolioPerformance = portfolio.reduce((prev, next) => {
				const coinAvgPurchasePrice = next.buys.reduce((prev, next) => {
					return prev + +next.usd_purchase_price;
				}, 0) / next.buys.length;
				const coinCurrentPrice = currentPrices.find(coin => coin.symbol === next.symbol).currentPrice.toFixed(2);
				const gainLoss = coinCurrentPrice - coinAvgPurchasePrice;
				const pctChange = gainLoss / coinAvgPurchasePrice;
				// Changing gain loss to string for manipulation of how data is displayed
				const displayGL = gainLoss.toString();

				prev.push({
					symbol: next.symbol,
					gainLoss: displayGL.charAt(0) === '-' 
						? displayGL.charAt(0) + '$' + displayGL.substring(1)
						: '$' + displayGL,
					pctChange: numeral(pctChange).format('0,0.00%')
				});

				return prev;
			}, []);

			console.log('PORTFOLIO PERFORMANCE:  ', analyzePortfolioPerformance);
			// @TODO: give portfolio performance and total value to view for displaying
			// @TODO: add modal forms for updating/adding coin purchases and deleting them


		} catch(e) {
			console.log({ Error: e });
		}
	};

	calculatePortfolioTotal(portfolio)






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
			const priceInfoRequest = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${query}&tsyms=USD`)
				.then(res => res.json());

			const fullPriceData = priceInfoRequest.DISPLAY[`${query}`].USD;

			// Destructure request
			const { PRICE, MARKET, LASTUPDATE, HIGH24HOUR, LOW24HOUR, CHANGEPCT24HOUR, MKTCAP } = fullPriceData;
	
			// Assign the priceInfo variable the properties of the request
			const priceInfo = { PRICE, MARKET, LASTUPDATE, HIGH24HOUR, LOW24HOUR, CHANGEPCT24HOUR, MKTCAP };
	
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
			.then( ([ general, price ]) => {
				res.render('results', { general, price });
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

router.post('/addToPortfolio', ensureAuthenticated, (req, res) => {
	// Destructuring values that I need from the request.
	const { symbol, ...purchase_details } = req.body;
	const coin = { 
		symbol, 
		buys : [ purchase_details ],
		sells: [] 
	};
	const { user } = req;

	// Search for a user via username and add coin to portfolio. Show error, if there is one.
	User.findOne({ username: user.username })
		.then(u => {
			u.portfolio = [...u.portfolio, coin];
			u.save();
			req.flash('success_message', 	`${ symbol } successfully added to portfolio !`);
			res.redirect('/');
		})
		.catch(e => {
			console.log(e);
			req.flash('error_message', `Could not add ${ symbol } to portfolio`);
			res.redirect('/');
		});

});

module.exports = router;