/**
 * Created by caasjj on 10/15/15.
 */
'use strict'
var net = require( 'net' )
var sockets = []
var EventEmitter = require('EventEmitter')

class Proxy extends EventEmitter {

	constructor(host = 'localhost', port = 6379, proxyPort = 6479) {
		super()
		this.host = host
		this.port = port
		this.proxyPort = proxyPort
		this.clients = {}
		this.idCount = 0
	}

	listen(host,port,proxyPort) {
		this.host = host || this.host
		this.port = port || this.port
		this.proxyPort  = this.proxyPort || this.proxyPort
		
		this.proxyServer = net.createServer( function(client ) {
			var proxy = net.createConnection( {
				host: options.host,
				port: options.port
			} ).listen(proxyPort)

			proxy.pipe( client )
			client.pipe( proxy )
			proxy.on( 'end', () => client.end() )
			client.on( 'end', () => proxy.end() )

			proxy.on( 'error', () => client.end() )
			client.on( 'error', () => proxy.end() )
			proxy.on( 'close', () => client.end() )
			client.on( 'close', () => proxy.end() )

			this.clients[ this.idCount ] = client
			client.id = this.idCount
			this.idCount += 1

		})

		this.proxyServer.on( 'connection', client => {
			this.emit('connection', client.id)
		} )

		this.proxyServer.on( 'error', err => {
			this.emit('error', err)
		})

		this.proxyServer.listen( this.proxyPort )

	}

	fail(id) {
		this.clients[id].end()
		delete this.clients[id]
	}
}

var proxy = new Proxy()

export { proxy as default }