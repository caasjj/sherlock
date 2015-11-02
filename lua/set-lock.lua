--[[

  Try to acquire a lock, or generte an error

  Function: set lock
  Keys    : KEYS[1] - name of lock (string)
  Args    : ARGV[1] - random uuid value to set lock to (string)
            ARGV[2] - expiration time of lock in seconds (number)

  return  : ttl of lock if successful
            throw ERR_LOCK_SET if user already has the lock
            throw ERR_LOCK_BUSY if another user has lock

   1. Try to set the lock to the indicated value, with given expiration, if it does not exist
   2. If successful, read and report the lock's TTL
   3. If failed, read back value stored in lock
          a. if lock value is same as ARGV[1], send 'ERR_LOCK_SET' error (user already has lock)
          b. if lock value is different, send 'ERR_LOCK_BUSY' error (someone else has lock)
]]--

local lockKey         = KEYS[1]
local lockValue       = ARGV[1]
local lockExpiration  = ARGV[2]

-- Max ttl is 90 seconds
local ttl = math.min(90, lockExpiration)

local lock = redis.call('set', lockKey, lockValue, 'ex', ttl, 'nx')

if (lock) then

-- lock set, return ttl
   return ttl

else

-- lock did not get set
   local value = redis.call('get', lockKey)
   assert( value == lockValue, 'ERR_LOCK_BUSY')
   assert( false, 'ERR_LOCK_SET')

end