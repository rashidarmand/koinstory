// Initialize all materialize plugins
M.AutoInit();

// Show / hide 
window.addEventListener('scroll', () => {
	if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
		document.getElementById('scrollToTop').style.display = 'block';
	} else {
		document.getElementById('scrollToTop').style.display = 'none';
	}
});

// Add modal functionality to button after path changes
const currentPath = location.pathname;

document.addEventListener('DOMContentLoaded', () => {
	// Alert boxes disappear after 3 seconds
	const alertBoxes = document.querySelectorAll('.alert');
	alertBoxes.forEach( box => {
		window.setTimeout(() => {
			box.classList.add('hide');
		}, 3000);
	});

	const scrollToTopButton = document.getElementById('scrollToTop');
	
	if(scrollToTopButton) {
		scrollToTopButton.addEventListener('click', () => {
			document.querySelector('html').scrollIntoView({ behavior: 'smooth' });
		});
	}
	
	const signInBtn = document.querySelector('.sign-in');
	const signUpBtn = document.querySelector('.sign-up');

	if(currentPath === '/users/login') {
		signInBtn.classList.add('modal-trigger');
	} else if(currentPath === '/users/register') {
		signUpBtn.classList.add('modal-trigger');
	} else if(currentPath === '/') {
		const modalTriggers = [...document.getElementsByClassName('modal-trigger')];
		const addHoldingsCoinInput = document.getElementById('selectedCoin');
		const selectedCoinSpans = [...document.getElementsByClassName('selectedCoin')];
		const ctx = document.getElementById('portfolioPie');
  
		modalTriggers.forEach(modalTrigger => {
			modalTrigger.addEventListener('click', () => {
				addHoldingsCoinInput.value = modalTrigger.id;
				selectedCoinSpans.forEach(span => span.innerText = modalTrigger.id);
			});
		});

		if(ctx) {
			// const colors = ['rgb(0,90,65)', 'rgb(242,242,242)', 'rgb(241, 160, 66)'];
			const colors = ['#6699cc', '#fff275', '#ff8c42', '#ff3c38', '#a23e48'];
			const holdings = [...document.getElementsByClassName('currentVal')].map(val => +val.innerText.substring(1).replace(',',''));
			const coinLabels = [...document.getElementsByClassName('portfolioCoinSymbol')].map(node => node.innerText);
			const bgColors = holdings.map((v, i) => i % 2 === 0 ? 'rgb(0,90,65)' : 'rgb(242,242,242)');
			const borderColors = bgColors.map(color => color === 'rgb(0,90,65)' ? 'rgb(0,22.5,16.25)' : 'rgb(60.5,60.5,60.5)');
			const test = holdings.map((v,i) => colors[i % colors.length]);

			console.log('bg: ', bgColors)
			console.log('border: ', borderColors)
			
			new Chart(ctx, {
				type: 'pie',
				data: {
					datasets: [{
						// The portfolio value numbers
						data: holdings,
						backgroundColor: test,
						// borderColor: borderColors,
						borderWidth: 1
					}],
			
					// These labels appear in the legend and in the tooltips when hovering different arcs
					labels: coinLabels
				},
				// options: options
			});
		}
	} else if(currentPath === '/') {
		// const ctx = document.getElementById('portfolioPie');
		// const holdings = [...document.getElementsByClassName('currentVal')].map(val => +val.innerText.substring(1).replace(',',''));
		// const coinLabels = [...document.getElementsByClassName('portfolioCoinSymbol')].map(node => node.innerText);
		// const bgColors = holdings.map((val, i) => i % 2 === 0 ? 'rgb(0,90,65)' : 'rgb(242,242,242)');
		// const borderColors = bgColors.map(color => color === 'rgb(0,90,65)' ? 'rgb(0,22.5,16.25)' : 'rgb(60.5,60.5,60.5)');

		// console.log('bg: ', bgColors)
		// console.log('border: ', borderColors)
		
		// new Chart(ctx, {
		// 	type: 'pie',
		// 	data: {
		// 		datasets: [{
		// 			// The portfolio value numbers
		// 			data: holdings,
		// 			backgroundColor: bgColors,
		// 			borderColor: borderColors,
		// 			borderWidth: 1
		// 		}],
		
		// 		// These labels appear in the legend and in the tooltips when hovering different arcs
		// 		labels: coinLabels
		// 	},
		// 	// options: options
		// });
	} else if(currentPath === '/markets') {
		const tickLabels = [...document.getElementsByClassName('tick-symbols')].map(ticker => ticker.innerText);
		const pctChanges = [...document.getElementsByClassName('pct-change')].map(pct => +pct.innerText.substring(0, pct.innerText.length - 1));
		const bgColors = pctChanges.map(pct => pct > 0 ? 'rgb(0, 128, 0)' : 'rgb(178, 34, 34)');
		const borderColors = bgColors.map(bgc => bgc === 'rgb(0, 128, 0)' ? 'rgb(0, 32, 0)' : 'rgb(44.5, 8.5, 8.5)');

		const ctx = document.getElementById('top10Chart');
		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: tickLabels,
				datasets: [{
					label: '% Change',
					data: pctChanges,
					backgroundColor: bgColors,
					borderColor: borderColors,
					borderWidth: 1
				}]
			},
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero:true
						}
					}]
				}
			}
		});
	}

});

// Charts


// document.addEventListener('DOMContentLoaded', () => {

//   new Chart(document.getElementById('coinLineChart'), {
//     type: 'line',
//     data: {
//       labels: [1500,1600,1700,1750,1800,1850,1900,1950,1999,2050],
//       datasets: [{ 
//           data: [86,114,106,106,107,111,133,221,783,2478],
//           label: "Open",
//           borderColor: "#3e95cd",
//           fill: false
//         }, { 
//           data: [282,350,411,502,635,809,947,1402,3700,5267],
//           label: "High",
//           borderColor: "#8e5ea2",
//           fill: false
//         }, { 
//           data: [168,170,178,190,203,276,408,547,675,734],
//           label: "Low",
//           borderColor: "#3cba9f",
//           fill: false
//         }, { 
//           data: [40,20,10,16,24,38,74,167,508,784],
//           label: "Close",
//           borderColor: "#e8c3b9",
//           fill: false
//         }
//       ]
//     },
//     options: {
//       title: {
//         display: true,
//         text: 'Simulated Coin Data'
//       }
//     }
//   });
// });