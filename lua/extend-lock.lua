--[[

  Try to extend expiration of lock, if owned by user and TTL is at least 1 sec, up to 30 seconds

  Function: extemd lock
  Keys    : KEYS[1] - name of lock (string)
  Args    : ARGV[1] - random uuid value to set lock to (string)
            ARGV[2] - updated lock expiration value

  return  :
   If value of lock matches ARGV[1], then set ARGV[2]  as new expiration.
   Else, if another use has lock, send 'ERR_LOCK_BUSY' error

]]--

local lockKey         = KEYS[1]
local lockValue       = ARGV[1]
local lockExpiration  = ARGV[2]

local readValue = redis.call('get', lockKey)

assert( readValue, 'ERR_NIL_LOCK')
assert( readValue == lockValue, 'ERR_LOCK_BUSY')

-- user owns lock

redis.call('expire', lockKey, lockExpiration)

-- return the new ttl
return redis.call('ttl', lockKey)
