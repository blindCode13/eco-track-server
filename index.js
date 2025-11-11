const express = require('express');
const cors = require('cors');
const app = express();
    require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// database client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kiq5mr9.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


app.get("/", (req, res) => {
    res.send("Server is running");
});

async function run() {
    try {
        await client.connect();

        const DB = client.db('EcoTrack');
        const challangesCollection = DB.collection('challanges');

        app.get("/challanges", async (req, res) => {
            const cursor = challangesCollection.find();
            const data = await cursor.toArray();
            res.send(data);
        });

    }
    finally { }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});