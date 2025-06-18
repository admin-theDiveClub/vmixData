exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      { "Text1": "Yuvan", "Text2": 14 },
      { "Text1": "Gershwin", "Text2": 9 }
    ])
  }
}
