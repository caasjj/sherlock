/**
 * Created by caasjj on 10/15/15.
 */
'use strict';
var net = require('net');
var sockets = [];

var proxyServer = net.createServer(function (client) {
	var proxied = net.createConnection({
		host: 'localhost',
		port: 6379
	});
	proxied.pipe(client);
	client.pipe(proxied);
	proxied.on('end', function () {
		return client.end();
	});
	client.on('end', function () {
		return proxied.end();
	});
	proxied.on('error', function () {
		return client.end();
	});
	client.on('error', function () {
		return proxied.end();
	});
	proxied.on('close', function () {
		return client.end();
	});
	client.on('close', function () {
		return proxied.end();
	});
});

proxyServer.on('connection', function (socket) {
	sockets.push(socket);
});

module.exports = {
	listen: proxyServer.listen.bind(proxyServer),
	fail: function fail() {
		sockets.forEach(function (socket) {
			socket.end();
		});
		proxyServer.close();
	}

};
//# sourceMappingURL=proxy.js.map