# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-01-01

### Added
- MediaInfo text parser with TypeScript interfaces
- CLI interface with multiple output formats
- YAML output support with file writing capability
- Comprehensive parsing for all MediaInfo track types:
  - General track (file metadata)
  - Video tracks (codec, resolution, bitrate, etc.)
  - Audio tracks (format, channels, sampling rate, etc.)
  - Text/Subtitle tracks (format, language, etc.)
  - Menu/Chapter information
- Human-readable formatting for file sizes, durations, and bitrates
- Standalone library usage (zero dependencies for core parser)
- Optional CLI dependencies (commander, yaml) via peer dependencies
- TypeScript support with full type definitions
- Sample MediaInfo output file for testing

### Features
- Parse MediaInfo output into structured TypeScript objects
- Convert units to standard formats (bytes, milliseconds, bps, Hz)
- Multiple output formats: formatted text, YAML, summary view
- File output support for YAML format
- Comprehensive error handling
- Cross-platform compatibility

### Technical
- TypeScript-first design with complete type safety
- ESM module format
- Proper package exports for library vs CLI usage
- GitHub Actions CI/CD pipeline
- Automated npm publishing on version tags 