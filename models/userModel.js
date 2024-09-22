
const db_connection = require('../db_connection');

const userSchema = db_connection.Schema({
    username: {
        type: String,
        required: true
    },
    pin: {
        type: String,
        required: true
    }
});

const User = db_connection.model('Users', userSchema);

module.exports = User;