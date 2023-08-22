const express = require('express');
const connectToDatabase = require('../config/database'); // Update the path if needed

const app = express();

// Middleware for parsing JSON data
app.use(express.json());

// Use your routes here (example route)
const userRoutes = require('./routes/userRoutes'); // Update the path if needed
app.use('/users', userRoutes);

// Start the database connection and then start the server
 connectToDatabase()

  .then(() => {
    // Start the Express server
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(error => {
    console.error("Error connecting to the database:", error);
  });
