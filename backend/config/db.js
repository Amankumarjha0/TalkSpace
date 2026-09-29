import mongoose from "mongoose";

const connectDB = async (MONGO_URI) => {
  try {
    const connection = await mongoose.connect(MONGO_URI);
    console.log(`Successfully connected to mongoDB`);

    try {
      const indexes = await connection.connection.db
        .collection("users")
        .indexInformation();

      if (indexes.email_1) {
        await connection.connection.db.collection("users").dropIndex("email_1");
        console.log("Dropped legacy email unique index from users collection");
      }
    } catch (indexError) {
      console.log("Legacy email index cleanup skipped:", indexError.message);
    }
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
