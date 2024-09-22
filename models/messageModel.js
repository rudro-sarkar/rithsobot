

const db_connection = require('../db_connection');

const messageSchema = db_connection.Schema({
    sender_id: {
        type: String,
        required: true
    },
    receiver_id: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {timestamps: true});

const Message = db_connection.model('Messages', messageSchema);

module.exports = Message;