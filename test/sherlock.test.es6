"use strict";
import Chai from 'chai'
import ChaiAsPromised from 'chai-as-promised'
import Redis from 'redis'
import path from 'path'
import Promise from 'bluebird'
import Sherlock from '../../lib/sherlock'

function rel(p) {
	return path.resolve( __dirname, '' + p )
}

Chai.use( ChaiAsPromised )
var expect = Chai.expect
var should = Chai.should()


describe( `Lewis`, () => {

	var sherlock

	before( done => {

		sherlock = Sherlock( {
			lockKey: `my-lock-key`,
			lockTimeoutWarning: 15,
			maxLockExpiration: 30,
			maxNumAttempts: 10,
			minRetryDelay: 250,
			lockExpiration: 40,
			numAttempts: 10,
			retryDelay: 250,
			retryRandomize: false
		} )

		sherlock.loader.then( () => done()
		)

	} )

	after( done => {
		sherlock.close()
		done()
	} )

	it( `should be alive`, () => {

		expect( sherlock.checkLock() ).to.eventually.be.instanceof(Array)
	} )

} )