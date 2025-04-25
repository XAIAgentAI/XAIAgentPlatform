import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('imageUrl');
  const style = searchParams.get('style');
  const text = searchParams.get('text');

  // 验证图片URL
  if (!imageUrl?.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:creator" content="@YourTwitterHandle">
        <meta name="twitter:title" content="${text || 'AI Generated Art'}">
        <meta name="twitter:description" content="Created with ${style || 'AI'} style #StyleIDChallenge #AIArt">
        <meta name="twitter:image" content="${imageUrl}">
        <meta name="twitter:image:alt" content="AI generated artwork in ${style || 'default'} style">
        <meta http-equiv="refresh" content="0;url=${imageUrl}" />
      </head>
      <body>
        <script>
          window.location.href = "${imageUrl}";
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, s-maxage=86400'
    }
  });
};