

const mainRouter = require("express").Router();
const userSession = require("express-session");

const authChecker = require('../middlewares/authchecker');
const mainController = require('../controllers/mainController');

mainRouter.use(userSession({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
    }
}));

mainRouter.get('/', authChecker.isUserAuthenticated, mainController.loadDashboard);

mainRouter.get('/auth', authChecker.isUserUnAuthenticated, mainController.loadAuthenticator);
mainRouter.post('/redirecting_to_main', authChecker.isUserUnAuthenticated, mainController.loadsession);

mainRouter.get('/deleteusersession',authChecker.isUserAuthenticated, mainController.removeUserSession);

mainRouter.get('/restrictionpanel', authChecker.isUserAuthenticated, mainController.loadRestrictionPanel);

module.exports = mainRouter;
