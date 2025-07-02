// mediainfo.types.ts

export interface GeneralTrack {
    uniqueId?: string;
    completeName?: string;
    format?: string;
    formatVersion?: string;
    fileSize?: number; // in bytes
    duration?: number; // in milliseconds
    overallBitRateMode?: string;
    overallBitRate?: number; // in bps
    frameRate?: number;
    frameCount?: number;
    streamSize?: number; // in bytes
    encodedDate?: Date;
    writingApplication?: string;
    writingLibrary?: string;
    attachments?: string;
}

export interface VideoTrack {
    id?: number;
    format?: string;
    formatInfo?: string;
    formatProfile?: string;
    formatSettings?: string;
    formatSettingsCabac?: string;
    formatSettingsReferenceFrames?: string;
    codecId?: string;
    duration?: number; // in milliseconds
    bitRateMode?: string;
    bitRate?: number; // in bps
    maximumBitRate?: number; // in bps
    width?: number; // in pixels
    height?: number; // in pixels
    displayAspectRatio?: string;
    frameRateMode?: string;
    frameRate?: number;
    colorSpace?: string;
    chromaSubsampling?: string;
    bitDepth?: number; // in bits
    scanType?: string;
    bitsPerPixelFrame?: number;
    streamSize?: number; // in bytes
    default?: boolean;
    forced?: boolean;
}

export interface AudioTrack {
    id?: number;
    format?: string;
    formatSettings?: string;
    codecId?: string;
    duration?: number; // in milliseconds
    bitRateMode?: string;
    bitRate?: number; // in bps
    channels?: number;
    samplingRate?: number; // in Hz
    frameRate?: number;
    bitDepth?: number; // in bits
    streamSize?: number; // in bytes
    language?: string;
    title?: string;
    default?: boolean;
    forced?: boolean;
}

export interface TextTrack {
    id?: number;
    format?: string;
    codecId?: string;
    codecIdInfo?: string;
    duration?: number; // in milliseconds;
    bitRate?: number; // in bps
    frameRate?: number;
    countOfElements?: number;
    compressionMode?: string;
    streamSize?: number; // in bytes
    language?: string;
    title?: string;
    default?: boolean;
    forced?: boolean;
}

export interface Chapter {
    timestamp: number; // in milliseconds
    title: string;
}

export interface MediaInfo {
    general: GeneralTrack;
    video: VideoTrack[];
    audio: AudioTrack[];
    text: TextTrack[];
    menu: Chapter[];
}

// --- Helper Functions for Parsing Values ---

/**
 * Parses a file size string (e.g., "6.10 GiB", "393 MiB") into bytes.
 */
const parseSize = (sizeStr: string): number => {
    const parts = sizeStr.split(' ');
    const value = parseFloat(parts[0].replace(/,/g, ''));
    const unit = parts[1]?.toLowerCase();

    const powers: { [key: string]: number } = {
        'b': 0,
        'kib': 1,
        'mib': 2,
        'gib': 3,
        'tib': 4,
        'kb': 1,
        'mb': 2,
        'gb': 3,
        'tb': 4,
    };

    const power = powers[unit] || 0;
    const multiplier = unit?.includes('ib') ? 1024 : 1000;
    return Math.round(value * (multiplier ** power));
};

/**
 * Parses a duration string (e.g., "23 min 50 s") into milliseconds.
 */
const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(' ');
    let totalMs = 0;
    for (let i = 0; i < parts.length; i += 2) {
        const value = parseInt(parts[i], 10);
        const unit = parts[i + 1];
        if (unit?.startsWith('h')) totalMs += value * 3600000;
        else if (unit?.startsWith('min')) totalMs += value * 60000;
        else if (unit?.startsWith('s')) totalMs += value * 1000;
        else if (unit?.startsWith('ms')) totalMs += value;
    }
    return totalMs;
};

/**
 * Parses a bitrate string (e.g., "36.6 Mb/s", "2 304 kb/s") into bits per second.
 */
const parseBitRate = (bitrateStr: string): number => {
    const cleanStr = bitrateStr.replace(/\s/g, '').toLowerCase();
    const value = parseFloat(cleanStr);

    if (cleanStr.includes('mb/s')) return Math.round(value * 1000 * 1000);
    if (cleanStr.includes('kb/s')) return Math.round(value * 1000);
    if (cleanStr.includes('b/s')) return Math.round(value);
    return Math.round(value);
};

/**
 * Parses a frequency string (e.g., "48.0 kHz") into Hz.
 */
const parseFrequency = (frequencyStr: string): number => {
    const value = parseFloat(frequencyStr.replace(/\s/g, ''));
    if (frequencyStr.toLowerCase().includes('khz')) return Math.round(value * 1000);
    if (frequencyStr.toLowerCase().includes('mhz')) return Math.round(value * 1000 * 1000);
    return Math.round(value);
};

/**
 * Parses a date string into a Date object.
 */
const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
};

// --- Main Parser Function ---

export const parseMediaInfo = (text: string): MediaInfo => {
    const result: MediaInfo = {
        general: {},
        video: [],
        audio: [],
        text: [],
        menu: [],
    };

    const lines = text.split('\n');
    let currentSection = '';
    let trackIndex = -1;

    for (const line of lines) {
        if (!line.trim()) {
            currentSection = '';
            continue;
        }

        // Check for new section headers (e.g., "Video", "Audio #1")
        const sectionMatch = line.match(/^(General|Video|Audio|Text|Menu)(?: #\d+)?$/);
        if (sectionMatch) {
            currentSection = sectionMatch[1].toLowerCase();
            if (currentSection === 'video') result.video.push({});
            else if (currentSection === 'audio') result.audio.push({});
            else if (currentSection === 'text') result.text.push({});
            trackIndex =
                currentSection === 'general' || currentSection === 'menu'
                    ? -1
                    : result[currentSection as 'video' | 'audio' | 'text'].length - 1;
            continue;
        }

        // Handle Menu chapters
        if (currentSection === 'menu') {
            const chapterMatch = line.match(/(\d{2}:\d{2}:\d{2}.\d{3})\s+:\s+.*?:(.*)/);
            if (chapterMatch) {
                const timeParts = chapterMatch[1].split(/[:.]/);
                const timestamp =
                    parseInt(timeParts[0]) * 3600000 +
                    parseInt(timeParts[1]) * 60000 +
                    parseInt(timeParts[2]) * 1000 +
                    parseInt(timeParts[3]);
                result.menu.push({ timestamp, title: chapterMatch[2].trim() });
            }
            continue;
        }

        // Parse key-value pairs
        const keyValueMatch = line.match(/^\s*([^:]+?)\s+:\s+(.*)$/);
        if (keyValueMatch) {
            const key = keyValueMatch[1].trim();
            const value = keyValueMatch[2].trim();

            // Assign values based on current section and key
            if (currentSection === 'general') {
                const target = result.general;
                switch (key) {
                    case 'Unique ID':
                        target.uniqueId = value;
                        break;
                    case 'Complete name':
                        target.completeName = value;
                        break;
                    case 'Format':
                        target.format = value;
                        break;
                    case 'Format version':
                        target.formatVersion = value;
                        break;
                    case 'File size':
                        target.fileSize = parseSize(value);
                        break;
                    case 'Duration':
                        target.duration = parseDuration(value);
                        break;
                    case 'Overall bit rate mode':
                        target.overallBitRateMode = value;
                        break;
                    case 'Overall bit rate':
                        target.overallBitRate = parseBitRate(value);
                        break;
                    case 'Frame rate':
                        target.frameRate = parseFloat(value);
                        break;
                    case 'Encoded date':
                        target.encodedDate = parseDate(value);
                        break;
                    case 'Writing application':
                        target.writingApplication = value;
                        break;
                    case 'Writing library':
                        target.writingLibrary = value;
                        break;
                    case 'Attachments':
                        target.attachments = value;
                        break;
                }
            } else if (currentSection === 'video' && trackIndex >= 0) {
                const target = result.video[trackIndex];
                switch (key) {
                    case 'ID':
                        target.id = parseInt(value, 10);
                        break;
                    case 'Format':
                        target.format = value;
                        break;
                    case 'Format/Info':
                        target.formatInfo = value;
                        break;
                    case 'Format profile':
                        target.formatProfile = value;
                        break;
                    case 'Format settings':
                        target.formatSettings = value;
                        break;
                    case 'Format settings, CABAC':
                        target.formatSettingsCabac = value;
                        break;
                    case 'Format settings, Reference frames':
                        target.formatSettingsReferenceFrames = value;
                        break;
                    case 'Codec ID':
                        target.codecId = value;
                        break;
                    case 'Duration':
                        target.duration = parseDuration(value);
                        break;
                    case 'Bit rate mode':
                        target.bitRateMode = value;
                        break;
                    case 'Bit rate':
                        target.bitRate = parseBitRate(value);
                        break;
                    case 'Maximum bit rate':
                        target.maximumBitRate = parseBitRate(value);
                        break;
                    case 'Width':
                        target.width = parseInt(value.replace(/\s/g, ''), 10);
                        break;
                    case 'Height':
                        target.height = parseInt(value.replace(/\s/g, ''), 10);
                        break;
                    case 'Display aspect ratio':
                        target.displayAspectRatio = value;
                        break;
                    case 'Frame rate mode':
                        target.frameRateMode = value;
                        break;
                    case 'Frame rate':
                        target.frameRate = parseFloat(value);
                        break;
                    case 'Color space':
                        target.colorSpace = value;
                        break;
                    case 'Chroma subsampling':
                        target.chromaSubsampling = value;
                        break;
                    case 'Bit depth':
                        target.bitDepth = parseInt(value, 10);
                        break;
                    case 'Scan type':
                        target.scanType = value;
                        break;
                    case 'Bits/(Pixel*Frame)':
                        target.bitsPerPixelFrame = parseFloat(value);
                        break;
                    case 'Stream size': {
                        const sizeMatch = value.match(/(\d+\.?\d*\s+[A-Za-z]+)/);
                        if (sizeMatch) {
                            target.streamSize = parseSize(sizeMatch[1]);
                        }
                        break;
                    }
                    case 'Default':
                        target.default = value.toLowerCase() === 'yes';
                        break;
                    case 'Forced':
                        target.forced = value.toLowerCase() === 'yes';
                        break;
                }
            } else if (currentSection === 'audio' && trackIndex >= 0) {
                const target = result.audio[trackIndex];
                switch (key) {
                    case 'ID':
                        target.id = parseInt(value, 10);
                        break;
                    case 'Format':
                        target.format = value;
                        break;
                    case 'Format settings':
                        target.formatSettings = value;
                        break;
                    case 'Codec ID':
                        target.codecId = value;
                        break;
                    case 'Duration':
                        target.duration = parseDuration(value);
                        break;
                    case 'Bit rate mode':
                        target.bitRateMode = value;
                        break;
                    case 'Bit rate':
                        target.bitRate = parseBitRate(value);
                        break;
                    case 'Channel(s)':
                        target.channels = parseInt(value, 10);
                        break;
                    case 'Sampling rate':
                        target.samplingRate = parseFrequency(value);
                        break;
                    case 'Frame rate':
                        target.frameRate = parseFloat(value);
                        break;
                    case 'Bit depth':
                        target.bitDepth = parseInt(value, 10);
                        break;
                    case 'Stream size': {
                        const sizeMatch = value.match(/(\d+\.?\d*\s+[A-Za-z]+)/);
                        if (sizeMatch) {
                            target.streamSize = parseSize(sizeMatch[1]);
                        }
                        break;
                    }
                    case 'Title':
                        target.title = value;
                        break;
                    case 'Language':
                        target.language = value;
                        break;
                    case 'Default':
                        target.default = value.toLowerCase() === 'yes';
                        break;
                    case 'Forced':
                        target.forced = value.toLowerCase() === 'yes';
                        break;
                }
            } else if (currentSection === 'text' && trackIndex >= 0) {
                const target = result.text[trackIndex];
                switch (key) {
                    case 'ID':
                        target.id = parseInt(value, 10);
                        break;
                    case 'Format':
                        target.format = value;
                        break;
                    case 'Codec ID':
                        target.codecId = value;
                        break;
                    case 'Codec ID/Info':
                        target.codecIdInfo = value;
                        break;
                    case 'Duration':
                        target.duration = parseDuration(value);
                        break;
                    case 'Bit rate':
                        target.bitRate = parseBitRate(value);
                        break;
                    case 'Frame rate':
                        target.frameRate = parseFloat(value);
                        break;
                    case 'Count of elements':
                        target.countOfElements = parseInt(value, 10);
                        break;
                    case 'Compression mode':
                        target.compressionMode = value;
                        break;
                    case 'Stream size': {
                        const sizeMatch = value.match(/(\d+\.?\d*\s+[A-Za-z]+)/);
                        if (sizeMatch) {
                            target.streamSize = parseSize(sizeMatch[1]);
                        }
                        break;
                    }
                    case 'Title':
                        target.title = value;
                        break;
                    case 'Language':
                        target.language = value;
                        break;
                    case 'Default':
                        target.default = value.toLowerCase() === 'yes';
                        break;
                    case 'Forced':
                        target.forced = value.toLowerCase() === 'yes';
                        break;
                }
            }
        }
    }

    return result;
};