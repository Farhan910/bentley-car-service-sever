const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ngamj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    console.log('db connected');
    const productCollection = client
      .db("bentley-car-service")
      .collection("products");

      
    
    const reviewCollection = client
      .db("bentley-car-service")
      .collection("reviews");

    const userCollection = client.db("bentley-car-service").collection("users");
    const profileCollection = client
      .db("bentley-car-service")
      .collection("profile");
    const purchaseCollection = client
      .db("bentley-car-service")
      .collection("purchases");
      const paymentCollection = client
      .db("bentley-car-service")
      .collection("payments");

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    app.post("/create-payment-intent", verifyJWT,async (req, res) => {
      const service = req.body;
      const price = service.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get("/review", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews.reverse());
    });

    app.post("/review", async (req, res) => {
      const review = req.body;

      const result = await reviewCollection.insertOne(review);
      res.send(result);
      
    });

    app.get("/product/:id",verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const products = await productCollection.findOne(query);
      res.send(products);
    });

    app.post("/product", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    app.delete('/product/:id',async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    })

    app.get("/user",verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    app.put("/profile/:email", verifyJWT,async (req, res) => {
      const email = req.params.id;
      const users = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: users.name,
          education: users.education,
          job: users.job,
          phone: users.phone,
          city: users.city,
        },
      };
      const result = profileCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/profile/:email", async (req, res) => {
      const email = req.params.id;
      const profile = req.body;
      const filter = { email: email};
      const result = await profileCollection.findOne(filter);
      res.send(result);
    });

    app.get("/profile/:user.email",verifyJWT, async (req, res) => {
      const user = req.params.user;
      const query = { email: user };
      const profile = await profileCollection.findOne(query);
      res.send(profile);
    });

    app.get("/admin/:email", verifyJWT,async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.delete('/user/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role === "admin";
      if (isAdmin) {
        const result = await userCollection.deleteOne({ email: email });
        res.send(result);
      } else {
        res.send({ message: "Forbidden" });
      }
    })

    app.put("/user/admin/:email",  async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };

      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });

    app.put("/purchase/:id",verifyJWT,(req, res) => {
      const id = req.params.id;
      const total = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: total.name,
          productName: total.productName,
          phone: total.phone,
          quantity: total.quantity,
          price: total.price,
          email: total.email
        },
      };
      
      
      const result = purchaseCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.patch("/purchase/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await paymentCollection.insertOne(payment);
      const updatedPurchase = await purchaseCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedPurchase);
    });
    app.get("/purchase/:id",verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const products = await purchaseCollection.findOne(query);
      res.send(products);
      
    })
    app.get("/purchase",verifyJWT, async (req, res) => {
      const query = {};
      const cursor = purchaseCollection.find(query);
      const purchases = await cursor.toArray();
      res.send(purchases);
    })

    app.get("/purchase/email",verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email};
      const cursor = purchaseCollection.findOne(query);
      const purchases = await cursor.toArray();
      res.send(purchases);
      console.log(email);
    })
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
