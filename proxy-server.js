const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const RIOT_API_TOKEN = process.env.RIOT_API_TOKEN;
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Active CORS pour toutes les routes
app.use(cors());
app.use(express.json());

// ✅ Corrige le chemin des fichiers statiques
app.use(express.static(path.join(__dirname, 'templates')));
app.use('/static', express.static(path.join(__dirname, 'static')));


// ✅ Corrige la route pour afficher le fichier HTML
app.get('/RiotAPI_Classement', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'RiotAPI_Classement.html'));
});

// ✅ Corrige la route pour afficher le fichier HTML
app.get('/RiotAPI_Bets', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'RiotAPI_Bets.html'));
});

// ✅ Corrige la route pour afficher le fichier HTML
app.get('/RiotAPI_Statistique', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'RiotAPI_Statistique.html'));
});

// ✅ Corrige la route pour afficher le fichier HTML
app.get('/RiotAPI_Parties', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'RiotAPI_Parties.html'));
});


// ✅ Corrige la route pour afficher le fichier HTML
app.get('/RiotAPI_Masteries', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'RiotAPI_Masteries.html'));
});

// Fonction utilitaire pour faire une requête externe
async function fetchRiotAPI(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Riot-Token': RIOT_API_TOKEN, // Utilisez la variable globale
            }
        });
        if (!response.ok) {
            throw new Error(`Erreur API Riot : ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la requête API Riot:', error.message);
        throw error;
    }
}

// Route pour obtenir le PUUID à partir du gameName et du tagLine
app.get('/proxy/riot/account/v1/accounts/by-riot-id/:gameName/:tagLine', async (req, res) => {
    const { gameName, tagLine } = req.params;
    const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du PUUID' });
    }
});

// Route pour obtenir les informations du compte Riot à partir du PUUID
app.get('/proxy/riot/account/v1/accounts/by-puuid/:puuid', async (req, res) => {
    const { puuid } = req.params;

    const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
    
    try {
        const data = await fetchRiotAPI(url); // Utilisation de fetchRiotAPI pour l'appel API
        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du compte Riot:', error.message);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations du compte Riot' });
    }
});

// Route pour obtenir les données du summoner à partir du PUUID
app.get('/proxy/lol/summoner/v4/summoners/by-puuid/:puuid', async (req, res) => {
    const { puuid } = req.params;
    const url = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des données du summoner' });
    }
});

// Route pour obtenir les données de classement à partir de l'ID du summoner
app.get('/proxy/lol/league/v4/entries/by-summoner/:summonerId', async (req, res) => {
    const { summonerId } = req.params;
    const url = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des données de classement' });
    }
});

app.get('/proxy/lol/spectator/v5/active-games/by-summoner/:gamePuuid', async (req, res) => {
    const { gamePuuid } = req.params;
    const url = `https://euw1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(gamePuuid)}`;

    try {
        const data = await fetchRiotAPI(url);

        res.json(data);
    } catch (error) {
        res.status(404).json({ error: 'Erreur lors de la récupération des données de la partie en cours' });
    }
});

// Route pour obtenir l'historique des partie à partir du PUUID avec un paramètre count
app.get('/proxy/lol/match/v5/matches/by-puuid/:puuid', async (req, res) => {
    const { puuid } = req.params;
    const { count = 10 } = req.query; // Par défaut, récupère 10 parties si count n'est pas spécifié

    const url = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${encodeURIComponent(count)}`;

    try {
        const data = await fetchRiotAPI(url); // Utilisation de fetchRiotAPI
        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la récupération de l’historique des parties:', error.message);
        res.status(500).json({ error: 'Erreur lors de la récupération de l’historique des parties' });
    }
});

app.get('/proxy/lol/match/v5/matches/:matchId', async (req, res) => {
    const { matchId } = req.params;
    const url = `https://europe.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(200).json({ error: 'Match non existant ou encore en cours' });
    }
});

// Route pour obtenir les détails d’un match à partir du matchId
app.get('/proxy/lol/match/v5/matches/:matchId/timeline', async (req, res) => {
    const { matchId } = req.params;
    const url = `https://europe.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}/timeline`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des détails du match' });
    }
});

// Route pour obtenir les détails d’un joueur à partir du puuid
app.get('/proxy/riot/account/v1/accounts/by-puuid/:puuid', async (req, res) => {
    const { puuid } = req.params;
    const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des détails du summoner' });
    }
});

app.get('/proxy/lol/champion-mastery/v4/champion-masteries/by-puuid/:puuid', async (req, res) => {
    const { puuid } = req.params;
    const url = `https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des détails du summoner' });
    }
});

app.post('/ajouter-summoner', (req, res) => {
    console.log('Données reçues:', req.body);  // Vérifie ce qui est reçu dans req.body

    // Extraire les données envoyées
    const { gamePuuid, gameName, tagLine, summonerID, level, profileIconId, tier, rank, leaguePoints } = req.body;

    // Vérifie si gamePuuid est bien présent dans la requête
    if (!gamePuuid) {
        return res.status(400).json({ message: 'gamePuuid manquant' });
    }

    // Vérifie si les autres informations sont présentes (facultatif, mais c'est une bonne pratique)
    if (!gameName || !tagLine || !summonerID || !level || !profileIconId) {
        return res.status(400).json({ message: 'Des informations sont manquantes' });
    }

    // Vérifier si le gamePuuid existe déjà dans la base de données
    const checkSummonerQuery = 'SELECT * FROM joueurs WHERE gamePuuid = ?';
    db.query(checkSummonerQuery, [gamePuuid], (err, results) => {
        if (err) {
            console.error('❌ Erreur de requête:', err);
            return res.status(500).json({ message: 'Erreur interne lors de la vérification du summoner.' });
        }

        // Si le gamePuuid existe déjà, retourner une erreur
        if (results.length > 0) {
            return res.status(400).json({ message: 'Le summoner avec ce gamePuuid existe déjà dans la base de données.' });
        }

        // Si le gamePuuid n'existe pas, insérer les données dans la base de données
        const insertQuery = 'INSERT INTO joueurs (gamePuuid, gameName, tagLine, summonerID, level, profileIconId, tier, \`rank\`, leaguePoints) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(insertQuery, [gamePuuid, gameName, tagLine, summonerID, level, profileIconId, tier, rank, leaguePoints], (err, results) => {
            if (err) {
                console.error('❌ Erreur d\'insertion dans la base de données:', err);
                return res.status(500).json({ message: 'Erreur lors de l\'ajout du summoner.' });
            }

            // Retourner une réponse après avoir ajouté le summoner
            res.status(200).json({ message: '✅ Summoner ajouté avec succès !' });
        });
    });
});

app.delete('/SupprimerJoueur/:gamePuuid', (req, res) => {
    const gamePuuid = req.params.gamePuuid;

    // Requête SQL pour supprimer un joueur
    const sql = 'DELETE FROM joueurs WHERE gamePuuid = ?';
    db.query(sql, [gamePuuid], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur lors de la suppression du joueur' });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Joueur supprimé avec succès' });
        } else {
            res.status(404).json({ message: 'Joueur non trouvé' });
        }
    });
});

app.post('/update-summoner', (req, res) => {
    console.log('🔄 Mise à jour des données reçues:', req.body);

    const { gamePuuid, gameName, tagLine, summonerID, level, profileIconId, tier, rank, leaguePoints } = req.body;

    if (!gamePuuid) {
        return res.status(400).json({ message: '❌ gamePuuid manquant' });
    }

        // Vérifie si les autres informations sont présentes (facultatif, mais c'est une bonne pratique)
    if (!gameName || !tagLine || !summonerID || !level || !profileIconId) {
        return res.status(400).json({ message: 'Des informations sont manquantes' });
    }

    // Vérifier si le gamePuuid existe déjà
    const checkSummonerQuery = 'SELECT * FROM joueurs WHERE gamePuuid = ?';
    db.query(checkSummonerQuery, [gamePuuid], (err, results) => {
        if (err) {
            console.error('❌ Erreur SQL:', err);
            return res.status(500).json({ message: 'Erreur interne lors de la vérification du summoner.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: '❌ Summoner introuvable, mise à jour impossible.' });
        }

        // Si le gamePuuid existe, on met à jour les données
        const updateQuery = `
            UPDATE joueurs 
            SET gameName = ?, tagLine = ?, summonerID = ?, level = ?, profileIconId = ?, tier = ?, \`rank\` = ?, leaguePoints = ? 
            WHERE gamePuuid = ?
        `;

        db.query(updateQuery, [gameName, tagLine, summonerID, level, profileIconId, tier, rank, leaguePoints, gamePuuid], (err, results) => {
            if (err) {
                console.error('❌ Erreur lors de la mise à jour:', err);
                return res.status(500).json({ message: 'Erreur lors de la mise à jour du summoner.' });
            }

            res.status(200).json({ message: '✅ Summoner mis à jour avec succès !' });
        });
    });
});

app.get('/get-puuid', (req, res) => {
    
    if (!db) {
        return res.status(500).json({ message: '❌ Erreur de connexion à la base de données.' });
    }

    // Sélectionner uniquement la colonne gamePuuid
    const query = 'SELECT gamePuuid FROM joueurs';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Erreur lors de la récupération des PUUIDs:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des PUUIDs' });
        }

        // Extraire uniquement les gamePuuid sous forme de tableau
        const puuids = results.map(row => row.gamePuuid);

        res.json(puuids); // Retourner un tableau contenant seulement les gamePuuid
    });
});

app.get('/get-joueurs', (req, res) => {
    
    if (!db) {
        // Si la connexion échoue, renvoie une erreur
        return res.status(500).json({ message: 'Erreur de connexion à la base de données.' });
    }

    const query = 'SELECT * FROM joueurs';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Erreur lors de la récupération des joueurs:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des joueurs' });
        }

        // Retourner les résultats en format JSON
        res.json(results);
    });
});

app.post('/ajouter-bets', (req, res) => {
    console.log('Données reçues:', req.body);  // Vérifie ce qui est reçu dans req.body

    // Extraire les données envoyées
    const { gamePuuid, gameId, bet_amount, bet_teamId } = req.body;

    // Vérifie si les autres informations sont présentes
    if (!gamePuuid || !gameId || !bet_amount || !bet_teamId) {
        return res.status(400).json({ message: 'Des informations sont manquantes' });
    }

    // Ajouter "EUW_1" devant le gameId
    const modifiedGameId = `EUW1_${gameId}`;
    
    // Vérification si le joueur existe dans la table joueurs
    const checkPlayerQuery = 'SELECT * FROM joueurs WHERE gamePuuid = ?';
    db.query(checkPlayerQuery, [gamePuuid], (err, results) => {
        if (err) {
            console.error('❌ Erreur de vérification du joueur:', err);
            return res.status(500).json({ message: 'Erreur interne lors de la vérification du joueur.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Le joueur avec ce gamePuuid n\'existe pas dans la base de données.' });
        }

        const player = results[0];

        // Vérification si le joueur a suffisamment de balance pour parier
        const playerBalance = parseFloat(player.balance);
        if (playerBalance < bet_amount) {
            return res.status(400).json({ message: 'Solde insuffisant pour effectuer ce pari.' });
        }

        // Début d'une transaction SQL pour garantir la cohérence des données
        db.beginTransaction(err => {
            if (err) {
                console.error('❌ Erreur lors du début de la transaction:', err);
                return res.status(500).json({ message: 'Erreur interne.' });
            }

            // Insérer le pari dans la table bets
            const insertBetQuery = 'INSERT INTO bets (gamePuuid, gameId, bet_amount, bet_teamId) VALUES (?, ?, ?, ?)';
            db.query(insertBetQuery, [gamePuuid, modifiedGameId, bet_amount, bet_teamId], (err, results) => {
                if (err) {
                    console.error('❌ Erreur d\'insertion du pari:', err);
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Erreur lors de l\'ajout du pari.' });
                    });
                }

                // Mettre à jour la balance du joueur
                const updateBalanceQuery = 'UPDATE joueurs SET balance = balance - ? WHERE gamePuuid = ?';
                db.query(updateBalanceQuery, [bet_amount, gamePuuid], (err, results) => {
                    if (err) {
                        console.error('❌ Erreur de mise à jour du solde:', err);
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Erreur lors de la mise à jour du solde du joueur.' });
                        });
                    }

                    // Ajouter une transaction dans la table transactions
                    const insertTransactionQuery = 'INSERT INTO transactions (gamePuuid, transaction_type, amount) VALUES (?, ?, ?)';
                    db.query(insertTransactionQuery, [gamePuuid, 'bet_deposit', bet_amount], (err, results) => {
                        if (err) {
                            console.error('❌ Erreur d\'ajout de la transaction:', err);
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Erreur lors de l\'ajout de la transaction.' });
                            });
                        }

                        // Valider la transaction SQL
                        db.commit(err => {
                            if (err) {
                                console.error('❌ Erreur lors de la validation de la transaction:', err);
                                return db.rollback(() => {
                                    res.status(500).json({ message: 'Erreur lors de la validation de la transaction.' });
                                });
                            }

                            res.status(200).json({ message: '✅ Pari ajouté avec succès, solde mis à jour et transaction enregistrée !' });
                        });
                    });
                });
            });
        });
    });
});

app.get('/get-bets', (req, res) => {
    const getAllBetsQuery = `
        SELECT gamePuuid, gameId, bet_amount, bet_teamId, bet_status 
        FROM bets
    `;

    db.query(getAllBetsQuery, (err, results) => {
        if (err) {
            console.error('❌ Erreur lors de la récupération des paris:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des paris.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Aucun pari trouvé.' });
        }

        res.status(200).json(results);
    });
});

app.get('/get-games', (req, res) => {
    // Requête pour récupérer les parties en statut "in_progress"
    const getPendingGamesQuery = `SELECT gameId, game_status FROM games WHERE game_status = 'in_progress'`;

    db.query(getPendingGamesQuery, (err, results) => {
        if (err) {
            console.error('❌ Erreur lors de la récupération des parties en attente:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des parties.' });
        }

        // Si aucune partie n'est trouvée, retourner une réponse vide mais avec un statut 200
        if (results.length === 0) {
            return res.status(200).json([]); // Pas d'erreur, juste aucune partie en attente
        }

        // Retourner les résultats sous forme de réponse JSON
        res.status(200).json(results);
    });
});

app.post('/ajouter-game', (req, res) => {
    console.log('Données reçues:', req.body);  // Vérifie ce qui est reçu dans req.body

    // Extraire les données envoyées
    const { gameId, gameStartTime } = req.body;

    // Vérifie si gameId est bien présent dans la requête
    if (!gameId) {
        return res.status(400).json({ message: 'gameId manquant' });
    }

    // Vérifie si les autres informations sont présentes
    if (!gameStartTime) {
        return res.status(400).json({ message: 'Des informations sont manquantes' });
    }

    // Ajouter "EUW_1" devant le gameId
    const modifiedGameId = `EUW1_${gameId}`;

    // Si gameStartTime est un timestamp Unix en millisecondes
    const formattedGameStartTime = new Date(gameStartTime).toISOString().slice(0, 19).replace("T", " ");

    // Vérifier si le gameId existe déjà dans la base de données
    const checkGameQuery = 'SELECT * FROM games WHERE gameId = ?';
    db.query(checkGameQuery, [modifiedGameId], (err, results) => {
        if (err) {
            console.error('❌ Erreur de requête:', err);
            return res.status(500).json({ message: 'Erreur interne lors de la vérification de la partie.' });
        }

        // Si le gameId existe déjà, ne pas insérer et renvoyer un message de succès
        if (results.length > 0) {
            return res.status(200).json({ message: '✅ La partie existe déjà dans la base de données.' });
        }

        // Si le gameId n'existe pas, insérer les données dans la base de données
        const insertQuery = 'INSERT INTO games (gameId, game_start_time) VALUES (?, ?)';
        db.query(insertQuery, [modifiedGameId, formattedGameStartTime], (err, results) => {
            if (err) {
                console.error('❌ Erreur d\'insertion dans la base de données:', err);
                return res.status(500).json({ message: 'Erreur lors de l\'ajout de la partie.' });
            }

            // Retourner une réponse après avoir ajouté la partie
            res.status(200).json({ message: '✅ Partie ajoutée avec succès !' });
        });
    });
});


app.post('/update-game', (req, res) => {
    console.log('Match reçues:', req.body);  // Vérifie ce qui est reçu dans req.body

    // Extraire les données envoyées
    const { gameId, gameEndTime, gameStatus, winnerTeamId } = req.body;

    // Vérifie si gameId est bien présent dans la requête
    if (!gameId) {
        return res.status(400).json({ message: 'gameId manquant' });
    }

    // Vérifie si les autres informations sont présentes
    if (!gameEndTime || !gameStatus || !winnerTeamId) {
        return res.status(400).json({ message: 'Des informations sont manquantes' });
    }

    // Vérifier si le gameId existe déjà dans la base de données
    const checkGameQuery = 'SELECT * FROM games WHERE gameId = ?';
    db.query(checkGameQuery, [gameId], (err, results) => {
        if (err) {
            console.error('❌ Erreur de requête:', err);
            return res.status(500).json({ message: 'Erreur interne lors de la vérification de la partie.' });
        }

        // Si le gameId n'existe pas, renvoyer un message d'erreur
        if (results.length === 0) {
            return res.status(404).json({ message: '❌ Partie non trouvée dans la base de données.' });
        }

        // Si gameEndTime est un timestamp Unix en millisecondes
        const formattedGameEndTime = new Date(gameEndTime).toISOString().slice(0, 19).replace("T", " ");

        // Créer un objet matchDetails avec les nouvelles informations
        const matchDetails = {
            gameEndTime: formattedGameEndTime, // game_end_time
            gameStatus: gameStatus, // game_status
            winnerTeamId: winnerTeamId, // winner_team_id
        };

        // Mettre à jour les informations du jeu dans la base de données
        const updateGameQuery = `
            UPDATE games 
            SET game_end_time = ?, game_status = ?, winner_team_id = ? 
            WHERE gameId = ?
        `;

        db.query(updateGameQuery, [matchDetails.gameEndTime, matchDetails.gameStatus, matchDetails.winnerTeamId, gameId], (err, results) => {
            if (err) {
                console.error('❌ Erreur lors de la mise à jour du jeu:', err);
                return res.status(500).json({ message: 'Erreur lors de la mise à jour de la partie.' });
            }

            // Retourner une réponse après avoir mis à jour les informations du jeu
            res.status(200).json({ message: '✅ Partie mise à jour avec succès !' });
        });
    });
});


app.post('/update-bets', (req, res) => {
    // Étape 1 : Chercher les paris en statut "pending"
    const getPendingBetsQuery = `
        SELECT b.bet_id, b.gamePuuid, b.bet_amount, b.bet_teamId, b.gameId, g.game_status, g.winner_team_id
        FROM bets b
        JOIN games g ON b.gameId = g.gameId
        WHERE b.bet_status = 'pending' AND g.game_status = 'completed'
    `;

    db.query(getPendingBetsQuery, async (err, results) => {
        if (err) {
            console.error('❌ Erreur lors de la récupération des paris en attente:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des paris.' });
        }

        // Vérification qu'il y a des paris en attente
        if (results.length === 0) {
            return res.status(200).json({ message: 'Aucun pari en attente à traiter.' });
        }
        

        // Étape 2 : Traiter chaque pari en attente
        for (const bet of results) {
            const { bet_id, gamePuuid, bet_amount, bet_teamId, gameId, game_status, winner_team_id } = bet;

            // Étape 3 : Vérifier si le jeu est "completed"
            if (game_status === 'completed') {
                // Vérifier si l'équipe du joueur est la même que l'équipe gagnante
                const betWon = bet_teamId === winner_team_id;

                // Étape 4 : Mettre à jour le statut du pari (gagné ou perdu)
                const updateBetQuery = `
                    UPDATE bets
                    SET bet_status = ?
                    WHERE bet_id = ?;
                `;
                const newBetStatus = betWon ? 'won' : 'lost';

                db.query(updateBetQuery, [newBetStatus, bet_id], (err) => {
                    if (err) {
                        console.error(`❌ Erreur lors de la mise à jour du pari ${bet_id}:`, err);
                    }
                });

                // Étape 5 : Mettre à jour la balance du joueur si le pari a été gagné
                const playerBalanceQuery = 'SELECT balance FROM joueurs WHERE gamePuuid = ?';
                db.query(playerBalanceQuery, [gamePuuid], (err, results) => {
                    if (err) {
                        console.error('❌ Erreur lors de la récupération du solde du joueur:', err);
                        return;
                    }

                    if (results.length === 0) {
                        console.error('❌ Joueur introuvable pour le gamePuuid:', gamePuuid);
                        return;
                    }

                    const player = results[0];
                    let newBalance;
                    if (betWon) {
                        // Double la mise du joueur en cas de victoire
                        newBalance = player.balance + bet_amount * 2; // Ajout du gain

                        // Ajouter une transaction pour la victoire
                        const transactionQuery = `
                            INSERT INTO transactions (gamePuuid, transaction_type, amount)
                            VALUES (?, 'bet_win', ?);
                        `;
                        db.query(transactionQuery, [gamePuuid, bet_amount * 2], (err) => {
                            if (err) {
                                console.error(`❌ Erreur lors de l'ajout de la transaction pour le pari ${bet_id}:`, err);
                            }
                        });
                    } else {
                        // Si perdu, rien n'est ajouté à la balance
                        newBalance = player.balance; // Pas de changement

                        // Ajouter une transaction pour la perte
                        const transactionQuery = `
                            INSERT INTO transactions (gamePuuid, transaction_type, amount)
                            VALUES (?, 'bet_lose', ?);
                        `;
                        db.query(transactionQuery, [gamePuuid, bet_amount], (err) => {
                            if (err) {
                                console.error(`❌ Erreur lors de l'ajout de la transaction pour le pari ${bet_id}:`, err);
                            }
                        });
                    }

                    // Mettre à jour la balance du joueur
                    const updateBalanceQuery = 'UPDATE joueurs SET balance = ? WHERE gamePuuid = ?';
                    db.query(updateBalanceQuery, [newBalance, gamePuuid], (err) => {
                        if (err) {
                            console.error(`❌ Erreur lors de la mise à jour de la balance du joueur ${gamePuuid}:`, err);
                        }
                    });
                });
            } else {
                console.log(`Le jeu ${gameId} n'est pas terminé. Aucun changement pour ce pari.`);
            }
        }

        res.status(200).json({ message: 'Mise à jour des paris terminée.' });
    });
});

app.get('/get-bets_all', (req, res) => {
    // Requête SQL mise à jour pour récupérer le gameName et le tagLine des joueurs
    const getBetsQuery = `
        SELECT 
            b.bet_id, 
            j.gameName, 
            j.tagLine, 
            b.bet_amount, 
            b.bet_teamId, 
            b.bet_status, 
            b.gameId, 
            b.bet_time,
            g.game_status, 
            g.winner_team_id
        FROM bets b
        JOIN games g ON b.gameId = g.gameId
        JOIN joueurs j ON b.gamePuuid = j.gamePuuid;
    `;

    db.query(getBetsQuery, (err, results) => {
        if (err) {
            console.error('❌ Erreur lors de la récupération des paris:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des paris.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Aucun pari trouvé.' });
        }

        // Envoie les paris sous forme de JSON
        res.status(200).json(results);
    });
});

/*app.post('/ajouter-participants', (req, res) => {
    console.log('Données reçues:', req.body);

    // Extraire les données
    const { gameId, gamePuuid, teamId, championPlayed } = req.body;

    // Vérification des données
    if (!gameId || !gamePuuid || !teamId || !championPlayed) {
        return res.status(400).json({ message: "Des informations sont manquantes" });
    }

    const checkGameQuery = 'SELECT gameId FROM games WHERE gameId = ?';

    db.query(checkGameQuery, [gameId], (err, results) => {
        if (err) {
            console.error("❌ Erreur lors de la vérification de gameId :", err);
            return res.status(500).json({ message: "Erreur serveur." });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: "gameId inexistant dans la table games" });
        }

        // Insérer le participant
        const insertQuery = 'INSERT INTO participants (gameId, gamePuuid, teamId, championPlayed) VALUES (?, ?, ?, ?)';
        db.query(insertQuery, [gameId, gamePuuid, teamId, championPlayed], (err, results) => {
            if (err) {
                console.error("❌ Erreur d'insertion :", err);
                return res.status(500).json({ message: "Erreur lors de l'ajout du participant." });
            }
            res.status(200).json({ message: "✅ Participant ajouté avec succès !" });
        });
    });
});
*/
function ConnexionBDD(host, utilisateur, motDePasse, baseDeDonnees) {
    const connection = mysql.createConnection({
        host: host,
        user: utilisateur,
        password: motDePasse,
        database: baseDeDonnees
    });

    connection.connect((err) => {
        if (err) {
            console.error('Erreur lors de la connexion :', err);
            return null;
        }
        console.log('Connexion réussie à la base de données.');
    });

    return connection;
}

const db = ConnexionBDD(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Proxy serveur en écoute sur le port ${PORT}`);
});