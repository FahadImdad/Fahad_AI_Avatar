'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import { persona } from '../config/persona.js';

// Dynamically import Avatar to avoid SSR issues with Three.js
const Avatar = dynamic(() => import('../components/Avatar'), { ssr: false });

export default function Home() {
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioData, setAudioData] = useState(0);
    const [error, setError] = useState(null);

    // Camera and mic are always enabled
    const cameraEnabled = true;
    const micEnabled = true;

    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const videoRef = useRef(null);
    const previewVideoRef = useRef(null);
    const mediaStreamRef = useRef(null);

    // State refs to avoid stale closures in callbacks
    const isSpeakingRef = useRef(false);
    const isProcessingRef = useRef(false);
    const silenceTimerRef = useRef(null);
    const transcriptAccumulatorRef = useRef('');
    const hasGreetedRef = useRef(false);

    // Initialize audio context and cleanup on unmount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }

        return () => {
            // Cleanup all resources
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    // Handle initial start
    const handleStart = async () => {
        if (isConnected) return;

        try {
            setError(null);

            // Resume audio context
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // Get user media (audio only initially)
            const constraints = {
                audio: true
            };

            if (cameraEnabled) {
                constraints.video = {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                };
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            mediaStreamRef.current = stream;
            if (videoRef.current && cameraEnabled) {
                videoRef.current.srcObject = stream;
            }
            if (previewVideoRef.current && cameraEnabled) {
                previewVideoRef.current.srcObject = stream;
            }

            // Initialize speech recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Speech recognition not supported in this browser');
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsConnected(true);
                setIsListening(micEnabled);
            };

            recognition.onresult = (event) => {
                const currentResult = event.results[event.results.length - 1];
                const transcript = currentResult[0].transcript;

                // If AI is speaking, interrupt it immediately when user starts talking
                if (isSpeakingRef.current) {
                    console.log('🛑 User started speaking - interrupting AI');
                    window.speechSynthesis.cancel(); // Stop any ongoing speech
                    setIsSpeaking(false);
                    isSpeakingRef.current = false;
                    setAudioData(0);
                    // After interruption, start capturing the user's speech
                    transcriptAccumulatorRef.current = ''; // Clear any previous transcript
                }

                // Ignore input only if processing or mic disabled (allow input while AI was speaking)
                if (isProcessingRef.current || !micEnabled) {
                    return;
                }

                if (currentResult.isFinal) {
                    transcriptAccumulatorRef.current += ' ' + transcript;
                    resetSilenceTimer();
                } else {
                    resetSilenceTimer();
                }
            };

            recognition.onerror = (event) => {
                console.log('Speech recognition error:', event.error);
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    setError(`Speech recognition error: ${event.error}`);
                }
                // Clear any pending transcripts on error
                if (event.error === 'no-speech') {
                    transcriptAccumulatorRef.current = '';
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                    }
                }
            };

            recognition.onend = () => {
                console.log('Recognition ended, restarting...');
                // Auto-restart if we still have a recognition reference (means we're still connected)
                if (recognitionRef.current && micEnabled) {
                    try {
                        setTimeout(() => {
                            if (recognitionRef.current) {
                                recognition.start();
                            }
                        }, 100); // Small delay to prevent rapid restart issues
                    } catch (e) {
                        console.error('Failed to restart recognition:', e);
                    }
                }
            };

            recognitionRef.current = recognition;
            if (micEnabled) {
                recognition.start();
            }

            // Initial Greeting
            if (!hasGreetedRef.current) {
                hasGreetedRef.current = true;
                setTimeout(() => {
                    speakText(persona.greeting);
                }, 1000);
            }

        } catch (err) {
            setError(err.message);
        }
    };


    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Wait 1.5 seconds of silence before processing
        silenceTimerRef.current = setTimeout(async () => {
            const fullTranscript = transcriptAccumulatorRef.current.trim();
            if (fullTranscript.length > 0) {
                console.log('Processing transcript after silence:', fullTranscript);
                await processConversation(fullTranscript);
                transcriptAccumulatorRef.current = '';
            } else {
                console.log('No transcript to process after silence timeout');
            }
        }, 1500);
    };

    const processConversation = async (text) => {
        if (isProcessingRef.current || isSpeakingRef.current) {
            console.log('⏸️ Blocked from processing:', {
                isProcessing: isProcessingRef.current,
                isSpeaking: isSpeakingRef.current,
                text: text.substring(0, 50)
            });
            return;
        }

        try {
            console.log('▶️ Starting to process conversation:', text.substring(0, 50));
            isProcessingRef.current = true;
            setIsListening(false);

            let response;

            // Always use Gemini (supports both text-only and vision)
            const imageData = cameraEnabled ? await captureVideoFrame() : null;

            console.log('📤 Sending to Gemini:', {
                cameraEnabled,
                hasImageData: !!imageData,
                imageDataLength: imageData?.length || 0,
                message: text.substring(0, 50) + '...'
            });

            response = await fetch('/api/chat-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    image: imageData
                }),
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            // Speak response
            await speakText(data.response);

        } catch (error) {
            setError(error.message);
        } finally {
            isProcessingRef.current = false;
            setIsListening(micEnabled);
        }
    };

    // Capture video frame
    const captureVideoFrame = async () => {
        console.log('🎥 captureVideoFrame called:', {
            hasVideoRef: !!videoRef.current,
            cameraEnabled,
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState
        });

        if (!videoRef.current || !cameraEnabled) {
            console.warn('❌ Video capture failed:', {
                hasVideoRef: !!videoRef.current,
                cameraEnabled
            });
            return null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        if (canvas.width === 0 || canvas.height === 0) {
            console.warn('Video not ready: dimensions are 0x0');
            return null;
        }

        console.log(`📸 Capturing frame: ${canvas.width}x${canvas.height}`);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.8);
        });
    };

    // Speak text using ElevenLabs or Web Speech API
    const speakText = async (text) => {
        if (isSpeakingRef.current) return;

        setIsSpeaking(true);
        isSpeakingRef.current = true;

        try {
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // Try ElevenLabs first
            const response = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (response.ok) {
                console.log('✓ ElevenLabs TTS successful');
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                // Set up audio analysis for lipsync
                let sourceNode = null;
                if (audioContextRef.current && analyserRef.current) {
                    try {
                        sourceNode = audioContextRef.current.createMediaElementSource(audio);
                        sourceNode.connect(analyserRef.current);
                        analyserRef.current.connect(audioContextRef.current.destination);
                    } catch (e) {
                        // Audio source already exists
                    }
                }

                const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 128);

                const updateAudioData = () => {
                    if (audio.paused || audio.ended) {
                        setAudioData(0);
                        return;
                    }
                    if (analyserRef.current) {
                        analyserRef.current.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                        const avgVolume = sum / dataArray.length;
                        setAudioData(avgVolume);
                    }
                    requestAnimationFrame(updateAudioData);
                };

                await audio.play();
                updateAudioData();

                await new Promise(resolve => {
                    audio.onended = resolve;
                });

                URL.revokeObjectURL(audioUrl);
            } else {
                const errorData = await response.json();
                console.error('❌ ElevenLabs API failed:', response.status, errorData);
                throw new Error('ElevenLabs not available');
            }
        } catch (error) {
            // Fallback to Web Speech API
            console.log('→ Using Web Speech API fallback');
            const utterance = new SpeechSynthesisUtterance(text);

            let animationId;
            const simulateLipsync = () => {
                const randomVolume = Math.random() * 100 + 50;
                setAudioData(randomVolume);
                animationId = requestAnimationFrame(simulateLipsync);
            };

            utterance.onstart = () => {
                simulateLipsync();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                cancelAnimationFrame(animationId);
                setAudioData(0);
            };

            await new Promise((resolve, reject) => {
                utterance.onend = () => {
                    cancelAnimationFrame(animationId);
                    setAudioData(0);
                    resolve();
                };
                utterance.onerror = (event) => {
                    cancelAnimationFrame(animationId);
                    setAudioData(0);
                    // Don't reject on 'interrupted' or 'canceled' errors - just resolve
                    if (event.error === 'interrupted' || event.error === 'canceled') {
                        resolve();
                    } else {
                        console.error('Speech synthesis error:', event.error);
                        resolve(); // Still resolve to prevent hanging
                    }
                };
                window.speechSynthesis.speak(utterance);
            });
        } finally {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            setAudioData(0);
            // Ensure listening state is restored after speaking
            if (micEnabled && !isProcessingRef.current) {
                setIsListening(true);
            }
        }
    };

    const stopConversation = () => {
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        isSpeakingRef.current = false;

        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        window.speechSynthesis.cancel();
    };

    return (
        <div className={styles.container} onClick={!isConnected ? handleStart : undefined}>
            <main className={styles.main}>
                <div className={styles.fullscreenAvatar}>
                    <div className={styles.avatarContainer}>
                        <Avatar
                            isListening={isListening}
                            isSpeaking={isSpeaking}
                            audioData={audioData}
                        />
                    </div>

                    {/* Webcam video element */}
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        style={{
                            position: 'absolute',
                            opacity: 0,
                            pointerEvents: 'none',
                            zIndex: -1
                        }}
                    />

                    {/* Click to start overlay */}
                    {!isConnected && (
                        <div className={styles.startOverlay}>
                            <div style={{
                                fontSize: '18px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                textAlign: 'center',
                                padding: '20px',
                                background: 'rgba(0, 0, 0, 0.5)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                Click anywhere to start
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorMessage}>
                            <span>⚠️ {error}</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
