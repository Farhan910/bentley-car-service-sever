const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const productRoutes = require("./routes/v1/products.route");
const viewCount = require("./middleware/viewCount");
const { rateLimit } = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");
const { connectToServer } = require("./utils/dbConnect");

app.use(cors());
app.use(express.json());

app.set("view engine", "ejs");

// app.use(viewCount);
connectToServer((err) => {
  if (!err) {
    app.listen(port, () => {
      console.log(`Bentley app listening on port ${port}`);
    });
  } else {
    console.log(err);
  }
});

app.use("/api/v1/products", productRoutes);

app.get("/", (req, res) => {
  res.send("Hello From Bentley Car service");
  // res.render("home.ejs", {
  //   id: 2,
  //   user: {
  //     name: "Ahmed",
  //   },
  // });
});

app.all("*", (req, res) => {
  res.status(404).send({ message: "No Route Found" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Bentley app listening on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  app.close(() => {
    process.exit(1);
  });
});
