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

        // Use Gemini 2.0 Flash (fastest) or Gemini 1.5 Pro (best quality)
        // Adjust system instruction based on whether image is provided
        const systemInstruction = image
            ? persona.getVisionInstructions()
            : persona.getCoreInstructions();

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction
        });

        const parts = [{ text: message }];

        // Add image if provided
        if (image) {
            console.log('✅ Adding image to Gemini request (length:', image.length, ')');
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: image
                }
            });
        } else {
            console.log('ℹ️ No image provided - text-only mode');
        }

        console.log('📤 Sending to Gemini with', parts.length, 'parts (text + image =', parts.length, ')');
        const result = await model.generateContent(parts);
        const response = await result.response;
        const aiResponse = response.text();

        console.log('Gemini response:', aiResponse);

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process request' },
            { status: 500 }
        );
    }
}
