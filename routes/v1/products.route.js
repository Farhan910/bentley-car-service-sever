const express = require("express");
const productsControllers = require("../../controllers/products.controller");
const viewCount = require("../../middleware/viewCount");
// const limiter = require("../../middleware/limiter");

const router = express.Router();

router
  .route("/")
  .get(productsControllers.getAllProducts)
  .post(productsControllers.addProduct);

router
  .route("/:id")
  .get(productsControllers.getProductById);
module.exports = router;
