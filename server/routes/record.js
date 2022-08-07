const express = require('express');
const glicko2 = require('glicko2');
const crypto = require('node:crypto');

// recordRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /listings.
const recordRoutes = express.Router();

// This will help us connect to the database
const dbo = require('../db/conn');

/**
 * Glicko settings.
 */
const DEFAULT_RATING = 1500;
const GLICKO_RD = 200;
const GLICKO_VOL = 0.06;
const settings = {
  // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
  //      be tested to decide which value results in greatest predictive accuracy."
  tau : 0.5,
  // rating : default rating
  rating : DEFAULT_RATING,
  // rd : Default rating deviation
  //      small number = good confidence on the rating accuracy
  rd : GLICKO_RD,
  // vol : Default volatility (expected fluctation on the player rating)
  vol : GLICKO_VOL
};

/**
 * @swagger
 * /player/{id}:
 *  get:
 *    description: Returns stats for a player with the provided id
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: ID of the player to retrieve
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Player with ID not found or database retrieval error
 */
recordRoutes.route('/player/:id').get(async function (req, res) {
  const dbConnect = dbo.getDb();
  const playerId = req.params.id;

  dbConnect
    .collection('players')
    .findOne({
      _id: playerId
    }, function (err, result) {
      if (err) {
        res.status(400).send(`Error fetching player with id: ${playerId}`);
      } else {
        res.json(result == null ? `Player ${playerId} not found` : result);
      }
    });
});

/**
 * @swagger
 * /top/{limit}:
 *  get:
 *    description: Returns the top limit (default 10) players with highest ratings
 *    parameters:
 *      - in: path
 *        name: limit
 *        schema:
 *          type: integer
 *          default: 10
 *        required: false
 *        description: Maximum top players to retrieve
 *    responses:
 *      200:
 *        description: Success
 *      400:
 *        description: Database retrieval error
 */
recordRoutes.route('/top/:limit?').get(async function (req, res) {
  const dbConnect = dbo.getDb();
  const limit = isNaN(parseInt(req.params.limit)) ? 10 : parseInt(req.params.limit);

  dbConnect
    .collection('players')
    .find()
    .sort({
      rating: -1
    })
    .limit(limit)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send(`Error fetching top ${limit} players`);
      } else {
        res.json(result);
      }
    })
});

/**
 * @swagger
 * /create/{id}:
 *  get:
 *    description: Create a new player, with optional id if specified. If the id is not specified, a random id will be generated in the format `player_<6-digit hash>`
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: false
 *        description: id of player to create
 *    responses:
 *      204:
 *        description: Player successfully created
 *      400:
 *        description: Player creation error
 */
recordRoutes.route('/create/:id?').post(async function (req, res) {
  const dbConnect = dbo.getDb();
  let playerId = `player_${crypto.randomBytes(6).toString('hex')}`

  if (req.params.id != null) {
    playerId = req.params.id;
  }

  const playerData = {
    _id: playerId,
    player_id: playerId,
    rating: DEFAULT_RATING,
    wins: 0,
    losses: 0,
    draws: 0
  };

  dbConnect
    .collection('players')
    .insertOne(playerData, function (err, result) {
      if (err) {
        res.status(400).send(`Error inserting player!\n${err}`);
      } else {
        console.log(`Added a new player with id ${playerId}`);
        res.status(204).send(`Added a new player with id ${playerId}`);
      }
    });
});

/**
 * Add a game result to the database
 */
recordRoutes.route('/game').post(async function (req, res) {
  const dbConnect = dbo.getDb();

  // Update ratings and game stats for involved players
  const participants = req.body.participants;

  if (participants == undefined || participants.length != 2) {
    res.status(400).send(`Did not receive 2 participants in: ${req.body.participants}`);
    return;
  }

  // Retrieve players from database
  function retrievePlayer(id) {
    return dbConnect
    .collection('players')
    .findOne({
      _id: id
    });
  }

  const player1 = await retrievePlayer(participants[0]);
  const player2 = await retrievePlayer(participants[1]);

  if (player1 == null || player2 == null) {
    res.status(400).send(`Not all participants exist in database.`);
    return;
  }

  /**
   * From Glicko docs, it's more ideal to keep track of matches and then update
   * rankings after a set of matches, but since we are only given one game
   * result in this case, we will only be able to simulate a "one game
   * tournament." We can perhaps consider implementing another endpoint with a
   * series of matches that represent a tournament, and in that way we can use
   * Glicko more effectively.
   *
   * TODO: Notice that we are assuming the same RD (rating deviation) and
   * volatility every time, which is not accurate. We can actually store these
   * values into the database.
   */
  const ranking = new glicko2.Glicko2(settings);
  const player1Glicko = ranking.makePlayer(player1.rating, GLICKO_RD, GLICKO_VOL);
  const player2Glicko = ranking.makePlayer(player2.rating, GLICKO_RD, GLICKO_VOL);

  if ('winner' in req.body.outcome && 'loser' in req.body.outcome) {
    if (req.body.outcome.winner == req.body.outcome.loser) {
      res.status(400).send(`Received a game with the same winner and loser`);
      return;
    }

    const player1Wins = req.body.outcome.winner == player1.player_id
    ranking.updateRatings([
      [player1Glicko, player2Glicko, player1Wins]
    ]);

    player1.wins += player1Wins;
    player1.losses += !player1Wins;

    player2.wins += !player1Wins;
    player2.losses += player1Wins;
  } else {
    // We assume this is a draw otherwise, even if the input is malformed, like just one winner or one loser
    ranking.updateRatings([
      [player1Glicko, player2Glicko, 0.5]
    ]);

    player1.draws += 1;
    player2.draws += 1;
  }

  player1.rating = player1Glicko.getRating();
  player2.rating = player2Glicko.getRating();

  function updateStatsForPlayer(id, newStats) {
    dbConnect
      .collection('players')
      .updateOne({ _id: id }, { $set: newStats }, function (err, _result) {
        if (err) {
          res
            .status(400)
            .send(`Error updating stats for player "${id}"`);
        } else {
          console.log(`New rating for player "${id}": ${newStats.rating}`);
        }
      });
  }

  updateStatsForPlayer(player1.player_id, player1);
  updateStatsForPlayer(player2.player_id, player2);

  // Add game to the database
  const gameData = {
    _id: req.body.id,
    date: req.body.date,
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
