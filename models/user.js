const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const UserSchema = mongoose.Schema({
	username: {
		type: String,
		index: true
	},
	password: {
		type: String
	},
	email: {
		type: String
	},
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	portfolio: {
		type: []
	}
});

const User = module.exports = mongoose.model('User', UserSchema);

// Create new user with an encrypted password via bcrypt js
module.exports.createUser = (newUser, callback) => {
	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(newUser.password, salt, (err, hash) => {
			newUser.password = hash;
			newUser.save(callback);
		});
	});
};

// Search db for a user with the passed in username via mongoose 'findOne' method
module.exports.getUserByUsername = (username, callback) => {
	User.findOne({ username }, callback);
};

// Use bcrypt js built in '.compare' to see if entered password is a match
module.exports.comparePassword = (enteredPassword, hash, callback) => {
	bcrypt.compare(enteredPassword, hash, (error, isMatch) => {
		if(error) throw(error);
		callback(null, isMatch);
	});
};

// Promise based version of the above comparePassword function
module.exports.passwordCompare = (enteredPassword, hash) => Promise.resolve(bcrypt.compare(enteredPassword, hash));

// Promise based version of bcrypt hashing
module.exports.encryptPassword = (password) => {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(password, salt, (err, hash) => {
				err ? reject(err) : resolve(hash);
			});
		});
	});
};

// Searching for a user via mongoose 'findById' method
module.exports.getUserById = (id, callback)=>{
	User.findById(id, callback);
};
