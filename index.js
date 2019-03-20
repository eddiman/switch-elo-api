var express = require('express');
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var mongoHelper = require('./mongoHelper');
var admin = require("firebase-admin");

var app = express();


var serviceAccount = require("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://switchelo.firebaseio.com"
});
const db = admin.database();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

const baseUrl = "localhost:8000";

/************************************** USER **********************************************/

app.put('/switch/user', (req, res) => {
  const {userName} = req.body;
  const userInfo = { userName: userName, creationDate : new Date().getTime()};

  db.ref(`user/${userName}`).setLocale({userInfo}, error => {
    if (error) {
      res.sendStatus(500);
    } else {
      res.sendStatus(201);
    }
  });
});

app.post('/switch/user', async (req, res) => {
  const {userName} = req.body;
  const userInfo = { userName: userName, creationDate : new Date().getTime()};
  const userSnapshot = await db.ref(`user/${userName}`).once('value');
  const response = Object.assign({}, userSnapshot.val());

  if((Object.entries(response).length === 0) || (response.userInfo.userName.toUpperCase() != userName.toUpperCase())) {
    db.ref(`user/${userName}`).set({userInfo}, error => {
      if (error) {
        res.sendStatus(500);
      } else {
        res.sendStatus(201);
      }
    });
  } else {
    res.send("User exists");
  }
});

app.get('/switch/user/', async (req, res) => {
  const {userName} = req.query;
  const userSnapshot = await db.ref(`user/${userName}`).once('value');
  // GOOD
  const response = Object.assign({}, userSnapshot.val());
  res.send(response);


});


/************************************** GAMES **********************************************/

app.post('/switch/game', async (req, res) => {
  const {gameName} = req.body;

  var ref = db.ref('game').orderByChild('gameName').equalTo(gameName);
  ref.once('value', snapshot => {
    if (!snapshot.exists()) {
      db.ref(`game/`).push({
        gameName: gameName,
        creationDate : new Date().getTime()}, error => {
          if (error) {
            res.sendStatus(500);
          } else {
            res.sendStatus(201);
          }
        });
      } else {
        console.log("Game exists");
        res.send("Game exists");
      }
    });
});

app.get('/switch/game/', (req, res) => {
  const {gameName} = req.query;

  var ref = db.ref('game').orderByChild('gameName').equalTo(gameName);
  ref.once('value', snapshot => {
    if (snapshot.exists()) {
      const response = Object.assign({}, snapshot.val());
      res.send(response);
      } else {
        res.send("Game doesnt exist");

      }
    });
});

app.get('/switch/games/', async (req, res) => {
  const {gameName} = req.query;
  const gameSnapshot = await db.ref(`game/`).once('value');

  const response = Object.assign({}, gameSnapshot.val());
  res.send(response);
});





var port = process.env.PORT || 8000;
app.listen(port, "0.0.0.0");
console.log('Running on http://localhost:8000');
