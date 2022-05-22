const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
ObjectId = require("mongodb").ObjectID;
const { MongoClient, ServerApiVersion,ObjectID } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ngamj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollection = client
      .db("bentley-car-service")
      .collection("products");

    await client.connect();
    const reviewCollection = client
      .db("bentley-car-service")
      .collection("reviews");

      app.get('/product' , async (req, res) => {
        const query = {};
        const cursor = productCollection.find(query);
        const products= await cursor.toArray();
        res.send(products);
      })

      app.get('/review' , async (req, res) => {
        const query = {};
        const cursor = reviewCollection.find(query);
        const reviews= await cursor.toArray();
        res.send(reviews);
      })


      app.get("/product/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectID(id) };
        const products = await productCollection.findOne(query);
        res.send(products);
      });
  } finally {

  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From Bentley Car service");
});

app.listen(port, () => {
  console.log(`Bentley app listening on port ${port}`);
});
