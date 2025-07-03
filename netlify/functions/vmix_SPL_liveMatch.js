const https = require('https')

exports.handler = async function(event, context) {
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';


  const fetchMatches = () => new Promise
  (
    (resolve, reject) => 
    {
        var _table = 'tbl_matches';

        // Build query parameters for filtering
        const queryParams = new URLSearchParams({
            'info->>status': 'eq.Live',
            'competitions->>leagueID': 'eq.74f79467-9c26-421b-bcef-389bb40fe1ad'
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
    const liveMatches = await fetchMatches(); 

    const match = liveMatches[0];

    const player_Home = match.players.h.fullName;
    const player_Home_firstName = match.players.h.fullName.split(' ')[0];
    const H_fw = match.results.h.fw;
    const H_bf = match.results.h.bf;
    const H_gb = match.results.h.gb;
    const H_rf = match.results.h.rf;
    const H_b_in = match.results.h.breaks.in;
    const H_b_dry = match.results.h.breaks.dry;
    const H_b_scr = match.results.h.breaks.scr;
    const H_points = H_fw + H_bf;

    const player_Away = match.players.a.fullName;
    const player_Away_firstName = match.players.a.fullName.split(' ')[0];
    const A_fw = match.results.a.fw;
    const A_bf = match.results.a.bf;
    const A_gb = match.results.a.gb;
    const A_rf = match.results.a.rf;
    const A_b_in = match.results.a.breaks.in;
    const A_b_dry = match.results.a.breaks.dry;
    const A_b_scr = match.results.a.breaks.scr;
    const A_points = A_fw + A_bf;

    var liveMatchStripped = {
      player_Home,
      player_Home_firstName,
      H_fw,
      H_bf,
      H_points,
      H_gb,
      H_rf,
      H_b_in,
      H_b_dry,
      H_b_scr,
      player_Away,
      player_Away_firstName,
      A_fw,
      A_bf,
      A_points,
      A_gb,
      A_rf,
      A_b_in,
      A_b_dry,
      A_b_scr
    };

    const data = liveMatchStripped;



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