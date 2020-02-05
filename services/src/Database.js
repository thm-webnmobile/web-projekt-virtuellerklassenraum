const MongoClient = require('mongodb').MongoClient

// Database Name
const dbName = 'myproject';

var state = {
    db: null,
};

// Connect to the database
exports.connect = function(url, done) {
    if (state.db) return done();

    MongoClient.connect(url, function(err, client) {
        if (err) return done(err);
        state.db = client.db(dbName);
        done();
    });
};

// Gets the database
exports.get = function() {
    return state.db;
};

// Closes connection
exports.close = function(done) {
    if (state.db) {
        state.db.close(function(err, result) {
            state.db = null;
            state.mode = null;
            done(err);
        });
    };
}