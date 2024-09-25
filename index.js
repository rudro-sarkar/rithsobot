
require("dotenv").config();

const { Client, Events, GatewayIntentBits, Partials, ActivityType } = require('discord.js');

require('./db_connection');

const Author = require('./models/authorModel');
const Message = require('./models/messageModel');
const Blocked = require('./models/blockedModel');

const express = require("express");
const http = require("http");
const path = require("path");

const app = express();

const server = http.createServer(app);

const io = require("socket.io")(server);

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, "public")));

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'templates'));

const mainRouter = require('./routes/main');

const authChecker = require('./middlewares/authchecker');

app.use(mainRouter);

const token = process.env.TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages], partials: [Partials.Channel] });

client.once(Events.ClientReady, readyClient => {
    client.user.setPresence({ activities: [{ name: 'DM me for Assistance!', type: ActivityType.Playing }], status: "idle" });
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on('messageCreate', async data => {
    if (data.author.bot) {
        return;
    } else {
        const author_id = data.author.id;
        const author_username = data.author.username;
        const author_avatar = data.author.displayAvatarURL({ format: 'png', dynamic: true });
        const author_message = data.content;
        const is_blocked = await Blocked.findOne({ user_id: author_id });
        if (!is_blocked) {
            const db_data = await Author.findOne({ author_id: author_id });
            if (db_data) {
                if (db_data.is_handled) {
                    await Message.insertMany([{
                        sender_id: author_username,
                        receiver_id: db_data.handler,
                        content: author_message
                    }]);
                    io.emit('author_msg', { content: author_message, receiver: db_data.handler });
                } else {
                    client.users.send(author_id, `Please wait patiently. A staff member will assist you shortly. You'll be notified once your request is accepted.`).then(() => {
                        return;
                    }).catch(err => {
                        io.emit('author_msg', { content: 'Messege form server: Cant send message. Possible reason: the user has blocked the bot.', receiver: db_data.handler });
                    })
                }
            } else {
                client.users.send(author_id, 'Please wait.....');
                await Author.insertMany([{
                    author_id: author_id,
                    author_username: author_username,
                    author_avatar: author_avatar,
                    handler: 'none',
                    is_handled: false
                }]);
                client.users.send(author_id, 'Your request for assistance has been received. Please wait while we connect you with a staff member.').then(() => {
                    client.channels.cache.get('1287345364441239645').send(`${client.guilds.cache.get('1251071702230630410').roles.cache.get('1287157224782958725')} a user named **${author_username}** requested for helpline support!`);
                }).catch(err => {
                    // io.emit('author_msg', { content: `Messege form <h2>server:</h2>: Internal error: ${error}`, receiver: db_data.handler });
                    console.log(err);
                });
            }
        }else {
            client.users.send(author_id, 'Ooops! You are blocked by a helpline agent! Visit Osthir Server or DM an server administrator or moderator directly if this is an error.').then(() => {
                return;
            }).catch(err => console.log(err));
        }
    }
});


client.login(token);

mainRouter.post('/redirecting_to_conversation/:id', authChecker.isUserAuthenticated, async (req, res) => {
    const chat_id = req.params.id;
    const staff_username = req.session.userData.username;
    const account = await Author.findOne({ author_id: chat_id });
    if (!account.is_handled) {
        await Author.findOneAndUpdate({ author_id: chat_id }, { handler: staff_username, is_handled: true });
        res.redirect(`/assist/${chat_id}`);
        io.once('connection', socket => {
            socket.emit('new_msg', { receiver_id: staff_username, content: `Hello ${account.author_username}, I am ${staff_username} from the OSTHIR Staff team. How can I assist you?` });
        });
        client.users.send(account.author_id, `Hello ${account.author_username}, I am ${staff_username} from the OSTHIR Staff team. How can I assist you?`).then(() => {
        }).catch(err => {
            io.emit('author_msg', { content: 'Messege form <h2>server:</h2>: Cant send message. Possible reason: the user has blocked the bot.', receiver: staff_username });
        })
    } else {
        res.redirect(`/assist/${chat_id}`);
    }
});

mainRouter.get('/assist/:id', authChecker.isUserAuthenticated, async (req, res) => {
    const chat_id = req.params.id;
    const staff_username = req.session.userData.username;
    const account = await Author.findOne({ author_id: chat_id });
    if (account) {
        if (!account.is_handled) {
            res.redirect('/');
        } else if (account.handler == staff_username) {
            const client_content_obj = await Message.find({
                $or: [
                    { sender_id: staff_username, receiver_id: account.author_username },
                    { sender_id: account.author_username, receiver_id: staff_username }
                ]
            });
            const client_content_array = [];
            client_content_obj.forEach(content => {
                let datacontent = { sender_id: content.sender_id, receiver_id: content.receiver_id, content: content.content }
                client_content_array.push(datacontent);
            });
            res.render('assist_conversation', { authordata: account, admin: staff_username, contentArr: client_content_array });

            io.once('connection', socket => {
                socket.on('msg_from_client', async data => {
                    const is_blocked = await Blocked.findOne({ user_name: account.author_username });
                    if (!is_blocked) {
                        await Message.insertMany([{
                            sender_id: data.sender,
                            receiver_id: account.author_username,
                            content: data.content
                        }]);
                        client.users.send(data.authorId, data.content).then(() => {
                            socket.emit('append_client_message', data);
                        }).catch(err => {
                            io.emit('author_msg', { content: 'Messege form server: Cant send message. Possible reason: the user has blocked the bot.', receiver: data.sender });
                        });
                    }else {
                        io.emit('author_msg', { content: 'Messege form server: You have blocked this user! Please unblock from the restriction panel to chat.', receiver: data.sender });
                    }

                });
            });

        } else {
            res.render('already_in_touch');
        }
    } else {
        res.redirect('/');
    }
});

mainRouter.post('/deletesupportsession', authChecker.isUserAuthenticated, (req, res) => {
    const { authorUsername, adminUsername, authorId } = req.body;
    Author.findOneAndDelete({ author_username: authorUsername }).then(() => {
        Message.deleteMany({
            $or: [
                { sender_id: authorUsername, receiver_id: adminUsername },
                { sender_id: adminUsername, receiver_id: authorUsername }
            ]
        }).then(() => {
                client.users.send(authorId, `The staff member has left, and the chat session is now over. Thank you for reaching out! We're always here to help if you need anything. Take care!`).then(() => {
                }).catch(err => {
                    io.emit('author_msg', { content: `Messege form <h2>server:</h2>: Cant send message. Possible reason: ${err}`, receiver: adminUsername });
                })
            res.redirect('/');
        }).catch(err => console.log(err));
    }).catch(err => {
        console.log(err);
    });
});

mainRouter.post('/blockinguser', authChecker.isUserAuthenticated, async (req, res) => {
    const { authorUsername, authorId } = req.body;
    const is_blocked = await Blocked.findOne({ user_id: authorId });
    if (!is_blocked) {
        await Blocked.insertMany([{
            user_name: authorUsername,
            user_id: authorId
        }]);
        res.redirect('/');
    }else {
        res.redirect(`/assist/${authorId}`);
    }
});

mainRouter.post('/restrictionpanel', authChecker.isUserAuthenticated, async (req, res) => {
    const { blockedUserId } = req.body;
    const is_blocked = await Blocked.findOne({ user_id: blockedUserId });
    if (is_blocked) {
        await Blocked.findOneAndDelete({ user_id: blockedUserId });
        res.redirect('/');
    }else {
        res.render('restriction_panel', { adminUser: req.session.userData.username, error: 'Invalid ID or the user is not blocked!' });
    }
});

const port = process.env.PORT || 5001;

server.listen(port, () => {
    console.log(`Server started listening at port ${port}`);
});
