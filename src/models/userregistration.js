const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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


const Register = new mongoose.model("Register", userSchema);

module.exports = Register;
