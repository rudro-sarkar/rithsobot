
const db_connection = require('../db_connection');

const blockedSchema = db_connection.Schema({
    user_name: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    }
});

const Blocked = db_connection.model('Blocked', blockedSchema);

module.exports = Blocked;