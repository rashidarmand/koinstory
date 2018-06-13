const express = require('express');
const router = express.Router();
const request = require('request');
const rp = require('request-promise');
const _ = require('lodash');
const numeral = require('numeral');

// If user is authenticated, continue, otherwise redirect to login and display error
const ensureAuthenticated = (req, res, next)=>{
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_message', 'Please log in!');
		res.redirect('/users/login');
	}
};

// Render the Homepage
router.get('/', ensureAuthenticated, (req, res)=>{

	let coins = [];

	// Hit api for top 10 coins information
	request('https://api.coinmarketcap.com/v2/ticker/?start=1&limit=10', (error, response, body)=>{
		// if error, render the view and show error occured
		if(error){
			res.render('markets', { error: error })
		} else {
			// Parse the response returned as JSON
			let top10 = JSON.parse(body)

			// Iterate over each coin in the response, push objects with relevant data to the coins list
			_.forOwn(top10.data, (value, key)=>{
				coins.push(
					{
						name: value.name,
						symbol: value.symbol,
						price: numeral(value.quotes.USD.price).format('$0,0.00'),
						change24h: value.quotes.USD.percent_change_24h + ' %'
					}
				)
				// console.log(value.name);
				// console.log(value.symbol);
				// console.log(value.circulating_supply);
				// console.log(value.total_supply);
				// console.log(value.max_supply);
				// console.log(value.quotes.USD.price);
				// console.log(value.quotes.USD.volume_24h);
				// console.log(value.quotes.USD.market_cap);
				// console.log(value.quotes.USD.percent_change_1h);
				// console.log(value.quotes.USD.percent_change_24h);
				// console.log(value.quotes.USD.percent_change_7d);
				// console.log(coin);
		});

		// console.log('Success')
		// console.log(coins)
		res.render('index', { coins: coins } );
		}

	});
});

router.get('/markets', (req, res)=>{
	// User already looked up
	// Retrieve Ticker Symbols
	let coins = [];

	// Hit api for top 10 coins information
	request('https://api.coinmarketcap.com/v2/ticker/?start=1&limit=10', (error, response, body)=>{
		// if error, render the view and show error occured
		if(error){
			res.render('markets', { error: error })
		} else {
			// Parse the response returned as JSON
			let top10 = JSON.parse(body)

			// Iterate over each coin in the response, push objects with relevant data to the coins list
			_.forOwn(top10.data, (value, key)=>{
				coins.push(
					{
						name: value.name,
						symbol: value.symbol,
						price: numeral(value.quotes.USD.price).format('$0,0.00'),
						change24h: value.quotes.USD.percent_change_24h + ' %'
					}
				)
				// console.log(value.name);
				// console.log(value.symbol);
				// console.log(value.circulating_supply);
				// console.log(value.total_supply);
				// console.log(value.max_supply);
				// console.log(value.quotes.USD.price);
				// console.log(value.quotes.USD.volume_24h);
				// console.log(value.quotes.USD.market_cap);
				// console.log(value.quotes.USD.percent_change_1h);
				// console.log(value.quotes.USD.percent_change_24h);
				// console.log(value.quotes.USD.percent_change_7d);
				// console.log(coin);
		});

		// console.log('Success')
		// console.log(coins)
		res.render('markets', { coins: coins } );
		}

	});

});

router.post('/search', ensureAuthenticated, (req, res)=>{
	let query = req.body.search
	
	// let coin = {
	// 	generalInfo: null,
	// 	priceInfo: null
	// };

	var generalInfo = null;
	var priceInfo = null;
	let coin = [generalInfo, priceInfo];

	if(query){
		// CryptoCompare only lets you search for coins by tickers and they must be UpperCase
		query = query.toUpperCase()

		request(`https://min-api.cryptocompare.com/data/histoday?fsym=${query}&tsym=USD&limit=0`, (error, response, body)=>{
			// if error, render the view and show error occured
			if(error){
				// res.redirect('/', { error: error })
				console.log(error)
			} else {
				// Parse the response returned as JSON
				let price = JSON.parse(body)

				let marketPrices = {
					open: price.Data[0].open,
					close: price.Data[0].close,
					high: price.Data[0].high,
					low: price.Data[0].low
				}

				// Assign the market prices to the coin
				priceInfo = marketPrices
			}
			// console.log(priceInfo);
		// });

		request(`https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms=${query}&tsym=USD`, (error, response, body)=>{
			// if error, render the view and show error occured
			if(error){
				// res.redirect('/', { error: error })
				console.log(error)
			} else {
				// Parse the response returned as JSON
				let info = JSON.parse(body)

				let bio = {
					name: info.Data[0].CoinInfo.FullName,
					symbol: info.Data[0].CoinInfo.Name,
					image: `https://www.cryptocompare.com${info.Data[0].CoinInfo.ImageUrl}`,
					algorithim: info.Data[0].CoinInfo.Algorithm,
					proofType: info.Data[0].CoinInfo.ProofType
				}

				// Assign the market prices to the coin
				generalInfo = bio
			}
			// console.log(generalInfo);
		// });
		console.log(generalInfo);
		console.log(priceInfo);
		res.render('results', { 
			general: generalInfo, 
			prices: priceInfo 
		});
	});
});
		// console.log(coin)
	} else{
		req.flash('error_message', 'Try entering a ticker symbol like eg. BTC !');
		res.redirect('/');
	}

	// console.log(query)
	// res.render('/results', {});
});

// router.get('/results', ensureAuthenticated, (req, res)=>{
// 	res.render('results');
// });


module.exports = router;