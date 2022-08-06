# game-ratings

Create an app that can simulate games between many players and show stats about ratings and games.

Built for the Aurory coding challenge.

## How to run

You will need to setup a database before you can run the node application.

### Database setup

You will need a [MongoDB Atlas Database](https://www.mongodb.com/cloud/atlas/lp/try6) in order to power the backend. After you've created an instance, please add a `config.env` under the `server` directory, with the contents

```env
ATLAS_URI=mongodb+srv://<username>:<password>@<DATABASE_NAME>?retryWrites=true&w=majority
```

NOTE: I purposely did not commit the `server/config.env` since it contains my login, but please paste in your own to connect to your database.

### Node Server

This is much simpler. Go into the `server/` directory and install packages first

```
npm install
```

And then to start the app, run

```
npm start
```

After running the app, you will get some output like

```
[nodemon] starting `node server.js`
Successfully connected to MongoDB.
Server is running on port: 5001
```

You want to see `Successfully connected to MongoDB.` to know your DB is up and running, and you want to note the port so you can make requests there.

## Docs

I might make some actual docs (e.g. wiki), but for now

### `GameResult` object

It makes sense to store this object by `id`

```json
{
  "id":"gr-1",
  "date":"string",
  "participants ": [ "player-1", "player-2"],
  "outcome":{
      "winner":"player-1",
      "loser":"player-2"
  }
}
```

### `PlayerRating` object

It makes sense to store this object by `player_id`

```json
{
  "player_id":"player-1",
  "rating":"7250",
  "wins":27,
  "losses":15,
  "draws":2
}
```

### API Endpoints

- Allow clients to submit results of games or matches, which will be to calculate
rating (example)
  - Probably a POST request and just submit a `GameResult` object, e.g. `result(res: GameResult)`
- Allow clients to fetch rating data for a given player (example)
  - GET request `player(id: string)`
- Allow clients to fetch the top 10 players by rating
  - GET request maybe `top(n: int)`

### Player Ratings

Calculated by [Glicko](https://en.wikipedia.org/wiki/Glicko_rating_system), which is like ELO but has some improvements.

We are likely to use the [`glicko npm package`](https://github.com/mmai/glicko2js) so we don't have to do all the complicated math.

## Initial plan

- I need to figure out what sort of backend to store this in. I'm thinking of just doing a simple Express or Django backend for now. Probably use Express so I can do node. Going to be honest I wish I knew more about backend choices, but I've only ever used Express before.
- Then I'll set up the database
- Then I'll set up the API endpoints
- Finally I'll have to do some testing

### If I have time

- I have a lot of UI ideas, but I think this is backend heavy, so maybe think of more API endpoints that might be useful
  - Fetch games by player
  - Fetch player rating over time (I'm def not storing this rn, but can maybe keep track of a history of ratings)
  - Fetch players with similar ratings (good for matchmaking)
