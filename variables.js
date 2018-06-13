var name = 'rashid';
var age = 24;
var state = 'NY'
let printName = name =>{
  return name;
}

// One way to write it.
// module.exports.name = name;
// module.exports.age = age;
// module.exports.state = state;

// ES6
module.exports = {name,age,state, printName}