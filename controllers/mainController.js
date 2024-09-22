
const interface = require('../interface');

const User = require('../models/userModel');
const Author = require('../models/authorModel');

async function loadDashboard(req, res) {
    const author_count = await Author.countDocuments();
    const author_accounts = await Author.find();
    const general_data_obj = {
        authorCount: author_count,
        authorAccounts: author_accounts
    }
    res.render('dashboard', { general_data_obj: general_data_obj, adminUser: req.session.userData.username });
}

async function loadAuthenticator(req, res) {
    res.render('authentication');
}

async function loadsession(req, res) {
    const { username, pin } = req.body;
    const data = await User.findOne({ username: username });
    if (data) {
        if (data.pin === pin) {
            const client_data = {
                username: data.username,
                pin: data.pin
            }
            req.session.userData = client_data;
            res.redirect('/');
        }else {
            res.redirect('/auth');
        }
    }else {
        res.redirect('/auth');
    }
}

async function removeUserSession(req, res) {
    req.session.destroy();
    res.redirect('auth');
}

module.exports = {
    loadDashboard,
    loadAuthenticator,
    loadsession,
    removeUserSession
}