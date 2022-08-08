const PlayerRating = require('./PlayerRating');
const assert = require('assert');
const record = require('../routes/record.js');
const request = require('supertest');

describe('Creating PlayerRating in DB', () => {
    it('Creates a New PlayerRating and then reads to make sure the data is accurate', (done) => {
        request(record)
            .post('/create')
            .send()
            .expect(204)
            .then(res => done())
            .catch(err => done(err));

        // Check that the data is right. That is, losses, wins, draws are 0.
    });
});
