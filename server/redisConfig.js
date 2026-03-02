export function getRedisConnectionConfig() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    const parsed = new URL(redisUrl);
    const isTls = parsed.protocol === "rediss:";

    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: isTls ? {} : undefined,
    };
  }

  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;

  if (redisHost) {
    return {
      host: redisHost,
      port: Number(redisPort || 6379),
    };
  }

  return null;
}
