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
			document.getElementById('topOfPage').scrollIntoView({ behavior: 'smooth' });
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
			const colors = ['#ffbe0b','#fb5607','#ff006e','#8338ec','#3a86ff', '#248232', '#890620', '#0a2463'];
			const holdings = [...document.getElementsByClassName('currentVal')].map(val => +val.innerText.substring(1).replace(',',''));
			const coinLabels = [...document.getElementsByClassName('portfolioCoinSymbol')].map(node => node.innerText);
			const bgColors = holdings.map((v,i) => colors[i % colors.length]);
			
			new Chart(ctx, {
				type: 'pie',
				data: {
					datasets: [{
						data: holdings, // The portfolio value numbers
						backgroundColor: bgColors,
						borderWidth: 1
					}],
					labels: coinLabels // These labels appear in the legend and in the tooltips when hovering different arcs
				},
			});
		}
	} else if(currentPath === '/settings') {
		// SETTINGS STUFF HERE ===>
		// 
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