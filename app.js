var icecast = require('icecast-stack');
var https = require('https');
var fs = require('fs');
var util = require('util');
var url = 'http://67.205.85.183:7714';
var client = require('icecast-stack/client').createClient(url);

var clients = [];

client.on('connect', function() {
  console.log('Icecast Stream connected!');
});


// When a chunk of data is received on the client, push it to all connected clients
client.on('data', function (chunk) {
    for (client in clients){
        clients[client].write(chunk);
    };
});

// When a 'metadata' event happens, usually a new song is starting.
client.on('metadata', function(title) {
  console.log(title);
});


// Listen on a web port and respond with a chunked response header.
var options = {
  key: fs.readFileSync('ssl/server.key'),
  cert: fs.readFileSync('ssl/server.crt')
};

var server = https.createServer(options, function(req, res){
    res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked'
    });
    // Add the response to the clients array to receive clienting
    clients.push(res);
    console.log('Client connected; streaming');
    console.log(util.inspect(req.headers));
});
server.listen('8000', '127.0.0.1', function() {
    console.log('Server running at http://127.0.0.1:8000'); 
});

