const https = require('https')

exports.handler = async function(event, context) {
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';


  const fetchMatch = (tournamentID) => new Promise
  (
    (resolve, reject) => 
    {
        var _table = 'tbl_matches_new';
        var _field = 'tournamentID';
        var _value = tournamentID; // Replace 'someVariable' with the actual variable or value

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
    const match = await fetchMatch('ea7ae96a-01ec-43b7-b908-8345e9540c55');
    
    if (!match || match.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Match not found' })
      };
    }

    const currentMatch = match[0];
    const homePlayer = currentMatch.players?.home;
    const awayPlayer = currentMatch.players?.away;

    if (!homePlayer?.id || !awayPlayer?.id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid player data in match' })
      };
    }

    // Get the league ID from the current match to fetch all matches in the same league
    const leagueID = currentMatch.leagueID;
    const allMatches = await fetchMatches(leagueID);

    // Filter matches that include both players (head-to-head)
    const headToHeadMatches = allMatches.filter(match => {
      const homeId = match.players?.home?.id;
      const awayId = match.players?.away?.id;
      return (homeId === homePlayer.id && awayId === awayPlayer.id) ||
             (homeId === awayPlayer.id && awayId === homePlayer.id);
    });

    // Calculate head-to-head statistics
    const playerStats = {
      [homePlayer.id]: {
        id: homePlayer.id,
        fullName: homePlayer.fullName,
        matchesPlayed: 0,
        matchesWon: 0,
        framesPlayed: 0,
        framesWon: 0,
        apples: 0,
        points: 0
      },
      [awayPlayer.id]: {
        id: awayPlayer.id,
        fullName: awayPlayer.fullName,
        matchesPlayed: 0,
        matchesWon: 0,
        framesPlayed: 0,
        framesWon: 0,
        apples: 0,
        points: 0
      }
    };

    headToHeadMatches.forEach(match => {
      // Only count completed matches
      if (match.time?.end != null) {
        ['home', 'away'].forEach(side => {
          const player = match.players?.[side];
          if (!player || !playerStats[player.id]) return;

          playerStats[player.id].matchesPlayed += 1;
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
      }
    });

    // Calculate win rates and points
    Object.values(playerStats).forEach(stat => {
      stat.matchesWinRate = stat.matchesPlayed ? `${Math.round((stat.matchesWon / stat.matchesPlayed) * 100)}%` : '0%';
      stat.framesWinRate = stat.framesPlayed ? `${Math.round((stat.framesWon / stat.framesPlayed) * 100)}%` : '0%';
      stat.points = stat.framesWon + stat.apples;
    });

    // Create head-to-head data structure
    const headToHeadData = {
      currentMatch: {
        id: currentMatch.id,
        homeName: homePlayer.fullName,
        awayName: awayPlayer.fullName,
        homeFrames: currentMatch.results?.home?.frames || 0,
        awayFrames: currentMatch.results?.away?.frames || 0,
        homeApples: currentMatch.results?.home?.apples || 0,
        awayApples: currentMatch.results?.away?.apples || 0,
        homeGoldenBreaks: currentMatch.results?.home?.goldenBreaks || 0,
        awayGoldenBreaks: currentMatch.results?.away?.goldenBreaks || 0,
        homePoints: (currentMatch.results?.home?.frames || 0) + (currentMatch.results?.home?.apples || 0),
        awayPoints: (currentMatch.results?.away?.frames || 0) + (currentMatch.results?.away?.apples || 0),
        status: currentMatch.time?.start && !currentMatch.time?.end ? 'active' : 'inactive'
      },
      headToHead: {
        totalMatches: headToHeadMatches.filter(m => m.time?.end != null).length,
        homePlayer: {
          fullName: homePlayer.fullName,
          matchesPlayed: playerStats[homePlayer.id].matchesPlayed,
          matchesWon: playerStats[homePlayer.id].matchesWon,
          matchesWinRate: playerStats[homePlayer.id].matchesWinRate,
          framesPlayed: playerStats[homePlayer.id].framesPlayed,
          framesWon: playerStats[homePlayer.id].framesWon,
          framesWinRate: playerStats[homePlayer.id].framesWinRate,
          apples: playerStats[homePlayer.id].apples,
          points: playerStats[homePlayer.id].points
        },
        awayPlayer: {
          fullName: awayPlayer.fullName,
          matchesPlayed: playerStats[awayPlayer.id].matchesPlayed,
          matchesWon: playerStats[awayPlayer.id].matchesWon,
          matchesWinRate: playerStats[awayPlayer.id].matchesWinRate,
          framesPlayed: playerStats[awayPlayer.id].framesPlayed,
          framesWon: playerStats[awayPlayer.id].framesWon,
          framesWinRate: playerStats[awayPlayer.id].framesWinRate,
          apples: playerStats[awayPlayer.id].apples,
          points: playerStats[awayPlayer.id].points
        }
      }
    };

    const response = {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(headToHeadData)
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

