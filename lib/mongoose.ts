import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// For hot reload in development
declare global {
  var mongooseCache: MongooseCache;
  // eslint-disable-next-line no-var, vars-on-top
}

const globalWithCache = global as typeof globalThis & {
  mongooseCache: MongooseCache;
};

let cached = globalWithCache.mongooseCache;

if (!cached) {
  cached = globalWithCache.mongooseCache = {
    conn: null,
    promise: null,
  };
}

const dbConnect = async (): Promise<Mongoose> => {
  if (cached.conn) {
    // Check if the connection is still open
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "worship-chords",
      })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        cached.promise = null; // Reset so next call can try again
        throw err; // Re-throw to prevent caching failed connection
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default dbConnect;
