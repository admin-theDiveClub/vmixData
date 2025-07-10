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

    // Helper to pad strings for neat columns
    const pad = (str, len) => String(str).padEnd(len);

    // Find max name length for alignment
    let maxNameLen = 0;
    matches.forEach(match => {
      const playerA = match.players && match.players.a ? match.players.a.fullName : 'Player A';
      const playerH = match.players && match.players.h ? match.players.h.fullName : 'Player H';
      maxNameLen = Math.max(maxNameLen, playerA.length, playerH.length);
    });

    // Format stats with padding
    const statString = (name, res) => {
      const fw = res.fw ?? 0;
      const bf = res.bf ?? 0;
      const gb = res.gb ?? 0;
      const b_in = res.breaks && res.breaks.in !== undefined ? res.breaks.in : 0;
      const b_dry = res.breaks && res.breaks.dry !== undefined ? res.breaks.dry : 0;
      const b_scr = res.breaks && res.breaks.scr !== undefined ? res.breaks.scr : 0;
      return `${pad(name, maxNameLen)} | FW: ${pad(fw,2)} | BF: ${pad(bf,2)} | GB: ${pad(gb,2)} | B_IN: ${pad(b_in,2)} | B_DRY: ${pad(b_dry,2)} | B_SCR: ${pad(b_scr,2)}`;
    };

    matches.forEach(match => {
      // Extract tournamentID from match.competitions.tournamentID
      const tournamentID = match.competitions && match.competitions.tournamentID ? match.competitions.tournamentID : 'Unknown';

      // Get player info and results
      const playerA = match.players && match.players.a ? match.players.a.fullName : 'Player A';
      const playerH = match.players && match.players.h ? match.players.h.fullName : 'Player H';

      const resultsA = match.results && match.results.a ? match.results.a : {};
      const resultsH = match.results && match.results.h ? match.results.h : {};

      // Create match description with neat columns
      const matchText = `${statString(playerA, resultsA)} vs ${statString(playerH, resultsH)}`;

      // Group by tournamentID
      if (!allMatches[tournamentID]) {
      allMatches[tournamentID] = [];
      }
      allMatches[tournamentID].push(matchText);
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

