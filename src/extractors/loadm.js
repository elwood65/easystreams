const CryptoJS = require('crypto-js');
const { USER_AGENT } = require('./common');
const STREAMINGCOMMUNITY_PROXY = (typeof process !== 'undefined' && process.env.STREAMINGCOMMUNITY_PROXY) || '';
let ProxyAgent = null;
try {
    ProxyAgent = require('undici').ProxyAgent;
} catch (_) {
    ProxyAgent = null;
}

/**
 * Extractor for Loadm (loadm.cam)
 * @param {string} playerUrl The player URL (e.g. https://loadm.cam/#qybu1k)
 * @param {string} referer The referer domain (e.g. guardoserie.horse)
 * @returns {Promise<Array>} Array of stream objects
 */
async function extractLoadm(playerUrl, referer = 'guardoserie.horse') {
    try {
        if (!playerUrl.includes('#')) return [];

        const parts = playerUrl.split('#');
        const baseUrl = parts[0];
        const id = parts[1];
        const apiUrl = `${baseUrl}api/v1/video`;

        const key = CryptoJS.enc.Utf8.parse('kiemtienmua911ca');
        const iv = CryptoJS.enc.Utf8.parse('1234567890oiuytr');

        const queryParams = `id=${encodeURIComponent(id)}&w=2560&h=1440&r=${encodeURIComponent(referer)}`;

        let response = await fetch(`${apiUrl}?${queryParams}`, {
            headers: {
                'User-Agent': USER_AGENT,
                'Referer': baseUrl,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok && response.status === 429 && STREAMINGCOMMUNITY_PROXY && ProxyAgent) {
            console.log(`[Loadm] Rate limited, retrying via SOCKS5 proxy`);
            response = await fetch(`${apiUrl}?${queryParams}`, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Referer': baseUrl,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                dispatcher: new ProxyAgent(STREAMINGCOMMUNITY_PROXY)
            });
        }

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            console.error(`[Loadm] API error: ${response.status} | Body: ${errorBody.substring(0, 100)}`);
            return [];
        }

        const hexData = await response.text();
        const ciphertext = CryptoJS.enc.Hex.parse(hexData);

        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: ciphertext },
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );

        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8).trim();
        if (!decryptedStr) {
            console.error(`[Loadm] Decryption failed`);
            return [];
        }

        // Find the last '}' to avoid trailing garbage
        const lastBraceIndex = decryptedStr.lastIndexOf('}');
        const cleanJson = lastBraceIndex !== -1 ? decryptedStr.substring(0, lastBraceIndex + 1) : decryptedStr;

        const data = JSON.parse(cleanJson);
        const streams = [];

        if (data.source) {
            const playbackHeaders = {
                'Referer': baseUrl,
                'User-Agent': USER_AGENT
            };

            streams.push({
                name: 'Loadm',
                url: data.source,
                title: data.title || 'M3U8',
                headers: playbackHeaders,
                behaviorHints: {
                    proxyHeaders: {
                        request: playbackHeaders
                    },
                    notWebReady: true
                }
            });
        }

        return streams;
    } catch (e) {
        console.error(`[Loadm] Extraction error:`, e);
        return [];
    }
}

module.exports = { extractLoadm };
