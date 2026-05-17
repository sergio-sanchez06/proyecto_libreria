import * as redis from "redis";

let redisServer = null;

async function startRedis() {
  if (!redisServer) {
    // 1. Creamos la instancia
    // redisServer = redis.createClient({
    //   url: "redis://localhost:6379",
    // });
    redisServer = redis.createClient({
      url: process.env.REDIS_URL ||
        "rediss://default:gQAAAAAAAYHAAAIncDI0YTk0MzhjNzhmNWU0MTFjYTM2MDIxZjdmNGVlNWZkMXAyOTg3NTI@known-trout-98752.upstash.io:6379",
      socket: {
        tls: true,
        rejectUnauthorized: false,
      },
    });

    // 2. REGISTRAMOS EL LISTENER PRIMERO (Punto 2 de Claude)
    // Esto captura errores durante el connect() y errores posteriores
    redisServer.on("error", (err) => {
      console.error("❌ Redis Client Error:", err);
      // Opcional: Si el error es crítico, podemos resetear el cliente
      // redisServer = null;
    });

    redisServer.on("connect", () => {
      console.log("✅ Conectando a Redis...");
    });

    redisServer.on("ready", () => {
      console.log("🚀 Redis está listo para operar");
    });

    try {
      // 3. AHORA SÍ, CONECTAMOS
      await redisServer.connect();
    } catch (error) {
      console.error("🔥 Error inicial al conectar Redis:", error);
      // Si falla el arranque, ponemos a null para que el próximo
      // intento de la aplicación vuelva a ejecutar este bloque.
      redisServer = null;
      throw error;
    }
  }
}

async function returnRedisClient() {
  if (!redisServer) {
    try {
      await startRedis();
    } catch (error) {
      console.error("Error al obtener el cliente Redis:", error);
      throw new Error("Redis no ha sido inicializado");
    }
  }

  return redisServer;
}

async function stopRedis() {
  if (redisServer) {
    try {
      await redisServer.quit();
      redisServer = null;
    } catch (error) {
      console.error("Error al detener el cliente Redis:", error);
    }
  }
}

export default { startRedis, returnRedisClient, stopRedis };
