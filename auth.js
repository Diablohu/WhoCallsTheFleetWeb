function getSessionData(user) {
    return {
        id: user.id,
        duoshuoId: user.duoshuoId,
        name: user.name
    };
}

const request = require('request');
const router = require('express').Router();
router.get('/login', function(req, res, next) {
    passport.authenticate('local', {
        successRedirect: req.body && req.body.from || '/'
    })(req, res, next);
});
router.get('/logout', function(req, res) {
    req.logout();
    res.redirectr(req.body && req.body.from || '/');
});

module.exports = function(app) {
    const passport = require('passport');
    const passportLocal = require('passport-local').Strategy;

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        const key = 'sess:' + id;
        app.cache.get(key, function(err, data) {
            if(err)
                done(err, null);
            else if(data)
                done(null, JSON.parse(data));
            else {
                const db = app.db;
                db.FleetUser.findById(id).then(function(user) {
                    if(user === null)
                        done(new Error('Can not find user ' + id), null);
                    else {
                        const sessionUser = getSessionData(user);
                        app.cache.set(key, JSON.stringify(sessionUser), 600, function() {
                            done(null, sessionUser);
                        });
                    }
                });
            }
        });
    });

    passport.use(new passportLocal({
        usernameField: 'code',
        passwordField: 'code',
        passReqToCallback: true
    }, function(req, code, _, done) {
        request.post({
            url: 'http://api.duoshuo.com/oauth2/access_token',
            form: {
                code: code
            }
        }, function(err, response, body) {
            if(err)
                done(err);
            else {
                var data = JSON.parse(body);
                //const accessToken = data.access_token;
                const duoshuoId = data.user_id;

                const db = req.app.db;
                db.FleetUser.findOne({
                    where: {
                        duoshuoId: duoshuoId
                    }
                }).then(function(user) {
                    if(user === null) {
                        request('http://api.duoshuo.com/users/profile.json?user_id=' + duoshuoId, function(err, response, body) {
                            if(err)
                                done(err);
                            else {
                                data = JSON.parse(body);
                                if(data.code === 0) {
                                    db.FleetUser.create({
                                        duoshuoId: duoshuoId,
                                        name: data.response.name
                                    }).then(function(user) {
                                        user.save().then(function() {
                                            done(null, getSessionData(user));
                                        });
                                    });
                                } else
                                    done(null, false, data.errorMessage);
                            }
                        });
                    } else
                        done(null, getSessionData(user));
                });
            }
        });
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    app.use('/', router);
    app.use(function(req, res, next) {
        if(req.isAuthenticated())
            next();
        else if(req.path === '/api' || req.path.startsWith('/api/')) {
            var err = new Error('抱歉，您没有访问该资源的权限');
            err.status = 401;
            next(err);
        } else
            next();
    });
};
