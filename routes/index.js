const router = require('express').Router();
const fetch = require('node-fetch');
const numeral = require('numeral');
const User = require('../models/user');
const uuidv4 = require('uuid/v4');


// If user is authenticated, continue, otherwise redirect to login and display error
const ensureAuthenticated = (req, res, next) => {
	if( req.isAuthenticated() ) {
		return next();
	} else {
		req.flash('error_message', 'Please log in!');
		res.redirect('/users/login');
	}
};

// Render the homepage
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
					averagePurchasePrice: numeral(coinAvgPurchasePrice).format('$0,0.00'),
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

// Render settings page
router.get('/settings', ensureAuthenticated, (req, res) => {
	res.render('settings');
});

// Top 10 Coin Information
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

// Search for specific coin
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

// Add Coins / Additional Holdings to Portfolio
router.post('/addToPortfolio', ensureAuthenticated, (req, res) => {
	const { symbol, ...purchase_details } = req.body;
	// Add unique id to purchase details to enable it to be easily identified for deletion
	purchase_details.id = uuidv4();
	const coin = { 
		symbol, 
		buys : [ purchase_details ],
		sells: [] 
	};
	const { user } = req;

	// Search for a user via username and add coin to portfolio. Show error, if there is one.
	// If coin already present in portfolio, add purchase details to buys array
	User.findOne({ _id: user._id })
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
				u.portfolio = [...user.portfolio, coin];
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

// Remove Coin / Purchase from Portfolio
router.delete('/deleteFromPortfolio', ensureAuthenticated, (req, res) => {
	const { user } = req;
	const { toBeDeleted } = req.body; // ID's are longer than 10
	
	User.findOne({ _id: user._id })
		.then(u => {
			const	updatedPortfolio = toBeDeleted.length > 10
				? user.portfolio.filter(coin => {
					// filter out the purchase to be delated from all coin buys
					coin.buys = coin.buys.filter(purchase => purchase.id !== toBeDeleted);
					// only return coins who still have buys
					return coin.buys.length > 0;
				})
				: user.portfolio.filter(coin => coin.symbol !== toBeDeleted);

			const updateMessage = toBeDeleted.length > 10
				? 'Purchase successfully removed !'
				: `${ toBeDeleted } successfully deleted from portfolio !`;

			u.portfolio = updatedPortfolio;
			u.save();
			req.flash('success_message', 	updateMessage);
			res.redirect('/');
		})
		.catch(e => {
			console.log(e);
			req.flash('error_message', `Could not delete ${ toBeDeleted } from portfolio`);
			res.redirect('/');
		});
});

// Create post method/s for the updating of user's settings.
router.put('/updateUser', ensureAuthenticated, (req, res) => {
	const { user } = req;
	const { newUsername, currentPassword, newPassword, confirmPassword  } = req.body;

	User.findOne({ _id: user._id })
		.then(u => {
			// If newUsername is defined, update it
			if(newUsername) {
				// Update the username
				u.username = newUsername;
				u.save();
				req.flash('success_message', 	'Username Updated !');
				res.redirect('/');
			} else {
				User.passwordCompare(currentPassword, u.password)
					.then(valid => {
						if(valid) {
							if(newPassword === confirmPassword) {
								User.encryptPassword(newPassword)
									.then(hash => {
										const newEncryptedPassword = hash;
										u.password = newEncryptedPassword;
										u.save();
										req.flash('success_message', 	'Password Updated !');
										res.redirect('/');
									})
									.catch(e => {
										console.log(e);
										req.flash('error_message', 'Error changing password !');
										res.redirect('/settings');
									});
							} else {
								req.flash('error_message', 'New passwords do not match !');
								res.redirect('/settings');
							}
						} else {
							req.flash('error_message', 'Invalid current password !');
							res.redirect('/settings');
						}
					});
			}
		})
		.catch(e => {
			console.log(e);
			req.flash('error_message', 'Could not update password');
			res.redirect('/');
		});	
});

// Delete Account
router.delete('/deleteAccount', ensureAuthenticated, (req, res) => {
	const { user } = req;
	const { username, password } = req.body;

	User.passwordCompare(password, user.password)
		.then(valid => {
			if(valid && username === user.username) {
				User.findOneAndDelete({ _id: user._id })
					.then(() => {
						req.logout();
						req.flash('success_message', 	'Account sucessfully deleted !');
						res.redirect('/users/register');
					});
			} else {
				req.flash('error_message', 'Incorrect username or password !');
				res.redirect('/settings');
			}
		});
});

module.exports = router;