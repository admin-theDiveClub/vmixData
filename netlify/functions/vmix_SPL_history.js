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
    const matches = await fetchMatches('competitions->>leagueID', '74f79467-9c26-421b-bcef-389bb40fe1ad');
    
    var allMatches = {};
    
    // Add headers for player stats to each round
    const roundKey = `Round 0`;
    allMatches[roundKey] = [
      "         Player          | FW  | BF| Points | Player | FW | BF | Points"
    ];

    matches.forEach((match, i) => {
      // Extract date from match.time.start (YYYY-MM-DD)
      const date = match.time && match.time.start ? match.time.start.split('T')[0] : 'Unknown Date';
      const roundKey = `Round ${date}`;

      // Ensure header exists for each round
      if (!allMatches[roundKey]) {
      allMatches[roundKey] = [
        "Player | FW | BF | Points | Player | FW | BF | Points"
      ];
      }

      // Extract player info and results
      const h = match.players && match.players.h ? match.players.h : {};
      const a = match.players && match.players.a ? match.players.a : {};
      const rh = match.results && match.results.h ? match.results.h : {};
      const ra = match.results && match.results.a ? match.results.a : {};

      // Format player stats
      const hStats = `FW:${rh.fw || 0} BF:${rh.bf || 0} Points:${(rh.fw || 0) + (rh.bf || 0)}`;
      const aStats = `FW:${ra.fw || 0} BF:${ra.bf || 0} Points:${(ra.fw || 0) + (ra.bf || 0)}`;

      // Format match line
      const matchLine = `${h.fullName || ''} | ${hStats} | ${a.fullName || ''} ${aStats}`;

      // Add to allMatches (append if multiple matches)
      allMatches[roundKey].push(`match_${i}: ${matchLine}`);
    });

    const data = allMatches;

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

