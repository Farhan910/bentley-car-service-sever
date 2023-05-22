const errorHandler = (err, req, res, next) => {
    console.log(err);
    res.status(500).send({ message: "Something went wrong" });
}

module.exports = errorHandler;