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

    matchesData.forEach(({ matches }) => 
    {
      matches.forEach(match => 
      {
      const { player_H, player_A, result_H, result_A, apples_H = 0, apples_A = 0, lag, breakHistory } = match;

      // Update stats for Home player
      if (!leaderboard[player_H]) 
      {
        leaderboard[player_H] = { 
        matchesPlayed: 0, matchesWon: 0, framesPlayed: 0, framesWon: 0, apples: 0, points: 0, lags: 0, breaks: 0, scratchBreaks: 0, dryBreaks: 0, breakIns: 0 
        };
      }

      leaderboard[player_H].matchesPlayed += 1;
      leaderboard[player_H].matchesWon += result_H > result_A ? 1 : 0;
      leaderboard[player_H].framesPlayed += result_H + result_A;
      leaderboard[player_H].framesWon += result_H;
      leaderboard[player_H].apples += apples_H;
      leaderboard[player_H].points += result_H + apples_H;
      leaderboard[player_H].lags += lag == "Home" ? 1 : 0;
      breakEvent.forEach(breakEvent => 
      {
        if (breakEvent.Player == "Home") 
        {
          leaderboard[player_H].breaks += 1;
          if (breakEvent.event === 0) leaderboard[player_H].scratchBreaks += 1;
          if (breakEvent.event === 1) leaderboard[player_H].dryBreaks += 1;
          if (breakEvent.event === 2) leaderboard[player_H].breakIns += 1;
        }
      });

      // Update stats for Away player
      if (!leaderboard[player_A]) 
      {
        leaderboard[player_A] = { 
        matchesPlayed: 0, matchesWon: 0, framesPlayed: 0, framesWon: 0, apples: 0, points: 0, lags: 0, breaks: 0, scratchBreaks: 0, dryBreaks: 0, breakIns: 0 
        };
      }

      leaderboard[player_A].matchesPlayed += 1;
      leaderboard[player_A].matchesWon += result_A > result_H ? 1 : 0;
      leaderboard[player_A].framesPlayed += result_H + result_A;
      leaderboard[player_A].framesWon += result_A;
      leaderboard[player_A].apples += apples_A;
      leaderboard[player_A].points += result_A + apples_A;
      leaderboard[player_A].lags += lag == "Away" ? 1 : 0;

      breakEvent.forEach(breakEvent => 
      {
        if (breakEvent.Player == "Away") 
        {
          leaderboard[player_A].breaks += 1;
          if (breakEvent.event === 0) leaderboard[player_A].scratchBreaks += 1;
          if (breakEvent.event === 1) leaderboard[player_A].dryBreaks += 1;
          if (breakEvent.event === 2) leaderboard[player_A].breakIns += 1;
        }
      });
      });
    });

    // Convert leaderboard object to an array and sort by Points, Frames Won, Apples in descending order
    const sortedLeaderboard = Object.entries(leaderboard)
      .map(([player, stats]) => ({
      player,
      matchesPlayed: stats.matchesPlayed,
      matchesWon: stats.matchesWon,
      matchWinRate: ((stats.matchesWon / stats.matchesPlayed) * 100).toFixed(2),
      framesPlayed: stats.framesPlayed,
      framesWon: stats.framesWon,
      framesWinRate: ((stats.framesWon / stats.framesPlayed) * 100).toFixed(2),
      lags: stats.lags,
      breaks: stats.breaks,
      scratchBreaks: stats.scratchBreaks,
      dryBreaks: stats.dryBreaks,
      breakIns: stats.breakIns,
      points: stats.points
      }))
      .sort((a, b) => 
      b.points - a.points || 
      b.framesWon - a.framesWon || 
      b.apples - a.apples
      );

    // Add rank to each player
    const rankedLeaderboard = sortedLeaderboard.map((entry, index) => ({
      rank: index + 1,
      player: entry.player,
      matchesPlayed: entry.matchesPlayed,
      matchesWon: entry.matchesWon,
      matchWinRate: entry.matchWinRate,
      framesPlayed: entry.framesPlayed,
      framesWon: entry.framesWon,
      framesWinRate: entry.framesWinRate,
      lags: entry.lags,
      breaks: entry.breaks,
      scratchBreaks: entry.scratchBreaks,
      dryBreaks: entry.dryBreaks,
      breakIns: entry.breakIns,
      points: entry.points
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

