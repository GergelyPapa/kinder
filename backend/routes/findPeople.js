const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const UserImages = require('../models/UserImages');
const Match = require('../models/Match');

// Helyes import a date-fns-ből
const { subYears, format } = require('date-fns'); // Szükség lehet a format-ra is, bár Sequelize lehet kezeli a Date objectet

const router = express.Router();

router.post('/findPeople', async (req, res) => {
    // Vedd ki az ID-t a body-ból
    const currentUserId = req.body.userId;

    try {
        // Ellenőrizd, hogy currentUserId létezik és érvényes
        if (currentUserId === undefined || currentUserId === null /* || isNaN(parseInt(currentUserId)) */) {
            console.error('Invalid or missing currentUserId in request body:', currentUserId);
            return res.status(400).json({ message: 'Hiányzó vagy érvénytelen felhasználói azonosító (id) a kérés törzsében.' });
        }

        const { searchedSex, minAge, maxAge } = req.body;

        // Meglévő validálások...
        if (!searchedSex || minAge === undefined || maxAge === undefined) {
            return res.status(400).json({ message: 'Hiányzó adatok: searchedSex, minAge és maxAge szükséges.' });
        }
        if (minAge < 18) {
             // Itt lehet, hogy a minAge-t is érdemes lenne magasabbra állítani, ha a maxAge is meg van adva,
             // de a feladat most a dátumok kezelése. A frontend validációval ezt érdemes megfogni.
            return res.status(400).json({ message: 'Az életkor nem lehet 18 évnél kevesebb.' });
        }
        if (maxAge < 18 || minAge > maxAge) { // maxAge sem lehet 18 alatt
            return res.status(400).json({ message: 'Érvénytelen életkor tartomány.' });
        }

        // --- Életkor alapján dátumhatárok számítása ---
        const today = new Date(); // Mindig az aktuális napot használjuk!

        // Legkésőbbi születési dátum (a minAge eléréséhez)
        // Aki ezen a napon vagy korábban született, az legalább minAge éves.
        const latestDob = subYears(today, minAge);

        // Legkorábbi születési dátum (hogy ne legyen idősebb maxAge-nél)
        // Aki ezen a napon vagy később született, az legfeljebb maxAge éves.
        const earliestDob = subYears(today, maxAge);

        // Opcionális: Formázás YYYY-MM-DD stringgé, ha Sequelize nem kezelné jól a Date objektumot
        // Bár általában kezeli, főleg ha a DB oszlop típusa DATE vagy DATETIME
        // const formattedLatestDob = format(latestDob, 'yyyy-MM-dd');
        // const formattedEarliestDob = format(earliestDob, 'yyyy-MM-dd');
        // console.log(`Keresési dátumtartomány: ${formattedEarliestDob} - ${formattedLatestDob}`);


        // Meglévő matchek lekérdezése...
        const existingMatches = await Match.findAll({
            where: {
                [Op.or]: [
                    { user1_id: currentUserId },
                    { user2_id: currentUserId }
                ]
            },
            attributes: ['user1_id', 'user2_id']
        });

        const matchedPartnerIds = existingMatches.map(match =>
            match.user1_id === currentUserId ? match.user2_id : match.user1_id
        );

        const excludedUserIds = [currentUserId, ...matchedPartnerIds].filter(id => id != null);

        // Felhasználók keresése a számított dátumhatárokkal
        const people = await User.findAll({
            where: {
                sex: searchedSex,
                // Itt használjuk a kiszámolt dátumokat
                dob: {
                    // A születési dátumnak a legkorábbi és legkésőbbi elfogadható dátum KÖZÖTT kell lennie (inkluzív)
                    [Op.between]: [earliestDob, latestDob]
                    // Használhatnánk formattedEarliestDob és formattedLatestDob is, ha szükséges lenne
                },
                id: {
                    [Op.notIn]: excludedUserIds
                }
            },
            attributes: {
                exclude: ['passwordHash']
            },
            include: [
                {
                    model: UserImages,
                    as: 'images',
                    attributes: ['imgUrl'],
                    required: false // Fontos, hogy ne zárja ki azokat, akiknek nincs képük
                }
            ]
        });

        // Eredmény visszaküldése (változatlan)
        // Nem kell külön ellenőrizni a people.length === 0-t, üres tömböt ad vissza a json([]) is.
        res.status(200).json(people);

    } catch (error) {
        console.error(`Hiba a /findPeople útvonalon (User ID: ${currentUserId || 'N/A'}):`, error);
        res.status(500).json({ message: 'Szerverhiba történt a felhasználók keresése közben.' });
    }
});

module.exports = router;