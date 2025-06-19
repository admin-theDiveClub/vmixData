const https = require('https')

exports.handler = async function(event, context) {
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';

  const fetchData = () => new Promise
  (
    (resolve, reject) => 
    {
      var _table = 'tbl_matches';
      var _field1 = 'player_H';
      var _field2 = 'player_A';
      var _value = 'yuvannaidoo@gmail.com';
      
      const options = 
      {
        hostname: 'db.thediveclub.org',
        path: `/rest/v1/${_table}?or=(${_field1}.eq.${_value},${_field2}.eq.${_value})`,
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
    const playerData = await fetchData();

    /*const data = 
    [
      { Player: 'Yuvan', Score: 14 },
      { Player: 'Gershwin', Score: 9 },
      { playerData }
    ];*/
    const data = playerData;

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

