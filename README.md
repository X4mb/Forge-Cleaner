# ⚠️ Work In Progress: Use at Your Own Risk

**This module is currently under active development. Features are not yet fully implemented and testing is incomplete. Use in production worlds at your own risk!**

# Forge Cleaner

A Foundry VTT module for automated file organization and optimization in your game world.

## Purpose

Forge Cleaner helps Game Masters organize their Foundry VTT world files by automatically sorting assets, tokens, scenes, audio files, and items into configured folder structures. It also provides file optimization capabilities to reduce world size and improve performance.

## Features

### 1. File Organization

Automatically organize all world files into your configured folder structure:

- **Assets**: General assets like journal images and macro icons
- **Tokens**: Separate folders for NPC and player character tokens
- **Scenes**: Organize scene images and maps (optionally recreate folder structure)
- **Audio**: Playlist sounds and ambient audio files
- **Items**: Item images and icons

The module intelligently moves files to their appropriate folders and updates all references in Foundry documents to maintain integrity.

### 2. Folder Configuration

Configure custom folder paths for each asset type:
- Set root folders for different file categories
- Option to recreate folder structure for scenes based on Foundry's folder organization
- All paths are configurable in the module settings

### 3. File Optimization

Convert files to optimized formats to reduce world size:
- Convert images to WebP format
- Optimize audio file formats
- Reduce overall world file size
- Improve load times

**Note**: File optimization is planned but not yet implemented.

## Installation

1. In Foundry VTT, go to the **Add-on Modules** tab and click **Install Module**.
2. Paste this manifest URL:
   ```
   https://raw.githubusercontent.com/X4mb/Forge-Cleaner/main/module.json
   ```
3. Click **Install**.

## Usage

### Configure Folder Structure

1. Go to **Game Settings > Module Settings > Forge Cleaner**
2. Set folder paths for each asset type:
   - Assets Folder Path
   - NPC Token Folder Path
   - Player Token Folder Path
   - Scenes Folder Path
   - Audio Folder Path
   - Items Folder Path
3. Enable **Recreate Scene Folder Structure** if you want scene files to match your folder organization
4. Save the settings

### Apply Organization

1. Click **Run Organization Now** in the module settings
2. Review the confirmation dialog showing your configuration
3. Click **Confirm** to start the process
4. The module will:
   - Scan all files in your world
   - Move them to configured folders
   - Update all document references
   - Report any issues or failures

### Optimize Files

1. Click **Run Optimization** in the module settings
2. Review the confirmation dialog
3. Click **Confirm** to start optimization

**Note**: This feature is not yet implemented.

## How It Works

### File Movement Process

1. **Scan**: The module scans all relevant documents (actors, scenes, items, playlists, journals, macros)
2. **Identify**: For each document, it identifies the file path
3. **Check**: Determines if the file needs to be moved based on your configuration
4. **Move**: Moves the file to the appropriate target folder
5. **Update**: Updates the document reference to point to the new location
6. **Rollback**: If updating fails, the module attempts to revert the file move
7. **Report**: Provides a detailed summary of successful moves and any issues

### Safety Features

- **GM Only**: Only Game Masters can run organization and optimization
- **Reference Updates**: Automatically updates all document references
- **Error Handling**: Logs failures and provides detailed error reports
- **Rollback**: Attempts to revert failed operations
- **Debug Logging**: Optional detailed logging for troubleshooting

## Compatibility

- **Foundry VTT**: v13+
- **System**: Works with all game systems
- **Platform**: Web-based Foundry installations (file operations require appropriate permissions)

## Current Limitations

⚠️ **Important Limitations**:

1. **File Optimization**: Not yet implemented
2. **File System Access**: Requires Foundry's file system API to work
3. **Hosting Platform**: May not work on all hosting platforms due to file system restrictions
4. **Large Worlds**: Processing large worlds may take considerable time
5. **No Backup**: Currently does not create backups before making changes

## Future Features

- File conversion to WebP format
- Audio file optimization
- Backup creation before operations
- Batch processing controls
- Progress indicators
- Selective folder processing

## License

MIT

## Support

For issues or feature requests, visit [GitHub Issues](https://github.com/X4mb/Forge-Cleaner/issues).

## Credits

Created by Xamb
