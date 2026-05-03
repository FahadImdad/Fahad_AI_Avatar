import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { persona } from '../../../config/persona.js';

export async function POST(request) {
    try {
        const { message, image } = await request.json();

        console.log('Gemini - Received message:', message);
        console.log('Gemini - Image received:', image ? `Yes (${image.length} chars)` : 'No');

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return NextResponse.json(
                { error: 'Gemini API key not configured', code: 'API_KEY_MISSING' },
                { status: 503 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const systemInstruction = image
            ? persona.getVisionInstructions()
            : persona.getCoreInstructions();

        const parts = [{ text: message }];
        if (image) {
            parts.push({
                inlineData: { mimeType: 'image/jpeg', data: image }
            });
        }

        // Try a list of models in order — Google has retired or restricted
        // several variants for new keys, so fall back through the current GA
        // family until one responds.
        const candidates = [
            'gemini-flash-latest',
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-pro-latest',
        ];

        const failures = [];
        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
                const result = await model.generateContent(parts);
                const aiResponse = (await result.response).text();
                console.log(`Gemini OK via ${modelName}`);
                return NextResponse.json({ response: aiResponse, model: modelName });
            } catch (e) {
                console.warn(`Model ${modelName} failed: ${e.message}`);
                failures.push(`${modelName}: ${e.message}`);
            }
        }

        return NextResponse.json(
            { error: `All Gemini models failed. ${failures.join(' | ')}` },
            { status: 502 }
        );
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process request' },
            { status: 500 }
        );
    }
}
