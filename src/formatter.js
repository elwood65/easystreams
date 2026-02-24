function formatStream(stream, providerName) {
    // Format resolution
    let quality = stream.quality || '';
    if (quality === '2160p') quality = '4K UHD';
    else if (quality === '1440p') quality = 'QHD';
    else if (quality === '1080p') quality = 'FHD';
    else if (quality === '720p') quality = 'HD';
    else if (quality === '576p' || quality === '480p' || quality === '360p' || quality === '240p') quality = 'Low Quality';
    else if (!quality || quality.toLowerCase() === 'auto') quality = 'Unknown';
    
    // Format title with emoji
    let title = ⁠ 📁 ${stream.title || 'Stream'} ⁠;

    // Extract language if not present
    let language = stream.language;
    if (!language) {
        if (stream.name && (stream.name.includes('SUB ITA') || stream.name.includes('SUB'))) language = '🇯🇵 🇮🇹';
        else if (stream.title && (stream.title.includes('SUB ITA') || stream.title.includes('SUB'))) language = '🇯🇵 🇮🇹';
        else language = '🇮🇹';
    }
    
    // Add details
    let details = [];
    if (stream.size) details.push(⁠ 📦 ${stream.size} ⁠);
    
    const desc = details.join(' | ');
    
    // Construct pName from stream.name or server or providerName
    let pName = stream.name || stream.server || providerName;
    
    // Clean SUB ITA or ITA from provider name if present
    if (pName) {
        pName = pName
            .replace(/\s*\\[?\\(?\s*SUB\s*ITA\s*\\)?\\]?/i, '')
            .replace(/\s*\\[?\\(?\s*ITA\s*\\)?\\]?/i, '')
            .replace(/\s*\\[?\\(?\s*SUB\s*\\)?\\]?/i, '')
            .replace(/\\(\s*\\)/g, '')
            .replace(/\\[\s*\\]/g, '')
            .trim();
    }
    
    // Capitalize if using the key name
    if (pName === providerName) {
        pName = pName.charAt(0).toUpperCase() + pName.slice(1);
    }
    
    // Add antenna emoji if provider exists
    if (pName) {
        pName = ⁠ 📡 ${pName} ⁠;
    }

    // ✅ MODIFICARE: quality pe prima linie, addon/provider pe a doua linie
    const finalName = quality && pName
        ? ⁠ ${quality}\n${pName} ⁠
        : quality || pName;

    let titleText = ⁠ ${title}\n${pName} ⁠;
    if (desc) titleText += ` | ${desc}`;
    if (language) titleText += ⁠ \n🗣️ ${language} ⁠;

    // Move headers to behaviorHints if present
    const behaviorHints = stream.behaviorHints || {};
    if (stream.headers) {
        behaviorHints.proxyHeaders = behaviorHints.proxyHeaders || {};
        behaviorHints.proxyHeaders.request = stream.headers;
        behaviorHints.headers = stream.headers;
        behaviorHints.notWebReady = true;
    }

    return {
        ...stream,
        name: finalName,
        title: titleText,
        language: language,
        _nuvio_formatted: true,
        behaviorHints: behaviorHints,
        headers: stream.headers
    };
}

module.exports = { formatStream };
