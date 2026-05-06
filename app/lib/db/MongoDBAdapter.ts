//import { MongoDBAdapter } from "@auth/mongodb-adapter";
/*
Note: This file requires @auth/mongodb-adapter to be installed.
If you are not using NextAuth.js with MongoDB, you can safely remove this file or keep it as is.
The MongoDBAdapter is designed to work with NextAuth.js to provide a seamless integration with MongoDB for authentication purposes.
It handles the connection to the database and provides methods for managing user sessions, accounts, and other authentication-related data.
*/
import clientPromise from "./MongoDBClient";
export default clientPromise;
// export default MongoDBAdapter(clientPromise);