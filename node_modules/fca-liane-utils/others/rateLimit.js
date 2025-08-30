const globalRateLimits = {};

function createGoatRateLimit(commandModule, rateLimitConfig) {
  const { maxRequests, interval } = rateLimitConfig;
  if (typeof maxRequests !== "number" || maxRequests <= 0) {
    throw new Error("Invalid maxRequests: must be a positive number");
  }
  if (typeof interval !== "number" || interval <= 0) {
    throw new Error("Invalid interval: must be a positive number");
  }

  const lastExecutionTimes = {};

  async function executeCommandWithRateLimit(context) {
    const { event } = context;
    const userId = event.senderID;
    const commandName = commandModule.config.name;

    if (!lastExecutionTimes[userId]) {
      lastExecutionTimes[userId] = {};
    }
    if (!lastExecutionTimes[userId][commandName]) {
      lastExecutionTimes[userId][commandName] = 0;
    }

    const currentTime = Date.now();
    const elapsedTime = currentTime - lastExecutionTimes[userId][commandName];

    if (elapsedTime < interval) {
      if (lastExecutionTimes[userId][commandName] === maxRequests) {
        return `❌ | Rate limit exceeded for command "${commandName}", please come back after ${interval / 1000} seconds.`;
      }
    }

    lastExecutionTimes[userId][commandName] = currentTime;
    context.rateLimit = {
      maxRequests,
      interval,
      elapsedTime,
      lastExecutionTimes,
      currentTime,
      timesExecuted: lastExecutionTimes[userId][commandName],
    };

    return await commandModule.onStart(context);
  }
  return (i) => executeCommandWithRateLimit(i);
}

module.exports = {
  globalRateLimits,
  createGoatRateLimit,
};
