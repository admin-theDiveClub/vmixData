const https = require('https')

exports.handler = async function(event, context) {
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';

  const fetchPlayer = () =>
    new Promise((resolve, reject) => {
      const options = {
        hostname: 'db.thediveclub.org',
        path: '/rest/v1/tbl_players?username=eq.yuvannaidoo@gmail.com',
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }
      };

      const req = https.request(options, res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => resolve(JSON.parse(body)));
      });

      req.on('error', err => reject(err));
      req.end();
    });

  try {
    const playerData = await fetchPlayer();

    const data = [
      { Player: 'Yuvan', Score: 14 },
      { Player: 'Gershwin', Score: 9 },
      { Player: 'FromDB', Score: playerData[0]?.id || 'N/A' } // Or whatever field you want
    ];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

