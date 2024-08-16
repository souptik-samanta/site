import AirtablePlus from "airtable-plus"

const airtable = new AirtablePlus({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseID: 'app4kCWulfB02bV8Q',
  tableName: "Users"
})

async function getUserFromLogin(loginToken) {

  // only alphanumeric & '-' characters are allowed in the token
  const safeLoginToken = loginToken.replace(/[^a-zA-Z0-9-]/g, '')

  const results = await airtable.read({
    filterByFormula: `{Login Token} = '${safeLoginToken}'`,
    maxRecords: 1
  })
  
  return results[0]
}

async function scrubLoginToken(userID) {
  console.log(`Scrubbing login token for user ${userID}`)
  await airtable.update(userID, {
    'Login Token': ''
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { token } = req.query
  if (!token) {
    return res.status(400).json({ error: "Token is required" })
  }

  const user = await getUserFromLogin(token)
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  const authToken = user.fields['Auth Token']
  if (!authToken) {
    return res.status(500).json({ error: "Auth Token not found" })
  }

  await scrubLoginToken(user.id)

  // return back the user's AuthToken
  res.status(200).json({ authToken })
}