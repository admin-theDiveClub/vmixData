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

    let upcomingMatches = [];
    let liveMatchesByDate = {};
    let completeMatchesByDate = {};

    for (const match of matches) {
      const status = match.info?.status;
      if (status === "New") {
        upcomingMatches.push(`${match.players.h.fullName} | ${match.players.a.fullName}`);
      } else if (status === "Live" || status === "Complete") {
        const date = match.time?.start ? match.time.start.split('T')[0] : 'Unknown Date';
        const row = `${match.players.h.fullName} | ${match.results.h.fw} | ${match.results.a.fw} | ${match.players.a.fullName}`;
        if (status === "Live") {
          if (!liveMatchesByDate[date]) liveMatchesByDate[date] = [];
          liveMatchesByDate[date].push(row);
        } else if (status === "Complete") {
          if (!completeMatchesByDate[date]) completeMatchesByDate[date] = [];
          completeMatchesByDate[date].push(row);
        }
      }
    }

    // Format upcoming matches
    let upcomingMatchesText = '';
    if (upcomingMatches.length) {
      upcomingMatchesText = 'Coming Up\n' + upcomingMatches.join('\n');
    }

    // Format live matches
    let liveMatchesText = '';
    const liveDates = Object.keys(liveMatchesByDate);
    if (liveDates.length) {
      liveMatchesText = 'Live\n';
      for (const date of liveDates) {
        liveMatchesText += `${date}\n${liveMatchesByDate[date].join('\n')}\n`;
      }
      liveMatchesText = liveMatchesText.trim();
    }

    // Format complete matches
    let completeMatchesText = '';
    const completeDates = Object.keys(completeMatchesByDate);
    if (completeDates.length) {
      completeMatchesText = 'Completed\n';
      for (const date of completeDates) {
        completeMatchesText += `${date}\n${completeMatchesByDate[date].join('\n')}\n`;
      }
      completeMatchesText = completeMatchesText.trim();
    }

    matchesCleaned = [upcomingMatchesText, liveMatchesText, completeMatchesText];

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

