import * as redis from "redis";

var redisServer = null

async function startRedis() {
  try {
    redisServer = redis.createClient({
        url: "rediss://default:gQAAAAAAAYHAAAIncDI0YTk0MzhjNzhmNWU0MTFjYTM2MDIxZjdmNGVlNWZkMXAyOTg3NTI@known-trout-98752.upstash.io:6379"
    });
    redisServer.on('error', err => console.log('Redis Client Error', err));
    await redisServer.connect();
  } catch (error) {
    console.error("Error al iniciar Redis", error);
  }
}

function returnRedisClient(){
    if (!redisServer) {
        throw new Error("Redis no ha sido inicializado");
    }
    return redisServer
}


export default {
    startRedis,
    returnRedisClient
};
