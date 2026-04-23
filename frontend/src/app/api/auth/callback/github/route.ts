import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const frontendUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(`${frontendUrl}/login?error=oauth_failed`)
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${frontendUrl}/login?error=oauth_failed`)
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.redirect(`${frontendUrl}/login?error=oauth_failed`)
    }

    const accessToken = tokenData.access_token

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    const userData = await userResponse.json()

    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    const emails = await emailResponse.json()
    const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email

    return NextResponse.redirect(
      `${frontendUrl}/auth?githubId=${userData.login}&username=${encodeURIComponent(userData.name || userData.login)}&avatarUrl=${encodeURIComponent(userData.avatar_url || '')}&email=${encodeURIComponent(primaryEmail || '')}`
    )
  } catch (err) {
    return NextResponse.redirect(`${frontendUrl}/login?error=oauth_failed`)
  }
}