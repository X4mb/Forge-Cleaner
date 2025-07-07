# ⚠️ Work In Progress: Use at Your Own Risk

**This module is currently under active development. No fully working or stable version has been released yet. Features and behavior may change at any time, and data loss or instability is possible. Use in production worlds at your own risk!**

# Forge Cleaner

A Foundry VTT module for automated world data hygiene and optimization.

## Purpose
Forge Cleaner periodically scans your active Foundry VTT world to identify and manage unused, orphaned, or redundant data, optimizing world performance and reducing file size. It works silently in the background with minimal GM interaction beyond initial configuration.

## Features
- **Scheduled Scans:** Automatically scan for unlinked tokens, orphaned active effects, empty documents, duplicate assets, and old chat messages.
- **Configurable Actions:** Choose to delete, quarantine, flag, or ignore each type of junk data.
- **Chat Log Archiving:** Archive old chat messages into a journal entry.
- **Minimal UI:** All configuration is in the standard Foundry settings menu.
- **Private GM Notifications:** Summaries of actions are sent privately to the GM.

## Installation
1. In Foundry VTT, go to the Add-on Modules tab and click "Install Module."
2. Paste this manifest URL:
   ```
   https://raw.githubusercontent.com/X4mb/Forge-Cleaner/main/module.json
   ```
3. Click Install.

## Usage
- Configure the module in **Game Settings > Module Settings > Forge Cleaner**.
- Enable/disable scan categories and set actions for each.
- Set scan frequency and chat message age.
- Use the manual scan button for on-demand cleanup.

## Compatibility
- **Foundry VTT:** v13+
- **System:** Designed for Pathfinder 2e (pf2e), but can be adapted for others.

## License
MIT

---
For issues or feature requests, visit [GitHub Issues](https://github.com/X4mb/Forge-Cleaner/issues). 