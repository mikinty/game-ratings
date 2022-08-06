const express = require('express');

// recordRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /listings.
const recordRoutes = express.Router();

// This will help us connect to the database
const dbo = require('../db/conn');

const DEFAULT_RATING = 1500;

/**
 * Return the stats for a player
 */
recordRoutes.route('/player/:id').get(async function (req, res) {
  const dbConnect = dbo.getDb();

  dbConnect
    .collection('players')
    .find({
      _id: req.body.id
    });
});

/**
 * Return top players
 */
recordRoutes.route('/player/top/:limit').get(async function (req, res) {
  const dbConnect = dbo.getDb();

  dbConnect
    .collection('players')
    .find()
    .sort({
      rating: 1
    })
    .limit(req.body.limit);
});

/**
 * Create a new player, with optional id if specified
 */
recordRoutes.route('/player/create/:id').post(function (req, res) {
  let player_id = `player ${crypto.randomBytes(6).toString('hex')}`

  if (req.body.id != null) {
    player_id = req.body.id;

    // TODO: Make sure this player isn't already in the database
  }

  const playerData = {
    player_id: id,
    rating: DEFAULT_RATING,
    wins: 0,
    losses: 0,
    draws: 0
  };

  dbConnect
    .collection('players')
    .insertOne(playerData, function (err, result) {
      if (err) {
        res.status(400).send('Error inserting player!');
      } else {
        console.log(`Added a new player with id ${player_id}`);
        res.status(204).send();
      }
    });
});

/**
 * Add a game result to the database
 */
recordRoutes.route('/game/result').post(function (req, res) {
  const dbConnect = dbo.getDb();

  // Update ratings and game stats for involved players
  // Retrieve players from database

  // Add game to the database
  const gameData = {
    _id: req.body.id,
    date: req.body.string,
    participants: req.body.participants,
    outcome: req.body.outcome
  }

  dbConnect
    .collection('matches')
    .insertOne(gameData, function (err, result) {
      if (err) {
        res.status(400).send('Error inserting game result!');
      } else {
        console.log(`Added a new game with id ${result.insertedId}`);
        res.status(204).send();
      }
    });
});

module.exports = recordRoutes;
