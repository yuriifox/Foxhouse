import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { UploadedImage } from '../types';

// The Part type is used for constructing the body of the generateContent request.
type Part = { text: string } | { inlineData: { data: string; mimeType: string; } };

const model = 'gemini-2.5-flash-image';

const promptInstruction = `
Your primary task is to create a high-quality image based on the user's uploaded image(s) and prompt.
**The main character is "nv1". The secondary character is "nv2".**

**Core Image Style:**
- The image MUST have a clean, solid white background. DO NOT use a transparent background.
- The image must be a clear, well-defined illustration or photo. Do NOT add any artificial borders, sticker-like outlines, or drop shadows. The subject should be cleanly isolated on the background.

**Framing Rules (based on user request for nv1):**
- If the user requests 'chỉ phần đầu' (head only), create an image showing ONLY the head and face of nv1. There should be NO neck or body.
- If the user requests 'nửa người' (half body), you MUST create an image of nv1 that is cropped at the waist. The final image should show the character from the head down to the waist ONLY. Absolutely NO part of the legs or feet should be visible. The crop must be a clean cut at the waistline.
- If the user requests 'toàn thân' (full body), create an image of the entire nv1.

**Special 'Posing' (Tạo dáng) Rule (ABSOLUTE & STRICT):**
- This rule applies when the prompt includes 'tạo dáng'.
- You MUST take the exact pose and body posture from the secondary character (nv2).
- You MUST then apply this pose to the main character (nv1).
- **CRITICAL PRESERVATION OF NV1:** The head, hair, face, facial expression, clothing, and accessories of nv1 MUST be preserved with 100% accuracy. DO NOT change the character's identity or outfit. Only the body's position should change to match nv2.
- **STYLE ADAPTATION:** The pose from nv2 must be seamlessly adapted to fit the body and art style of nv1. The final image must look natural, as if nv1 was originally drawn in that pose.
- **FINAL OUTPUT:** The final image MUST contain ONLY the re-posed nv1. The secondary character (nv2) must NOT be present in the output. The background must be solid white.

**Special 'Đổi trang phục' (Outfit Swap) Rule (HIGHEST PRIORITY & PRECISION REQUIRED):**
- This rule is paramount and overrides all others when the prompt includes 'đổi trang phục'. It applies to both artistic and photorealistic images.

**Special 'Phân rã' (Character Decomposition) Rule:**
- This rule applies when the prompt includes 'thực hiện phân rã nhân vật' or 'character decomposition sheet'.

**Special 'Example Reference' (Ảnh ví dụ) Rule:**
- If an EXAMPLE IMAGE is provided, your goal is to strictly follow its artistic style, composition, lighting, and mood. 
- Use the EXAMPLE IMAGE as the primary visual guide for how the subject (nv1/nv2) should interact with the environment or what specific artistic "feel" the user wants.
`;

const upscalePromptInstruction = `Your primary task is to upscale the provided image to 4 times its original resolution.`;

const mangaPromptInstruction = `
You are a professional Comic Artist. Your task is to create a single comic page.
**Inputs:**
1. **Layout Mask (Image 1):** This is a black-and-white sketch defining the panel layout. You MUST respect this layout. Draw the panels exactly where the black lines or boxes are shown.
2. **Character References (Images 2+):** These are the global character sheets labeled nv1, nv2, etc. Use these to maintain consistency across all panels.
3. **Panel-Specific Data:**
   - For each panel, you are provided with a "STORY PROMPT" and optionally a "PANEL REFERENCE IMAGE".
   - **PANEL REFERENCE IMAGE:** If provided for a specific panel, use it as a visual guide for the scene composition, environment, or specific actions within THAT PANEL ONLY.

**Execution Rules:**
- **Consistency:** The characters in the comic must look identical to the global reference images (nv1, nv2...).
- **Panels:** Fill the boxes defined in the Layout Mask.
- **Content:** Visualize the story within the panels based on the prompts.
`;

export const generateStickers = async (
    mainImageBase64: string,
    mainImageMimeType: string,
    prompt: string,
    secondaryImageBase64?: string,
    secondaryImageMimeType?: string,
    exampleImageBase64?: string,
    exampleImageMimeType?: string
): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const finalPrompt = `${promptInstruction}\n\nUser's creative request: "${prompt}".`;
    const parts: Part[] = [{ text: finalPrompt }];
    parts.push({ text: "Đây là nhân vật chính (nv1):" });
    parts.push({ inlineData: { data: mainImageBase64, mimeType: mainImageMimeType } });
    
    if (secondaryImageBase64 && secondaryImageMimeType) {
        parts.push({ text: "Đây là nhân vật phụ (nv2):" });
        parts.push({ inlineData: { data: secondaryImageBase64, mimeType: secondaryImageMimeType } });
    }

    if (exampleImageBase64 && exampleImageMimeType) {
        parts.push({ text: "Đây là ẢNH VÍ DỤ tham khảo phong cách/bố cục:" });
        parts.push({ inlineData: { data: exampleImageBase64, mimeType: exampleImageMimeType } });
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: parts,
            config: { imageConfig: { aspectRatio: "1:1" } },
        });

        const stickers: string[] = [];
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    stickers.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                }
            }
        }
        return stickers;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};

export const upscaleImage = async (
    image: UploadedImage
): Promise<UploadedImage | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: Part[] = [
        { text: upscalePromptInstruction },
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
    ];

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: parts,
            config: { imageConfig: { aspectRatio: "1:1" } },
        });

        if (response.candidates && response.candidates.length > 0) {
            const part = response.candidates[0].content.parts[0];
            if (part && part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                    dataURL: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                };
            }
        }
        return null;
    } catch (error) {
        console.error("Error calling Gemini API for upscaling:", error);
        throw error;
    }
};

export const generateComic = async (
    panelData: { prompt: string; example: UploadedImage | null }[],
    layoutImage: UploadedImage,
    characters: UploadedImage[],
    aspectRatio: '1:1' | '16:9' | '9:16'
): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: Part[] = [{ text: mangaPromptInstruction }];

    // 1. Layout
    parts.push({ text: "LAYOUT MASK:" });
    parts.push({ inlineData: { data: layoutImage.base64, mimeType: layoutImage.mimeType } });

    // 2. Global Characters
    characters.forEach((char, index) => {
        parts.push({ text: `GLOBAL CHARACTER REF nv${index + 1}:` });
        parts.push({ inlineData: { data: char.base64, mimeType: char.mimeType } });
    });

    // 3. Panel-Specific Prompts and Examples
    panelData.forEach((data, i) => {
        parts.push({ text: `PANEL ${i + 1} STORY PROMPT: ${data.prompt || 'Natural progression.'}` });
        if (data.example) {
            parts.push({ text: `PANEL ${i + 1} REFERENCE IMAGE:` });
            parts.push({ inlineData: { data: data.example.base64, mimeType: data.example.mimeType } });
        }
    });

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: parts,
            config: { imageConfig: { aspectRatio: aspectRatio } },
        });

        if (response.candidates && response.candidates.length > 0) {
            const part = response.candidates[0].content.parts.find(p => p.inlineData);
            if (part && part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating comic:", error);
        throw error;
    }
};