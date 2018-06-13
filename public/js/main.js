// Initialize all materialize plugins
M.AutoInit();

// let closeButton = document.querySelector(".close-button")
// let flashPanel = document.querySelector(".flash")

// closeButton.addEventListener("click", event => {
//   event.preventDefault()

//   flashPanel.classList.add("hide")
// })

let alertBoxes = document.querySelectorAll('.alert');

alertBoxes.forEach(box=>{
  window.setTimeout(()=>{
    box.classList.add("hide");
  }, 3000);
});

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