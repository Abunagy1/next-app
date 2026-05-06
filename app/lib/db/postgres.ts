// import postgres from 'postgres';
// const env = process.env.ENV || process.env.NODE_ENV || 'development';
// interface DbConfig {
//   url?: string;
//   host?: string;
//   port?: number;
//   database?: string;
//   username?: string;
//   password?: string;
//   ssl?: boolean | 'require' | object;
// }
// function getConfig(): DbConfig {
//   switch (env) {
//     case 'development':
//     case 'dev': {
//       const host = process.env.DEV_DB_HOST;
//       const port = process.env.DEV_DB_PORT;
//       const database = process.env.DEV_DB_NAME;
//       const username = process.env.DEV_DB_USER;
//       const password = process.env.DEV_DB_PASSWORD;
//       if (!host || !port || !database || !username || !password) {
//         throw new Error(
//           `Missing one or more DEV_* environment variables. Check your .env file.\n` +
//           `DEV_DB_HOST: ${host}\nDEV_DB_PORT: ${port}\nDEV_DB_NAME: ${database}\nDEV_DB_USER: ${username}\nDEV_DB_PASSWORD: ${password ? '***' : 'undefined'}`
//         );
//       }
//       return {
//         host,
//         port: parseInt(port, 10),
//         database,
//         username,
//         password,
//         ssl: false,
//       };
//     }
//     case 'test': {
//       const host = process.env.TEST_DB_HOST;
//       const port = process.env.TEST_DB_PORT;
//       const database = process.env.TEST_DB_NAME;
//       const username = process.env.TEST_DB_USER;
//       const password = process.env.TEST_DB_PASSWORD;
//       if (!host || !port || !database || !username || !password) {
//         throw new Error(
//           `Missing one or more TEST_* environment variables. Check your .env file.\n` +
//           `TEST_DB_HOST: ${host}\nTEST_DB_PORT: ${port}\nTEST_DB_NAME: ${database}\nTEST_DB_USER: ${username}\nTEST_DB_PASSWORD: ${password ? '***' : 'undefined'}`
//         );
//       }
//       return {
//         host,
//         port: parseInt(port, 10),
//         database,
//         username,
//         password,
//         ssl: false,
//       };
//     }
//     case 'production':
//     case 'prod': {
//       const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
//       if (!url) {
//         throw new Error('Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING for production');
//       }
//       return {
//         url,
//         ssl: 'require',
//       };
//     }
//     default:
//       throw new Error(`Unknown environment: ${env}`);
//   }
// }
// const config = getConfig();
// let connectionString: string;
// if (config.url) {
//   connectionString = config.url;
// } else {
//   connectionString = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
// }
// // Log safely (hide password in production)
// if (env !== 'production') {
//   console.log(`[db] Connecting to ${env} database at ${config.host || 'URL'}`);
// }
// const sql = postgres(connectionString, {
//   ssl: config.ssl,
// });
// export default sql;
import postgres from 'postgres';

const env = process.env.ENV || process.env.NODE_ENV || 'development';

interface DbConfig {
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean | 'require' | object;
}

function getConfig(): DbConfig {
  switch (env) {
    case 'development':
    case 'dev': {
      const host = process.env.DEV_DB_HOST;
      const port = process.env.DEV_DB_PORT;
      const database = process.env.DEV_DB_NAME;
      const username = process.env.DEV_DB_USER;
      const password = process.env.DEV_DB_PASSWORD;
      if (!host || !port || !database || !username || !password) {
        throw new Error(
          `Missing one or more DEV_* environment variables. Check your .env file.\n` +
          `DEV_DB_HOST: ${host}\nDEV_DB_PORT: ${port}\nDEV_DB_NAME: ${database}\nDEV_DB_USER: ${username}\nDEV_DB_PASSWORD: ${password ? '***' : 'undefined'}`
        );
      }
      return {
        host,
        port: parseInt(port, 10),
        database,
        username,
        password,
        ssl: false,
      };
    }
    case 'test': {
      const host = process.env.TEST_DB_HOST;
      const port = process.env.TEST_DB_PORT;
      const database = process.env.TEST_DB_NAME;
      const username = process.env.TEST_DB_USER;
      const password = process.env.TEST_DB_PASSWORD;
      if (!host || !port || !database || !username || !password) {
        throw new Error(
          `Missing one or more TEST_* environment variables. Check your .env file.\n` +
          `TEST_DB_HOST: ${host}\nTEST_DB_PORT: ${port}\nTEST_DB_NAME: ${database}\nTEST_DB_USER: ${username}\nTEST_DB_PASSWORD: ${password ? '***' : 'undefined'}`
        );
      }
      return {
        host,
        port: parseInt(port, 10),
        database,
        username,
        password,
        ssl: false,
      };
    }
    case 'production':
    case 'prod': {
      const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
      if (!url) {
        throw new Error('Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING for production');
      }
      return {
        url,
        ssl: 'require',
      };
    }
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

const config = getConfig();

let connectionString: string;
if (config.url) {
  connectionString = config.url;
} else {
  connectionString = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
}

/**
 * GLOBAL SINGLETON PATTERN
 * Next.js in development re-runs the code on every HMR (Hot Module Replacement) update.
 * To prevent exhausting database connections, we attach the client to the global object.
 */
const globalForPostgres = global as typeof globalThis & {
  _postgresSql?: postgres.Sql;
};

// Use the existing connection if it exists, otherwise create a new one
const sql = globalForPostgres._postgresSql || postgres(connectionString, {
  ssl: config.ssl,
  // Maintaining full feature set: you can add 'transform: postgres.camel' here 
  // if your merged project expects camelCase keys from Postgres.
});

// In development, save the connection to the global object
if (env !== 'production') {
  if (!globalForPostgres._postgresSql) {
    console.log(`[db] Connecting to ${env} database at ${config.host || 'URL'}`);
    globalForPostgres._postgresSql = sql;
  }
}

export default sql;