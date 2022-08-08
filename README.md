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

The schemas are more formally defined in the `[server/server.js](./server/server.js)`, but here are what the data types look like

### `GameResult` object

It makes sense to store this object by `id`

```json
{
  "id": "gr-1",
  "date": "string",
  "participants ": ["player-1", "player-2"],
  "outcome":{
      "winner": "player-1",
      "loser": "player-2"
      // This is empty if there is a draw
  }
}
```

### `PlayerRating` object

```json
{
  "player_id":"player-1",
  "rating": 7250,
  "wins": 27,
  "losses": 15,
  "draws": 2
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

## Features that I wanted to implement but I didn't

- Fetch games by player
- Fetch player rating over time (I'm def not storing this rn, but can maybe keep track of a history of ratings)
- Be able to simulate many game results at once (e.g. a tournament) for more accurate
- Fetch players with similar ratings with the given one (good for matchmaking)

### Datamodel improvements

- `PlayerRating`:
  - Store rating deviation and volatility into a user's profile, this makes the ranking more accurate
  - Store win, loss, draw streaks
  - Store records against other players (although this is just an endpoint, query-able via the games)
  - Store achievements
  - Store hero type
- `GameResult`:
  - The date should be a more formal date type, not just a string (I think MongoDB supports this)
  - Game type -- I assume there are many different types of games
  - Game duration

## Testing

I did not get to fully getting a testing working example, but here are some examples of tests that I wanted to get going

- Test basic endpoints
  - Test that creation and fetching a playergoing works: create a player, and then fetch it
  - Test that fetching a nonexistent player errors out
  - Test that creating a player with an existing username errors
  - Test that the top 10 function works
    - Test for different number of users
    - Test that it is in sorted descending order
  - Test that the game result processing works. E.g. the game is saved, and that the player ratings that are changed work
    - Also test for players that don't exist, what happens?
- Test other functions I didn't get to
- Test reliability
  - Not sure if you can do this in mocha, but try to send many requests (e.g. stress test) and see if it works

## Making this Production-Ready

- Obvious limit to this project is that everything is pretty small scale. The current code is only designed to run on one server and work with one database.
  - I'm not sure, but I think multiple servers can still connect to the MongoDB instance I have, so that's actually ok. The issue is the MongoDB instance load is probably not going to support enough writes to scale up. This can be easily fixed by upgrading to a larger instance.
  - To get multiple servers, we can probably use AWS Elastic Beanstalk, so the servers will scale and decrease based on the load
  - For performance, it's likely better that we data shard so that we separate the data into several databases so that they aren't too overloaded with so many requests, and that we can optimize maybe regions for certain uses, to reduce ping. E.g. we have databases regional by North America, South America, Asia, etc.
  - We should probably have all the data be backed up (I'm sure Amazon offers this somewhere, maybe S3)
- We should protect our API against DDOS and random people in general
  - Probably need to give clients some sort of session key that verifies they are actual players
  - This also prevents hacking, so random people don't add results to the game (I think Blockchain might solve this as well, depending on if the game results are stored on the chain)
- Is storing in plaintext the best idea? This data actually seems ok since everything seems pretty public, but if we start getting into more private info, might be a good idea to do some sort of encryption
