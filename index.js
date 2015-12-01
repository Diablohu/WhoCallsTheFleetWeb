const path = require('path');
const express = require('express');
const app = express();

app.use(express.static(path.join(__dirname, 'static')));

const server = app.listen(0, function() {
    console.log('Express server started on port %s', server.address().port);
});
