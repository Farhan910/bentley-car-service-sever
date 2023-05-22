const { getDb } = require("../utils/dbConnect");


module.exports.getAllProducts = (req, res, next) => {
  const db = getDb();
  db.collection("users")
    .find()
    .toArray()
    .then((result) => {
      res.send(result);
    })
    .catch((err) => next(err));
  
};

module.exports.addProduct = async (req, res, next) => {

  try {
    const db = getDb();

    const result = await db.collection("products").insertOne(req.body);
    console.log(result);
    res.send("Product Added");
  } catch (error) {
    next(error);
  }
};

module.exports.getProductById = (req, res) => {
  const { id } = req.params;
  const foundProduct = products.find((product) => product.id == Number(id));
  res.send(foundProduct);
};
