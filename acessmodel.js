const mongoose = require('mongoose');

// Define Schema for storing access token
const accessTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,  // Ensure that the token is always provided
  },
  createdAt: {
    type: Date,
    default: Date.now,  // Automatically set to the current date when the document is created
  },
  userId: {
    type: String,
  },
});

// Create and export the Model
const AccessToken = mongoose.model('AccessToken', accessTokenSchema);

module.exports = AccessToken;
