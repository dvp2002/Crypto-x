const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
const Cookies = require("js-cookie");

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
        const password = req.body.password;
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const email = req.body.email;
        const phno = req.body.mobile;
        const user = req.body.name;
        const address = req.body.address;
        const useremail = await Register.findOne({email:email});
        if(useremail)
        {
            res.render("loginagain.hbs",{ danger: 'The User is already Registered, Please login now' });
        }
        else
        {
        if((user.length >= 5) && (/[a-zA-Z]/i.test(user)))
        {
            if(email.includes("@gmail.com")==true)
            {
                if((password.length >= 8) && (password.includes("@")||password.includes("!")||password.includes("~")) && (/[a-zA-Z]/i.test(password)))
                {
                        const mob = phno.length;
                        const addlen = address.length;
                        var bal = 0;
                        if(addlen >= 5)
                        {
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
                        balance: "0"
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
                    res.render("registeragain.hbs",{ danger: 'Invalid Address' });
                    }
                }
                else
                {
                res.render("registeragain.hbs",{ danger: 'Invalid Password, Please enter a valid password' });
                }
            }
        else
        {
        res.render("registeragain.hbs",{ danger: 'Invalid Email, Please enter a valid email address' });
        }
        }
        else
        {
            res.render("registeragain.hbs",{ danger: 'Please enter a valid Username' });
        }
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
            res.clearCookie('session-token');
            res.cookie("login-token",useremail._id);
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
            if(userem)
            {
                res.cookie('verify-token',userem.hashedpwd);
                res.clearCookie('login-token');
                console.log('user is already registered through google');
            }
            else
            {
                var ObjectId = require('mongodb').ObjectId;
                const registerUser = new gRegister({
                    name: payload['name'],
                    email: em,
                    hashedpwd: payload['at_hash'],
                    balance :0
                });
                res.clearCookie('login-token');
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
    res.clearCookie('login-token');
    res.redirect('/login');
})

app.get('/cashwallet', async(req,res) => {
    const lt = req.cookies['login-token'];
    const gt = req.cookies['session-token'];
    if(!lt)
    {
        if(!gt)
        res.render("loginagain.hbs",{ danger: 'Please Login First' });
        else
        res.render("payment", { key: PUBLISHABLE_KEY });
    }
    else
    {
        res.render("payment" , { key: PUBLISHABLE_KEY }, );
    }
})

app.post('/cashwallet', async(req,res) => {
    const lt = req.cookies['login-token'];
    const gt = req.cookies['session-token'];
    const vt = req.cookies['verify-token'];
    var ObjectId = require('mongodb').ObjectId;
    var bal;
    if(!lt)
    {
        if(!gt)
        {

        }
        else
        {
            const userpass = await gRegister.findOne({hashedpwd:vt});
            bal=userpass.balance;
        }
    }
    else
    {
        const userid = await Register.findOne({_id:lt});
        bal = userid.balance;
    }
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: 'Crypto-X',
        address:{
            line1: 'State,India',
            postal_code: '69400',
            city: 'Munich',
            state: 'Any state',
            country: 'India'
        }
    })
    .then((customer) => {
        stripe.charges.create({
            amount: Number(req.body.amount),
            description: 'Crypto-X',
            currency: 'INR',
            customer: customer.id
        })
    })
    .then(async(charge) => {
        const amount = Number(req.body.amount);
        if(amount >= 50)
        {
            bal = bal + (amount/100);
            if(!lt)
            {
                if(!gt)
                {

                }
                else
                {
                    let doc = await gRegister.findOneAndUpdate({hashedpwd: (vt)}, {balance: bal});
                }
            }
            else
            {
                let doc = await Register.findOneAndUpdate({_id: ObjectId(lt)}, {balance: bal});
            }
            res.render("redirect",{ success: "The Payment was Successful!" });
        }
        else
        {
            res.render("redirect",{ success: "Please enter an amount greater than 0.5₹!" });
        }
    })
    .catch((e) => {
        console.log(e);
    })
})

app.get('/balance', async(req,res) => {
    const lt = req.cookies['login-token'];
    const gt = req.cookies['session-token'];
    const vt = req.cookies['verify-token'];
    if(!lt)
            {
                if(!gt)
                {

                }
                else
                {
                    const userid = await gRegister.findOne({hashedpwd:vt});
                    var bal = userid.balance;
                    res.render("balance",{ balance: bal});
                }
            }
            else
            {
                const userid = await Register.findOne({_id:lt});
                var bal = userid.balance;
                res.render("balance",{ balance: bal});
            }
})

app.listen(port,() => {
    console.log(`listening on port ${port}`);
});

