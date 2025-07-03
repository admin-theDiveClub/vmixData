const https = require('https')

exports.handler = async function(event, context) 
{
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';


  const fetchMatches = (field, value) => new Promise
  (
    (resolve, reject) => 
    {
        var _table = 'tbl_matches';
        var _field = field;
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
    const liveMatches = await fetchMatches("info->>status", "Live");
    const players = [liveMatches[0].players.h.fullName, liveMatches[0].players.a.fullName];

    const leagueMatches = await fetchMatches("competitions->>leagueID", "74f79467-9c26-421b-bcef-389bb40fe1ad");

    var leaderboard = [];
    const playerStats = {};

    for (const match of leagueMatches) 
    {
      if (!match.info || !["Live", "Complete"].includes(match.info.status)) continue;

      const players = match.players;
      const results = match.results;
      const history = match.history;

      // Get player IDs and names
      const playerA = players.a;
      const playerH = players.h;

      // Calculate points for each player
      const pointsA = (results.a.fw || 0) + (results.a.bf || 0);
      const pointsH = (results.h.fw || 0) + (results.h.bf || 0);

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

      // Helper to get stat or 0
      const getStat = (obj, path) => {
        return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : 0), obj);
      };

      // Update stats for player A
      if (!playerStats[playerA.id]) {
        playerStats[playerA.id] = {
          id: playerA.id,
          fullName: playerA.fullName,
          matchesPlayed: 0,
          matchesWon: 0,
          framesPlayed: 0,
          framesWon: 0,
          bf: 0,
          points: 0,
          gb: 0,
          rf: 0,
          b_in: 0,
          b_dry: 0,
          b_scr: 0
        };
      }
      if (match.info.status === "Complete") {
        playerStats[playerA.id].matchesPlayed += 1;
        if (winner === playerA.id) playerStats[playerA.id].matchesWon += 1;
      }
      playerStats[playerA.id].framesPlayed += framesPlayed;
      playerStats[playerA.id].framesWon += framesWonA;
      playerStats[playerA.id].bf += results.a.bf || 0;
      playerStats[playerA.id].points += pointsA;
      playerStats[playerA.id].gb += results.a.gb || 0;
      playerStats[playerA.id].rf += results.a.rf || 0;
      playerStats[playerA.id].b_in += getStat(results.a, ["breaks", "in"]);
      playerStats[playerA.id].b_dry += getStat(results.a, ["breaks", "dry"]);
      playerStats[playerA.id].b_scr += getStat(results.a, ["breaks", "scr"]);

      // Update stats for player H
      if (!playerStats[playerH.id]) {
        playerStats[playerH.id] = {
          id: playerH.id,
          fullName: playerH.fullName,
          matchesPlayed: 0,
          matchesWon: 0,
          framesPlayed: 0,
          framesWon: 0,
          bf: 0,
          points: 0,
          gb: 0,
          rf: 0,
          b_in: 0,
          b_dry: 0,
          b_scr: 0
        };
      }
      if (match.info.status === "Complete") {
        playerStats[playerH.id].matchesPlayed += 1;
        if (winner === playerH.id) playerStats[playerH.id].matchesWon += 1;
      }
      playerStats[playerH.id].framesPlayed += framesPlayed;
      playerStats[playerH.id].framesWon += framesWonH;
      playerStats[playerH.id].bf += results.h.bf || 0;
      playerStats[playerH.id].points += pointsH;
      playerStats[playerH.id].gb += results.h.gb || 0;
      playerStats[playerH.id].rf += results.h.rf || 0;
      playerStats[playerH.id].b_in += getStat(results.h, ["breaks", "in"]);
      playerStats[playerH.id].b_dry += getStat(results.h, ["breaks", "dry"]);
      playerStats[playerH.id].b_scr += getStat(results.h, ["breaks", "scr"]);
    }

    // Prepare cleaned array
    leaderboard = Object.values(playerStats).map(player => {
      const matchesWinRate = player.matchesPlayed > 0 ? (player.matchesWon / player.matchesPlayed) : 0;
      const framesWinRate = player.framesPlayed > 0 ? (player.framesWon / player.framesPlayed) : 0;
      return {
        fullName: player.fullName,
        matchesPlayed: player.matchesPlayed,
        matchesWon: player.matchesWon,
        matchesWinRate: (matchesWinRate * 100).toFixed(1),
        framesPlayed: player.framesPlayed,
        framesWon: player.framesWon,
        framesWinRate: (framesWinRate * 100).toFixed(1),
        bf: player.bf,
        points: player.points,
        gb: player.gb,
        rf: player.rf,
        b_in: player.b_in,
        b_dry: player.b_dry,
        b_scr: player.b_scr
      };
    });

    // Sort by points, framesWon, bf, matchesWon
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.framesWon !== a.framesWon) return b.framesWon - a.framesWon;
      if (b.bf !== a.bf) return b.bf - a.bf;
      return b.matchesWon - a.matchesWon;
    });

    // Add Rank
    leaderboard.forEach((player, idx) => {
      player.rank = idx + 1;
    });

    // Filter out leaderboard entries where player is in players array
    const filteredLeaderboard = leaderboard.filter(player => players.includes(player.fullName));
    data = filteredLeaderboard;

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

