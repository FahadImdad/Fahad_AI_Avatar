/**
 * Simple audio-to-viseme mapper
 * Maps audio intensity to basic mouth shapes
 * Based on the Oculus visemes_15 standard used by MetaPerson/ReadyPlayerMe
 */

/**
 * Get a simple viseme weight based on audio intensity
 * For numbered morph targets, we need to determine which index controls mouth opening
 *
 * @param {number} audioLevel - Audio intensity (0-255)
 * @returns {Object} Viseme weights for basic lip sync
 */
export function getVisemeFromAudio(audioLevel) {
    const intensity = audioLevel / 255;

    // Simple approach: use intensity to drive mouth open/close
    // Return weights for common mouth shapes
    return {
        // Closed mouth (silence)
        sil: Math.max(0, 1 - intensity * 2),

        // Open mouth vowels (increases with volume)
        aa: intensity * 0.8,  // "ah" sound - wide open
        E: intensity * 0.6,   // "eh" sound
        oh: intensity * 0.5,  // "oh" sound

        // Consonants (triggered by higher frequencies/intensity changes)
        PP: intensity > 0.7 ? 0.5 : 0,  // "p" "b" "m"
        FF: intensity > 0.6 ? 0.4 : 0,  // "f" "v"
        SS: intensity > 0.5 ? 0.3 : 0,  // "s" "z"
    };
}

/**
 * Map standard viseme names to your avatar's numbered morph targets
 * You'll need to determine these mappings by testing your specific avatar
 *
 * Common patterns for numbered morphs in MetaPerson/ReadyPlayerMe:
 * - Indices 0-13: Often basic facial expressions and vowels
 * - Index 14-18: Often jaw/mouth movements
 * - Higher indices: Detailed facial features
 */
export const VISEME_MORPH_MAP = {
    // These are common indices - adjust based on your avatar's actual morphs
    'sil': null,      // Silence - just reset to 0
    'aa': 14,         // Wide open mouth "ah"
    'E': 15,          // Medium open "eh"
    'ih': 16,         // Small open "ih"
    'oh': 17,         // Rounded "oh"
    'ou': 18,         // Rounded "oo"
    'PP': 0,          // Lip closure
    'FF': 1,          // Lip bite
    'TH': 2,          // Tongue between teeth
    'DD': 3,          // Tongue to roof
    'kk': 4,          // Back of throat
    'CH': 5,          // Soft palate
    'SS': 6,          // Tongue to teeth ridge
    'nn': 7,          // Nasal
    'RR': 8,          // Tongue curl
};

/**
 * Apply viseme weights to mesh morph targets
 * @param {THREE.Mesh} mesh - The mesh with morph targets
 * @param {number} audioLevel - Current audio intensity (0-255)
 */
export function applyVisemeToMesh(mesh, audioLevel) {
    if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
        return;
    }

    const dict = mesh.morphTargetDictionary;
    const influences = mesh.morphTargetInfluences;

    // Simple approach: just use mouth open (aa viseme) driven by audio
    // This is the most reliable method for basic lip sync

    // Try to find the mouth open morph
    const mouthOpenIndex =
        dict['viseme_aa'] ??
        dict['viseme_AA'] ??
        dict['mouthOpen'] ??
        dict['14'];  // Common index for mouth open

    if (mouthOpenIndex !== undefined) {
        const intensity = audioLevel / 255;
        influences[mouthOpenIndex] = intensity * 0.8;
    } else {
        // Fallback: try indices that commonly control mouth
        const testIndices = [14, 15, 16, 17, 18];
        const intensity = audioLevel / 255;

        testIndices.forEach(idx => {
            if (influences[idx] !== undefined) {
                influences[idx] = intensity * 0.3;  // Lower intensity to avoid breaking face
            }
        });
    }
}
