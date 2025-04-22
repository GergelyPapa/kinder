// socket/socketHandler.js
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const Match = require('../models/Match');
const ChatMessage = require('../models/ChatMessages');
const UserImages = require('../models/UserImages');

// --- Konstansok az eseménynevekhez ---
const EVENT = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    AUTHENTICATION_ERROR: 'authentication_error', // Kliensnek küldhető hibaesemény
    JOIN_MATCH_ROOM: 'join_match',
    LEAVE_MATCH_ROOM: 'leave_match',
    SEND_MESSAGE: 'send_message',
    NEW_MESSAGE: 'new_message',
    USER_ONLINE: 'user_online',     // Értesítés, ha valaki online lesz
    USER_OFFLINE: 'user_offline',   // Értesítés, ha valaki offline lesz
};

// --- Globális Online Felhasználó Kezelő ---
// Tárolja az aktív kapcsolatokat felhasználónként.
// Kulcs: userId (Number)
// Érték: Set<socket.id> (String) - Egy Set, ami az adott userhez tartozó összes aktív socket ID-t tartalmazza.
// Ez kezeli azt az esetet, ha egy user több eszközről/fülről is csatlakozik.
const onlineUsers = new Map();

/**
 * Inicializálja és konfigurálja a Socket.IO szervert.
 * @param {http.Server} httpServer - A Node.js HTTP szerver.
 * @param {object} corsOptions - A CORS beállítások a Socket.IO számára.
 * @returns {Server} A konfigurált Socket.IO szerver instance.
 */
function initializeSocket(httpServer, corsOptions) {
    const io = new Server(httpServer, {
        cors: corsOptions
    });

    // ==================================
    // ===      HELPER FUNKCIÓK       ===
    // ==================================

    /**
     * Értesíti egy felhasználó párjait az online/offline státuszának változásáról.
     * Csak a partnereknek küld üzenetet, és csak akkor, ha ők maguk is online vannak.
     * @param {number} userId - Annak a felhasználónak az ID-ja, akinek a státusza megváltozott.
     * @param {boolean} isOnline - Igaz, ha a felhasználó online lett, hamis, ha offline.
     */
    async function notifyMatchesAboutStatus(userId, isOnline) {
        try {
            // 1. Keresd meg az összes olyan match-et, ahol a felhasználó részt vesz.
            const matches = await Match.findAll({
                where: {
                    [Op.or]: [{ user1_id: userId }, { user2_id: userId }]
                },
                attributes: ['user1_id', 'user2_id'] // Csak az ID-k kellenek
            });

            // 2. Gyűjtsd ki a partnerek ID-jait.
            const partnerIds = matches
                .map(match => (match.user1_id === userId ? match.user2_id : match.user1_id))
                .filter(id => id !== userId); // Biztosítjuk, hogy saját magát ne vegyük partnernek

            if (partnerIds.length === 0) {
                // console.log(`User ${userId} has no partners to notify.`);
                return; // Nincs kinek szólni
            }

            // 3. Határozd meg az esemény nevét és az adatokat.
            const eventName = isOnline ? EVENT.USER_ONLINE : EVENT.USER_OFFLINE;
            const statusData = { userId: userId }; // Az esemény arról szól, hogy melyik user státusza változott

            console.log(`Notifying partners (${partnerIds.join(', ')}) of user ${userId} status change: ${eventName}`);

            // 4. Küldd el az értesítést minden partnernek a saját user-specifikus szobájába.
            //    Így csak az adott partner kapja meg az üzenetet, nem mindenki.
            partnerIds.forEach(partnerId => {
                // Fontos: Az io.to() egy szobának küld. A user-specifikus szoba neve a userId stringgé alakítva.
                // Feltételezzük, hogy minden csatlakozott kliens csatlakozik a saját userId szobájához is.
                io.to(partnerId.toString()).emit(eventName, statusData);
            });

        } catch (error) {
            console.error(`[Socket Handler] Error notifying matches about status for user ${userId}:`, error);
        }
    }

    // ==================================
    // ===      MIDDLEWARE           ===
    // ==================================

    // Authentikációs Middleware: Minden kapcsolat előtt lefut.
    io.use((socket, next) => {
        // Token kiolvasása a handshake adataiból (auth objektum vagy query paraméter)
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            console.error('[Socket Auth] Authentication error: No token provided.');
            // Opcionális: Küldhetünk egy hibaüzenetet a kliensnek, mielőtt bontjuk a kapcsolatot
            // socket.emit(EVENT.AUTHENTICATION_ERROR, { message: "No token provided" });
            return next(new Error("Authentication error: No token provided"));
        }

        // Token verifikálása
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('[Socket Auth] Authentication error: Invalid token.', err.message);
                // socket.emit(EVENT.AUTHENTICATION_ERROR, { message: "Invalid token" });
                return next(new Error("Authentication error: Invalid token"));
            }
            // Sikeres authentikáció esetén a dekódolt user adatokat a socket objektumhoz csatoljuk
            socket.user = decoded; // Tartalmazza pl. a user ID-t (socket.user.id)
            console.log(`[Socket Auth] User authenticated: ${socket.user.username} (ID: ${socket.user.id})`);
            next(); // Továbbengedjük a kapcsolatot a connection handler felé
        });
    });

    // ==================================
    // === KAPCSOLAT KEZELÉSI LOGIKA ===
    // ==================================

    io.on(EVENT.CONNECTION, (socket) => {
        // Ellenőrizzük, hogy a middleware sikeresen hozzáadta-e a user adatokat.
        if (!socket.user || typeof socket.user.id === 'undefined') {
            console.error("[Socket Connection] Connection attempt without valid user data after middleware. Disconnecting socket:", socket.id);
            socket.disconnect(true); // Bontjuk a kapcsolatot, ha nincs user adat
            return;
        }

        const userId = socket.user.id;
        const username = socket.user.username || 'Unknown'; // Ha van username a tokenben
        console.log(`[Socket Connection] User connected: ${username} (ID: ${userId}), Socket ID: ${socket.id}`);

        // --- Online státusz kezelése ---
        let userSockets = onlineUsers.get(userId);
        const wasOffline = !userSockets || userSockets.size === 0; // Igaz, ha ez az első kapcsolat ettől a usertől

        if (!userSockets) {
            userSockets = new Set();
            onlineUsers.set(userId, userSockets);
        }
        userSockets.add(socket.id); // Hozzáadjuk az új socketet a user kapcsolatainak listájához

        console.log(`[Socket Status] User ${userId} now has ${userSockets.size} active socket(s).`);

        // Csatlakozás a saját user ID-hoz tartozó szobához.
        // Ez teszi lehetővé, hogy az io.to(userId.toString()).emit(...) működjön.
        socket.join(userId.toString());
        console.log(`[Socket Room] Socket ${socket.id} joined user room: ${userId.toString()}`);

        // Ha a user *éppen most* lett online (ez volt az első kapcsolata), értesítsük a partnereit.
        if (wasOffline) {
            console.log(`[Socket Status] User ${userId} transitioned to ONLINE. Notifying matches.`);
            notifyMatchesAboutStatus(userId, true); // true = online
        }

        // ==================================
        // ===   TOVÁBBI ESEMÉNYEK      ===
        // ==================================

        // --- Match Szoba Kezelése ---
        socket.on(EVENT.JOIN_MATCH_ROOM, (matchId) => {
            if (!matchId) {
                console.warn(`[Socket Room] User ${userId} tried to join a null/undefined match room.`);
                return;
            }
            socket.join(matchId.toString());
            console.log(`[Socket Room] User ${userId} (Socket: ${socket.id}) joined match room: ${matchId}`);
        });

        socket.on(EVENT.LEAVE_MATCH_ROOM, (matchId) => {
            if (!matchId) {
                console.warn(`[Socket Room] User ${userId} tried to leave a null/undefined match room.`);
                return;
            }
            socket.leave(matchId.toString());
            console.log(`[Socket Room] User ${userId} (Socket: ${socket.id}) left match room: ${matchId}`);
        });

        // --- Üzenetküldés Kezelése ---
        socket.on(EVENT.SEND_MESSAGE, async (data) => {
            const { matchId, content } = data;
            const senderId = socket.user.id; // A küldő ID-ja a hitelesített socketből származik

            // Validálás
            if (!matchId || !content || typeof content !== 'string' || content.trim() === '') {
                console.warn(`[Socket Send Message] Invalid message data received from user ${senderId}. MatchID: ${matchId}, Content: ${content}`);
                // Opcionálisan küldhetünk hibaüzenetet a küldőnek
                // socket.emit('message_error', { message: "Invalid message data" });
                return;
            }

            try {
                // Ellenőrizzük, hogy a küldő tagja-e a matchnek
                const match = await Match.findOne({
                    where: {
                        id: matchId,
                        [Op.or]: [{ user1_id: senderId }, { user2_id: senderId }]
                    }
                });

                if (!match) {
                    console.warn(`[Socket Send Message] User ${senderId} tried to send message to match ${matchId} they are not part of.`);
                    // socket.emit('message_error', { message: "You are not part of this match." });
                    return;
                }

                // Üzenet mentése az adatbázisba
                const newMessage = await ChatMessage.create({
                    match_id: matchId,
                    sender_id: senderId,
                    content: content.trim() // Mentés előtt trimmeljük
                });

                // Küldő profilképének lekérése (opcionális, de jó a UI-hoz)
                // Itt feltételezzük, hogy a legelső kép a releváns profilkép
                const senderImage = await UserImages.findOne({
                    where: { userId: senderId },
                    attributes: ['imgUrl'],
                    order: [['id', 'ASC']], // Vagy createdAt, ha az relevánsabb
                    required: false // Lehet, hogy nincs képe
                });
                const senderImageUrl = senderImage ? senderImage.imgUrl : null; // Használj default képet, ha null

                // Előkészítjük az üzenet objektumot, amit a klienseknek küldünk
                const messageToSend = {
                    id: newMessage.id,
                    match_id: newMessage.match_id,
                    sender_id: newMessage.sender_id,
                    content: newMessage.content,
                    createdAt: newMessage.createdAt,
                    // Beágyazzuk a küldő alapadatait, hogy a kliensnek ne kelljen külön lekérdeznie
                    sender: {
                        id: senderId,
                        username: socket.user.username, // A tokenből jön
                        profileImageUrl: senderImageUrl
                    }
                };

                // Üzenet küldése a match szobában lévő *összes* kliensnek (beleértve a küldőt is)
                io.to(matchId.toString()).emit(EVENT.NEW_MESSAGE, messageToSend);
                console.log(`[Socket Send Message] User ${senderId} sent message to match ${matchId}`);

            } catch (error) {
                console.error(`[Socket Send Message] Error sending message for user ${senderId} in match ${matchId}:`, error);
                // Fontold meg hiba küldését a kliensnek
                // socket.emit('message_error', { message: "Failed to send message. Please try again." });
            }
        });

        // ==================================
        // ===   LECSATLAKOZÁS KEZELÉSE ===
        // ==================================
        socket.on(EVENT.DISCONNECT, (reason) => {
            console.log(`[Socket Disconnect] User disconnected: ${username} (ID: ${userId}), Socket ID: ${socket.id}. Reason: ${reason}`);

            // --- Online státusz frissítése ---
            const userSockets = onlineUsers.get(userId);

            // Előfordulhat (bár nem kellene), hogy a user nincs a listában, pl. ha a connect előtt megszakadt
            if (!userSockets) {
                console.warn(`[Socket Disconnect] User ${userId} disconnected, but was not found in onlineUsers map.`);
                return;
            }

            // Távolítsuk el az éppen lecsatlakozott socketet a Set-ből
            userSockets.delete(socket.id);

            console.log(`[Socket Status] User ${userId} now has ${userSockets.size} active socket(s) after disconnect.`);

            // Ha ez volt az *utolsó* aktív kapcsolata ennek a usernek...
            if (userSockets.size === 0) {
                // ...akkor távolítsuk el teljesen az online userek közül...
                onlineUsers.delete(userId);
                console.log(`[Socket Status] User ${userId} transitioned to OFFLINE (last socket disconnected). Notifying matches.`);
                // ...és értesítsük a partnereit, hogy offline lett.
                notifyMatchesAboutStatus(userId, false); // false = offline
            }
            // Ha maradt még aktív kapcsolata (pl. másik böngészőfül), akkor nem vált offline-ná,
            // így nem küldünk offline értesítést.
        });

    }); // io.on('connection') vége

    console.log("[Socket Handler] Socket.IO initialized and ready for connections.");
    return io;
}

module.exports = initializeSocket;