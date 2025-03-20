const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');
const Buffer = require('buffer').Buffer; // Pour encoder en base64
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const RIOT_API_TOKEN = process.env.RIOT_API_TOKEN;
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const clientId = process.env.clientId;
const secret = process.env.secret;
const JWT_SECRET = process.env.JWT_SECRET || 'superSecretKey123';

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

// ✅ Corrige la route pour afficher le fichier HTML
app.get('/RiotAPI_Paypal', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'RiotAPI_Paypal.html'));
});

// ✅ Corrige la route pour afficher le fichier HTML
app.get('/RiotAPI_Paypal2', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'RiotAPI_Paypal2.html'));
});

// Fonction utilitaire pour faire une requête avec gestion du rate limit
async function fetchRiotAPI(url, retries = 5, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Riot-Token': RIOT_API_TOKEN,
                }
            });

            const data = await response.json();

            // Vérifier si Riot API retourne un rate limit (429)
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay * attempt; // Si "Retry-After" est disponible, on l'utilise
                console.warn(`Rate limit Riot API atteint. Nouvelle tentative dans ${waitTime / 1000} secondes...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue; // Réessayer la requête
            }

            return data; // Retourner les données si tout va bien
        } catch (error) {
            console.error(`Erreur lors de la requête Riot API (tentative ${attempt}/${retries}):`, error.message);
            
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt)); // Attente exponentielle
            } else {
                throw new Error("Impossible de contacter l'API Riot après plusieurs tentatives.");
            }
        }
    }
}

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé, token manquant' });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token invalide' });
    }
};

//RIOT//

// Route pour obtenir le PUUID à partir du gameName et du tagLine
app.get('/proxy/riot/account/v1/accounts/by-riot-id/:gameName/:tagLine', async (req, res) => {
    const { gameName, tagLine } = req.params;
    const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur API : Récupération du PUUID', gameName, tagLine });
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
        res.status(500).json({ message: 'Erreur API : Récupération des informations du compte Riot', puuid });
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
        res.status(500).json({ message: 'Erreur API : Récupération des données du summoner', puuid });
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
        res.status(500).json({ message: 'Erreur API : Récupération des données de classement', summonerId });
    }
});

app.get('/proxy/lol/champion-mastery/v4/champion-masteries/by-puuid/:puuid', async (req, res) => {
    const { puuid } = req.params;
    const url = `https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur API : Récupération des masteries du summoner' });
    }
});

app.get('/proxy/lol/spectator/v5/active-games/by-summoner/:gamePuuid', async (req, res) => {
    const { gamePuuid } = req.params;
    const url = `https://euw1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(gamePuuid)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);
    } catch (error) {
            res.status(500).json({ message: 'Erreur API : Récupération des données de la partie en cours', gamePuuid });
        }
});

// Route pour obtenir l'historique des partie à partir du PUUID avec un paramètre count
app.get('/proxy/lol/match/v5/matches/by-puuid/:puuid', async (req, res) => {
    const { puuid } = req.params;
    const { count = 10 } = req.query;
    const url = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${encodeURIComponent(count)}`;

    try {
        const data = await fetchRiotAPI(url); // Utilisation de fetchRiotAPI
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur API : Récupération de l’historique des parties', puuid });
    }
});

app.get('/proxy/lol/match/v5/matches/:matchId', async (req, res) => {
    const { matchId } = req.params;
    const url = `https://europe.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;

    try {
        const data = await fetchRiotAPI(url);
        res.json(data);

    } catch (error) {
        res.status(500).json({ message: 'Erreur API : Récupération du match ', matchId });
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
        res.status(500).json({ message: 'Erreur API : Récupération des détails du match', matchId });
    }
});

//BDD JOUEURS//

app.post('/ajouter-joueurs', async (req, res) => {
    const { gamePuuid, gameName, tagLine, summonerID, level, profileIconId, tier, rank, leaguePoints, password } = req.body;
    const balance = 0;

    if (!gamePuuid || !gameName || !tagLine || !summonerID || !level || !profileIconId || !password) {
        return res.status(400).json({ message: 'Des informations sont manquantes' });
    }

    // Vérifier si le gamePuuid existe déjà dans la base de données
    db.query('SELECT * FROM joueurs WHERE gamePuuid = ?', [gamePuuid], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Le summoner avec ce gamePuuid existe déjà dans la base de données.' });
        }

        try {
            // Hachage du mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertion du joueur avec le mot de passe haché
            db.query(
                'INSERT INTO joueurs (gamePuuid, gameName, tagLine, summonerID, level, profileIconId, tier, `rank`, leaguePoints, balance, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [gamePuuid, gameName, tagLine, summonerID, level, profileIconId, tier, rank, leaguePoints, balance, hashedPassword],
                (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: 'Erreur avec la base de données' });
                    }
                    res.status(201).json({ message: '✅ Summoner ajouté avec succès !' });
                }
            );
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors du hachage du mot de passe' });
        }
    });
});

app.delete('/supprimer-joueurs', (req, res) => {
    const gamePuuid = req.params.gamePuuid;

    // Requête SQL pour supprimer un joueur
    db.query('DELETE FROM joueurs WHERE gamePuuid = ?', [gamePuuid], (err, result) => {

        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        if (result.affectedRows === 0) {  // Correction ici
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }

        res.status(200).json({ message: 'Joueur supprimé avec succès' });

    });
});

app.post('/maj-joueurs', (req, res) => {
    const { gamePuuid, gameName, tagLine, summonerID, level, profileIconId, tier, rank, leaguePoints } = req.body;

    if (!gamePuuid) {
        return res.status(400).json({ message: '❌ gamePuuid manquant' });
    }

    if (!gameName || !tagLine || !summonerID || !level || !profileIconId) {
        return res.status(400).json({ message: 'Des informations sont manquantes' });
        
    }

    // Vérifier si le gamePuuid existe déjà
    db.query('SELECT * FROM joueurs WHERE gamePuuid = ?', [gamePuuid], (err, results) => {
        
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
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
                return res.status(500).json({ message: 'Erreur avec la base de données' });
            }
            res.status(200).json({ message: '✅ Summoner mis à jour avec succès !' });
        });
    });
});

app.get('/recuperer-joueurs', (req, res) => {

    db.query('SELECT * FROM joueurs', (err, results) => {

        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }
        // Retourner les résultats en format JSON
        res.json(results);
    });
});

app.get('/recuperer-joueurs-gamePuuid', (req, res) => {
    db.query('SELECT gamePuuid FROM joueurs', (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        const data = results.map(row => row.gamePuuid);
        res.json(data);

    });
});

app.post('/recuperer-gamepuuid', (req, res) => {
    const { gameName, tagLine } = req.body; // Extraire les valeurs du body

    if (!gameName || !tagLine) {
        return res.status(400).json({ message: 'Le gameName et le tagLine sont requis' });
    }

    // Requête pour récupérer le gamePuuid à partir de gameName et tagLine
    const query = 'SELECT gamePuuid FROM joueurs WHERE gameName = ? AND tagLine = ?';

    db.query(query, [gameName, tagLine], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }

        // Retourner le gamePuuid du joueur
        res.json({ gamePuuid: results[0].gamePuuid });
    });
});

app.post('/recuperer-balance', (req, res) => {
    const { gameName, tagLine } = req.body; // Extraire les valeurs du body

    if (!gameName || !tagLine) {
        return res.status(400).json({ message: 'Le gameName et le tagLine sont requis' });
    }

    // Requête pour récupérer le gamePuuid à partir de gameName et tagLine
    const query = 'SELECT balance FROM joueurs WHERE gameName = ? AND tagLine = ?';

    db.query(query, [gameName, tagLine], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }

        // Retourner le gamePuuid du joueur
        res.json({ balance: results[0].balance });
    });
});

app.post('/ajouter-balance', (req, res) => {
    const { gamePuuid, amount } = req.body;

    if (!gamePuuid || !amount) {
        return res.status(400).json({ message: '❌ gamePuuid ou amount manquant' });
    }

    // Démarre une transaction
    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur de transaction' });
        }

        // Vérifier si le gamePuuid existe déjà dans la base de données
        db.query('SELECT * FROM joueurs WHERE gamePuuid = ?', [gamePuuid], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ message: 'Erreur avec la base de données' });
                });
            }

            if (results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ message: '❌ Summoner introuvable, mise à jour impossible.' });
                });
            }

            // Récupérer la balance actuelle
            const currentBalance = results[0].balance;

            // Ajouter le montant à la balance actuelle
            const newBalance = currentBalance + parseFloat(amount);

            // Mise à jour de la balance dans la base de données
            const updateQuery = `
                UPDATE joueurs 
                SET balance = ? 
                WHERE gamePuuid = ?
            `;

            db.query(updateQuery, [newBalance, gamePuuid], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Erreur avec la mise à jour de la balance' });
                    });
                }

                // Ajouter une transaction dans la table transactions
                const transactionQuery = `
                    INSERT INTO transactions (gamePuuid, transaction_type, amount) 
                    VALUES (?, ?, ?)
                `;

                db.query(transactionQuery, [gamePuuid, 'deposit', amount], (err, results) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Erreur avec l\'ajout de la transaction' });
                        });
                    }

                    // Commit la transaction si tout se passe bien
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Erreur lors du commit de la transaction' });
                            });
                        }

                        // Réponse finale
                        res.status(200).json({
                            message: `✅ Balance mise à jour avec succès ! Nouveau solde : ${newBalance}`,
                            transactionMessage: '✅ Transaction ajoutée avec succès'
                        });
                    });
                });
            });
        });
    });
});



//BDD BETS//

app.post('/ajouter-bets', (req, res) => {
    const { gamePuuidJoueur, gameId, bet_amount, bet_teamId } = req.body;
    // Vérifie si les autres informations sont présentes
    if (!gamePuuidJoueur || !gameId || !bet_amount || !bet_teamId) {
        return res.status(400).json({ message: 'Des informations sont manquantes' });
    }

    // Ajouter "EUW_1" devant le gameId
    const modifiedGameId = `EUW1_${gameId}`;
    
    // Vérification si le joueur existe dans la table joueurs

    db.query('SELECT * FROM joueurs WHERE gamePuuid = ?', [gamePuuidJoueur], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
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
                return res.status(500).json({ message: 'Erreur avec la base de données' });
            }

            db.query('INSERT INTO bets (gamePuuid, gameId, bet_amount, bet_teamId) VALUES (?, ?, ?, ?)', [gamePuuidJoueur, modifiedGameId, bet_amount, bet_teamId], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Erreur avec la base de données, rollback fait' });
                    });
                }

                // Mettre à jour la balance du joueur
                db.query('UPDATE joueurs SET balance = balance - ? WHERE gamePuuid = ?', [bet_amount, gamePuuidJoueur], (err, results) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Erreur avec la base de données, rollback fait' });
                        });
                    }

                    // Ajouter une transaction dans la table transactions

                    db.query('INSERT INTO transactions (gamePuuid, transaction_type, amount) VALUES (?, ?, ?)', [gamePuuidJoueur, 'bet_deposit', bet_amount], (err, results) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ message: 'Erreur avec la base de données, rollback fait' });
                            });
                        }

                        // Valider la transaction SQL
                        db.commit(err => {
                            if (err) {
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

app.post('/maj-bets', (req, res) => {
    // Étape 1 : Chercher les paris en statut "pending"
    const getPendingBetsQuery = `
        SELECT b.bet_id, b.gamePuuid, b.bet_amount, b.bet_teamId, b.gameId, g.game_status, g.winner_team_id
        FROM bets b
        JOIN games g ON b.gameId = g.gameId
        WHERE b.bet_status = 'pending' AND g.game_status = 'completed'
    `;

    db.query(getPendingBetsQuery, async (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
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
                        return res.status(500).json({ message: 'Erreur avec la base de données' });
                    }
                });

                // Étape 5 : Mettre à jour la balance du joueur si le pari a été gagné
                db.query('SELECT balance FROM joueurs WHERE gamePuuid = ?', [gamePuuid], (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: 'Erreur avec la base de données' });
                    }

                    if (results.length === 0) {
                        return res.status(400).json({ message: 'Joueur introuvable dans la base de données' });
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
                                return res.status(500).json({ message: 'Erreur avec la base de données' });
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
                                return res.status(500).json({ message: 'Erreur avec la base de données' });
                            }
                        });
                    }

                    // Mettre à jour la balance du joueur
                    db.query('UPDATE joueurs SET balance = ? WHERE gamePuuid = ?', [newBalance, gamePuuid], (err) => {
                        if (err) {
                            return res.status(500).json({ message: 'Erreur avec la base de données' });
                        }
                    });
                });
            } else {
                return res.status(400).json({ message: 'Le jeu n\'est pas terminé' });
            }
        }
        res.status(200).json({ message: 'Mise à jour des paris terminée.' });
    });
});

app.get('/recuperer-bets', (req, res) => {
    const getAllBetsQuery = `
        SELECT gamePuuid, gameId, bet_amount, bet_teamId, bet_status 
        FROM bets
    `;

    db.query(getAllBetsQuery, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Aucun pari trouvé.' });
        }

        res.status(200).json(results);
    });
});

//BDD GAMES//

app.post('/ajouter-games', (req, res) => {
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
    db.query('SELECT * FROM games WHERE gameId = ?', [modifiedGameId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        // Si le gameId existe déjà, ne pas insérer et renvoyer un message de succès
        if (results.length > 0) {
            return res.status(200).json({ message: 'La partie existe déjà dans la base de données.' });
        }

        // Si le gameId n'existe pas, insérer les données dans la base de données
        db.query('INSERT INTO games (gameId, game_start_time) VALUES (?, ?)', [modifiedGameId, formattedGameStartTime], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur avec la base de données' });
            }

            // Retourner une réponse après avoir ajouté la partie
            res.status(200).json({ message: '✅ Partie ajoutée avec succès !' });
        });
    });
});

app.post('/maj-games', (req, res) => {
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

    db.query('SELECT * FROM games WHERE gameId = ?', [gameId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
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
                return res.status(500).json({ message: 'Erreur avec la base de données' });
            }

            // Retourner une réponse après avoir mis à jour les informations du jeu
            res.status(200).json({ message: '✅ Partie mise à jour avec succès !' });
        });
    });
});

app.get('/recuperer-games', (req, res) => {
    
    // Requête pour récupérer les parties en statut "in_progress"
    db.query(`SELECT gameId, game_status FROM games WHERE game_status = 'in_progress'`, (err, results) => {

        if (err) {
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        if (results.length === 0) {
            return res.status(200).json([]);
        }

        // Retourner les résultats sous forme de réponse JSON
        res.status(200).json(results);
    });
});

//BDD AUTRES//

app.get('/recuperer-classement', (req, res) => {
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
            return res.status(500).json({ message: 'Erreur avec la base de données' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Aucun pari trouvé.' });
        }

        // Envoie les paris sous forme de JSON
        res.status(200).json(results);
    });
});

//PAYPAL//

app.post('/paypal/create-order', async (req, res) => {
    const { amount } = req.body; // Le montant à payer (en USD)

    try {
        const accessToken = await getAccessToken(); // Récupérer le token d'accès
        const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'EUR',
                        value: amount,
                    },
                }],
                application_context: {
                    return_url: 'http://localhost:5000/paypal/success',  // Ajouter l'URL de retour ici
                    cancel_url: 'http://localhost:5000/RiotAPI_Paypal', // URL si l'utilisateur annule le paiement
                },
            }),
        });

        const data = await response.json();
        if (data.id) {
            // Retourner l'ID de la commande et l'URL d'approbation
            res.json({
                orderId: data.id,
                approvalUrl: data.links.find(link => link.rel === 'approve').href,
            });
        } else {
            res.status(500).json({ message: 'Erreur lors de la création de la commande PayPal' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

app.post('/paypal/capture-payment', async (req, res) => {
    const { orderId } = req.body; // Récupérer l'ID de la commande depuis le corps de la requête

    try {
        const accessToken = await getAccessToken(); // Récupérer le token d'accès

        // Assurez-vous d'utiliser la syntaxe correcte pour insérer la variable orderId
        const response = await fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.status === 'COMPLETED') {
            res.json({ message: 'Paiement réussi', data });
        } else {
            res.status(500).json({ message: 'Erreur lors de la capture du paiement PayPal' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

app.get('/paypal/success', (req, res) => {
    const orderId = req.query.token; // PayPal retourne l'ID de commande sous "token"

    if (!orderId) {
        return res.redirect('/paiement.html?error=missing_order');
    }

    // Redirige l'utilisateur vers la page de confirmation avec l'orderId
    res.redirect(`http://localhost:5000/RiotAPI_Paypal2?orderId=${orderId}`);
});

app.post('/connexion', (req, res) => {
    const { gamePuuid, password } = req.body;

    // Vérifier si le gamePuuid existe dans la base de données
    db.query('SELECT * FROM joueurs WHERE gamePuuid = ?', [gamePuuid], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur avec la base de données' });

        if (results.length === 0) {
            return res.status(400).json({ message: 'Utilisateur non trouvé' });
        }

        const user = results[0];

        // Comparer le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Mot de passe incorrect' });
        }

        // Générer le token JWT
        const token = jwt.sign({ gamePuuid: user.gamePuuid }, JWT_SECRET, { expiresIn: '2h' });

        // Retourner le token et autres informations (ex: balance)
        res.status(200).json({
            token,
            balance: user.balance, // Retourne la balance du joueur
        });
    });
});

function ConnexionBDD(host, utilisateur, motDePasse, baseDeDonnees) {

    const connection = mysql.createConnection({
        host: host,
        user: utilisateur,
        password: motDePasse,
        database: baseDeDonnees
    });

    connection.connect((err) => {
        if (err) {
            console.error('Erreur lors de la connexion a la base de données :', err);
            return null;
        }
        console.log('Connexion réussie à la base de données.');
    });
    return connection;
}

const db = ConnexionBDD(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

// Fonction pour récupérer un token d'accès OAuth2 depuis PayPal
async function getAccessToken() {
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    const data = await response.json();
    return data.access_token;
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur en écoute sur http://0.0.0.0:${PORT}`);
});
