// Import mongoose
const mongoose = require('mongoose');
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const AccessToken = require('./acessmodel'); // Ensure this is the correct model path

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// MongoDB URI (Replace with your MongoDB URI)
const mongoURI = 'mongodb://localhost:27017/xxxxDBfrr';

// Connect to MongoDB using Mongoose
const connectDB = async () => {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => {
            console.error('Error connecting to MongoDB:', err);
        });
}
connectDB();

// Auth route to redirect to Shopify OAuth
app.get("/auth", (req, res) => {
    const { shop } = req.query;
    const redirectUri = `http://localhost:3001/callback`;
    const scopes = "read_products";

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}`;

    res.redirect(authUrl);
});

// Callback route to exchange code for an access token
app.get("/callback", async (req, res) => {
    const { shop, code } = req.query;

    try {
        const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            code,
        });

        const accessToken = tokenRes.data.access_token;

        // Store the access token in the database
        await AccessToken.create({
            token: accessToken,
            userId: '11111' // You can replace with an actual user ID if needed
        });

        res.send("✅ App Installed. You can now fetch products from frontend.");
    } catch (error) {
        console.error('Error during OAuth callback:', error);
        res.status(500).send("Error during authentication.");
    }
});

// Products route to fetch products using the access token
app.get("/products", async (req, res) => {
    const { shop } = req.query;
    // Check if shop is provided in the query string
    if (!shop) {
        return res.status(400).send("Missing 'shop' parameter");
    }

    try {
        // Retrieve the access token from the database
        const accessTokenDoc = await AccessToken.findOne({ userId: '11111' });

        if (!accessTokenDoc) return res.status(403).send("Unauthorized");
        const accessToken = accessTokenDoc.token;
        console.log(accessToken)

        // Fetch products from Shopify
        const response = await axios.get(`https://${shop}/admin/api/2023-07/products.json`, {
            headers: {
                "X-Shopify-Access-Token": accessToken,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Error fetching products.");
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
