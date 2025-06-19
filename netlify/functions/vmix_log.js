const https = require('https')

exports.handler = async function(event, context) {
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';

  const fetchRounds = () => new Promise
  (
    (resolve, reject) => 
    {
        var _table = 'tbl_tournaments';
        var _field = 'leagueID';
        var _value = "74f79467-9c26-421b-bcef-389bb40fe1ad";

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

  const fetchMatches = (tournamentID) => new Promise
  (
    (resolve, reject) => 
    {
        var _table = 'tbl_matches';
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
    const roundsData = await fetchRounds();
    const matchesData = [];

    for (const round of roundsData) 
    {
        const tournamentID = round.id; // Assuming 'id' is the field in roundsData that corresponds to tournamentID
        const matches = await fetchMatches(tournamentID);
        matchesData.push({ round, matches });
    }

    /*const data = 
    [
      { Player: 'Yuvan', Score: 14 },
      { Player: 'Gershwin', Score: 9 },
      { playerData }
    ];*/
    const leaderboard = {};

    matchesData.forEach(({ matches }) => {
      matches.forEach(match => {
        const { player_H, player_A, result_H, result_A } = match;

        // Update frames won for Home player
        if (!leaderboard[player_H]) {
          leaderboard[player_H] = 0;
        }
        leaderboard[player_H] += result_H;

        // Update frames won for Away player
        if (!leaderboard[player_A]) {
          leaderboard[player_A] = 0;
        }
        leaderboard[player_A] += result_A;
      });
    });

    // Convert leaderboard object to an array and sort by frames won in descending order
    const sortedLeaderboard = Object.entries(leaderboard)
      .map(([player, framesWon]) => ({ player, framesWon }))
      .sort((a, b) => b.framesWon - a.framesWon);

    // Add rank to each player
    const rankedLeaderboard = sortedLeaderboard.map((entry, index) => ({
      rank: index + 1,
      player: entry.player,
      framesWon: entry.framesWon
    }));

    const data = rankedLeaderboard;

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

