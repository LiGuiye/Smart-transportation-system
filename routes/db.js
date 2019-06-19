var promise = require('bluebird');

var options = {
	// Initialization Options
	promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = 'postgres://postgres:313616@localhost:5432/postgres';
var db = pgp(connectionString);

// add query functions
function getAllPath(req, res, next) {
	db.any('select * from traffjam')
		.then(function(data) {
			res.status(200)
				.json({
					status: 'success',
					data: data,
					message: 'Retrieved ALL players'
				});
		})
		.catch(function(err) {
			return next(err);
		});
}


module.exports = {
	getAllPath: getAllPath
};