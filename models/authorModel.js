
const db_connection = require('../db_connection');

const authorSchema = db_connection.Schema({
    author_id: {
        type: String,
        required: true
    },
    author_username: {
        type: String,
        required: true
    },
    author_avatar: {
        type: String,
        required: true
    },
    handler: {
        type: String,
        required: true
    },
    is_handled: {
        type: Boolean,
        required: true
    }
});

const Author = db_connection.model('Authors', authorSchema);

module.exports = Author;