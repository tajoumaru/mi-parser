#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { stringify as yamlStringify } from 'yaml';
import { parseMediaInfo, MediaInfo } from './mediainfo.js';

const program = new Command();

program
    .name('mi-parser')
    .description('CLI tool to parse MediaInfo output from text files')
    .version('1.0.0');

interface CLIOptions {
    yaml?: boolean;
    summary?: boolean;
    output?: string;
}

program
    .argument('<file>', 'MediaInfo text file to parse')
    .option('-y, --yaml', 'output as YAML')
    .option('-o, --output <file>', 'output to file (only works with --yaml)')
    .option('-s, --summary', 'show only summary information')
    .action((file: string, options: CLIOptions) => {
        try {
            const filePath = resolve(file);
            const content = readFileSync(filePath, 'utf-8');

            console.log(`Parsing MediaInfo file: ${filePath}\n`);

            const mediaInfo = parseMediaInfo(content);

            if (options.summary) {
                showSummary(mediaInfo);
            } else if (options.yaml) {
                const yamlOutput = yamlStringify(mediaInfo);
                if (options.output) {
                    const outputPath = resolve(options.output);
                    writeFileSync(outputPath, yamlOutput, 'utf-8');
                    console.log(`YAML output written to: ${outputPath}`);
                } else {
                    console.log(yamlOutput);
                }
            } else {
                showFormatted(mediaInfo);
            }

        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error: ${error.message}`);
            } else {
                console.error('An unknown error occurred');
            }
            process.exit(1);
        }
    });

function showSummary(mediaInfo: MediaInfo) {
    console.log('=== MEDIA INFO SUMMARY ===\n');

    // General info
    if (mediaInfo.general.completeName) {
        console.log(`File: ${mediaInfo.general.completeName}`);
    }
    if (mediaInfo.general.format) {
        console.log(`Format: ${mediaInfo.general.format}`);
    }
    if (mediaInfo.general.fileSize) {
        console.log(`Size: ${formatBytes(mediaInfo.general.fileSize)}`);
    }
    if (mediaInfo.general.duration) {
        console.log(`Duration: ${formatDuration(mediaInfo.general.duration)}`);
    }
    if (mediaInfo.general.overallBitRate) {
        console.log(`Overall Bitrate: ${formatBitrate(mediaInfo.general.overallBitRate)}`);
    }

    // Video tracks
    console.log(`\nVideo Tracks: ${mediaInfo.video.length}`);
    mediaInfo.video.forEach((track, index) => {
        console.log(`  Track ${index + 1}: ${track.format || 'Unknown'} ${track.width}x${track.height} @ ${track.frameRate}fps`);
        if (track.bitRate) {
            console.log(`    Bitrate: ${formatBitrate(track.bitRate)}`);
        }
    });

    // Audio tracks
    console.log(`\nAudio Tracks: ${mediaInfo.audio.length}`);
    mediaInfo.audio.forEach((track, index) => {
        console.log(`  Track ${index + 1}: ${track.format || 'Unknown'} ${track.channels}ch @ ${track.samplingRate ? (track.samplingRate / 1000) + 'kHz' : 'Unknown'}`);
        if (track.bitRate) {
            console.log(`    Bitrate: ${formatBitrate(track.bitRate)}`);
        }
        if (track.language) {
            console.log(`    Language: ${track.language}`);
        }
    });

    // Text tracks
    if (mediaInfo.text.length > 0) {
        console.log(`\nSubtitle Tracks: ${mediaInfo.text.length}`);
        mediaInfo.text.forEach((track, index) => {
            console.log(`  Track ${index + 1}: ${track.format || 'Unknown'}`);
            if (track.language) {
                console.log(`    Language: ${track.language}`);
            }
        });
    }

    // Chapters
    if (mediaInfo.menu.length > 0) {
        console.log(`\nChapters: ${mediaInfo.menu.length}`);
    }
}

function showFormatted(mediaInfo: MediaInfo) {
    console.log('=== DETAILED MEDIA INFO ===\n');

    // General
    console.log('GENERAL:');
    Object.entries(mediaInfo.general).forEach(([key, value]) => {
        if (value !== undefined) {
            let formattedValue = value;
            if (key === 'fileSize' && typeof value === 'number') {
                formattedValue = formatBytes(value);
            } else if (key === 'duration' && typeof value === 'number') {
                formattedValue = formatDuration(value);
            } else if ((key === 'overallBitRate') && typeof value === 'number') {
                formattedValue = formatBitrate(value);
            } else if (key === 'encodedDate' && value instanceof Date) {
                formattedValue = value.toISOString();
            }
            console.log(`  ${key}: ${formattedValue}`);
        }
    });

    // Video tracks
    mediaInfo.video.forEach((track, index) => {
        console.log(`\nVIDEO TRACK ${index + 1}:`);
        Object.entries(track).forEach(([key, value]) => {
            if (value !== undefined) {
                let formattedValue = value;
                if ((key === 'duration') && typeof value === 'number') {
                    formattedValue = formatDuration(value);
                } else if ((key === 'bitRate' || key === 'maximumBitRate') && typeof value === 'number') {
                    formattedValue = formatBitrate(value);
                } else if ((key === 'streamSize') && typeof value === 'number') {
                    formattedValue = formatBytes(value);
                }
                console.log(`  ${key}: ${formattedValue}`);
            }
        });
    });

    // Audio tracks
    mediaInfo.audio.forEach((track, index) => {
        console.log(`\nAUDIO TRACK ${index + 1}:`);
        Object.entries(track).forEach(([key, value]) => {
            if (value !== undefined) {
                let formattedValue = value;
                if ((key === 'duration') && typeof value === 'number') {
                    formattedValue = formatDuration(value);
                } else if ((key === 'bitRate') && typeof value === 'number') {
                    formattedValue = formatBitrate(value);
                } else if ((key === 'streamSize') && typeof value === 'number') {
                    formattedValue = formatBytes(value);
                } else if ((key === 'samplingRate') && typeof value === 'number') {
                    formattedValue = `${value / 1000} kHz`;
                }
                console.log(`  ${key}: ${formattedValue}`);
            }
        });
    });

    // Text tracks
    mediaInfo.text.forEach((track, index) => {
        console.log(`\nTEXT TRACK ${index + 1}:`);
        Object.entries(track).forEach(([key, value]) => {
            if (value !== undefined) {
                let formattedValue = value;
                if ((key === 'duration') && typeof value === 'number') {
                    formattedValue = formatDuration(value);
                } else if ((key === 'bitRate') && typeof value === 'number') {
                    formattedValue = formatBitrate(value);
                } else if ((key === 'streamSize') && typeof value === 'number') {
                    formattedValue = formatBytes(value);
                }
                console.log(`  ${key}: ${formattedValue}`);
            }
        });
    });

    // Chapters
    if (mediaInfo.menu.length > 0) {
        console.log(`\nCHAPTERS:`);
        mediaInfo.menu.forEach((chapter, index) => {
            console.log(`  ${index + 1}. ${formatDuration(chapter.timestamp)} - ${chapter.title}`);
        });
    }
}

function formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
}

function formatBitrate(bps: number): string {
    if (bps >= 1000000) {
        return `${(bps / 1000000).toFixed(2)} Mbps`;
    } else if (bps >= 1000) {
        return `${(bps / 1000).toFixed(2)} kbps`;
    } else {
        return `${bps} bps`;
    }
}

program.parse();