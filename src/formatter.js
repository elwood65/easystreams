
function formatStream(stream, providerName, options = {}) {

    // ─── HELPERS ────────────────────────────────────────────────
    const resolutionValues = ['2160p','1440p','1080p','720p','576p','480p','360p','240p','144p'];

    // ─── PROXY / CACHE ──────────────────────────────────────────
    const isProxied = stream.proxied === true || !!(stream.behaviorHints?.proxyHeaders);
    const isCached  = stream.cached === true || options.cached === true;

    // ─── RESOLUTION ─────────────────────────────────────────────
    // stream.resolution ha priorità su stream.quality (legacy)
    const res = stream.resolution || (resolutionValues.includes(stream.quality) ? stream.quality : '');
    let resLabel = '';
    if      (res === '2160p')                                     resLabel = '4K';
    else if (res === '1440p')                                     resLabel = 'QHD';
    else if (res === '1080p')                                     resLabel = 'FHD';
    else if (res === '720p')                                      resLabel = 'HD';
    else if (['576p','480p','360p','240p','144p'].includes(res))  resLabel = 'Low Quality';
    else                                                          resLabel = res ? res : 'UNK';

    // ─── ENCODE QUALITY (WEB-DL, BluRay, etc.) ──────────────────
    // Se stream.quality NON è una risoluzione, è la qualità di encode
    const encodeQuality = (stream.quality && !resolutionValues.includes(stream.quality))
        ? stream.quality
            .replace('BluRay REMUX', 'BluRay Remux')
            .replace('WEB-DL',       'Web Download')
            .replace('WEBRip',       'Web Rip')
            .replace('DVDRip',       'DVD Rip')
        : '';

    // ─── VISUAL TAGS (DV / HDR) ──────────────────────────────────
    const visualTags = Array.isArray(stream.visualTags) ? stream.visualTags : [];
    const hasDV  = visualTags.some(t => /DV/i.test(t));
    const hasHDR = visualTags.some(t => /HDR/i.test(t));
    const dvStr  = hasDV ? 'ᵈᵛ' : '';
    const hdrStr = (hasHDR && !hasDV) ? 'ʰᵈʳ' : '';
    const visualStr = [dvStr, hdrStr].filter(Boolean).join('');

    // ─── ADDON / PROVIDER NAME ───────────────────────────────────
    let addonName = stream.name || stream.server || providerName || '';
    if (addonName) {
        addonName = addonName
            .replace(/\s*\\[?\\(?\s*SUB\s*ITA\s*\\)?\\]?/i, '')
            .replace(/\s*\\[?\\(?\s*ITA\s*\\)?\\]?/i, '')
            .replace(/\s*\\[?\\(?\s*SUB\s*\\)?\\]?/i, '')
            .replace(/\\(\s*\\)/g, '')
            .replace(/\\[\s*\\]/g, '')
            .trim();
    }
    if (addonName === providerName) {
        addonName = addonName.charAt(0).toUpperCase() + addonName.slice(1);
    }

    // ─── NAME FIELD ──────────────────────────────────────────────
    // 🔐⚡️ AddonName  FHD ᵈᵛ
    const proxiedStr = isProxied ? '🔐' : '';
    const cacheStr   = isCached  ? '⚡️ ' : '⏳ ';
    const tagSuffix  = visualStr ? ` ${visualStr}` : '';
    cost finaName = '${proxiedStr}${cacheStr}${addonName}  ${resLabel}${tagSuffix}'.trim()
    // ─── STREAM TYPE ─────────────────────────────────────────────
    const streamType = (stream.type || '').toLowerCase();
    const typeLabels = {
        p2p:       ' 🕋  Type: P2P ',
        error:     ' 🕋  Type: ERROR ',
        youtube:   ' 🕋  Type: YOUTUBE ',
        live:      ' 🕋  Type: LIVE ',
        http:      ' 🕋  Type: HTTP ',
        external:  ' 🕋  Type: EXTERNAL ',
        statistic: ' 🕋  Type: STATS ',
    };
    const typeStr = typeLabels[streamType] || '';

    // ─── INDEXER + RELEASE GROUP ─────────────────────────────────
    let indexerStr = '';
    if (stream.indexer) {
        indexerStr = stream.indexer
            .replace('Comet|',       ' ')
            .replace('Torrentio|',   ' ')
            .replace('MediaFusion|', ' ');
    } else {
        indexerStr = 'EPC';
    }
    if (stream.releaseGroup) {
        indexerStr += ` | ${stream.releaseGroup.substring(0, 8)}`;
    }

    // ─── AUDIO ───────────────────────────────────────────────────
    const audioChannels = Array.isArray(stream.audioChannels) ? stream.audioChannels.join(' ') : '';
    const audioTags     = Array.isArray(stream.audioTags)     ? stream.audioTags.join(' ')     : '';
    const audioStr      = [audioChannels, audioTags].filter(Boolean).join(' ');

    // ─── SEADEX ──────────────────────────────────────────────────
    let seadexStr = '';
    if (stream.seadexBest === true)                              seadexStr = '🕋  ʙᴇsᴛ ʀᴇʟᴇᴀsᴇ';
    else if (stream.seadex === true && !stream.seadexBest)      seadexStr = '🕋  ᴀʟᴛ ʙᴇsᴛ ʀᴇʟᴇᴀsᴇ';

    // ─── USENET UNCACHED ─────────────────────────────────────────
    const isUsenet  = streamType.includes('usenet');
    const usenetStr = (isUsenet && !isCached) ? '▫ ᴜsᴇɴᴇᴛ ᴜɴᴄᴀᴄʜᴇᴅ' : '';

    // ─── LANGUAGES ───────────────────────────────────────────────
    let langStr = '';
    if (Array.isArray(stream.languages) && stream.languages.length > 0) {
        langStr = stream.languages.join(' | ');
    } else if (stream.language) {
        langStr = stream.language;
    } else {
        const nameHasSub  = (stream.name  || '').includes('SUB');
        const titleHasSub = (stream.title || '').includes('SUB');
        langStr = (nameHasSub || titleHasSub) ? '🇯🇵 🇮🇹' : '🇮🇹';
    }

    // ─── TITLE FIELD (description) ───────────────────────────────
    const lines = [];
    if (typeStr)      lines.push(typeStr);
    lines.push(` 🕋  ${indexerStr}`);
    lines.push('');
    if (encodeQuality) {
        lines.push(` 🕋  ${encodeQuality}`);
        lines.push('');
    }
    if (audioStr) {
        lines.push(` 🕋  ${audioStr}`);
        lines.push('');
    }
    if (seadexStr) {
        lines.push(seadexStr);
        lines.push('');
    }
    if (usenetStr) lines.push(usenetStr);
    if (langStr)   lines.push(` 🕋  ${langStr}`);

    const titleText = lines.join('\n');

    // ─── BEHAVIOR HINTS ──────────────────────────────────────────
    const behaviorHints = stream.behaviorHints || {};
    if (stream.headers) {
        behaviorHints.proxyHeaders = behaviorHints.proxyHeaders || {};
        behaviorHints.proxyHeaders.request = stream.headers;
        behaviorHints.headers    = stream.headers;
        behaviorHints.notWebReady = true;
    }

    // ─── RETURN ──────────────────────────────────────────────────
    return {
        ...stream,
        name: finalName,
        title: titleText,
        language: langStr,
        _nuvio_formatted: true,
        behaviorHints: behaviorHints,
        headers: stream.headers
    };
}

module.exports = { formatStream };
