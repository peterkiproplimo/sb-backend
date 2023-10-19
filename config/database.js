const mongoose = require("mongoose");
const MONGO_URI =
  "mongodb+srv://Safaribust:ffFnYOKKFVSEWis6@cluster0.yuiecha.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

async function connectToDatabase() {
  try {
    // Connect to MongoDB using Mongoose
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000, // Timeout for server selection
    });

    console.log("Connected to MongoDB");

    // Return the Mongoose connection
    return mongoose.connection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
}

module.exports = connectToDatabase;
