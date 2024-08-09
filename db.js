const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://EstivenPosada:SharpodsDataBase123.@cluster0.6ys5t.mongodb.net/");
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Error connecting to MongoDB', err);
    process.exit(1); 
  }
};

module.exports = connectDB;
