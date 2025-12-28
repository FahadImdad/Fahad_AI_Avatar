import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { message } = await request.json();

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GROQ_API_KEY not configured. Get your free key at https://console.groq.com' },
                { status: 500 }
            );
        }

        console.log('Received message (Groq):', message);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Fast and free
                messages: [
                    {
                        role: 'system',
                        content: `You are Fahad, a friendly and natural AI assistant.

                        IMPORTANT RULES:
                        - Respond naturally like a human friend would in conversation
                        - Keep responses concise (2-3 sentences max) since this is a voice conversation
                        - Be warm, helpful, and conversational
                        - You don't have vision capabilities in this mode. If the user asks what you see or about their appearance, politely tell them to enable the camera by clicking the camera button to activate vision mode.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API error:', error);
            throw new Error(`Groq API error: ${error}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        console.log('Groq response:', aiResponse);

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error('Groq API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process request' },
            { status: 500 }
        );
    }
}
