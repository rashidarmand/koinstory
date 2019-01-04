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
	const { portfolio } = req.user;

	const analyzePortfolio = async (portfolio) => {
		try {
			// Get just the symbols for each coin in the portfolio
			const coinSymbols = portfolio.map(coin => coin.symbol);
			// Join all coin symbols together for use in fetch statement
			const query = coinSymbols.join();
			// Request the coin data
			const coinDataRequest = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${ query }&tsyms=USD`)
				.then(res => res.json());
			// Create a new array with the current price of each coin in the portfolio
			const currentPrices = coinSymbols.map(symbol => {
				return {
					symbol,
					currentPrice: coinDataRequest.RAW[`${ symbol }`].USD.PRICE,
					change24hr: coinDataRequest.DISPLAY[`${ symbol }`].USD.CHANGEPCT24HOUR,
					currentValue: null,
					holdings: null
				};
			});
			// Multiply the current price of each coin by the quantity of each coin to get current portfolio value
			let currentPortfolioValue = portfolio.reduce((prev, next) => {
				const cpInfo = currentPrices.find(coin => coin.symbol === next.symbol);
				const coinQuantity = next.buys.reduce((prev, next) => prev + +next.quantity, 0);
				const coinCurrentPrice = cpInfo.currentPrice;
				const coinCurrentValue = coinQuantity * coinCurrentPrice;
				cpInfo.currentValue = numeral(coinCurrentValue).format('$0,0.00');
				cpInfo.holdings = coinQuantity;
				return prev + coinCurrentValue; 
			}, 0);
			// Formatting Value
			currentPortfolioValue = numeral(currentPortfolioValue).format('$0,0.00');
			// Subtract average purchase price of each coin from current price and divide that by average purchase price to get Gain/Loss %.
			const calculatePerformance = portfolio.reduce((prev, next) => {
				const coinAvgPurchasePrice = next.buys.reduce((prev, next) => {
					return prev + +next.usd_purchase_price;
				}, 0) / next.buys.length;
				const coinCurrentPrice = currentPrices.find(coin => coin.symbol === next.symbol).currentPrice.toFixed(2);
				const gainLoss = coinCurrentPrice - coinAvgPurchasePrice;
				const pctChange = gainLoss / coinAvgPurchasePrice;
				const displayGL = numeral(gainLoss).format('$0,0.00');
				const displayPctChange = numeral(pctChange).format('0,0.00%');

				prev.push({
					symbol: next.symbol,
					gainLoss: displayGL,
					pctChange: displayPctChange,
					averagePurchasePrice: coinAvgPurchasePrice,
					purchaseHistory: next.buys
				});

				return prev;
			}, []);
			
			// Format Values
			currentPrices.forEach(coin => coin.currentPrice = numeral(coin.currentPrice).format('$0,0.00'));

			return {
				totalVal: currentPortfolioValue,
				performance: calculatePerformance,
				currentPrices
			};
		} catch(e) {
			console.log({ Error: e });
		}
	};

	analyzePortfolio(portfolio)
		.then(data => {
			res.render('index', { portfolio: data });
		})
		.catch(e => res.render('index', { error: e }));
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
	// If coin already present in portfolio, add purchase details to buys array
	User.findOne({ username: user.username })
		.then(u => {
			const updatedPortfolio = [...user.portfolio];
			const existingCoin = updatedPortfolio.find(val => val.symbol === coin.symbol);

			if(existingCoin) {
				existingCoin.buys.push(purchase_details); 
				u.portfolio = updatedPortfolio;
				u.save();
				req.flash('success_message', 	`Successfully added new purchase of ${ symbol } to portfolio !`);
				res.redirect('/');
			} else {
				u.portfolio = [...u.portfolio, coin];
				u.save();
				req.flash('success_message', 	`${ symbol } successfully added to portfolio !`);
				res.redirect('/');
			}
		})
		.catch(e => {
			console.log(e);
			req.flash('error_message', `Could not add ${ symbol } to portfolio`);
			res.redirect('/');
		});

});

// Remove Coin from Portfolio
router.delete('/deleteFromPortfolio', ensureAuthenticated, (req, res) => {
	const { user } = req;
	const { coinToDelete } = req.body;

	// @TODO
	// Uniquely identify previous purchase to delete it.
	
	User.findOne({ username: user.username })
		.then(u => {
			const updatedPortfolio = user.portfolio.filter(coin => coin.symbol !== coinToDelete);
			u.portfolio = updatedPortfolio;
			u.save();
			req.flash('success_message', 	`${ coinToDelete } successfully deleted from portfolio !`);
			res.redirect('/');
		})
		.catch(e => {
			console.log(e);
			req.flash('error_message', `Could not delete ${ coinToDelete } from portfolio`);
			res.redirect('/');
		});
});

module.exports = router;