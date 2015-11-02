/**
 * Created by caasjj on 10/14/15.
 */
'use strict'

var util = require( `util` )
var path = require( 'path' )
var EventEmitter = require( 'events' )
var Promise = require( 'bluebird' )
var uuid = require( 'node-uuid' )
var Lewis = require( 'lewis' )
var Redis = require( 'redis' )


function Sherlock(options = {
	host: 'localhost',
	port: 6379,
	redisOptions: {
		parser: 'hiredis',
		retry_max_delay: 2
	}
}) {

	options = options || {}

	//if (options.port) options.host = options.host + ':' + port

	var redis = options.redis || Redis.createClient( options.port, options.host, options.redisOptions )

	if (typeof redis.scriptAsync !== 'function') {
		Promise.promisifyAll( Redis.RedisClient.prototype )
		Promise.promisifyAll( Redis.Multi.prototype )
	}

	var obj = Object.create( EventEmitter.prototype, {
		redis: {
			value: redis
		},
		lockValue: {
			value: options.lockValue || uuid.v1()
		},
		lockKey: {
			value: options.lockKey || `lock-key`
		},
		lockTimeoutWarning: {
			value: +options.lockTimeoutWarning || 5
		},
		maxLockExpiration: {
			value: +options.maxLockExpiration || 30
		},
		maxNumAttempts: {
			value: +options.maxNumAttempts || 10
		},
		minRetryDelay: {
			value: +options.minRetryDelay || 250
		},
		lockExpiration: {
			value: +options.lockExpiration || 15
		},
		numAttempts: {
			value: +options.numAttempts || 10
		},
		retryDelay: {
			value: +options.retryDelay || 250
		},
		retryRandomize: {
			value: false
		},
		lockoutCallback: {
			value: options.lockoutCallback || function (sherlock) {
				sherlock.emit( 'LOCKOUT', sherlock )
			}
		},
		lockoutTimerHandle: {
			value: null,
			writable: true
		},
		startLockoutTimer: {
			value: _startLockoutTimer
		},
		loader: {
			value: _loadScripts( redis )
		},
		lock: {
			value: _lock
		},
		checkLock: {
			value: _checkLock
		},
		releaseLock: {
			value: _releaseLock
		},
		extendLock: {
			value: _extendLock
		},
		close: {
			value: _close
		}
	} )

	EventEmitter.call(obj);
	return obj
}

function To_ms(t) {
	return t * 1000
}

function _close() {
	this.redis.end()
}

function _loadScripts(redis) {

	var lewis = new Lewis( redis )

	var scriptPath = path.resolve( __dirname, `../lua` )

	var scripts = [`set-lock.lua`, `check-lock.lua`, `release-lock.lua`, `extend-lock.lua`]
	return lewis.load( scriptPath, scripts )
							.then( () => lewis )
	return lewis
}

function _releaseLock() {
	return this.loader.then( scriptLoader => {
		return scriptLoader.run( `release-lock`, this.lockKey, this.lockValue )
											 .bind( this )
											 .then( () => clearTimeout( this.lockoutTimerHandle ) )
	} )
}

function _extendLock(lockExtension) {
	return this.loader.then( scriptLoader => {
		return scriptLoader.run( `extend-lock`, this.lockKey, this.lockValue, lockExtension )
											 .bind( this )
											 .then( readTtl => this.startLockoutTimer( To_ms( readTtl - this.lockTimeoutWarning ) ) )
	} )
}

function _startLockoutTimer(ttl) {
	// Todo: this if should never pass, but we put it here as a precaution
	if (this.lockoutTimerHandle) clearTimeout( this.lockoutTimerHandle )
	this.lockoutTimerHandle = setTimeout( this.lockoutCallback.bind( null, this ), ttl )
	return ttl
}

function _checkLock() {
	return this.loader.then( scriptLoader => {
		return scriptLoader.run( `check-lock`, this.lockKey, this.lockValue )
											 .bind( this )
	} )
}

function _lock(lockExpiration, numAttempts, retryDelay) {

	var count = 0
	var start = Date.now()

	lockExpiration = Math.min( this.maxLockExpiration, lockExpiration || this.lockExpiration )

	numAttempts = Math.min( this.maxNumAttempts, numAttempts || this.numAttempts )

	retryDelay = Math.max( this.minRetryDelay, retryDelay || this.retryDelay )

	var attemptLock = () => {

		if (count === numAttempts) {
			return new Promise.reject( {
				attemptTime: Date.now() - start + 'ms',
				attemptCount: count,
				status: 'Fail'

			} )
		}

		count += 1

		return this.loader.then( scriptLoader => {
			return scriptLoader.run( `set-lock`, this.lockKey, this.lockValue, lockExpiration )
												 .bind( this )
												 .then( readTtl => {
													 this.startLockoutTimer( To_ms( readTtl - this.lockTimeoutWarning ) )

													 return {count: count, acquisitionTime: Date.now() - start}
												 } )
												 .error( err => {
													 if (err.message === 'ERR_LOCK_BUSY') {
														 console.log( `Lock busy ... try again: ${count}` )
														 return Promise.delay( retryDelay + this.retryRandomize ? Math.floor( Math.random() * retryDelay ) : 0 )
																					 .then( attemptLock )
													 } else {
														 return Promise.reject( err )
													 }
												 } )
		} )
	}


	return attemptLock()

}

module.exports = Sherlock