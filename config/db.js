const mongoose = require('mongoose');

const connectDB = async () => {
  const URL = `mongodb+srv://savyasachibhat:9xEiiGD3ORe4D885@cluster0.86xg6.mongodb.net/savya`;

  try {
    // Wait for the connection to MongoDB
    await mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1); // Exit the process if connection fails
  }
};

module.exports = { connectDB };
