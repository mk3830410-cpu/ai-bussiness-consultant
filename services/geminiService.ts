import { GoogleGenAI, Type } from '@google/genai';
import { StrategyResponse, MarketPulseResponse, QuickResponse, VisualAnalysisResponse, AnalysisMode, AnalysisResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Main service function ---
export const generateStrategy = async (
    mode: AnalysisMode, 
    inputText: string, 
    image: { b64: string; mimeType: string } | null
): Promise<AnalysisResult> => {
    switch(mode) {
        case 'deep':
            return generateDeepDiveStrategy(inputText);
        case 'market':
            return generateMarketPulse(inputText);
        case 'quick':
            return generateQuickBrainstorm(inputText);
        case 'visual':
            if (!image) throw new Error("Image is required for visual analysis.");
            return generateVisualAnalysis(inputText, image.b64, image.mimeType);
        default:
            throw new Error("Invalid analysis mode");
    }
}

// --- Specific Generators ---

const generateDeepDiveStrategy = async (inputText: string): Promise<StrategyResponse> => {
    const model = 'gemini-2.5-pro';
    const prompt = `You are StratIQ, an AI co-founder and expert business strategist. Analyze the user's business idea and generate a comprehensive, actionable strategy report in the specified JSON format. Your analysis must be insightful, creative, and data-driven. 
    - Crucially, create a customer journey map that links the customer personas and growth hacking tips to the key stages of customer interaction (Awareness, Consideration, Conversion, Loyalty, Advocacy).
    - For each pricing model, also specify the target customer segment and the key features included.
    - Propose a detailed monetization plan with multiple potential strategies. For each strategy, explain it, list potential revenue streams, and justify why it's a good fit for this business.
    Business Description:
    ---
    ${inputText}
    ---
    Produce the entire output as a single, valid JSON object matching the schema.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: deepDiveStrategyResponseSchema,
                temperature: 0.7,
                thinkingConfig: { thinkingBudget: 32768 }
            },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error(`Error with ${model}:`, error);
        throw new Error(`Failed to generate Deep Dive strategy. The model may have returned an invalid format.`);
    }
};

const generateMarketPulse = async (inputText: string): Promise<MarketPulseResponse> => {
    const model = 'gemini-2.5-flash';
    const prompt = `You are StratIQ, an AI market analyst. Based on the user's business idea, use your knowledge and access to Google Search to provide an up-to-date market pulse. Identify key trends and competitors.
    Business Description:
    ---
    ${inputText}
    ---
    Your response should be a concise summary.
    `;
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const text = response.text.trim();
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string; } => !!web?.uri && !!web.title)
            .filter((web, index, self) => index === self.findIndex(w => w.uri === web.uri)); // Unique URIs

        // Since the model with grounding doesn't support JSON output, we ask it to generate text and then parse it here, or make a second call to structure it. For simplicity, we'll do a second call.
        const structuringResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Use a fast model for structuring
            contents: `Based on the following market analysis text, extract a market summary, emerging trends (as an array of strings), and a list of competitors with their name, a brief analysis, and their market positioning.
            Analysis Text:
            ---
            ${text}
            ---
            Format this as a JSON object: { "marketSummary": "...", "emergingTrends": ["..."], "competitors": [{"name": "...", "analysis": "...", "positioning": "..."}] }`,
            config: { responseMimeType: "application/json" }
        });

        const structuredData = JSON.parse(structuringResponse.text.trim());
        
        return { ...structuredData, sources };

    } catch (error) {
        console.error(`Error with ${model}:`, error);
        throw new Error("Failed to generate Market Pulse. The model may have returned an invalid format.");
    }
};

const generateQuickBrainstorm = async (inputText: string): Promise<QuickResponse> => {
    const model = 'gemini-2.5-flash-lite';
    const prompt = `You are StratIQ, a rapid idea generator. Give a quick, high-level analysis of the following business idea. Provide a validation score (1-10), brief justification, a few company name/slogan ideas, and three key strategies. Be concise and quick.
    Business Description:
    ---
    ${inputText}
    ---
    Respond strictly in the JSON format defined by the schema.`;
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quickResponseSchema,
            },
        });
        return JSON.parse(response.text.trim());
    } catch(error) {
        console.error(`Error with ${model}:`, error);
        throw new Error("Failed to generate Quick Brainstorm. The model may have returned an invalid format.");
    }
};

const generateVisualAnalysis = async (inputText: string, imageB64: string, mimeType: string): Promise<VisualAnalysisResponse> => {
    const model = 'gemini-2.5-flash';
    const prompt = `You are StratIQ, an AI design and brand consultant. Analyze the provided image in the context of the user's request. Provide a concise analysis and actionable suggestions.
    User Request:
    ---
    ${inputText || "Analyze this image for my business."}
    ---
    Respond strictly in the JSON format defined by the schema.`;

    const imagePart = {
      inlineData: {
        data: imageB64,
        mimeType: mimeType,
      },
    };
    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: visualAnalysisSchema,
            }
        });
        return JSON.parse(response.text.trim());
    } catch(error) {
        console.error(`Error with ${model}:`, error);
        throw new Error("Failed to generate Visual Analysis. The model may have returned an invalid format.");
    }
};


export const generateLogoImage = async (prompt: string): Promise<string> => {
     try {
        const fullPrompt = `Generate a modern, clean, minimalist logo based on this concept: ${prompt}. The logo should be suitable for a startup, on a solid light gray background.`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("No images were generated.");
        }
    } catch (error) {
        console.error("Error generating logo image:", error);
        throw new Error("Failed to generate logo image.");
    }
};

// --- Schemas ---
const deepDiveStrategyResponseSchema = {
    type: Type.OBJECT,
    properties: {
        ideaValidation: {
            type: Type.OBJECT, properties: {
                score: { type: Type.INTEGER, description: "Score from 1 to 10" },
                justification: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
        },
        marketAnalysis: {
            type: Type.OBJECT, properties: {
                targetAudience: { type: Type.STRING },
                uniqueSellingProposition: { type: Type.STRING },
                swot: {
                    type: Type.OBJECT, properties: {
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                        threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                    }
                },
                competitors: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            name: { type: Type.STRING },
                            analysis: { type: Type.STRING },
                            positioning: { type: Type.STRING },
                        }
                    }
                },
            }
        },
        financialProjections: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    year: { type: Type.INTEGER },
                    revenue: { type: Type.STRING },
                    costs: { type: Type.STRING },
                    assumptions: { type: Type.STRING },
                }
            }
        },
        brandIdentity: {
            type: Type.OBJECT, properties: {
                companyNameSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                sloganSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                logoConcept: { type: Type.STRING, description: "A detailed, visually-rich description for an image generation model to create a logo." },
                colorPalette: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            name: { type: Type.STRING },
                            hex: { type: Type.STRING },
                            description: { type: Type.STRING },
                        }
                    }
                },
                typography: {
                    type: Type.OBJECT, properties: {
                        primaryFont: { type: Type.STRING },
                        secondaryFont: { type: Type.STRING },
                        justification: { type: Type.STRING },
                    }
                },
                brandVoice: {
                    type: Type.OBJECT, properties: {
                        tone: { type: Type.STRING },
                        style: { type: Type.STRING },
                        keyMessaging: { type: Type.ARRAY, items: { type: Type.STRING } },
                    }
                },
            }
        },
        customerPersonas: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    name: { type: Type.STRING },
                    demographics: { type: Type.STRING },
                    goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                    painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            }
        },
        customerJourneyMap: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    stageName: { type: Type.STRING },
                    description: { type: Type.STRING },
                    touchpoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    strategies: { type: Type.ARRAY, items: { type: Type.STRING, description: "Relevant strategies or growth hacking tips for this stage." } },
                }
            }
        },
        growthHackingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        pricingModels: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    targetCustomer: { type: Type.STRING, description: "The ideal customer segment for this pricing model." },
                    keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The key features included in this pricing tier." },
                }
            }
        },
        monetizationPlan: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    revenueStreams: { type: Type.ARRAY, items: { type: Type.STRING } },
                    justification: { type: Type.STRING },
                }
            }
        },
        pitchDeck: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.ARRAY, items: { type: Type.STRING } },
                    speakerNotes: { type: Type.STRING },
                }
            }
        },
        legalInsights: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                }
            }
        },
    }
};
const quickResponseSchema = {
    type: Type.OBJECT, properties: {
        ideaValidation: {
            type: Type.OBJECT, properties: {
                score: { type: Type.INTEGER },
                justification: { type: Type.STRING },
            }
        },
        branding: {
            type: Type.OBJECT, properties: {
                companyNameSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                sloganSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
        },
        keyStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
    }
};
const visualAnalysisSchema = {
    type: Type.OBJECT, properties: {
        analysis: { type: Type.STRING },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};