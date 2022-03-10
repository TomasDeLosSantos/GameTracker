const { response } = require("express");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const passportSteam = require("passport-steam");
const SteamStrategy = passportSteam.Strategy;
const request = require("express/lib/request");
const port = 3000;
const axios = require("axios");
const app = express();
const steamKey = "92A6C77ECC778345E6C193672F58BD35";
let USERID = "ACCOUNT NOT CONNECTED";

/* STEAM AUTH  */
app.use(express.static("public"));

app.use((req, res, next) => {
    res.header("Acces-Control-Allow-Origin", "*");
    res.header("Acces-Control-Allow-Origin", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// Required to get data from user for sessions
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});
// Initiate Strategy
passport.use(new SteamStrategy({
    returnURL: 'http://localhost:' + port + '/api/auth/steam/return',
    realm: 'http://localhost:' + port + '/',
    apiKey: steamKey
}, function (identifier, profile, done) {
    process.nextTick(function () {
        USERID = profile._json.steamid;
        profile.identifier = identifier;
        return done(null, profile);
    });
}
));
app.use(session({
    secret: 'Whatever_You_Want',
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge: 3600000
    }
}))
app.use(passport.initialize());
app.use(passport.session());
/* STEAM AUTH  */

app.listen(process.env.PORT || port, () => console.log("Server Online"));

// GET ALL USER OWNED GAMES
app.get("/userGames", (req, res) => {
    axios.get("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=" + steamKey + "&steamid=" + req.query["steamuid"])
        .then((response) => {
            const stringified = JSON.stringify(response.data);
            const data = JSON.parse(stringified);
            res.send(data.response.games);
        })
        .catch((error) => console.log(error));
});

// GET USER ACHIEVEMENTS FOR GAME
app.get("/userAchievements", (req, res) => {
    axios.get("https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=" + steamKey + "&appid=" + req.query["appid"] + "&steamid=" + req.query["steamuid"])
        .then((response) => {
            const stringified = JSON.stringify(response.data);
            const data = JSON.parse(stringified);
            res.send(data.playerstats);

        })

        .catch((error) => {
            console.log("error" + req.query["appid"]);
        });
});

// FIND WHICH GAMES HAVE ACHIEVEMENTS (OTHERWISE /userAchievements MIGHT FAIL)
app.get("/gameAchievements", (req, res) => {
    axios.get("https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=" + steamKey + "&appid=" + req.query["appid"])
        .then((response) => {
            const stringified = JSON.stringify(response.data);
            const data = JSON.parse(stringified);
            res.send(data);

        })

        .catch((error) => {
        });
});

// GET A LIST WITH ALL GAMES IN STEAM APP (PENDING TO MAKE THIS FILE LOCAL)
app.get("/allGames", (req, res) => {
    axios.get("https://api.steampowered.com/ISteamApps/GetAppList/v2/")
        .then((response) => {
            res.send(response.data.applist.apps);
        })
        .catch((error) => console.log(error));
});

// STARTS STEAM AUTHENTICATION PROCESS
app.get("/api/auth/steam", passport.authenticate("steam"), function(req,res){});

// STEAM AUTHENTICATION PROCESS FINISHED AND RETURNED
app.get("/api/auth/steam/return",
    passport.authenticate("steam", {failureRedirect:"/"}),
    function(req, res){
        res.redirect("/");
    }
);

// ONCE THE USER LOGGED IN, SEND USER INFO
app.get('/', (req, res) => {
    res.send(req.user);
});

// IF LOGGED IN, SENDS USER STEAMID, OTHERWISE "ACCOUNT NOT CONNECTED"
app.get("/steamid", (req,res) => {
    res.send(USERID);
})

// USER LOGGED OUT, USERID = "ACCOUNT NOT CONNECTED"
app.get('/api/auth/steam/logout', function(req, res){
    USERID = "ACCOUNT NOT CONNECTED";
    res.redirect("/");
});