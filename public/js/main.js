// Initialize all materialize plugins
M.AutoInit();

// Alert boxes disappear after 3 seconds
let alertBoxes = document.querySelectorAll('.alert');

alertBoxes.forEach(box=>{
  window.setTimeout(()=>{
    box.classList.add("hide");
  }, 3000);
});

// Add modal functionality to button after path changes
let currentPath = location.pathname;
let signInBtn = document.querySelector('.sign-in');
let signUpBtn = document.querySelector('.sign-up');

document.addEventListener('DOMContentLoaded', ()=>{
  if(currentPath === '/users/login'){
    signInBtn.classList.add('modal-trigger');
  } else if(currentPath === '/users/register'){
    signUpBtn.classList.add('modal-trigger');
  }
});

// Charts
document.addEventListener('DOMContentLoaded', ()=>{

  let ctx = document.getElementById("myChart");
  let myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ["BTC", "LTC", "XRP", "XLM", "ETH", "MIOTA"],
          datasets: [{
              label: '% Change',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                  'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                  'rgba(255,99,132,1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)'
              ],
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

});

document.addEventListener('DOMContentLoaded', ()=>{

  new Chart(document.getElementById('coinLineChart'), {
    type: 'line',
    data: {
      labels: [1500,1600,1700,1750,1800,1850,1900,1950,1999,2050],
      datasets: [{ 
          data: [86,114,106,106,107,111,133,221,783,2478],
          label: "Open",
          borderColor: "#3e95cd",
          fill: false
        }, { 
          data: [282,350,411,502,635,809,947,1402,3700,5267],
          label: "High",
          borderColor: "#8e5ea2",
          fill: false
        }, { 
          data: [168,170,178,190,203,276,408,547,675,734],
          label: "Low",
          borderColor: "#3cba9f",
          fill: false
        }, { 
          data: [40,20,10,16,24,38,74,167,508,784],
          label: "Close",
          borderColor: "#e8c3b9",
          fill: false
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Simulated Coin Data'
      }
    }
  });
});