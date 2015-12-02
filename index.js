const path = require('path');
const express = require('express');
const app = express();

app.set('ace', global.ACESDK !== undefined);
if(app.get('ace'))
    console.log('ACE environment has been detected.');

app.use(express.static(path.join(__dirname, 'static')));

const database = require('./database');
database(app);

const cache = require('./cache');
cache(app);

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser(process.env.FLEET_COOKIE_SECRET || 'COOKIE_SECRET'));

const sessionExpires = 86400;
const session = require('express-session');
var sessionStore;
if(app.get('ace')) {
    const AceSessionStore = MemcachedStore(session);
    sessionStore = new AceSessionStore({
        prefix: 'sess',
        expires: sessionExpires
    });
} else {
    const SequelizeStore = require('connect-session-sequelize')(session.Store);
    sessionStore = new SequelizeStore({
        db: app.db.sequelize,
        table: 'FleetSession'
    });
}
app.use(session({
    name: 'FLEET_SID',
    store: sessionStore,
    cookie: {maxAge: sessionExpires * 1000},
    rolling: true,
    secret: process.env.FLEET_SESSION_SECRET || 'SESSION_SECRET',
    saveUninitialized: false,
    resave: false
}));

var server;
if(app.get('ace'))
    server = app.listen(0, function() {
        console.log('Server started on port ' + server.address().port);
    });
else
    server = app.listen(8080, 'localhost', function() {
        const address = 'http://' + server.address().address + ':' + server.address().port;
        console.log('Server started on %s', address);
        //require('child_process').execSync('start ' + address);
    });
