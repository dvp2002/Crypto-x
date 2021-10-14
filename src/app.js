const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.urlencoded({ extended: false }))
require("./db/conn");

const Register = require("./models/userregistration");

const port = process.env.PORT || 8000;

app.set("view engine", "hbs");

app.get('/', (req,res) => {
    res.render("index.hbs");
});

app.get('/register', (req,res) => {
    res.render("register.hbs");
});

app.post('/register', async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const registerUser = new Register({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            hashedpwd: hashedPassword
        })
        const registered = await registerUser.save();
        res.redirect("/login");
    } catch(e) {
        res.status(404).send(e);
    }
});

app.get('/login', (req,res) => {
    res.render("login.hbs");
});

app.post('/login', async (req,res) => {
    try{
        const password = req.body.password;
        const email = req.body.email;
        const useremail = await Register.findOne({email:email});

        if(useremail.password === password)
        {
            res.redirect("/");
        }
        else{
            res.send("Invalid Password");
        }

    } catch(e){
        res.status(400).send("Invalid Email,please try again");
    }
});

app.listen(port,() => {
    console.log(`listening on port ${port}`);
});

