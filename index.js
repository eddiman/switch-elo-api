var express = require('express');
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var mongoHelper = require('./mongoHelper');
var admin = require("firebase-admin");
var cors = require("cors");

//var app = express();
const app=express().use('*', cors());


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

app.use(cors());


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
    const {game, winner, losers} = req.body;
    let error = "";
    error = registerWinnerToFireBase(game, winner[0]);

    losers.forEach(loserKey => {
      error = registerLoserToFireBase(game, loserKey);
    });

    error = createHistoricalMatch(game, winner, losers);
    setNoOfGameMatches();
    res.send(error)
  });

  function registerWinnerToFireBase(game, userId){
    //const userKey = Object.keys(userWinner)[0];
    var ref = db.ref('user').orderByKey().equalTo(userId);
    ref.once('value', snapshot => {
      snapshot.forEach(child => {
        const user = child.val();

        if(!user.hasOwnProperty("gamesPlayed") ) {
          child.ref.update({
            gamesPlayed: {[game] : {wins: 1, lose: 0}}
          });

        } else {
          console.log()
          //if game has been played before, insert game in to gamesPlayed collection
              db.ref('user/' + userId +'/gamesPlayed').update({
                [game] : {wins: user.gamesPlayed[game].wins+1, lose: 0}
            });

        }
        const newWinCount = user.wins + 1;
        const newScore = calculateWinScore( user.score);

        child.ref.update({
          wins: newWinCount,
          score: newScore,
        });

      });

    },
    error => {
      if (error) {
        return error;
      }
    });
  }


  function registerLoserToFireBase(game, userId){
    //const userKey = Object.keys(userWinner)[0];
    var ref = db.ref('user').orderByKey().equalTo(userId);
    ref.once('value', snapshot => {
      snapshot.forEach(child => {
        const user = child.val();

        if(!user.hasOwnProperty("gamesPlayed") ) {
          child.ref.update({
            gamesPlayed: {[game] : {wins: 0, lose: 1}}
          });

        } else {
          console.log()
          //if game has been played before, insert game in to gamesPlayed collection
              db.ref('user/' + userId +'/gamesPlayed').update({
                [game] : {wins: 0, lose:  user.gamesPlayed[game].lose+1}
            });

        }
        const newLoseCount = user.lose + 1;
        const newScore = calculateLoseScore( user.score);

        child.ref.update({
          lose: newLoseCount,
          score: newScore,
        });
      });
    },
    error => {
      if (error) {
        return error;
      }
    });
  }

  function createHistoricalMatch(game, winner, losers) {

    db.ref(`matches/`).push({
      gameName: game,
      winner: winner,
      losers: losers,
      status: "finished",
      creationDate : new Date().getTime()},

      error => {
        if (error) {
          return error;
        }
      });
    }

    function setTimesPlayed() {

    }



    function calculateWinScore(score) {
      return score + 10;
    }
    function calculateLoseScore(score) {
      return score - 10;
    }

    var port = process.env.PORT || 8000;
    app.listen(port, "0.0.0.0");
    console.log('Running on http://localhost:8000');
