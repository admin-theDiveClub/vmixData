import { createClient } from '@supabase/supabase-js';

export const handler = async function() 
{
  // Initialize Supabase client
  const supabaseUrl = 'https://db.thediveclub.org';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmx3dXRudW91eW51a290ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTgyMzEsImV4cCI6MjA1NTI3NDIzMX0.qyEDq8w67G2BMfyHO7Iyvd3nFUSd0sulJhGl0eGkbfA';
  const supabase = createClient(supabaseUrl, supabaseKey);

  var data = 
  [
    { "Player": "Yuvan", 
      "Score": 14 
    },
    { "Player": "Gershwin", 
      "Score": 9 
    }
  ];

  const response = await supabase.from('tbl_players').select('*').eq('username', 'yuvannaidoo@gmail.com');
  console.log("GetPlayer Response:", response.data[0]);
  data.push({response: response.data[0]});

  response = 
  {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }
  return response;
}
