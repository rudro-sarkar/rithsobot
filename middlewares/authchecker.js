
const User = require('../models/userModel');

async function isUserAuthenticated(req, res, next) {
    if (req.session.userData) {
        const userData = req.session.userData;
        const data = await User.findOne({ pin: userData.pin });
        if (!data) {
            res.redirect('/auth');
        } else {
            next();
        }
    } else {
        res.redirect('/auth');
    }
}

async function isUserUnAuthenticated(req, res, next) {
    const userData = req.session.userData;
    if (!userData) {
        next()
    } else {
        const data = await User.findOne({ pin: userData.pin });
        if (!data) {
            res.redirect('/auth');
        } else {
            res.redirect('/');
        }
    }
}

module.exports = {
    isUserAuthenticated,
    isUserUnAuthenticated
}