const https = require('https')

exports.handler = async function(event, context) {
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';


  const fetchMatches = (leagueID) => new Promise
  (
    (resolve, reject) => 
    {
        var _table = 'tbl_matches_new';
        var _field = 'leagueID';
        var _value = leagueID; // Replace 'someVariable' with the actual variable or value

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
    // Build leaderboard
    const playerStats = {};

    matches.forEach(match => {
      // Only count matches with valid players
      ['home', 'away'].forEach(side => {
      const player = match.players?.[side];
      if (!player || !player.id) return;
      if (!playerStats[player.id]) {
        playerStats[player.id] = {
        id: player.id,
        fullName: player.fullName,
        matchesPlayed: 0,
        matchesWon: 0,
        framesPlayed: 0,
        framesWon: 0,
        apples: 0,
        points: 0
        };
      }
      if (match.time?.end != null) 
      {
        playerStats[player.id].matchesPlayed += 1;
      }
      playerStats[player.id].framesPlayed += match.history?.['breaks-event']?.length || 0;
      playerStats[player.id].framesWon += match.results?.[side]?.frames || 0;
      playerStats[player.id].apples += match.results?.[side]?.apples || 0;
      });

      // Determine match winner
      let homeFrames = match.results?.home?.frames || 0;
      let awayFrames = match.results?.away?.frames || 0;
      if (homeFrames > awayFrames && match.players?.home?.id) {
      playerStats[match.players.home.id].matchesWon += 1;
      } else if (awayFrames > homeFrames && match.players?.away?.id) {
      playerStats[match.players.away.id].matchesWon += 1;
      }
    });

    // Calculate win rates and points
    Object.values(playerStats).forEach(stat => {
      stat.matchesWinRate = stat.matchesPlayed ? `${Math.round((stat.matchesWon / stat.matchesPlayed) * 100)}%` : '0%';
      stat.framesWinRate = stat.framesPlayed ? `${Math.round((stat.framesWon / stat.framesPlayed) * 100)}%` : '0%';
      stat.points = stat.framesWon + stat.apples;
    });

    // Sort leaderboard by points descending
    const leaderboard = Object.values(playerStats)
      .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.framesWon !== a.framesWon) return b.framesWon - a.framesWon;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      return b.apples - a.apples;
      })
      .map((stat, idx) => ({
      rank: idx + 1,
      fullName: stat.fullName,
      matchesPlayed: stat.matchesPlayed,
      matchesWon: stat.matchesWon,
      matchesWinRate: stat.matchesWinRate,
      framesPlayed: stat.framesPlayed,
      framesWon: stat.framesWon,
      framesWinRate: stat.framesWinRate,
      apples: stat.apples,
      points: stat.points
      }));

    const data = leaderboard;

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

