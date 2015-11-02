--[[

  Respond with a dummy message

]]--

local key            = KEYS[1]
local person         = ARGV[1]
redis.call('set', key, person)
return 'Hello ' .. person .. '!'
