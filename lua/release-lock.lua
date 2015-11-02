--[[

  Release lock, if owned by user

  Function: release lock
  Keys    : KEYS[1] - name of lock (string)
  Args    : ARGV[1] - random uuid value to set lock to (string)

   If value of lock matches ARGV[1], then delete the lock. Otherwise,
   send back 'ERR_LOCK_BUSY' error 

]]--

local lockKey   = KEYS[1]
local lockValue = ARGV[1]

local readValue = redis.call('get', lockKey)

assert(readValue, 'ERR_NIL_LOCK')
assert(readValue == lockValue, 'ERR_LOCK_BUSY')

-- delete the key to release the lock
return redis.call('del', lockKey)

    