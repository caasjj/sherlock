/**
 * Created by caasjj on 10/15/15.
 */
'use strict'

'use strict';

var net = require('net');

var proxyPort = 6379;
var counter = 0;

function breaker(conn) {
	conn.end();
	conn.destroy();
}

var proxyServer = net.createServer(function(client) {
	counter++;
	var proxyConn = net.createConnection({
		port: proxyPort
	});
	client.pipe(proxyConn);
	proxyConn.pipe(client);
	proxyConn.on('end', function() {
		client.end();
	});
	client.on('end', function() {
		proxyConn.end();
	});
	client.on('close', function() {
		proxyConn.end();
	});
	proxyConn.on('close', function() {
		client.end();
	});
	proxyConn.on('error', function() {
		client.end();
	});
	client.on('error', function() {
		proxyConn.end();
	});

	// disconnect the client at random
	setTimeout(breaker.bind(null, client), 200 + Math.floor(Math.random() * 2000));

});

proxyServer.listen(6479);

var redis = require('redis');

var client = redis.createClient(6479, 'localhost');

function iter() {
	var k = "k" + Math.floor(Math.random() * 10);
	var coinflip = Math.random() > 0.5;
	if (coinflip) {
		client.set(k, k, function(err, resp) {
			if (!err && resp !== "OK") {
				console.log("Unexpected set response " + resp);
			}
		});
	} else {
		client.get(k, function(err, resp) {
			if (!err) {
				if (k !== resp) {
					console.log("Key response mismatch: " + k + " " + resp);
				}
			}
		});
	}
}

function iters() {
	for (var i = 0; i < 100; ++i) {
		iter();
	}
	setTimeout(iters, 10);
}

client.on("connect", function () {
	iters();
});

client.on("error", function (err) {
	console.log("Client error " + err);
});
