import Redis from 'redis'

let redis = Redis.createClient(6479)

var timer

redis.on( 'error', err => console.log('error', err))

redis.on( 'reconnecting', res => console.log('reconnecting'))

redis.on( 'connect', () => {

	console.log('READY!')

	if (timer) clearInterval(timer)

	timer = setInterval( () => {

		console.log(`Ping...` )

		redis.ping( (err, pong) => {

			if (err) throw(err)

				console.log('Pong...', pong)

		})

	}, 500)

} )


