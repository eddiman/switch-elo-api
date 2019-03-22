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
  const userInfo = { userName: userName, creationDate : new Date().getTime(), score: score};

  db.ref(`user/${userName}`).setLocale({userInfo}, error => {
    if (error) {
      res.sendStatus(500);
    } else {
      res.sendStatus(201);
    }
  });
});

/**POST**/
app.post('/switch/user', async (req, res) => {
  const {userName} = req.body;

  var ref = db.ref('user').orderByChild('userName').equalTo(userName);
  ref.once('value', snapshot => {
    if (!snapshot.exists()) {
      db.ref(`user/`).push({
        userName: userName,
        creationDate : new Date().getTime(),
        score: 1500,
        wins: 0,
        lose: 0
      },
      error => {
        if (error) {
          res.sendStatus(500);
        } else {
          res.sendStatus(201);
        }
      });
    } else {
      console.log("User exists");
      res.send("User exists");
    }
  });
});

/**GET**/
app.get('/switch/user/', (req, res) => {
  const {userName} = req.query;

  var ref = db.ref('user').orderByChild('userName').equalTo(userName);
  ref.once('value', snapshot => {
    if (snapshot.exists()) {
      const response = Object.assign({}, snapshot.val());
      res.send(response);
    } else {
      res.send("user doesnt exist");

    }
  });
});

app.get('/switch/users/', async (req, res) => {
  const {gameName} = req.query;
  const userSnapshot = await db.ref(`user/`).once('value');

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
        creationDate : new Date().getTime()},
        error => {
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


  /************************************** SCORE **********************************************/
  app.post('/switch/register', (req, res) => {
    const {winner, losers} = req.body;
    registerWinnerToFireBase(winner);
  });
  function registerWinnerToFireBase(userWinner){

    const userKey = Object.keys(userWinner)[0];


    var ref = db.ref('user').orderByKey().equalTo(userKey);
    ref.once('value', snapshot => {
      //console.log(snapshot.child(userKey));
      let userName = "";
      const newWinCount = 0;
      const newLoseCount = 0;
      const newScore = 0;
      snapshot.forEach(child => {
        const user = child.val();

        const newWinCount = user.wins + 1;
        const newLoseCount = user.lose+ 1;
        const newScore = calculateWinScore( user.score);

        snapshot.ref.update({
          wins: newWinCount,
          lose: newLoseCount,
          score: newScore,
        });
      });

    },
    error => {
      if (error) {
        res.sendStatus(500);
      } else {
        res.sendStatus(201);
      }
    });
  }




  function calculateWinScore(score) {
    return score + 10;
  }

  var port = process.env.PORT || 8000;
  app.listen(port, "0.0.0.0");
  console.log('Running on http://localhost:8000');
