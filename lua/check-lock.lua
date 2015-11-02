--[[

  Return TTL of lock, if owned by given user or generate an error

  Function: check lock
  Keys    : KEYS[1] - name of lock (string)
  Args    : ARGV[1] - random uuid value to set lock to (string)

  return : [-1, 0  ] if lock is not set
           [ 1, ttl] if user has lock (ttl is TTL of lock)
           [ 0, ttl] if lock is owned by a different user

   1. Read value and TTL of lock
   2. If lock value matches ARGV[1], then send back TTL
   3. else, send back ERR_LOCK_BUSY error (some else has lock)
]]--

local lockKey         = KEYS[1]
local lockValue       = ARGV[1]

local readValue = redis.call('get', lockKey)

--  return immediately if lock is not set
if (readValue==false) then

   return { -1, 0 }

else

-- read TTL of lock
    local ttl = redis.call('ttl', lockKey)
    return { readValue==lockValue, ttl  }

end
