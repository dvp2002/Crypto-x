const mongoose = require("mongoose");

const fguserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    hashedpwd: {
        type: String,
        required: true
    },
    address: {
        type: String,
    },
    mobile: {
        type: String,
    },
    age: {
        type: Number,
    }
});


const fgRegister = new mongoose.model("fgRegister", fguserSchema);

module.exports = fgRegister;