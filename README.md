# MediaInfo Parser

A TypeScript library and CLI tool to parse MediaInfo output from text files and display the information in various formats.

## Features

- Parse MediaInfo text output into structured data
- Multiple output formats: formatted text, YAML, or summary view
- Support for all MediaInfo tracks: General, Video, Audio, Text/Subtitles, and Chapters
- YAML output option for structured data
- Human-readable formatting for file sizes, durations, and bitrates
- **Standalone library** - use the parser in your own projects

## Library Usage

### Installation
```bash
npm install mi-parser
```

### Basic Usage
```typescript
import { parseMediaInfo } from 'mi-parser';

const mediaInfoText = `
General
Complete name                            : /path/to/video.mp4
Format                                   : MPEG-4
File size                                : 1.50 GiB
Duration                                 : 1 h 45 min 30 s

Video
Format                                   : AVC
Width                                    : 1 920 pixels
Height                                   : 1 080 pixels
Frame rate                               : 23.976 FPS
`;

const result = parseMediaInfo(mediaInfoText);

console.log(result.general.completeName); // "/path/to/video.mp4"
console.log(result.general.fileSize);     // 1610612736 (bytes)
console.log(result.video[0].width);       // 1920
console.log(result.video[0].height);      // 1080
```

### TypeScript Interfaces
```typescript
import { MediaInfo, GeneralTrack, VideoTrack, AudioTrack, TextTrack, Chapter } from 'mi-parser';

// All interfaces are fully typed for excellent IDE support
const mediaInfo: MediaInfo = parseMediaInfo(text);
```

### Available Types
- `MediaInfo` - Main interface containing all tracks
- `GeneralTrack` - File metadata and general information
- `VideoTrack` - Video stream information
- `AudioTrack` - Audio stream information  
- `TextTrack` - Subtitle/text stream information
- `Chapter` - Chapter/menu information

## CLI Usage

### Installation
1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

### Basic usage:
```bash
npm start <mediainfo-file.txt>
```

### Using development mode (no build required):
```bash
npm run dev <mediainfo-file.txt>
```

### Command line options:

- `--yaml` or `-y`: Output as YAML
- `--output <file>` or `-o <file>`: Output to file (only works with --yaml)
- `--summary` or `-s`: Show only summary information
- `--help`: Show help information

### Examples:

```bash
# Display formatted output
npm start sample.txt

# Show summary only
npm start sample.txt --summary

# Output as YAML to console
npm start sample.txt --yaml

# Output as YAML to file
npm start sample.txt --yaml --output mediainfo.yaml
```

## Sample MediaInfo Output

To test the parser, create a text file with MediaInfo output like this:

```
General
Unique ID                                : 12345
Complete name                            : /path/to/video.mp4
Format                                   : MPEG-4
File size                                : 1.50 GiB
Duration                                 : 1 h 45 min 30 s

Video
ID                                       : 1
Format                                   : AVC
Width                                    : 1 920 pixels
Height                                   : 1 080 pixels
Frame rate                               : 23.976 FPS

Audio
ID                                       : 2
Format                                   : AAC
Channel(s)                               : 2 channels
Sampling rate                            : 48.0 kHz
```

## Development

- `npm run dev <file>`: Run CLI in development mode with tsx
- `npm run build`: Compile TypeScript to JavaScript
- `npm run test`: Build and run the compiled version

## Publishing

This project uses GitHub Actions for automated releases:

### Setup
1. Add `NPM_TOKEN` to your GitHub repository secrets:
   - Go to [npmjs.com](https://npmjs.com) → Account → Access Tokens
   - Create an "Automation" token
   - Add it as `NPM_TOKEN` in your GitHub repo settings → Secrets

### Release Process
1. Update `CHANGELOG.md` with new version details
2. Commit changes: `git commit -am "Release v1.x.x"`
3. Create and push a version tag: `git tag v1.x.x && git push origin v1.x.x`
4. GitHub Actions will automatically:
   - Run tests on multiple Node.js versions
   - Build the project
   - Create a GitHub release with changelog notes
   - Publish to npm registry
   - Publish to GitHub Package Registry

### Manual Publishing
```bash
npm run build
npm publish --access public
```

## Project Structure

- `mediainfo.ts`: **Core parser library** - use this in your projects
- `main.ts`: CLI interface and formatting logic
- `package.json`: Project configuration and dependencies
- `tsconfig.json`: TypeScript compilation settings

## Parsed Data Format

The parser converts MediaInfo text into structured objects with proper TypeScript typing:

- **File sizes** are converted to bytes (number)
- **Durations** are converted to milliseconds (number)  
- **Bit rates** are converted to bits per second (number)
- **Sampling rates** are converted to Hz (number)
- **Dates** are converted to Date objects
- **Boolean flags** (Default/Forced) are converted to boolean values 