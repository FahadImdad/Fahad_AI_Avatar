import { NextResponse } from 'next/server';

// Proxy the ReadyPlayerMe avatar through our own domain so the browser-side
// useGLTF call isn't subject to RPM's CORS / hotlinking rules. The query
// param `?morphTargets=Oculus+Visemes` tells RPM to include viseme morph
// targets, which the lipsync code in components/Avatar.js needs.
const AVATAR_URL =
    'https://models.readyplayer.me/693afeff78f65986ccb00932.glb?morphTargets=Oculus+Visemes';

export async function GET() {
    try {
        const upstream = await fetch(AVATAR_URL, { cache: 'no-store' });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: `Upstream returned ${upstream.status}` },
                { status: upstream.status }
            );
        }

        return new Response(upstream.body, {
            status: 200,
            headers: {
                'Content-Type': 'model/gltf-binary',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            },
        });
    } catch (err) {
        return NextResponse.json(
            { error: err.message || 'Failed to fetch avatar' },
            { status: 502 }
        );
    }
}
