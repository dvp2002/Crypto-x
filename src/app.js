const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();

//middleware

const cookieParser = require("cookie-parser");
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(cookieParser());

//Stripe keys

const PUBLISHABLE_KEY = "pk_test_51JnI2dSD4liG97atq1QsvxJGCEtCXWme3H5eBCQV1D30Sl7e2R0Ojprdjbkg1ValIuIRf0NdwQ9v1fx4IrdxjK0B00VWHrIyRv"
const SECRET_KEY = "sk_test_51JnI2dSD4liG97atmLjEc3uiSywW8c4YMvx0gjfBi0a6ArlXmlVoZ9BgaMjDNmTb3W8PnzkTMGLnqErltXP3AY0O00yUkcxyPY"
const stripe = require("stripe")(SECRET_KEY);

//google keys

const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = '658161400052-6bmotko4se9kti3cco47kniufr5cv9kn.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

//databse generation

require("./db/conn");

const Register = require("./models/userregistration");
const gRegister = require("./models/guserregistration");
const fgRegister = require("./models/fguserregistration");

const Tatum = require("@tatumio/tatum");

const port = process.env.PORT || 8000;
app.set("view engine", "hbs");

//get and post methods for working on the app

app.get('/', async(req,res) => {
    res.render("index.hbs");
});

app.get('/register', (req,res) => {
    res.render("register.hbs");
});

app.post('/register', async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const email=req.body.email;
        const phno=req.body.mobile;
        if(email.includes("@gmail.com")==true)
        {
            const mob=phno.length;
            if(mob === 10)
            {
        const registerUser = new Register({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            hashedpwd: hashedPassword,
            address: req.body.address,
            mobile: req.body.mobile,
            age: req.body.age,
        })
        const registered = await registerUser.save();
        const {generateWallet, Currency} = Tatum;
        const btcWallet = await generateWallet(Currency.BTC, false);
        console.log(btcWallet);
        const {generateAddressFromXPub} = Tatum;
        const xpub='xpub6E6Hro3bzSnTc8KyhTJZWF44za9VDg3yBmhmtdy2NDJbyzHLWzrD5wEgenFYgPKeWKk9LMRp1r7E9uU9taGpL8zZ83rX7F5genPjKjuuryz'
        const btcAddress = await generateAddressFromXPub(Currency.BTC, false, xpub, 1);
        console.log(btcAddress);
        const {generatePrivateKeyFromMnemonic} = Tatum;
        const btcPrivateKey = await generatePrivateKeyFromMnemonic(Currency.BTC, false, "<<mnemonic>>", 1);
        console.log({key: btcPrivateKey});
        res.redirect("/login");
        }
        else
        {
            res.render("registeragain.hbs",{ danger: 'Invalid Phone number' });
        }
        }
        else
        {
            res.render("registeragain.hbs",{ danger: 'Invalid Email, Please enter a valid email address' });
        }
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
            res.render("loginagain.hbs",{ danger: 'Invalid Password' });
        } 

    } catch(e){
        res.render("loginagain.hbs",{ danger: 'Invalid Email, please try again' });
    }
});

app.get('/google', (req,res) => {
    console.log("google connected");
})

app.post('/google', (req,res) => {
    let token = req.body.token;

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        });
        const payload = ticket.getPayload();
        try{
            const em=payload['email'];
            const userem = await gRegister.findOne({email:em});
            if(userem !== em)
            {
            const registerUser = new gRegister({
                name: payload['name'],
                email: payload['email'],
                hashedpwd: payload['at_hash'],
            });
            const registered = await registerUser.save(); 
            }
        }
        catch(e)
        {
            console.log(e);
        }
      }
      verify().then(() => {
          res.cookie('session-token', token);
          res.send('success');
      }).
      catch(console.error);
});

app.get('/logout', (req,res) => {
    res.clearCookie('session-token');
    res.redirect('/login');
})

app.get('/payment', (req,res) => {
    res.render("payment", { key: PUBLISHABLE_KEY });
})

app.post('/payment', (req,res) => {
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: 'Web App',
        address:{
            line1: 'Munich,Germany',
            postal_code: '69420',
            city: 'Munich',
            state: 'Whatever',
            country: 'Germany'
        }
    })
    .then((customer) => {
        stripe.charges.create({
            amount: 7000,
            description: 'Web dev app',
            currency: 'USD',
            customer: customer.id

        })
    })
    .then((charge) => {
        res.render("redirect",{ success: "The Payment was Successful!" });
    })
    .catch((e) => {
        console.log(e);
    })
})

app.listen(port,() => {
    console.log(`listening on port ${port}`);
});

