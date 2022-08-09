const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlayerRatingSchema = new Schema({
  type: Object,
  properties: {
    player_id: {
      type: String,
      description: "ID of a player",
      example: "player1"
    },
    rating: {
      type: Number,
      description: "Glick rating of player",
      example: 1500
    },
    wins: {
      type: Number,
      description: "Number of wins by the player",
      example: 10
    },
    losses: {
      type: Number,
      description: "Number of losses by the player",
      example: 2
    },
    draws: {
      type: Number,
      description: "Number of draws by the player",
      example: 1
    }
  }
});

const PlayerRating = mongoose.model('PlayerRating', PlayerRatingSchema);
module.exports = PlayerRating;
