const express = require('express');
const cors = require('cors');
const app = express();
    require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const challengesCollection = DB.collection('challenges');
        const tipsCollection = DB.collection('tips');
        const eventsCollection = DB.collection('events');
        const userChallenges = DB.collection('userChallenges');

        app.get("/challenges", async (req, res) => {
            const emailQuery = req.query.email;
            const filterQuery = req.query.filters;
            if (emailQuery) {
                const cursor = challengesCollection.find({createdBy: emailQuery});
                const data = await cursor.toArray();
                res.send(data);
            }
            else if (filterQuery) {
                const {category, startDate, endDate, minParticipant, maxParticipant} = JSON.parse(filterQuery);
                let filter = {}
                if (category) {
                    filter.category = {$in: [category]}
                }

                if (startDate) {
                    filter.startDate =  {$gte: startDate}
                }
                if (endDate) {
                    filter.endDate =  {$lte: endDate}
                }
                if (startDate && endDate) {
                    filter.startDate = {$gte: startDate, $lte: endDate}
                }

                if (minParticipant) {
                    filter.participants = {$gte: parseInt(minParticipant)}
                }
                if (maxParticipant) {
                    filter.participants = {$lte: parseInt(maxParticipant)}
                }
                if (minParticipant && maxParticipant) {
                    filter.participants = {$gte: parseInt(minParticipant), $lte: parseInt(maxParticipant)}
                }

                const cursor = challengesCollection.find(filter);
                const data = await cursor.toArray();
                res.send(data)
            }
            else {
                const cursor = challengesCollection.find().limit(parseInt(req.query.dataLimit));
                const data = await cursor.toArray();
                res.send(data);
            }
        });

        app.post("/challenges", async (req, res) => {
            const dataToPost = req.body;
            const result = challengesCollection.insertOne(dataToPost);
            res.send(result);
        });

        app.get("/challenges/:id", async (req, res) => {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(404).json({ message: "Not Found" });
            }
            const query = { _id: new ObjectId(req.params.id) }
            const data = await challengesCollection.findOne(query);
            res.send(data);
        });

        app.delete("/challenges/:id", async (req, res) => {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(404).json({ message: "Not Found" });
            }
            const query = { _id: new ObjectId(req.params.id) }
            const data = await challengesCollection.deleteOne(query);
            res.send(data);
        });

        app.patch("/challenges/:id", async (req, res) => {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(404).json({ message: "Not Found" });
            }
            const query = { _id: new ObjectId(req.params.id) }
            const patchReq = req.body;
            if (patchReq.increment) {
                const result = await challengesCollection.updateOne(query, { $inc: {participants: 1} });
                res.send(result);
            }
            else {
                const result = await challengesCollection.updateOne(query, { $set: {impactMetric: patchReq.dataForPatch} });
                res.send(result);
            }
        });

        app.post("/userChallenges", async (req, res) => {
            const postData = req.body;
            const result = await userChallenges.insertOne(postData);
            res.send(result);
        });

        app.get("/userChallenges", async (req, res) => {
            const {challengeId, userId} = req.query;
            if (!challengeId) {
                const cursor = userChallenges.find({userId});
                const data = await cursor.toArray();
                res.send(data);
            }
            else {
                const data = await userChallenges.findOne({challengeId, userId});
                res.send(data);
            }
        });

        app.patch("/userChallenges", async (req, res) => {
            const {challengeId, userId} = req.query;
            const patchReq = req.body;
            if (patchReq.increment) {
                const result = await userChallenges.updateOne({challengeId, userId}, { $inc: {progress: 1} });
                res.send(result);
            }
        });

        app.get("/tips", async (req, res) => {
            const cursor = tipsCollection.find().limit(parseInt(req.query.dataLimit));
            const data = await cursor.toArray();
            res.send(data);
        });

        app.get("/tips/:id", async (req, res) => {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(404).json({ message: "Not Found" });
            }
            const query = { _id: new ObjectId(req.params.id) }
            const data = await tipsCollection.findOne(query);
            res.send(data);
        });

        app.get("/events", async (req, res) => {
            const cursor = eventsCollection.find().limit(parseInt(req.query.dataLimit));
            const data = await cursor.toArray();
            res.send(data);
        });

        app.get("/events/:id", async (req, res) => {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(404).json({ message: "Not Found" });
            }
            const query = { _id: new ObjectId(req.params.id) }
            const data = await eventsCollection.findOne(query);
            res.send(data);
        });

    }
    finally { }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});