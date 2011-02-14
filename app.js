#!/usr/bin/env node
var icecast = require('icecast-stack');
var static = require('node-static');
var mime = require('mime');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');
var urls = require('./urls');

var clients = {};
var icecastClient = require('icecast-stack/client').createClient(urls.random().url);

icecastClient.on('connect', function() {
    console.log('Icecast Stream connected!');
});

// When a chunk of data is received on the icecastClient, push it to all connected clients.
icecastClient.on('data', function (chunk) {
    for (id in clients){
        clients[id].write(chunk);
    };
});

// When a 'metadata' event happens, usually a new song is starting.
icecastClient.on('metadata', function(title) {
    console.log(title);
    // TODO: use webSockets to notify the client
});


// Listen on a web port and respond with a chunked response header.
var options = {
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.crt')
};

var fileServer = new static.Server('.');
//var server = https.createServer(options, function(req, res) {
var server = http.createServer(function(req, res) {
    var query = url.parse(req.url, true);

    //console.log(util.inspect(req.headers));

    if(query.pathname == '/' || query.pathname == '/index.html') {
        req.addListener('end', function () {
            fileServer.serve(req, res, function (err, result) {
                //console.log(err, result);
            });
        });
        return;
    }

    res.writeHead(200, {
        'Content-Type': mime.lookup(query.pathname) || 'octet/stream'
        , 'Transfer-Encoding': 'chunked'
    });

    if(query.pathname.match(/^\/public/)) {
        console.log(req.url);
        req.addListener('end', function () {
            fileServer.stream(null, [ query.pathname ], res, res, function(err) {
                console.log(util.inspect(err));
            });
            /*fileServer.serve(req, res, function (err, result) {
                console.log(err, req.url);
            });*/
        });
        server.addListener('error', function (err) {
            sys.error('Error serving ' + req.url + '- ' + err.message);
            res.writeHead(err.status, err.headers);
            res.end();
        });

        return;
    }

    // Add the response to the clients hash to receive streaming
    clients[query.query.id] = res;
    console.log('Client '+ query.query.id +' connected', util.inspect(query));
});

server.listen('8000', '127.0.0.1', function() {
    console.log('Server running at https://127.0.0.1:8000'); 
});

