var express = require('express');
var router = express.Router();
var pgclient = require('dao/pgHelper');
pgclient.getConnection();

/* GET home page. */
router.get('/', function(req, res) {
	if (req.cookies.islogin) {
		req.session.islogin = req.cookies.islogin;
	}
	if (req.session.islogin) {
		res.locals.islogin = req.session.islogin;
	}
	res.render('index', {
		test: res.locals.islogin
	});
});

router.route('/login')
	.get(function(req, res) {
		if (req.session.islogin) {
			res.locals.islogin = req.session.islogin;
		}
		if (req.cookies.islogin) {
			req.session.islogin = req.cookies.islogin;
		}
		res.render('login', {
			title: '用户登录',
			test: res.locals.islogin
		});
	})
	.post(function(req, res) {
		result = null;
		pgclient.select('userinfo', {
			'username': req.body.username
		}, '', function(result) {
			if (result[0] === undefined) {
				res.send("<script language='javascript'>alert('没有该用户，请重新登录！！');</script>");
			} else {
				if (result[0].password === req.body.password) {
					req.session.islogin = req.body.username;
					res.locals.islogin = req.session.islogin;
					res.cookie('islogin', res.locals.islogin, {
						maxAge: 60000
					});
					res.redirect('/');
				} else {
					res.send("<script language='javascript'>alert('账户或密码错误，请重现登录！！');</script>");
				}
			}
		});
	});


router.get('/logout', function(req, res) {
	res.clearCookie('islogin');
	req.session.destroy();
	res.redirect('/');
});

router.route('/reg')
	.get(function(req, res) {
		res.render('reg');
	})
	.post(function(req, res) {
		result = null;
		// 先查一下数据库是否已注册
		pgclient.select('userinfo', {
			'username': req.body.username
		}, '', function(result) {
			// 如果用户名没有被使用
			if (result[0] === undefined) {
				pgclient.save('userinfo', {
					'username': req.body.username,
					'password': req.body.password,
					'email': req.body.email
				}, function(err) {
					pgclient.select('userinfo', {
						'username': req.body.username
					}, '', function(result) {
						console.log("注册成功");
						console.log(result)
						res.render('/home')
					});
				});
			} else {
				console.log("用户名已经被注册")
			}
		});
	});

module.exports = router;
