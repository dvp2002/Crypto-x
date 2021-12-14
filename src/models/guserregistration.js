const mongoose = require("mongoose");

//creating Schema to store entered information

const guserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    hashedpwd: {
        type: String,
        required: true
    },
})

const gRegister = new mongoose.model("gRegister", guserSchema);

module.exports = gRegister;