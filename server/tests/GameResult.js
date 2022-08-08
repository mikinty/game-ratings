const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameResultSchema = new Schema({
    type: Object,
    properties: {
      id: {
        type: String,
        description: "Identifier for a game",
        example: "game-1"
      },
      date: {
        type: String,
        description: "Date of the game",
        example: "August 7th, 2022"
      },
      participants: {
        type: Array,
        items: {
          type: String
        },
        description: "List of players in the game. Exactly two players are supported in a game.",
        example: ["player1", "player2"]
      },
      outcome: {
        type: Object,
        properties: {
          winner: {
            type: String,
            description: "Id of the player that won the game",
            example: "player1"
          },
          loser: {
            type: String,
            description: "Id of the player that lost the game",
            example: "player2"
          }
        },
        description: "Describes the winner and loser of the game. If there is a draw, none are specified."
      }
});

const GameResult = mongoose.model('GameResult', GameResultSchema);
module.exports = GameResult;
