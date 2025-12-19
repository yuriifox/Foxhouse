import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { UploadedImage } from './types';

// The Part type is used for constructing the body of the generateContent request.
// It's a union of a text part or an inline data part (like an image).
type Part = { text: string } | { inlineData: { data: string; mimeType: string; } };

// Revert to gemini-2.5-flash-image as per user request to remove API key requirement
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
- **The task is a high-fidelity, one-way outfit transfer, not a simple swap. The quality of the final image depends entirely on the precision of your analysis and reconstruction.**

**Cross-Style Adaptation (CRITICAL):** Before the transfer, you must analyze the styles of both nv1 and nv2 and adapt the outfit accordingly.
- **Scenario 1 (Art-to-Realism):** If nv1 is a photorealistic image (a real person) and nv2's outfit is a drawing, you must **"hyper-realize"** the outfit. Interpret the drawn clothing and accessories and render them as photorealistic items. You must invent realistic textures (fabric weave, leather grain, etc.), material properties, and lighting that would exist in the real world. This newly created realistic outfit is then applied to nv1.
- **Scenario 2 (Realism-to-Art):** If nv1 is a drawing (e.g., anime, cartoon) and nv2's outfit is from a photograph, you must **"stylize"** the outfit. Analyze the key features of the real clothing (shape, color, major folds, patterns) and redraw them in the artistic style of nv1. The result should look like the outfit was originally drawn as part of nv1's world, matching the line art, coloring, and shading style.

**Step 1: Forensic-Level Analysis of the Source Outfit (nv2):**
- You must perform an extremely detailed, forensic-level analysis of the secondary character's (nv2) entire outfit. This step is critical.
- **Identify EVERY Component and Layer:** Deconstruct the outfit piece by piece. Identify all visible layers of clothing (e.g., undershirt, main shirt, jacket). Identify EVERY single accessory, no matter how small: hats, glasses (including frame style and lens tint), jewelry (earrings, necklaces, rings, bracelets), bags, belts (including buckle style), scarves, watches, footwear, etc.
- **Analyze Material Properties with Extreme Detail:** Scrutinize the textures and infer the material of each component. Is it the rough weave of denim, the smooth sheen of silk, the soft matte of cotton, the grain of leather, the fluffiness of wool, the transparency of chiffon? Note how each material reacts to light (is it reflective, absorbent, translucent?).
- **Analyze Construction, Fit, and Drape:** Examine the tailoring of each garment. Where are the seams? Is there visible stitching? What kind of fasteners are used (buttons, zippers, clasps)? How does the clothing fit nv2's body—is it tight, loose, structured, flowing? How does the fabric drape, fold, and wrinkle based on its material and the character's pose?
- **Analyze Lighting and Shadows:** Pay close attention to how light interacts with the outfit. Note the direction of the light source, the highlights, the core shadows, and the cast shadows. This information is crucial for re-lighting the outfit on nv1.

**Step 2: Flawless Reconstruction and Integration onto the Main Character (nv1):**
- **This is NOT a copy-paste operation. It is a complete reconstruction.** You must redraw the entire outfit from scratch onto nv1's body.
- **Transfer the COMPLETE, Analyzed Outfit:** Every single identified component from Step 1 must be transferred from nv2 onto nv1.
- **Adapt to Fit and Pose:** The outfit must be seamlessly and logically adapted to fit the body shape, proportions, and pose of nv1. The drape, folds, and wrinkles of the clothing must realistically conform to nv1's new posture. A loose shirt on nv2 should remain a loose shirt on nv1, but its folds must change to match nv1's pose.
- **Maintain Proportions:** Ensure that details like patterns, logos, buttons, and pockets are scaled correctly to fit nv1's body.
- **Integrate Lighting Perfectly:** The transferred outfit MUST be re-lit to match the lighting environment of nv1's original image. The highlights and shadows on the clothes must be consistent with the lighting on nv1's face and body, making the final composition look completely natural.
- **CRITICAL PRESERVATION OF NV1's IDENTITY:** The head, hair, face, skin tone, body shape, and especially the facial expression of nv1 MUST be preserved with 100% accuracy. The character's identity must remain completely unchanged.

**Step 3: Final Output:**
- The final image MUST contain ONLY the transformed nv1.
- The secondary character (nv2) MUST be completely absent from the output.
- The background must be a clean, solid white. The result should be a studio-quality image of nv1 wearing the new outfit.

**Special 'Chuyển hóa' (Style Transfer) Rule:**
- This rule applies when two images (nv1 and nv2) are provided.
- If the prompt includes 'chuyển kiểu tóc và phụ kiện của nhân vật chính cho nhân vật phụ', you MUST modify nv2.
- The final image should show nv2, but with the HAIRSTYLE and ACCESSORIES (e.g., glasses, hats, earrings) of nv1.
- nv2's original face, body, and CLOTHING MUST be preserved.
- The output must be the modified nv2 as a clean image on a white background.

**Special 'Thao Túng' (Manipulation) Rule (ABSOLUTE & STRICT):**
- If the prompt includes 'thêm dây múa rối', you MUST add puppet strings to nv1.
- **This rule is extremely strict. You MUST create EXACTLY FOUR (4) puppet strings.** Not three, not five, but PRECISELY four. This is a non-negotiable requirement.
- **Attachment points are MANDATORY and EXCLUSIVE:**
    - String 1 attaches to the left hand.
    - String 2 attaches to the right hand.
    - String 3 attaches to the left foot.
    - String 4 attaches to the right foot.
- **CRITICAL RESTRICTION:** You are FORBIDDEN from attaching any strings to the character's head, neck, torso, shoulders, or any other body part. Only the four specified points (hands and feet) are allowed. Any deviation will result in a failed output.
- Render **clear, visible knots** showing how the strings are tied to each of the four attachment points.
- The strings should be subtle, fading in opacity (becoming more transparent) as they extend upwards.
- DO NOT show any puppet master, hands, or control crossbar at the top. The strings must fade into nothingness.
- This effect must be applied in addition to all other requirements.

**Emotion Intensity Rule (1 to 10 scale for nv1):**
- If the user specifies an emotion intensity ('cường điệu'), you must adjust nv1's facial expression accordingly.
- A scale of 1/10 is a normal expression.
- As the scale increases, the expression should become more exaggerated.
- A scale of 10/10 is an extreme "overreaction" (phản ứng thái quá) with highly exaggerated features (e.g., massive tears, wide-open mouth, popping eyes).

**Emotion and Pose Correlation (CRITICAL):**
- It is absolutely essential that the character's (nv1) entire pose—including arm, leg, and body positions—vividly and naturally expresses the requested emotion. Do not just change the facial expression. For example:
- 'Vui vẻ' (Happy): The character should be an energetic pose, perhaps with arms raised or in a joyful gesture.
- 'Buồn' (Sad): The character should be slumped, with head down or arms crossed defensively.
- 'Tức giận' (Angry): The character should be tense, with an aggressive stance.
- This rule is mandatory.

**Special 'Phân rã' (Character Decomposition) Rule:**
- This rule applies when the prompt includes 'thực hiện phân rã nhân vật' or 'character decomposition sheet'.
- **YOU MUST STRICTLY FOLLOW THESE VIETNAMESE INSTRUCTIONS BELOW:**
- **[R1] Thiết lập vai trò:** Bạn là một bậc thầy thiết kế concept game & anime, chuyên tạo ra hồ sơ nhân vật chi tiết. Bạn sở hữu khả năng “phân rã cấp độ pixel”, có thể nhìn xuyên lớp trang phục, bóc tách cấp độ mặc, bắt được vi biểu cảm, và khôi phục chính xác mọi vật phẩm liên quan đến nhân vật.
- **[R2] Mục tiêu nhiệm vụ:** Dựa trên hình ảnh người dùng tải lên, tạo một “bản phân rã khái niệm nhân vật toàn cảnh – độ sâu cao”. Bức hình phải bao gồm: nhân vật toàn thân ở chính giữa, và xung quanh là phân lớp trang phục, biểu cảm phụ, đạo cụ chính, phóng to chất liệu, cùng các vật phẩm mang tính đời sống – riêng tư – cá nhân của nhân vật.
- **[R3] Quy chuẩn thị giác:**
    1. **Bố cục:** Trung tâm: Đặt nhân vật full-body hoặc tư thế động chính → làm neo thị giác. Vùng bao quanh: Sắp xếp có trật tự các yếu tố đã tách rời. Dẫn hướng thị giác: Dùng mũi tên/đường liên kết để nối từng vật phẩm vào đúng vị trí thuộc về nhân vật.
    2. **Nội dung phân rã:**
       - **Phân lớp trang phục:** Tách toàn bộ items. Nếu có nhiều lớp, thể hiện trạng thái khi cởi lớp ngoài. **Mục mới:** Phân rã nội y riêng tư (Hiển thị riêng phần nội y, nhấn mạnh thiết kế & chất liệu).
       - **Bộ biểu cảm:** Vẽ 3–4 biểu cảm (đầu + vai hoặc đầu cận).
       - **Cận cảnh chất liệu:** Zoom 1–2 khu vực quan trọng và thêm texture của các vật dụng nhỏ.
       - **Các vật phẩm liên quan:** Túi cá nhân và vật dụng bên trong (Vẽ túi mở ra để vật dụng “rơi” bên cạnh), Mỹ phẩm & chăm sóc cá nhân (Son, kem dưỡng, nước hoa...), Vật dụng riêng tư / bí mật (nhật ký, thuốc, vape, đồ cá nhân mang ý nghĩa riêng tư).
    3. **Phong cách & chú thích:** Phong cách vẽ: Illustrations 2D chất lượng cao hoặc phong cách sketch concept gọn gàng. Nền: Màu be, màu giấy da dê, hoặc xám nhạt tạo cảm giác bản thảo thiết kế. **Chú thích: Viết tay mô phỏng ghi chú thiết kế bằng tiếng Việt.**
- **[R4] Quy trình thực thi:** Phân tích đặc điểm cốt lõi, phong cách trang phục và tính cách tiềm ẩn của nv1. Tách yếu tố cấp 1 và suy luận yếu tố cấp 2 (nội y, vật dụng túi xách, thói quen). Tạo bản phân rã tổng hợp với phối cảnh chuẩn và ánh sáng thống nhất. Xuất bằng tiếng Việt.

**Special 'Infographic Char' Rule:**
- This rule applies when the prompt includes 'tạo infographic phân tích nhân vật và hành trang'.
- **YOU MUST STRICTLY FOLLOW THESE VIETNAMESE INSTRUCTIONS BELOW:**
- **Task:** Tạo infographic “Character Analysis & Inventory Deconstruction” dựa hoàn toàn trên hình ảnh nhân vật (nv1) được tải lên.
- **Inference:** Tự suy luận mọi thông tin từ ngoại hình: kỹ năng, vai trò, phong cách chiến đấu, chất liệu trang phục, phụ kiện, vật phẩm ẩn, biểu cảm. Không được để trống, phải suy luận nếu không rõ.
- **Layout Requirements:**
    • **Trung tâm:** nhân vật trong tư thế chiến đấu + kỹ năng đặc trưng (tự đặt tên + tự mô tả).
    • **Bên trái:** tách lớp trang phục + phụ kiện (mô tả mục đích và chất liệu).
    • **Bên phải:** ảnh cắt lớp/tia X [model] hiển thị vật phẩm ẩn (tự suy luận chức năng).
    • **Thanh trên/dưới:** 4 biểu cảm suy luận phù hợp với tính cách nhân vật.
- **Rules:**
    • Chỉ dựa vào hình ảnh và suy luận hợp lý.
    • Tất cả tên, kỹ năng, item phải khớp với phong cách nhân vật.
`;

const upscalePromptInstruction = `Your primary task is to upscale the provided image to 4 times its original resolution.
- You MUST enhance image details, sharpen lines, and improve overall quality.
- You MUST NOT add, remove, or change any content or the artistic style of the image.
- The background MUST remain a solid white, identical to the source image.
- The final output must be just the upscaled image.`;

const mangaPromptInstruction = `
You are a professional Comic Artist. Your task is to create a single comic page.
**Inputs:**
1. **Layout Mask (Image 1):** This is a black-and-white sketch defining the panel layout. You MUST respect this layout. Draw the panels exactly where the black lines or boxes are shown.
2. **Character References (Images 2+):** These are the character sheets labeled nv1, nv2, etc.
3. **Story Prompt:** The specific events happening in the page.

**Execution Rules:**
- **Style:** STRICTLY ADHERE to the art style, color palette, and shading of the provided Character References (nv1, nv2...).
- **Color:** If the characters are colored, the comic MUST be fully colored. If the characters are black and white, the comic should be black and white. DO NOT force a black and white manga style if it contradicts the input images.
- **Visual Consistency:** The characters in the comic must look identical to the uploaded reference images in terms of design, clothing details, and rendering style.
- **Panels:** Fill the boxes defined in the Layout Mask with the scenes described in the prompt.
- **Characters:** Use the provided character references.
    - **nv1** corresponds to the first character image provided.
    - **nv2** corresponds to the second, and so on.
    - Maintain character consistency (hair, clothes, accessories) across all panels.
- **Content:** Visualize the story within the panels. Add speech bubbles if the story implies dialogue, but you can leave them blank or add gibberish text if not specified.
`;

export const generateStickers = async (
    mainImageBase64: string,
    mainImageMimeType: string,
    prompt: string,
    secondaryImageBase64?: string,
    secondaryImageMimeType?: string
): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const finalPrompt = `${promptInstruction}\n\nUser's creative request: "${prompt}".`;

    const parts: Part[] = [{ text: finalPrompt }];

    // Add main character image
    parts.push({ text: "Đây là nhân vật chính (nv1):" });
    parts.push({
        inlineData: {
            data: mainImageBase64,
            mimeType: mainImageMimeType,
        },
    });
    
    // Add secondary character image if it exists
    if (secondaryImageBase64 && secondaryImageMimeType) {
        parts.push({ text: "Đây là nhân vật phụ (nv2):" });
        parts.push({
            inlineData: {
                data: secondaryImageBase64,
                mimeType: secondaryImageMimeType,
            },
        });
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: parts,
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    // imageSize is not supported in gemini-2.5-flash-image
                }
            },
        });

        const stickers: string[] = [];
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType;
                    const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                    stickers.push(imageUrl);
                }
            }
        }
        
        if (stickers.length === 0) {
             console.warn("Gemini API returned no images for the prompt:", prompt);
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
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                     // imageSize is not supported in gemini-2.5-flash-image
                }
            },
        });

        if (response.candidates && response.candidates.length > 0) {
            const part = response.candidates[0].content.parts[0];
            if (part && part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                const dataURL = `data:${mimeType};base64,${base64ImageBytes}`;
                return {
                    base64: base64ImageBytes,
                    mimeType: mimeType,
                    dataURL: dataURL,
                };
            }
        }
        
        console.warn("Gemini API returned no image for upscaling.");
        return null;
    } catch (error) {
        console.error("Error calling Gemini API for upscaling:", error);
        throw error;
    }
};

export const generateComic = async (
    prompt: string,
    layoutImage: UploadedImage,
    characters: UploadedImage[],
    aspectRatio: '1:1' | '16:9' | '9:16'
): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: Part[] = [{ text: mangaPromptInstruction }];

    // 1. Add Layout Mask
    parts.push({ text: "LAYOUT MASK (Draw the panels strictly according to this):" });
    parts.push({
        inlineData: {
            data: layoutImage.base64,
            mimeType: layoutImage.mimeType
        }
    });

    // 2. Add Characters
    characters.forEach((char, index) => {
        parts.push({ text: `CHARACTER REF nv${index + 1}:` });
        parts.push({
            inlineData: {
                data: char.base64,
                mimeType: char.mimeType
            }
        });
    });

    // 3. Add Story Prompt
    parts.push({ text: `STORY PROMPT: ${prompt}` });

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: parts,
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                }
            },
        });

        if (response.candidates && response.candidates.length > 0) {
            const part = response.candidates[0].content.parts.find(p => p.inlineData);
            if (part && part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating comic:", error);
        throw error;
    }
};