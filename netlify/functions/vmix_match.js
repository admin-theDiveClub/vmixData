const https = require('https')

exports.handler = async function(event, context) {
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';


  const fetchMatch = (matchID) => new Promise
  (
    (resolve, reject) => 
    {
        var _table = 'tbl_matches';
        var _field = 'id';
        var _value = matchID; // Replace 'someVariable' with the actual variable or value

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
    const match = await fetchMatch('9173fa90-21b3-4bad-b077-3d5e447e8a6b');
    const data = match.map(item => ({
        ...item,
        runningPoints_H: item.result_H + item.apples_H + item.goldenBreaks_H,
        runningPoints_A: item.result_A + item.apples_A + item.goldenBreaks_A
    }));

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

