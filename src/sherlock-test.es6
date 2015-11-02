/**
 * Created by caasjj on 10/15/15.
 */
'use strict'

import Promise from 'bluebird'
import Sherlock from './sherlock'
import util from 'util'
import Redis from 'redis'
import Proxy from 'proxy'

function lockoutWarning(sherlock) {

	sherlock.loader.value().run( 'check-lock', sherlock.lockKey )
					.then( res => {
						console.log( 'Time is Running out: ', res )
					} )
					.then( () => sherlock.close() )
}

var sherlock = Sherlock( {

	port: 11231,
	host: `pub-redis-11231.us-east-1-4.6.ec2.redislabs.com`,
	redisOptions: {
		auth_pass: `foobared`
	},
	lockKey: `my-lock-key`,
	lockTimeoutWarning: 15,
	maxLockExpiration: 30,
	maxNumAttempts: 10,
	minRetryDelay: 250,
	lockExpiration: 40,
	numAttempts: 10,
	retryDelay: 250,
	retryRandomize: false,
	lockoutCallback: lockoutWarning
} )


// these will override the values given to Sherlock
//var lockExpiration = 10
//var numAttempts = 12
//var retryDelay = 2000

sherlock.checkLock()
				.then( res => console.log( res ) )
				//.then( res => sherlock.lock( lockExpiration, numAttempts, retryDelay ) )
				.then( res => sherlock.lock() )
				.then( res => console.log( res ) )
				.then( () => sherlock.checkLock() )
				.then( res => console.log( res ) )
				.then( () => sherlock.extendLock( 20 ) )
				.then( res => console.log( res ) )
				.error( err => {
					console.log( err );
					sherlock.close()
				} )
				.catch( err => console.log( 'DID NOT EXPECT THIS: ', err ) )


sherlock.on( 'LOCKOUT', (sherlock) => {

	sherlock.loader.value().run( 'check-lock', sherlock.lockKey )
					.then( res => {
						console.log( `Your lock running out in ${res[1]} seconds` )
					} )
					.then( () => sherlock.close() )

} )

