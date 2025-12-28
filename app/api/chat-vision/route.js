import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { message, image } = await request.json();

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OPENAI_API_KEY not configured. Vision features unavailable.', code: 'SERVICE_NOT_CONFIGURED' },
                { status: 503 }
            );
        }

        console.log('Received message:', message);
        console.log('Image received:', image ? `Yes (${image.length} chars)` : 'No');

        // Build messages array
        const messages = [
            {
                role: 'system',
                content: `You are Fahad, a friendly and natural AI assistant with vision capabilities. You can see the user through their webcam in real-time.

IMPORTANT RULES:
- Respond naturally like a human friend would in conversation
- You HAVE vision and CAN see the user. When they ask "what do you see?", "how do I look?", "what am I wearing?", or similar questions, describe what you see in their webcam image.
- ONLY mention what you see when:
  1. The user explicitly asks (e.g., "what do you see?", "how do I look?", "what am I wearing?", "describe what you see")
  2. It's contextually relevant (e.g., if they ask "should I go out?" you might comment on their outfit)
  3. You notice something important (e.g., they look tired, happy, or their appearance changed significantly)
- DO NOT describe the visual scene in every response - that's unnatural
- Keep responses concise (2-3 sentences max) since this is a voice conversation
- Be warm, helpful, and conversational`
            }
        ];

        // Add user message with or without image
        if (image) {
            console.log('Sending image to OpenAI with message:', message);
            messages.push({
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: message
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${image}`,
                            detail: 'low' // Use 'low' for faster/cheaper processing
                        }
                    }
                ]
            });
        } else {
            console.log('No image - text only');
            messages.push({
                role: 'user',
                content: message
            });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Affordable model with vision
                messages: messages,
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenAI API error:', error);
            throw new Error(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        console.log('OpenAI response:', aiResponse);

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error('OpenAI API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process request' },
            { status: 500 }
        );
    }
}
