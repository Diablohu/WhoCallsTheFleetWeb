const path = require('path');
const express = require('express');
const app = express();

app.use(express.static(path.join(__dirname, 'static')));

const database = require('./database');
database(app);

var server;
if(app.get('env') === 'production') {
    server = app.listen(0, function() {
        console.log('Server started on port ' + server.address().port);
    });
} else {
    server = app.listen(8080, 'localhost', function() {
        const address = 'http://' + server.address().address + ':' + server.address().port;
        console.log('Server started on %s', address);
        require('child_process').execSync('start ' + address);
    });
}
