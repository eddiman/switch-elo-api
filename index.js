var express = require('express');
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var mongoHelper = require('./mongoHelper');

var app = express();
var db = "db";
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var baseUrl = "localhost:8000";


app.post('/switch/newuser', function(req, res, next) {
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  console.log("from post " + req.body.userName);

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("db");
    
    var compareObj = { userName : req.body.userName };
    var user = { userName: req.body.userName, creationDate : new Date().getTime()};

    if(mongoHelper.insertObjToCollection(db, dbo, compareObj, user, "users")){
      res.send("Added object");
    } else {
      res.send("Already exists");
    }
  });

});

app.post('/switch/addgame', function(req, res, next) {
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  console.log("from post " + req.body.gameName);

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("db");
    var compareObj = { gameName : req.body.gameName};
    var game = { gameName: req.body.gameName};

    if(mongoHelper.insertObjToCollection(db, dbo, compareObj, game, "games")){
      res.send("Added object");
    } else {
      res.send("Already exists");
    }
    db.close();
  });
});



app.get('/switch/getallusers', function(req, res, next) {
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("db");

    dbo.collection("users").find({}).toArray(function(err, result) {
      if (err) throw err;
      res.send(result);
      db.close();

    });
  });
});

app.post('/switch/getuser', function(req, res, next) {
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("db");

    dbo.collection("users").findOne({ userName : req.body.userName}, function(err, result) {
      if (err) throw err;
      res.send(result);
      db.close();

    });
  });
});

var port = process.env.PORT || 8000;
app.listen(port, "0.0.0.0");
console.log('Running on http://localhost:8000');
