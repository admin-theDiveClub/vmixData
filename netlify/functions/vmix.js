const https = require('https')

exports.handler = async function(event, context) {
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';

  const fetchPlayer = () => new Promise
  (
    (resolve, reject) => 
    {
      var _table = 'tbl_players';
      var _field = 'username';
      var _value = 'yuvannaidoo@gmail.com';
      
      const options = 
      {
        hostname: 'db.thediveclub.org',
        path: `/rest/v1/${_table}?${_field}=eq.${_value}`,
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
          body = body[0];
        });

        res.on('end', function() 
        {
          resolve(JSON.parse(body));
        });
      });

      req.on('error', err => reject(err));
      req.end();
    }
  );

  try 
  {
    const playerData = await fetchPlayer();

    const data = 
    [
      { Player: 'Yuvan', Score: 14 },
      { Player: 'Gershwin', Score: 9 },
      { playerData }
    ];

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

