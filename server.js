const express = require("express");

var app = express();
app.listen(8888);

app.get('/', function(req, response) {
    response.sendFile('index.html', { root: __dirname});
});

app.get('/files/:name', function(req, response) {
    response.sendFile(req.params.name, { root: __dirname});
});

app.get('/files/audio/:name', function(req, response) {
    response.sendFile(req.params.name, { root: __dirname + "/audio/"});
});

app.get('/files/qt/:name', function(req, response) {
    response.sendFile(req.params.name, { root: __dirname + "/qt/"});
});