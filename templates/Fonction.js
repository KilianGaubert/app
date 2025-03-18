function appelHeader(callback) {
    fetch("RiotAPI_Header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;
            if (callback) callback(); // Exécuter DemandePseudo() après chargement
        })
        .catch(error => console.error("Erreur lors du chargement du header :", error));
}

function appelHeader_Classement(callback) {
    fetch("RiotAPI_Header_Classement.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;
            if (callback) callback(); // Exécuter DemandePseudo() après chargement
        })
        .catch(error => console.error("Erreur lors du chargement du header :", error));
}

function appelHeader_Bets(callback) {
    fetch("RiotAPI_Header_Bets.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;
            if (callback) callback(); // Exécuter DemandePseudo() après chargement
        })
        .catch(error => console.error("Erreur lors du chargement du header :", error));
}

function getPlayerIcon(profileIconId) {
        const profileIconURL = `static/data_riot/15.2.1/img/profileicon/${profileIconId}.png`;
        return `<img src="${profileIconURL}" alt="Icône du joueur" width="64" height="64" style="border-radius: 10px;">`;
}

function getChampionIcon(championName) {
        const championIconPath = `static/data_riot/15.2.1/img/champion/${championName}.png`;
        return `<img src="${championIconPath}" alt="${championName}" width="30" height="30" style="vertical-align: middle;">`;
}

function getItemIcon(itemId) {
    if (!itemId || itemId === 0) {
        return '<div style="width: 32px; height: 32px; border: 1px solid gray; display: inline-block;"></div>'; // Case vide
    }
    return `<img src="static/data_riot/15.2.1/img/item/${itemId}.png" 
                alt="Item ${itemId}" 
                style="width: 32px; height: 32px; border: 1px solid gray; margin: 2px; border-radius: 4px;">`;
}

function getSummonerIcon(SummonerName) {
    const championIconPath = `static/data_riot/15.2.1/img/spell/${SummonerName}.png`;
    return `<img src="${championIconPath}" alt="${SummonerName}" width="30" height="30" style="vertical-align: middle;">`;
}

function getChampionByKey(key) {
    return fetch('static/data_riot/15.2.1/data/fr_FR/champion.json')
        .then(response => response.json())
        .then(data => {
            let foundChampion = null;
            for (const championId in data.data) {
                if (data.data[championId].key === String(key)) {
                    foundChampion = data.data[championId];
                    break;
                }
            }

            if (foundChampion) {
                return foundChampion.id; // Retourner le nom du champion
            } else {
                return null; // Aucun champion trouvé
            }
        })
        .catch(error => {
            console.error('Erreur de chargement du fichier JSON', error);
            return null; // En cas d'erreur
        });
}

function getSummonerByKey(key) {
    return fetch('static/data_riot/15.2.1/data/fr_FR/summoner.json')
        .then(response => response.json())
        .then(data => {
            if (!data.data) {
                console.error("Structure JSON inattendue :", data);
                return null;
            }

            for (const SummonerId in data.data) {
                if (data.data[SummonerId].key === String(key)) {
                    return data.data[SummonerId].id; // Retourne l'ID du sort
                }
            }

            console.warn(`Aucun sort trouvé pour la clé : ${key}`);
            return null;
        })
        .catch(error => {
            console.error('Erreur de chargement du fichier JSON', error);
            return null;
        });
}

function convertSecondsToMinutes(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
}

function getStatsAtTime(timelineData, playerId, timeLimit = 600) {
    let kills = 0;
    let deaths = 0;
    let assists = 0;

    timelineData.info.frames.forEach((frame) => {
        if (frame.timestamp / 1000 <= timeLimit) {
            frame.events.forEach((event) => {
                if (event.timestamp / 1000 <= timeLimit) {
                    if (event.type === 'CHAMPION_KILL') {
                        if (event.killerId === playerId) kills++;
                        if (event.victimId === playerId) deaths++;
                    }
                    if (event.assistingParticipantIds?.includes(playerId)) {
                        assists++;
                    }
                }
            });
        }
    });

    return { kills, deaths, assists };
}

function getRankIcon(tier) {
    const rankIconPath = `static/data_riot/ranked-emblems/Ranked Emblems Latest/rank=${tier.toLowerCase()}.png`;
    return `<img src="${rankIconPath}" alt="${tier}" width="128" height="128" style="vertical-align: middle;">`;
}

function getKDAColor(kda) {
    if (kda === "Perfect") return "green"; // "Perfect" est toujours en vert.
    kda = parseFloat(kda); // Convertir en nombre si ce n'est pas déjà le cas.

    if (kda < 1) return "red"; // KDA inférieur à 1 -> rouge.
    if (kda >= 1 && kda < 2) return "orange"; // Entre 1 et 2 -> orange.
    if (kda >= 2 && kda < 3) return "yellow"; // Entre 2 et 3 -> jaune.
    if (kda >= 3) return "green"; // 3 ou plus -> vert.
}

function calculateAverageTableau(arr) {
    if (arr.length === 0) return 0;
    return (arr.reduce((sum, value) => sum + value, 0) / arr.length).toFixed(2);
}

function calculateAverageLane(laneStats) {
    const kdaAverages = {};

    Object.keys(laneStats).forEach((lane) => {
        const stats = laneStats[lane];
        const totalKills = stats.KILL.reduce((a, b) => a + b, 0);
        const totalDeaths = stats.DEATH.reduce((a, b) => a + b, 0);
        const totalAssists = stats.ASSIST.reduce((a, b) => a + b, 0);
        const count = stats.KILL.length;

        kdaAverages[lane] = count > 0
            ? (totalDeaths === 0
                ? "Perfect" // Aucun décès pour cette lane
                : ((totalKills + totalAssists) / totalDeaths).toFixed(2)) // KDA calculé
            : "N/A"; // Aucune donnée pour cette lane
    });

    return kdaAverages;
}

function calculatePlayerStats(player) {
    const kills = parseFloat(player.kills) || 0; // Convertit kills en nombre
    const deaths = parseFloat(player.deaths) || 0; // Convertit deaths en nombre
    const assists = parseFloat(player.assists) || 0; // Convertit assists en nombre

    // Calcul du KDA
    const kda = deaths === 0 ? "Perfect" : ((kills + assists) / deaths).toFixed(2);

    return { kills, deaths, assists, kda };
}

async function callAPI(url, method, body = null) {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : null,
        });

        // Lire la réponse JSON
        const data = await response.json();

        // Vérifier si `status` existe et contient une erreur
        if (data.status && data.status.status_code && data.status.status_code >= 400) {
            console.log("Erreur détectée:", data.status);
            return { error: data.status };
        }

        return data;
    } catch (error) {
        console.error('Erreur lors de la communication avec le serveur:', error);
        return { error: "Impossible de contacter le serveur" };
    }
}

function formatDate(dateString) {
    return dateString
        .replace('T', ' ')  // Remplacer 'T' par un espace
        .replace(/\.\d+/, '')  // Supprimer les millisecondes
        .replace('Z', '');  // Supprimer le 'Z'
}

function initializeLaneStats() {
    return {
        TOP: { KILL: [], DEATH: [], ASSIST: [] },
        JUNGLE: { KILL: [], DEATH: [], ASSIST: [] },
        MIDDLE: { KILL: [], DEATH: [], ASSIST: [] },
        BOTTOM: { KILL: [], DEATH: [], ASSIST: [] },
        UTILITY: { KILL: [], DEATH: [], ASSIST: [] }
    };
}

function FermerPopupGame() {
    document.getElementById("popupGame").style.display = "none";
}

function compareRanks(a, b) {

    // Ordre des rangs de League of Legends
const rankOrder = ["CHALLENGER", "GRANDMASTER", "MASTER", "DIAMOND", "EMERALD", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON"];

const tierA = a.tier ? rankOrder.indexOf(a.tier.toUpperCase()) : rankOrder.length;
const tierB = b.tier ? rankOrder.indexOf(b.tier.toUpperCase()) : rankOrder.length;

if (tierA !== tierB) return tierA - tierB; // Trier d'abord par tier

const divisionA = a.rank ? parseInt(a.rank.replace(/\D/g, "")) || 5 : 5; // Convertit I, II, III, IV en chiffres
const divisionB = b.rank ? parseInt(b.rank.replace(/\D/g, "")) || 5 : 5;

if (divisionA !== divisionB) return divisionA - divisionB; // Puis par division

return (b.leaguePoints || 0) - (a.leaguePoints || 0); // Enfin par LP (points de ligue)
}


//CALL API//


async function DemandePseudo() {
    const gameName = document.getElementById("ResearchgameName").value;
    const tagLine = document.getElementById("ResearchtagLine").value;

    const summonerInfoDiv = document.getElementById('SummonerInfo');
    summonerInfoDiv.style.display = 'block';

    const profileIconDiv = document.getElementById("ProfileIcon");
    const levelDiv = document.getElementById("Level");
    const RankIconDiv = document.getElementById("RankIcon");
    const TierDiv = document.getElementById("Tier");
    const LPDiv = document.getElementById("LP");

    const gameNameDiv = document.getElementById("gameName");
    const tagLineDiv = document.getElementById("tagLine");

    try {
        const puuidData = await callAPI(`/proxy/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, 'GET');
        const gamePuuid = puuidData.puuid;

        if (puuidData.error) {
            alert(puuidData.error.status.message || "Erreur inconnue");
            throw new Error (puuidData.error.status.message || "Erreur inconnue");
        }

        localStorage.setItem("gameName", gameName);
        localStorage.setItem("tagLine", tagLine);
        localStorage.setItem("gamePuuid", gamePuuid);

        const summonerData = await callAPI(`/proxy/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(gamePuuid)}`, 'GET');
        console.log("Données du summoner reçues :", summonerData);
       
        if (summonerData.error) {
            alert(puuidData.error.status.message || "Erreur inconnue");
            throw new Error (puuidData.error.status.message || "Erreur inconnue");
        }

        profileIconDiv.innerHTML = getPlayerIcon(summonerData.profileIconId);
        levelDiv.innerHTML = `${summonerData.summonerLevel}`;
        gameNameDiv.innerHTML = `${gameName}`;
        tagLineDiv.innerHTML = `#${tagLine}`;

        const leagueData = await callAPI(`/proxy/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerData.id)}`, 'GET');
        console.log("Données du classement du summoner reçues :", leagueData);

        if (leagueData.error) {
            alert(leagueData.error.status.message || "Erreur inconnue");
            throw new Error (leagueData.error.status.message || "Erreur inconnue");
        }
        
        if (leagueData.length > 0) {
            const { tier, rank, leaguePoints } = leagueData[0];
            RankIconDiv.innerHTML = getRankIcon(tier);
            TierDiv.innerHTML = `${tier} ${rank}`;
            LPDiv.innerHTML = `${leaguePoints} LP`;
        } else {
            TierDiv.innerHTML = `<p>Le summoner n'est pas encore classé.</p>`;
        }
        document.getElementById("Update").click();

    } catch (error) {
        console.error("Erreur :", error);
        alert("Erreur lors de l'envoi de la requête !");
    }
}

async function RechercheHistorique() {

    gamePuuid = localStorage.getItem("gamePuuid") || "Aucun Puuid";
    gameName = localStorage.getItem("gameName") || "Inconnu";
    tagLine = localStorage.getItem("tagLine") || "Aucune tagline";

    if (!gamePuuid) {
        alert("Veuillez d'abord rechercher un summoner !");
        return;
    }
    historiqueInfo.innerHTML = '<p>Chargement des données...</p>';

    const kdaAveragesAlly = {};
    const kdaAveragesEnemy = {};
    const laneStatsAlly = initializeLaneStats();
    const laneStatsEnemy = initializeLaneStats();
    const count = 10;
    try {
        const matchIds = await callAPI(`/proxy/lol/match/v5/matches/by-puuid/${encodeURIComponent(gamePuuid)}?count=${encodeURIComponent(count)}`,'GET');
        
        if (matchIds.error) {
            alert(matchIds.error.status.message || "Erreur inconnue");
            throw new Error (matchIds.error.status.message || "Erreur inconnue");
        }

        const matches = [];

        for (let i = 0; i < matchIds.length; i++) {
            const matchId = matchIds[i];

            // Récupération des détails du match
            const matchData = await callAPI(`/proxy/lol/match/v5/matches/${matchId}`,'GET');

            if (matchData.error) {
                alert(matchData.error.status.message || "Erreur inconnue");
                throw new Error (matchData.error.status.message || "Erreur inconnue");
            }

            // Récupération de la timeline du match
            const timelineData = await callAPI(`/proxy/lol/match/v5/matches/${matchId}/timeline`,'GET');

            if (timelineData.error) {
                alert(timelineData.error.status.message || "Erreur inconnue");
                throw new Error (timelineData.error.status.message || "Erreur inconnue");
            }

            matches.push({ matchData, timelineData });

            if ((i + 1) % 20 === 0) {
                console.log("Pause de 1 seconde pour respecter la limite d'API...");
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        console.log('Détails des matchs reçus :', matches);

        const matchDetailsHTML = await Promise.all(matches.map(async ({ matchData, timelineData }) => {
            const player = matchData.info.participants.find((p) => p.puuid === gamePuuid);
            const championIconHTML = getChampionIcon(player.championName);

            // Calcul du KDA global
            const { kills: playerkills, deaths: playerdeaths, assists: playerassists, kda: playerkda } = calculatePlayerStats(player);

            const kdaColor = getKDAColor(playerkda);

            const itemsHTML = [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5]
                .map((itemId) => itemId ? getItemIcon(itemId) : '<div style="width:30px;height:30px;border:1px solid black;margin:2px;"></div>')
                .join('');

            const sumonnerSpell1 = player.summoner1Id;
            const Summoner1Name = await getSummonerByKey(sumonnerSpell1);
            const Sumonner1Icon = getSummonerIcon(Summoner1Name);

            const sumonnerSpell2 = player.summoner2Id;
            const Summoner2Name = await getSummonerByKey(sumonnerSpell2);
            const Sumonner2Icon = getSummonerIcon(Summoner2Name);

            // Séparer les joueurs en deux équipes
            const allies = matchData.info.participants.filter((p) => p.teamId === player.teamId);
            const enemies = matchData.info.participants.filter((p) => p.teamId !== player.teamId);

            const teamHTML = (team, isAlly) =>
                `<div style="display: flex; justify-content: space-between; margin-top: 10px;">
                    ${team
                        .map((participant) => {
                            const { kills: participantkills, deaths: participantdeaths, assists: participantassists, kda: participantkda } = calculatePlayerStats(participant);

                            // Détermination de la couleur du KDA avec la fonction getKDAColor

                            const kdaColor = getKDAColor(participantkda);
                            // Récupérer les items du joueur
                            const itemsHTML = [
                                participant.item0, participant.item1, participant.item2,
                                participant.item3, participant.item4, participant.item5
                            ]
                                .map((itemId) => itemId ? getItemIcon(itemId) : '<div style="width:30px;height:30px;border:1px solid black;margin:2px;"></div>')
                                .join('');

                            return `
                                <div style="border: 1px solid ${isAlly ? "green" : "red"}; border-radius: 10px; padding: 10px; margin: 5px; text-align: center; width: 150px;">
                                    <strong>${participant.championName}</strong>
                                    <br>${getChampionIcon(participant.championName)}
                                    <br><strong>KDA:</strong> <span style="color: ${kdaColor};">${participantkda}</span>
                                    
                                    <br><strong>Lane:</strong> ${participant.teamPosition || "Non spécifiée"}
                                    <br>Kills: ${participant.kills}, Deaths: ${participant.deaths}, Assists: ${participant.assists}
                                    <br><strong>Items :</strong>
                                    <div style="display: flex; flex-wrap: wrap; margin-top: 10px;">${itemsHTML}</div>
                                </div>
                            `;
                        })
                        .join("")}
                </div>`;

            // Récupération des stats à 10 minutes pour chaque joueur
                matchData.info.participants.map((participant) => {
                    const stats = getStatsAtTime(timelineData, participant.participantId, 600); // 600 secondes = 10 minutes
                    const isAlly = participant.teamId === player.teamId;
                    // Remplir les statistiques dans le tableau selon la lane
                    const lane = participant.teamPosition || "Non spécifiée";
                    if (isAlly) {
                        if (laneStatsAlly[lane]) {
                            laneStatsAlly[lane].KILL.push(stats.kills);
                            laneStatsAlly[lane].DEATH.push(stats.deaths);
                            laneStatsAlly[lane].ASSIST.push(stats.assists);
                        }
                    }
                    else if (!isAlly) {
                        if (laneStatsEnemy[lane]) {
                            laneStatsEnemy[lane].KILL.push(stats.kills);
                            laneStatsEnemy[lane].DEATH.push(stats.deaths);
                            laneStatsEnemy[lane].ASSIST.push(stats.assists);
                        }
                    }

                    for (const lane in laneStatsAlly) {

                        // Calcul des moyennes pour les alliés
                        const ally = {
                            kills: calculateAverageTableau(laneStatsAlly[lane].KILL),
                            deaths: calculateAverageTableau(laneStatsAlly[lane].DEATH),
                            assists: calculateAverageTableau(laneStatsAlly[lane].ASSIST)
                        };

                        const { kills: AverageAllykills, deaths: AverageAllydeaths, assists: AverageAllyassists, kda: AveragesAllyKDA } = calculatePlayerStats(ally);
                        kdaAveragesAlly[lane] = AveragesAllyKDA;

                        // Calcul des moyennes pour les ennemis
                        const enemy = {
                            kills: calculateAverageTableau(laneStatsEnemy[lane].KILL),
                            deaths: calculateAverageTableau(laneStatsEnemy[lane].DEATH),
                            assists: calculateAverageTableau(laneStatsEnemy[lane].ASSIST)
                        };

                        const { kills: AverageEnemykills, deaths: AverageEnemydeaths, assists: AverageEnemyassists, kda: AveragesEnemykda } = calculatePlayerStats(enemy);
                        kdaAveragesEnemy[lane] = AveragesEnemykda;
                    }

                    return `
                        <div style="margin-bottom: 5px;">
                            <strong>Participant ID :</strong> ${participant.participantId} <br>
                            <strong>Lane :</strong> ${participant.teamPosition || "Non spécifiée"} <br>
                            <strong>Champion :</strong> ${participant.championName} ${getChampionIcon(participant.championName)}<br>
                        </div>
                    `;
                })
                .join('');

            return `<div id="match-container" class="match-container ${player.win ? 'win' : 'lose'}">
                        <div id="match-container10" class="match-container10">
                            <div id="match-container2" class="match-container2">
                                <div id="match-gamemode" class="match-gamemode"> Mode de jeu : ${matchData.info.gameMode} </div>
                                <div id="match-victoire" class="match-victoire"> ${player.win ? 'Victoire' : 'Défaite'} </div>
                            </div>

                            <div id="match-container3" class="match-container3">

                                <div id="match-container4" class="match-container4">
                                    <div id="match-champion" class="match-champion"> ${championIconHTML} </div>
                                    <div id="match-sumonnericon1" class="match-sumonnericon"> ${Sumonner1Icon}</div>
                                    <div id="match-sumonnericon2" class="match-sumonnericon"> ${Sumonner2Icon} </div>
                                    <div id="match-kda" class="match-kda"> ${playerkills} / ${playerdeaths} / ${playerassists} </div>
                                    <div id="kda-color" class="kda-${kdaColor}">${playerkda} </div>
                                </div>

                                <div id="match-container5" class="match-container5">
                                    <div id="match-item" class="match-item">${itemsHTML}</div>
                                </div>
                            </div>
                        </div>
                        <div id="match-container20" class="match-container20">
                            <details class="match-details">
                                <summary>Statistiques détaillées des équipes</summary>
                                <div>
                                    <strong>Équipe Alliée :</strong>
                                    ${teamHTML(allies, true)}
                                    <hr>
                                    <strong>Équipe Adverse :</strong>
                                    ${teamHTML(enemies, false)}
                                </div>
                            </details>
                        </div>
                    </div>`;

        }));

        document.getElementById('historiqueInfo').innerHTML = `
            <h3>Détails des ${matches.length} dernières parties :</h3>
            <ul style="list-style-type: none; padding: 0;">${matchDetailsHTML.join('')}</ul>
        `;
        document.getElementById('10MinClassement').innerHTML += `
            <hr>
            <h3>Moyennes des KDA par lane a 10min de jeu :</h3>
            <div>
                <strong>Alliés :</strong>
                <ul>
                    ${Object.entries(kdaAveragesAlly)
                        .map(([lane, kda]) => `<li>${lane} : ${kda}</li>`)
                        .join("")}
                </ul>
                <strong>Ennemis :</strong>
                <ul>
                    ${Object.entries(kdaAveragesEnemy)
                        .map(([lane, kda]) => `<li>${lane} : ${kda}</li>`)
                        .join("")}
                </ul>
            </div>
        `;
        // Affichage du tableau des statistiques pour chaque lane
        console.log('Stats par lane alliés:', laneStatsAlly);
        console.log('Stats par lane énnemis:', laneStatsEnemy);
        console.log("Moyennes des KDA des alliés :", kdaAveragesAlly);
        console.log("Moyennes des KDA des ennemis :", kdaAveragesEnemy);

    } catch (error) {
        console.error('Erreur :', error);
        alert('Erreur lors de l’envoi de la requête !');
    }
}

async function RecherchePartie(Ouca) {

    const gameName = document.getElementById("ResearchgameName").value;
    const tagLine = document.getElementById("ResearchtagLine").value;    // URL pour récupérer le puuid
    const response = await callAPI(`/proxy/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, 'GET');
    
    if (response.error) {
        alert(response.error.status.message || "Erreur inconnue");
        throw new Error (response.error.status.message || "Erreur inconnue");
    }
    
    gamePuuid = response.puuid;
    console.log("Puuid reçu :", gamePuuid);
    localStorage.setItem("gameName", gameName);
    localStorage.setItem("tagLine", tagLine);
    localStorage.setItem("gamePuuid", gamePuuid);

    try {
        const spectatorData = await callAPI(`/proxy/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(gamePuuid)}`, 'GET');

        if (spectatorData.httpStatus === 404) {
            alert("Aucune partie en cours pour ce summoner.");
            return null;
        }

        if (spectatorData.error) {
            alert(spectatorData.error.message || "Erreur inconnue");
            throw new Error (spectatorData.status.message || "Erreur inconnue");
        }

        console.log("Données de la partie en cours :", spectatorData);
        const participants = spectatorData.participants;

        const player = participants.find((p) => p.puuid === gamePuuid);
        
        if (!player) {
            alert("Joueur introuvable dans la partie !");
            return;
        }

        const championIconHTML = getChampionIcon(await getChampionByKey(player.championId));

        // Récupérer les sorts d'invocateurs
        const sumonnerSpell1 = player.spell1Id;
        const Summoner1Name = await getSummonerByKey(sumonnerSpell1);
        const Sumonner1Icon = getSummonerIcon(Summoner1Name);

        const sumonnerSpell2 = player.spell2Id;
        const Summoner2Name = await getSummonerByKey(sumonnerSpell2);
        const Sumonner2Icon = getSummonerIcon(Summoner2Name);
        const temps = convertSecondsToMinutes(spectatorData.gameLength);
        // Séparer les équipes
        const allies = participants.filter((p) => p.teamId === player.teamId);
        const enemies = participants.filter((p) => p.teamId !== player.teamId);
        gameId = spectatorData.gameId;
        localStorage.setItem("gameId", gameId);
        // Générer l'affichage HTML des équipes
        const teamHTML = async (team, isAlly) => {
            const teamMembers = await Promise.all(
                team.map(async (participant) => {
                    const championName = await getChampionByKey(participant.championId);
                    const championIcon = getChampionIcon(championName);
                    const RiotName = participant.riotId;

                    // Récupérer les sorts d'invocateurs
                    const sumonnerSpell1 = participant.spell1Id;
                    const Summoner1Name = await getSummonerByKey(sumonnerSpell1);
                    const Sumonner1Icon = getSummonerIcon(Summoner1Name);

                    const sumonnerSpell2 = participant.spell2Id;
                    const Summoner2Name = await getSummonerByKey(sumonnerSpell2);
                    const Sumonner2Icon = getSummonerIcon(Summoner2Name);

                    return `
                        <div style="border: 1px solid ${isAlly ? "green" : "red"}; border-radius: 10px; padding: 10px; margin: 5px; text-align: center; width: 150px;">
                            <strong>${RiotName}</strong>
                            <strong>${championName}</strong>
                            <br>${championIcon}</br>
                            <div>${Sumonner1Icon}</div>
                            <div>${Sumonner2Icon}</div>
                        </div>
                    `;
                })
            );
            return `<div style="display: flex; justify-content: space-between; margin-top: 10px;">
                ${teamMembers.join("")}
            </div>`;
        };

        // Attendre que les équipes soient chargées
        const alliesHTML = await teamHTML(allies, true);
        const enemiesHTML = await teamHTML(enemies, false);

        // Insérer dans le HTML
        document.getElementById(Ouca).innerHTML = `
            <div id="match-container10" class="match-container10">
                <div id="match-container3" class="match-container3">
                    <div id="match-container4" class="match-container4">
                        <div id="match-champion" class="match-champion"> ${temps} </div>
                        <div id="match-champion" class="match-champion"> ${championIconHTML} </div>
                        <div id="match-sumonnericon1" class="match-sumonnericon"> ${Sumonner1Icon}</div>
                        <div id="match-sumonnericon2" class="match-sumonnericon"> ${Sumonner2Icon} </div>
                        <div id="match-champion" class="match-champion"> ${player.riotId} </div>
                    </div>
                </div>
            </div>
            <div id="match-container20" class="match-container20">
                <details class="match-details">
                    <summary>Statistiques détaillées des équipes</summary>
                    <div>
                        <strong>Équipe Alliée :</strong>
                        ${alliesHTML}
                        <hr>
                        <strong>Équipe Adverse :</strong>
                        ${enemiesHTML}
                    </div>
                </details>
            </div>
        `;

    } catch (error) {
        console.error("Erreur :", error);
        alert("Erreur lors de la récupération de la partie en cours !");
    }
}

async function RecherchePartie2(gamePuuid) {
    if (!gamePuuid) return "Hors ligne"; // Si pas de puuid, on assume hors ligne

    try {
        const response = await callAPI(`/proxy/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(gamePuuid)}`, 'GET');

        if (response.httpStatus === 404) {
            return ("Hors Ligne");
        }

        if (response.error) {
            alert(response.error.message || "Erreur inconnue");
            throw new Error (response.error.message || "Erreur inconnue");
        }

        // Si tout va bien et que le joueur est en partie
        return "En partie";

    } catch (error) {
        console.error('Erreur :', error);
        alert('Erreur lors de l’envoi de la requête !');
    }
}

async function RechercheMasteries() {

    gamePuuid = localStorage.getItem("gamePuuid") || "Aucun Puuid";
    gameName = localStorage.getItem("gameName") || "Inconnu";
    tagLine = localStorage.getItem("tagLine") || "Aucune tagline";

    if (!gamePuuid) {
        alert("Veuillez d'abord rechercher un summoner !");
        return;
    }

    try {
        
        const masteries = await callAPI(`/proxy/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(gamePuuid)}`, 'GET');
        
        if (masteries.error) {
            alert(masteries.error.status.message || "Erreur inconnue");
            throw new Error (masteries.error.status.message || "Erreur inconnue");
        }
        
        console.log("Masteries reçues :", masteries);

        // Affichage des masteries
        const masteriesHTML = await Promise.all(masteries.map(async (mastery) => {
        const championName = await getChampionByKey(mastery.championId);  // Attendre le nom du champion
        const championIconHTML = getChampionIcon(championName);  // Obtenir l'icône

            return `
                <li style="padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px;">
                    <strong>Champion :</strong> ${championName} ${championIconHTML} <br>
                    <strong>Mastery Level :</strong> ${mastery.championLevel} <br>
                    <strong>Mastery Points :</strong> ${mastery.championPoints} <br>
                </li>
            `;
        }));

        // Mettre à jour l'HTML avec les masteries
        document.getElementById('historiqueInfo').innerHTML = `
            <h3>Masteries des Champions :</h3>
            <ul style="list-style-type: none; padding: 0;">${masteriesHTML.join('')}</ul>
        `;
    } catch (error) {
        console.error("Erreur :", error);
        alert("Erreur lors de la récupération des masteries !");
    }
}

async function UpdateClassement() {
    
    try {
        
        const puuids = await callAPI(`/recuperer-joueurs-gamePuuid`, 'GET');
        console.log("Liste des PUUIDs récupérés :", puuids);

        // Exécuter les mises à jour pour chaque PUUID
        await Promise.all(
            puuids.map(async (gamePuuid) => {
                const accountResponse = await callAPI(`/proxy/riot/account/v1/accounts/by-puuid/${encodeURIComponent(gamePuuid)}`, 'GET');
                
                if (accountResponse.error) {
                    alert(accountResponse.error.status.message || "Erreur inconnue");
                    throw new Error (accountResponse.error.status.message || "Erreur inconnue");
                }
                
                const gameName = accountResponse.gameName;
                const tagLine = accountResponse.tagLine;
                const summonerResponse = await callAPI(`/proxy/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(gamePuuid)}`, 'GET');
                
                if (summonerResponse.error) {
                    alert(summonerResponse.error.status.message || "Erreur inconnue");
                    throw new Error (summonerResponse.error.status.message || "Erreur inconnue");
                }

                const leagueResponse = await callAPI(`/proxy/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerResponse.id)}`, 'GET');
                if (leagueResponse.error) {
                    alert(leagueResponse.error.message || "Erreur inconnue");
                    throw new Error (leagueResponse.error.message || "Erreur inconnue");
                }

                const summonerDetails = {
                    gamePuuid,
                    gameName,
                    tagLine,
                    summonerID: summonerResponse.id,
                    level: summonerResponse.summonerLevel,
                    profileIconId: summonerResponse.profileIconId,
                    tier: null,
                    rank: null,
                    leaguePoints: null
                };

                if (leagueResponse.length > 0) {
                    summonerDetails.tier = leagueResponse[0].tier;
                    summonerDetails.rank = leagueResponse[0].rank;
                    summonerDetails.leaguePoints = leagueResponse[0].leaguePoints;
                }
                console.log(summonerDetails);
                response = await callAPI(`/maj-joueurs`, 'POST', (summonerDetails));

                if (response.error) {
                    alert(response.error.status.message || "Erreur inconnue");
                    throw new Error (response.error.status.message || "Erreur inconnue");
                }

            })
        );

        console.log("Mise à jour terminée !");

        // Récupérer les joueurs mis à jour
        const joueurs = await callAPI('/recuperer-joueurs', 'GET');

        if (joueurs.error) {
            alert(joueurs.error.status.message || "Erreur inconnue");
            throw new Error (joueurs.error.status.message || "Erreur inconnue");
        }

        console.log(joueurs);
        // Trier les joueurs par classement
        const sortedPlayers = joueurs.sort(compareRanks);

        // Sélectionner le tbody de la table
        const tbody = document.querySelector('#joueursTable tbody');
        tbody.innerHTML = ""; // Vider le tableau avant d'ajouter les nouvelles lignes triées

        // Utilisation de `for...of` pour gérer `await`
        for (const joueur of sortedPlayers) {
            const statut = await RecherchePartie2(joueur.gamePuuid);
            const playerIcon = getPlayerIcon(joueur.profileIconId);
            const rankIcon = joueur.tier ? getRankIcon(joueur.tier) : null;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${playerIcon || 'Inconnu'}</td>
                <td>${joueur.gameName || 'Inconnu'}</td>
                <td>#${joueur.tagLine || 'Inconnu'}</td>
                <td>${joueur.level || 'Inconnu'}</td>
                <td>${joueur.tier || 'Unranked'} ${joueur.rank || ''} (${joueur.leaguePoints || 0} LP) ${rankIcon || ''}</td>
                <td>${joueur.balance}</td>
                <td>${statut}</td>

                <td><button class="Button" onclick="SupprimerJoueur('${joueur.gamePuuid}')">Supprimer le joueur</button></td>
            `;
            tbody.appendChild(tr);
        }

    } catch (error) {
        console.error("Erreur :", error);
        alert('Erreur lors de la mise à jour des joueurs !');
    }
}

async function UpdateClassementBets() {
    try {
        const bets = await callAPI('/recuperer-classement', 'GET');

        if (bets.error) {
            alert(bets.error.status.message || "Erreur inconnue");
            throw new Error (bets.error.status.message || "Erreur inconnue");
        }

        const tbody = document.querySelector('#joueursTable tbody');

        if (!tbody) {
            console.error("❌ L'élément tbody n'existe pas !");
            return;
        }

        tbody.innerHTML = '';  // Vider le tableau avant de l'actualiser

        // Trier les paris par date (bet_time) du plus récent au plus ancien
        bets.sort((a, b) => new Date(b.bet_time) - new Date(a.bet_time));

        bets.forEach(bet => {
            const tr = document.createElement('tr');
            
            const gameNameTd = document.createElement('td');
            gameNameTd.textContent = `${bet.gameName}#${bet.tagLine}`;
            tr.appendChild(gameNameTd);
        
            const gameIdTd = document.createElement('td');
            gameIdTd.textContent = bet.gameId;
            gameIdTd.id = `gameId-${bet.gameId}`;  // Ajout d'un ID unique
            tr.appendChild(gameIdTd);
        
            const betAmountTd = document.createElement('td');
            betAmountTd.textContent = bet.bet_amount;
            tr.appendChild(betAmountTd);
        
            const betTeamIdTd = document.createElement('td');
            betTeamIdTd.textContent = bet.bet_teamId;
            tr.appendChild(betTeamIdTd);
        
            const betStatusTd = document.createElement('td');
            betStatusTd.textContent = bet.bet_status;
            tr.appendChild(betStatusTd);
        
            const betTimeTd = document.createElement('td');
            betTimeTd.textContent = formatDate(bet.bet_time);
            tr.appendChild(betTimeTd);
        
            // Colonne action avec bouton
            const actionTd = document.createElement('td');
            const button = document.createElement('button');
            button.textContent = 'Détails';
            button.classList.add('Button');
            button.dataset.gameId = bet.gameId; // Stocker le gameId dans un attribut data
            button.onclick = function () { AfficherPopupGame(bet.gameId); };
            actionTd.appendChild(button);
            tr.appendChild(actionTd);
        
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function UpdateBets() {
    try {
        // Étape 1 : Récupérer les jeux en attente
        const pendingGames = await callAPI('/recuperer-games', 'GET');

        if (pendingGames.error) {
            alert(pendingGames.error.status.message || "Erreur inconnue");
            throw new Error (pendingGames.error.status.message || "Erreur inconnue");
        }
        
        if (pendingGames.length === 0) {
            console.log('Aucun jeu en attente trouvé.');
        } 
        
        else {
            for (const game of pendingGames) {
                const matchId = game.gameId;

                try {
                    const matchData = await callAPI(`/proxy/lol/match/v5/matches/${matchId}`, 'GET');

                    if (matchData.error) {
                        alert(matchData.error.status.message || "Erreur inconnue");
                        throw new Error (matchData.error.status.message || "Erreur inconnue");
                    }

                    let winnerTeamId = matchData.info.teams[0].win ? 100 : 200;

                    const matchDetails = {
                        gameId: game.gameId,
                        gameEndTime: matchData.info.gameEndTimestamp,
                        gameStatus: 'completed',
                        winnerTeamId: winnerTeamId,
                    };

                    console.log(matchDetails);

                    // Mise à jour de la base de données
                    const updateResponse = await callAPI('/maj-games', 'POST', matchDetails);

                    if (updateResponse.error) {
                        alert(updateResponse.error.status.message || "Erreur inconnue");
                        throw new Error (updateResponse.error.status.message || "Erreur inconnue");
                    }
                
                } catch (error) {
                    console.log(`Game ${matchId} encore en cours ou non disponible.`);
                }
            }
        }

        // Étape 2 : Mise à jour des paris
        const updateBetsResponse = await callAPI('/maj-bets', 'POST');

        if (updateBetsResponse.error) {
            alert(updateBetsResponse.error.status.message || "Erreur inconnue");
            throw new Error (updateBetsResponse.error.status.message || "Erreur inconnue");
        }

            console.log(`Paris mis à jour avec succès`);
            UpdateClassementBets(); 

    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function AjoutJoueurs() {
    try {
        const gameName = document.getElementById('ResearchgameName').value;
        const tagLine = document.getElementById('ResearchtagLine').value;

        // Récupérer le puuid
        const gamePuuid = await callAPI(`/proxy/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, 'GET');

        if (gamePuuid.error) {
            alert(gamePuuid.error.status.message || "Erreur inconnue");
            throw new Error (gamePuuid.error.status.message || "Erreur inconnue");
        }
        
        // Initialisation de l'objet Summoner
        const summonerDetails = {
            gamePuuid,
            gameName,
            tagLine,
            summonerID: null,
            level: null,
            profileIconId: null,
            tier: null,
            rank: null,
            leaguePoints: null
        };

        // Récupérer les détails du summoner
        const summonerData = await callAPI(`/proxy/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(gamePuuid)}`, 'GET');
        
        if (summonerData.error) {
            alert(summonerData.error.status.message || "Erreur inconnue");
            throw new Error (summonerData.error.status.message || "Erreur inconnue");
        }

        summonerDetails.summonerID = summonerData.id;
        summonerDetails.level = summonerData.summonerLevel;
        summonerDetails.profileIconId = summonerData.profileIconId;

        const leagueData = await callAPI(`/proxy/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerDetails.summonerID)}`, 'GET');

        if (leagueData.error) {
            alert(leagueData.error.status.message || "Erreur inconnue");
            throw new Error (leagueData.error.status.message || "Erreur inconnue");
        }

        if (leagueData.length > 0) {
            summonerDetails.tier = leagueData[0].tier;
            summonerDetails.rank = leagueData[0].rank;
            summonerDetails.leaguePoints = leagueData[0].leaguePoints;
        }

        // Envoyer les données au backend pour ajout en base de données
        const response = await callAPI('/ajouter-joueurs', 'POST', summonerDetails);

        if (response.error) {
            alert(response.error.status.message || "Erreur inconnue");
            throw new Error (response.error.status.message || "Erreur inconnue");
        }

        console.log(response);
        UpdateClassement();

    } catch (error) {
        console.error("Erreur :", error);
        alert('Erreur lors de la récupération des données !');
    }
}

async function AjoutJoueurs2(gameName, tagLine) {
    try {
        // Récupérer le puuid
        const response1 = await callAPI(`/proxy/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, 'GET');
        if (response1.error) {
            alert(response1.error.status.message || "Erreur inconnue");
            throw new Error (response1.error.status.message || "Erreur inconnue");
        }

        gamePuuid = response1.puuid
        // Initialisation de l'objet Summoner
        const summonerDetails = {
            gamePuuid,
            gameName,
            tagLine,
            summonerID: null,
            level: null,
            profileIconId: null,
            tier: null,
            rank: null,
            leaguePoints: null
        };

        // Récupérer les détails du summoner
        const summonerData = await callAPI(`/proxy/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(gamePuuid)}`, 'GET');
        console.log(summonerData)
        if (summonerData.error) {
            alert(summonerData.error.status.message || "Erreur inconnue");
            throw new Error (summonerData.error.status.message || "Erreur inconnue");
        }

        summonerDetails.summonerID = summonerData.id;
        summonerDetails.level = summonerData.summonerLevel;
        summonerDetails.profileIconId = summonerData.profileIconId;

        const leagueData = await callAPI(`/proxy/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerDetails.summonerID)}`, 'GET');
        console.log(leagueData)
        if (leagueData.error) {
            alert(leagueData.error.status.message || "Erreur inconnue");
            throw new Error (leagueData.error.status.message || "Erreur inconnue");
        }

        if (leagueData.length > 0) {
            summonerDetails.tier = leagueData[0].tier;
            summonerDetails.rank = leagueData[0].rank;
            summonerDetails.leaguePoints = leagueData[0].leaguePoints;
        }

        // Envoyer les données au backend pour ajout en base de données
        const response = await callAPI('/ajouter-joueurs', 'POST', summonerDetails);
        console.log(response)
        if (response.error) {
            alert(response.error.status.message || "Erreur inconnue");
            throw new Error (response.error.status.message || "Erreur inconnue");
        }
        alert('Joueur ajouté :)');
    } catch (error) {
        console.error("Erreur :", error);
        alert('Erreur lors de la récupération des données !');
    }
}

async function SupprimerJoueur(gamePuuid) {
    try {
        // Envoie une requête DELETE pour supprimer le joueur
        response = await callAPI('/supprimer-joueurs', 'DELETE', { gamePuuid });

        if (response.error) {
            alert(response.error.status.message || "Erreur inconnue");
            throw new Error (response.error.status.message || "Erreur inconnue");
        }

        // Supprimer la ligne de la table HTML
        const row = document.querySelector(`button[onclick="SupprimerJoueur('${gamePuuid}')"]`).closest('tr');
        if (row) {
            row.remove();
        }

    } catch (error) {
        console.error("Erreur :", error);
        alert('Erreur lors de la suppression du joueur');
    }
}


async function Bets(ResultatParié) {
    const gamePuuid = localStorage.getItem("gamePuuid");
    const JoueursgamePuuid = localStorage.getItem("JoueursgamePuuid") || "Aucun Puuid";
    if (!gamePuuid) {
        alert('Aucun PUUID trouvé !');
        return;
    }
    console.log(JoueursgamePuuid)
    try {
        // Récupération des infos de la partie en cours
        const spectatorData = await callAPI(`/proxy/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(gamePuuid)}`, 'GET');

        if (spectatorData.error) {
            alert(spectatorData.error.status.message || "Erreur inconnue");
            throw new Error (spectatorData.error.status.message || "Erreur inconnue");
        }

        const gameLengthInMinutes = spectatorData.gameLength / 60; // Convertir en minutes
        if (gameLengthInMinutes > 40) {
            alert("La partie a commencé il y a plus de 40 minutes. Les paris ne sont pas autorisés.");
            return;
        }

        const participants = spectatorData.participants;
        const player = participants.find((p) => p.puuid === gamePuuid);

        if (!player) {
            alert("Joueur introuvable dans la partie !");
            return;
        }

        const gameDetails = {
            gameId: spectatorData.gameId,
            gameStartTime: spectatorData.gameStartTime,
        };

        // Ajouter la partie d'abord
        const gameResponse = await callAPI('/ajouter-games', 'POST', gameDetails);

        if (gameResponse.error) {
            alert(gameResponse.error.status.message || "Erreur inconnue");
            throw new Error (gameResponse.error.status.message || "Erreur inconnue");
        }

        console.log("Game ajoutée avec succès.");

        // Déterminer l'équipe en fonction du pari
        let bet_teamId = (ResultatParié === "Victoire") ? player.teamId : (player.teamId === 100 ? 200 : 100);

        const betAmount = document.getElementById("BetsPrice")?.value;
        if (!betAmount || betAmount == 0) {
            alert('Veuillez entrer un montant de pari valide.');
            return;
        }
        const BetsDetails = {
            gamePuuidJoueur: JoueursgamePuuid,
            gameId: spectatorData.gameId,
            bet_amount: betAmount,
            bet_teamId: bet_teamId,
        };

        // Envoi du pari
        const betResponse = await callAPI('/ajouter-bets', 'POST', BetsDetails);

        if (betResponse.error) {
            alert(betResponse.error.status.message || "Erreur inconnue");
            throw new Error (betResponse.error.status.message || "Erreur inconnue");
        }



        alert(betResponse.message);
        // Mettre à jour le classement des paris
        UpdateClassementBets();

    } catch (error) {
        console.error("Erreur :", error);
        alert("Erreur lors de la récupération de la partie en cours !");
    }
}

async function AfficherPopupGame(gameId) {
    try {
        const popup = document.getElementById("popupGame");
        const popupText = document.getElementById("popupGameId");
        const popupDetails = document.getElementById("popupGameDetails");

        if (!popup || !popupText || !popupDetails) {
            console.error("❌ Erreur : popup non trouvé !");
            return;
        }

        // Réinitialiser le contenu précédent
        popupDetails.innerHTML = "";
        popupText.textContent = `Game ID: ${gameId}`;
        popup.style.display = "block";

        // Récupération des détails du match
        const matchData = await callAPI(`/proxy/lol/match/v5/matches/${gameId}`, 'GET');
        console.log(matchData);

        if (matchData.error) {
            alert(matchData.error.status.message || "Erreur inconnue");
            throw new Error (matchData.error.status.message || "Erreur inconnue");
        }

        if (!matchData) {
            console.error("❌ Erreur : Aucune donnée de match trouvée !");
            return;
        }

        // Séparer les équipes (100 pour les alliés, 200 pour les ennemis)
        const allies = matchData.info.participants.filter(p => p.teamId === 100);
        const enemies = matchData.info.participants.filter(p => p.teamId === 200);

        // 💡 A TOI DE DÉFINIR `isWinnerTeam100` ! (true si Team 100 a gagné, false sinon)
        const isWinnerTeam100 = matchData.info.teams[0].win; // ➜ Remplace par ta logique pour vérifier qui a gagné

        const teamHTML = (team, isWinner) =>
            `<div style="display: flex; justify-content: space-between; margin-top: 10px;">
                ${team.map(participant => {
                    const { kills, deaths, assists, kda } = calculatePlayerStats(participant);
                    const kdaColor = getKDAColor(kda);
                    const itemsHTML = [
                        participant.item0, participant.item1, participant.item2,
                        participant.item3, participant.item4, participant.item5
                    ]
                        .map(itemId => itemId ? getItemIcon(itemId) : '<div style="width:30px;height:30px;border:1px solid black;margin:2px;"></div>') // Si pas d'item, afficher une box vide
                        .join('');

                    return `
                        <div style="border: 2px solid ${isWinner ? "green" : "red"}; border-radius: 10px; padding: 5px; margin-right: 30px; margin-left: 30px; text-align: center; width: 150px;">
                            
                            <strong>${participant.riotIdGameName}#${participant.riotIdTagline}</strong>
                            <br><strong>${participant.championName}</strong>
                            <br>${getChampionIcon(participant.championName)}
                            <br><strong>KDA:</strong> <span style="color: ${kdaColor};">${kda}</span>
                            <br><strong>Lane:</strong> ${participant.teamPosition || "Non spécifiée"}
                            <br>Kills: ${participant.kills}, Deaths: ${participant.deaths}, Assists: ${participant.assists}
                            <br><strong>Items :</strong>
                            <div style="display: flex; flex-wrap: wrap; margin-top: 5px;">${itemsHTML}</div>
                        </div>
                    `;
                }).join("")}
            </div>`;

        // ✅ Détermine quelle équipe est gagnante et affiche les couleurs en conséquence
        popupDetails.innerHTML = `
            <div>
                <div><strong>Team 100</strong>${teamHTML(allies, isWinnerTeam100)}</div>
                <div><strong>Team 200</strong>${teamHTML(enemies, !isWinnerTeam100)}</div>
            </div>
        `;

    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}

// Fonction pour ouvrir le popup
function openPopup(HTML) {
    document.getElementById(HTML).style.display = "flex";
}

// Fonction pour fermer le popup
function closePopup(HTML) {
    document.getElementById(HTML).style.display = "none";
}

async function ConnexionJoueurs(gameName, tagLine) {
    const Details = {
        gameName,
        tagLine
    };
console.log(Details)
    try {
        const response = await callAPI('/recuperer-gamepuuid', 'POST', Details);
        const response2 = await callAPI('/recuperer-balance', 'POST', Details);
        // Vérification si la réponse contient le gamePuuid
        if (response.gamePuuid) {
            // Enregistrer les informations dans localStorage
            localStorage.setItem("JoueursgameName", gameName);
            localStorage.setItem("JoueurstagLine", tagLine);
            localStorage.setItem("JoueursgamePuuid", response.gamePuuid);
            localStorage.setItem("Joueursbalance", response2.balance);
            alert('Joueur connecté :)');
            afficherInfosUtilisateur();
        } else {
            alert('Joueur non trouvé');
            console.error('Erreur: Aucun gamePuuid trouvé pour ce joueur');
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
    }
}

function DeconnexionJoueurs() {
    // Supprimer les informations de l'utilisateur du localStorage
    localStorage.removeItem('JoueursgameName');
    localStorage.removeItem('JoueurstagLine');
    localStorage.removeItem('JoueursgamePuuid');
    localStorage.removeItem('Joueursbalance');
    afficherInfosUtilisateur();
}

// Fonction pour afficher les infos de l'utilisateur dans le div JoueursConnexion
function afficherInfosUtilisateur() {
    // Récupérer les informations depuis localStorage
    const gameName = localStorage.getItem('JoueursgameName');
    const tagLine = localStorage.getItem('JoueurstagLine');
    const gamePuuid = localStorage.getItem('JoueursgamePuuid');
    const balance = localStorage.getItem('Joueursbalance');
    console.log (gamePuuid)
    const ButtonConnexionDiv = document.getElementById('ButtonConnexion');
    const PlayerInfoDiv = document.getElementById('PlayerInfo');
    // Vérifier si les informations existent dans localStorage
    if (gameName && tagLine && gamePuuid) {
        ButtonConnexionDiv.innerHTML = `
        <Button onclick="DeconnexionJoueurs()" class="Button2">Deconnexion</Button>
        `
        PlayerInfoDiv.innerHTML = `
        <p>${gameName}#${tagLine}<br>balance : ${balance}</p>
        `

    } else {
        ButtonConnexionDiv.innerHTML = `
        <Button onclick="openPopup('registerPopup')" class="Button2">Sign up</Button>
        <Button onclick="openPopup('connexionPopup')" class="Button2">Connexion</Button>
    `
        PlayerInfoDiv.innerHTML = `
        <strong>Utilisateur non connecté</strong>
        `
    ;

    }
}