// Loads the configuration from config.env to process.env
require('dotenv').config({ path: './config.env' });

const express = require('express');
const cors = require('cors');
// get MongoDB driver connection
const dbo = require('./db/conn');

// Swagger docs
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(require('./routes/record'));

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Aurory ChallengeAPI',
      version: '1.0.0',
      description: 'API for adding games and updating rankings of players via Glicko'
    },
    components: {
      schemas: {
        GameResult: {
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
          }
        }
      }
    }
  },
  apis: ['routes/record.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Global error handling
app.use(function (err, _req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// perform a database connection when the server starts
dbo.connectToServer(function (err) {
  if (err) {
    console.error(err);
    process.exit();
  }

  // start the Express server
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
});
