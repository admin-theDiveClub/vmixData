const https = require('https')

exports.handler = async function(event, context) 
{
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';


  const fetchMatches = (value) => new Promise
  (
    (resolve, reject) => 
    {
        var _table = 'tbl_matches';
        var _field = 'competitions->>leagueID';
        var _value = value;

        // Encode the query parameters to ensure proper URL formatting
        const queryParams = new URLSearchParams({
            [`${_field}`]: `eq.${_value}`
        }).toString();

        const options = 
        {
        hostname: 'db.thediveclub.org',
        path: `/rest/v1/${_table}?${queryParams}`,
        method: 'GET',
        headers: 
        {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
        }
        };

        const req = https.request(options, res => 
        {
            let body = '';
            res.on('data', function(chunk) 
            {
            body += chunk;
            });

            res.on('end', function() 
            {
            const data = JSON.parse(body);
            resolve(data);
            });
        });

        req.on('error', err => reject(err));
        req.end();
    }
  );



  try 
  {
    const matches = await fetchMatches('74f79467-9c26-421b-bcef-389bb40fe1ad');
    
    var matchesCleaned = [];

    const playerStats = {};

    for (const match of matches) {
      if (!match.info || !["Live", "Complete"].includes(match.info.status)) continue;

      const players = match.players;
      const results = match.results;
      const history = match.history;

      // Get player IDs and names
      const playerA = players.a;
      const playerH = players.h;

      // Calculate points for each player
      const pointsA = (results.a.fw || 0) + (results.a.bw || 0);
      const pointsH = (results.h.fw || 0) + (results.h.bw || 0);

      // Determine match winner
      let winner = null;
      if (pointsA > pointsH) winner = playerA.id;
      else if (pointsH > pointsA) winner = playerH.id;

      // Frames played
      const framesPlayed = Object.keys(history || {}).length;

      // Frames won
      let framesWonA = 0;
      let framesWonH = 0;
      for (const key in history) {
        if (history[key]["winner-player"] === "a") framesWonA++;
        if (history[key]["winner-player"] === "h") framesWonH++;
      }

      // Update stats for player A
      if (!playerStats[playerA.id]) {
        playerStats[playerA.id] = {
          id: playerA.id,
          fullName: playerA.fullName,
          matchesPlayed: 0,
          matchesWon: 0,
          framesPlayed: 0,
          framesWon: 0,
          bw: 0,
          points: 0
        };
      }
      playerStats[playerA.id].matchesPlayed += 1;
      if (winner === playerA.id) playerStats[playerA.id].matchesWon += 1;
      playerStats[playerA.id].framesPlayed += framesPlayed;
      playerStats[playerA.id].framesWon += framesWonA;
      playerStats[playerA.id].bw += results.a.bw || 0;
      playerStats[playerA.id].points += pointsA;

      // Update stats for player H
      if (!playerStats[playerH.id]) {
        playerStats[playerH.id] = {
          id: playerH.id,
          fullName: playerH.fullName,
          matchesPlayed: 0,
          matchesWon: 0,
          framesPlayed: 0,
          framesWon: 0,
          bw: 0,
          points: 0
        };
      }
      playerStats[playerH.id].matchesPlayed += 1;
      if (winner === playerH.id) playerStats[playerH.id].matchesWon += 1;
      playerStats[playerH.id].framesPlayed += framesPlayed;
      playerStats[playerH.id].framesWon += framesWonH;
      playerStats[playerH.id].bw += results.h.bw || 0;
      playerStats[playerH.id].points += pointsH;
    }

    // Prepare cleaned array
    matchesCleaned = Object.values(playerStats).map(player => {
      const matchesWinRate = player.matchesPlayed > 0 ? (player.matchesWon / player.matchesPlayed) : 0;
      const framesWinRate = player.framesPlayed > 0 ? (player.framesWon / player.framesPlayed) : 0;
      return {
        fullName: player.fullName,
        matchesPlayed: player.matchesPlayed,
        matchesWon: player.matchesWon,
        matchesWinRate: Number(matchesWinRate.toFixed(3)),
        framesPlayed: player.framesPlayed,
        framesWon: player.framesWon,
        framesWinRate: Number(framesWinRate.toFixed(3)),
        bw: player.bw,
        points: player.points
      };
    });

    // Sort by points, framesWon, bw, matchesWon
    matchesCleaned.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.framesWon !== a.framesWon) return b.framesWon - a.framesWon;
      if (b.bw !== a.bw) return b.bw - a.bw;
      return b.matchesWon - a.matchesWon;
    });

    // Add Rank
    matchesCleaned.forEach((player, idx) => {
      player.Rank = idx + 1;
    });

    const data = matchesCleaned;

    const response =
    {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

    return response;
    
  } catch (err) 
  {
    const error = 
    {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
    return error;
  }
};

/*
{"leagueID": "74f79467-9c26-421b-bcef-389bb40fe1ad", "tournamentID": "0bae0f74-ef96-45d9-bdbb-fe8d20aab7d4"}
tournament.status = "Live" / "Complete" / "New"

*/

