
const mongoose = require("mongoose");

const mongo_uri = process.env.MONGO_URI

mongoose.connect(mongo_uri).then(() => {
    console.log('connected to db!');
}).catch(err => console.log(err));

module.exports = mongoose