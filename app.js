require('dotenv').config()
const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const cors = require("cors")
const morgan = require('morgan')
const https = require("https")
const fetch = require('cross-fetch')
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { Router } = require('express')
const app = express()

const PORT = process.env.PORT||3000
app.use(express.static("public"))

app.set("view engine","ejs")
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json())
let cash
app.use(cors())
app.use(morgan("coins"))

const stripe = require("stripe")(`${process.env.SECRET_KEY}`)

app.get("/coins", (req, res) => {
  const url = "https://api.coinranking.com/v2/coins?limit=100";
  (async () => {
    try {
      await fetch(`${url}`, {
        headers: { "x-access-token": `${process.env.COIN_RANKING_API_KEY}` }
      }).then((response) => response.json())
        .then((json) => {
          //console.log(json)
          res.json(json)
        })
    } catch (error) {
     // console.log(error)
    }
  })()
})

app.use(session({
  secret: "20",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true,useUnifiedTopology:true},function(){
  console.log("Connected to Database.")
});
//mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret:String,
  balance:Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/markets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id ,balance:0,username:profile.displayName}, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/markets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/markets");
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});



app.get("/markets", function(req, res){
  if (req.isAuthenticated()){
    res.sendFile(__dirname + '/public/tables.html')
  } else {
    res.redirect("/login");
  }
});
app.get("/wallet", function(req, res){
  if (req.isAuthenticated()){
    res.render('wallet.ejs')
  } else {
    res.redirect("/login");
  }
});

app.post("/wallet.ejs",function(req,res){
       
  res.render("payment.ejs",{
      key:`${process.env.PUBLISHABLE_KEY}`,
      money:(req.body.num)*100
  })
  function variableAmount(){
      return 100*(req.body.num)
}
  cash = variableAmount()
})
app.post("/payment.ejs",(req,res)=>{
  stripe.customers.create({
      email:req.body.stripeEmail,
      source:req.body.stripeToken,
      name:"Crypto-X",
      address:{
          
          city:'Delhi',
          postal_code:"210001",
          state:'Delhi',
          country:'India'
      }
  })
  .then((customer)=>{
      
      return stripe.charges.create({
          amount:cash,
          description:'Add to Wallet',
          currency:'INR',
          customer:customer.id
      })
  })
  .then((charge)=>{
      console.log(charge)
      if(charge.captured){
      res.redirect("/paymentsuccessful");
      
      }else{
        res.redirect("/paymentfail")
      }
  })
  .catch((err)=>{
      res.send(err)
  })
})
app.get("/paymentsuccessful",function(req,res){
  res.render("paymentsuccess")
})
app.get("/paymentfail",function(req,res){
  res.render("paymentfailure")
})

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username,balance:0}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/markets");
      });
    }
  });
})

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/markets");
      });
    }
  });

});

app.get("/",function(req,res){
res.sendFile(__dirname+ "/public/index.html")

})

app.get("/charts",function(req,res){
  res.render("charts")
})



app.get("/exchange",function(req,res){
    res.send("Coming Soon !")
})

app.get("/transfer",function(req,res){
    res.send("Coming Soon !")
})

app.listen(PORT,function(){
    console.log(`Server started on port ${PORT}`)
})
