/**
 * Forge Cleaner - Foundry VTT v13 Module
 * File organization and optimization tool for Foundry VTT worlds.
 * @author Xamb
 * @license MIT
 */

Hooks.once('init', () => {
  console.log('Forge Cleaner | Initializing module');
  registerForgeCleanerSettings();
});

/**
 * Register module settings in the Foundry VTT settings menu.
 */
function registerForgeCleanerSettings() {
  // Section 1: Apply Organization Button
  game.settings.registerMenu('forge-cleaner', 'applyOrganization', {
    name: game.i18n.localize('FORGE_CLEANER.ApplyOrganization.Name'),
    label: game.i18n.localize('FORGE_CLEANER.ApplyOrganization.Label'),
    hint: game.i18n.localize('FORGE_CLEANER.ApplyOrganization.Hint'),
    icon: 'fas fa-sitemap',
    type: ForgeCleanerApplyOrganizationMenu,
    restricted: true,
  });

  // Section 2: Folder Configuration
  // Assets folder
  game.settings.register('forge-cleaner', 'assetsFolder', {
    name: game.i18n.localize('FORGE_CLEANER.AssetsFolder.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.AssetsFolder.Hint'),
    scope: 'world',
    config: true,
    type: String,
    default: 'assets',
  });

  // NPC Token Images folder
  game.settings.register('forge-cleaner', 'npcTokenFolder', {
    name: game.i18n.localize('FORGE_CLEANER.NPCTokenFolder.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.NPCTokenFolder.Hint'),
    scope: 'world',
    config: true,
    type: String,
    default: 'tokens/npc',
  });

  // Player Token Images folder
  game.settings.register('forge-cleaner', 'playerTokenFolder', {
    name: game.i18n.localize('FORGE_CLEANER.PlayerTokenFolder.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.PlayerTokenFolder.Hint'),
    scope: 'world',
    config: true,
    type: String,
    default: 'tokens/player',
  });

  // Scenes folder
  game.settings.register('forge-cleaner', 'scenesFolder', {
    name: game.i18n.localize('FORGE_CLEANER.ScenesFolder.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.ScenesFolder.Hint'),
    scope: 'world',
    config: true,
    type: String,
    default: 'scenes',
  });

  // Recreate scene folder structure
  game.settings.register('forge-cleaner', 'recreateSceneFolders', {
    name: game.i18n.localize('FORGE_CLEANER.RecreateSceneFolders.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.RecreateSceneFolders.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  // Audio files folder
  game.settings.register('forge-cleaner', 'audioFolder', {
    name: game.i18n.localize('FORGE_CLEANER.AudioFolder.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.AudioFolder.Hint'),
    scope: 'world',
    config: true,
    type: String,
    default: 'audio',
  });

  // Item pictures folder
  game.settings.register('forge-cleaner', 'itemsFolder', {
    name: game.i18n.localize('FORGE_CLEANER.ItemsFolder.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.ItemsFolder.Hint'),
    scope: 'world',
    config: true,
    type: String,
    default: 'items',
  });

  // Section 3: File Optimization
  game.settings.registerMenu('forge-cleaner', 'optimizeFiles', {
    name: game.i18n.localize('FORGE_CLEANER.OptimizeFiles.Name'),
    label: game.i18n.localize('FORGE_CLEANER.OptimizeFiles.Label'),
    hint: game.i18n.localize('FORGE_CLEANER.OptimizeFiles.Hint'),
    icon: 'fas fa-compress',
    type: ForgeCleanerOptimizeFilesMenu,
    restricted: true,
  });

  // Debug logging
  game.settings.register('forge-cleaner', 'debugLogging', {
    name: game.i18n.localize('FORGE_CLEANER.DebugLogging.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.DebugLogging.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
}

function forgeCleanerLog(...args) {
  if (game.settings?.get('forge-cleaner', 'debugLogging')) {
    console.log('[Forge Cleaner]', ...args);
  }
}

// --- ApplicationV2 Menus ---

class ForgeCleanerApplyOrganizationMenu extends ApplicationV2 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'forge-cleaner-apply-organization',
      title: game.i18n.localize('FORGE_CLEANER.ApplyOrganization.Name'),
      width: 500,
      height: 'auto',
    });
  }

  async render(force, options) {
    const config = getOrganizationConfig();
    const summary = generateOrganizationSummary(config);

    new Dialog({
      title: game.i18n.localize('FORGE_CLEANER.ApplyOrganization.ConfirmTitle'),
      content: `<div>${game.i18n.localize('FORGE_CLEANER.ApplyOrganization.BackupWarning')}<p>${game.i18n.localize('FORGE_CLEANER.ApplyOrganization.ConfirmPrompt')}</p>${summary}</div>`,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('FORGE_CLEANER.ApplyOrganization.Confirm'),
          callback: async () => {
            ui.notifications.info(game.i18n.localize('FORGE_CLEANER.ApplyOrganization.Started'));
            await applyOrganization(config);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('FORGE_CLEANER.ApplyOrganization.Cancel'),
        }
      },
      default: 'cancel'
    }).render(true);
  }
}

class ForgeCleanerOptimizeFilesMenu extends ApplicationV2 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'forge-cleaner-optimize-files',
      title: game.i18n.localize('FORGE_CLEANER.OptimizeFiles.Name'),
      width: 500,
      height: 'auto',
    });
  }

  async render(force, options) {
    const folders = ['assets', 'tokens', 'scenes', 'audio', 'items'];
    const summary = `<p><strong>${game.i18n.localize('FORGE_CLEANER.OptimizeFiles.Summary')}</strong></p><p>${folders.map(f => `- ${f}`).join('<br>')}</p>`;

    new Dialog({
      title: game.i18n.localize('FORGE_CLEANER.OptimizeFiles.ConfirmTitle'),
      content: `<div>${game.i18n.localize('FORGE_CLEANER.OptimizeFiles.BackupWarning')}<p>${game.i18n.localize('FORGE_CLEANER.OptimizeFiles.ConfirmPrompt')}</p>${summary}</div>`,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('FORGE_CLEANER.OptimizeFiles.Confirm'),
          callback: async () => {
            ui.notifications.info(game.i18n.localize('FORGE_CLEANER.OptimizeFiles.Started'));
            await optimizeFiles(folders);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('FORGE_CLEANER.OptimizeFiles.Cancel'),
        }
      },
      default: 'cancel'
    }).render(true);
  }
}

// --- Core Functionality ---

/**
 * Get the current organization configuration from settings.
 * @returns {Object} Configuration object with folder paths
 */
function getOrganizationConfig() {
  return {
    assetsFolder: game.settings.get('forge-cleaner', 'assetsFolder'),
    npcTokenFolder: game.settings.get('forge-cleaner', 'npcTokenFolder'),
    playerTokenFolder: game.settings.get('forge-cleaner', 'playerTokenFolder'),
    scenesFolder: game.settings.get('forge-cleaner', 'scenesFolder'),
    recreateSceneFolders: game.settings.get('forge-cleaner', 'recreateSceneFolders'),
    audioFolder: game.settings.get('forge-cleaner', 'audioFolder'),
    itemsFolder: game.settings.get('forge-cleaner', 'itemsFolder'),
  };
}

/**
 * Generate a summary of the organization configuration.
 * @param {Object} config - Configuration object
 * @returns {string} HTML summary
 */
function generateOrganizationSummary(config) {
  return `
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li><strong>Assets:</strong> ${config.assetsFolder}</li>
      <li><strong>NPC Tokens:</strong> ${config.npcTokenFolder}</li>
      <li><strong>Player Tokens:</strong> ${config.playerTokenFolder}</li>
      <li><strong>Scenes:</strong> ${config.scenesFolder}${config.recreateSceneFolders ? ' (recreate folders)' : ''}</li>
      <li><strong>Audio:</strong> ${config.audioFolder}</li>
      <li><strong>Items:</strong> ${config.itemsFolder}</li>
    </ul>
  `;
}

/**
 * Apply the organization to all files in the world.
 * @param {Object} config - Configuration object
 */
async function applyOrganization(config) {
  if (!game.user?.isGM) {
    ui.notifications.error(game.i18n.localize('FORGE_CLEANER.Error.GMOnly'));
    return;
  }

  forgeCleanerLog('Starting organization...');
  const results = {
    success: 0,
    failed: [],
    warnings: []
  };

  // Organize by document type
  try {
    await organizeDocuments(config, results);
    await sendOrganizationSummary(results);
  } catch (error) {
    forgeCleanerLog('Error during organization:', error);
    ui.notifications.error(game.i18n.localize('FORGE_CLEANER.Error.OrganizationFailed'));
  }
}

/**
 * Organize documents by their type and move files accordingly.
 * @param {Object} config - Configuration object
 * @param {Object} results - Results tracking object
 */
async function organizeDocuments(config, results) {
  // Organize Actors (tokens)
  await organizeActors(config, results);

  // Organize Scenes
  await organizeScenes(config, results);

  // Organize Items
  await organizeItems(config, results);

  // Organize Audio Files (Playlists)
  await organizeAudio(config, results);

  // Organize custom assets (Journal Images, etc.)
  await organizeAssets(config, results);
}

/**
 * Organize Actor/Token images.
 * @param {Object} config - Configuration object
 * @param {Object} results - Results tracking object
 */
async function organizeActors(config, results) {
  const actors = game.actors?.contents || [];
  forgeCleanerLog(`Organizing ${actors.length} actors...`);

  for (const actor of actors) {
    if (!actor.img || actor.img === 'icons/svg/mystery-man.svg') continue;

    const targetFolder = actor.type === 'character' 
      ? config.playerTokenFolder 
      : config.npcTokenFolder;

    try {
      await moveFileAndUpdateReference(actor.img, targetFolder, actor, 'img', results);
    } catch (error) {
      forgeCleanerLog(`Failed to organize actor ${actor.name}:`, error);
      results.failed.push({ type: 'Actor', name: actor.name, file: actor.img, error: error.message });
    }
  }
}

/**
 * Organize Scene images and maps.
 * @param {Object} config - Configuration object
 * @param {Object} results - Results tracking object
 */
async function organizeScenes(config, results) {
  const scenes = game.scenes?.contents || [];
  forgeCleanerLog(`Organizing ${scenes.length} scenes...`);

  for (const scene of scenes) {
    if (!scene.img) continue;

    let targetFolder = config.scenesFolder;
    
    // If recreate folders is enabled and scene has a folder
    if (config.recreateSceneFolders && scene.folder) {
      const folder = game.folders.get(scene.folder);
      if (folder) {
        targetFolder = `${config.scenesFolder}/${folder.name}`;
      }
    }

    try {
      await moveFileAndUpdateReference(scene.img, targetFolder, scene, 'img', results);
    } catch (error) {
      forgeCleanerLog(`Failed to organize scene ${scene.name}:`, error);
      results.failed.push({ type: 'Scene', name: scene.name, file: scene.img, error: error.message });
    }
  }
}

/**
 * Organize Item images.
 * @param {Object} config - Configuration object
 * @param {Object} results - Results tracking object
 */
async function organizeItems(config, results) {
  const items = game.items?.contents || [];
  forgeCleanerLog(`Organizing ${items.length} items...`);

  for (const item of items) {
    if (!item.img || item.img === 'icons/svg/item-bag.svg') continue;

    try {
      await moveFileAndUpdateReference(item.img, config.itemsFolder, item, 'img', results);
    } catch (error) {
      forgeCleanerLog(`Failed to organize item ${item.name}:`, error);
      results.failed.push({ type: 'Item', name: item.name, file: item.img, error: error.message });
    }
  }
}

/**
 * Organize Audio files from Playlists.
 * @param {Object} config - Configuration object
 * @param {Object} results - Results tracking object
 */
async function organizeAudio(config, results) {
  const playlists = game.playlists?.contents || [];
  forgeCleanerLog(`Organizing ${playlists.length} playlists...`);

  for (const playlist of playlists) {
    const sounds = playlist.sounds?.contents || [];
    for (const sound of sounds) {
      if (!sound.path) continue;

      try {
        // For embedded documents, we need to update the parent
        await moveFileAndUpdateReference(sound.path, config.audioFolder, playlist, sound, results);
      } catch (error) {
        forgeCleanerLog(`Failed to organize audio ${sound.name}:`, error);
        results.failed.push({ type: 'Audio', name: sound.name, file: sound.path, error: error.message });
      }
    }
  }
}

/**
 * Organize custom assets (Journal Entry images, etc.).
 * @param {Object} config - Configuration object
 * @param {Object} results - Results tracking object
 */
async function organizeAssets(config, results) {
  // Journal Entry images
  const journals = game.journal?.contents || [];
  forgeCleanerLog(`Organizing ${journals.length} journal entries...`);

  for (const journal of journals) {
    if (!journal.img) continue;

    try {
      await moveFileAndUpdateReference(journal.img, config.assetsFolder, journal, 'img', results);
    } catch (error) {
      forgeCleanerLog(`Failed to organize journal ${journal.name}:`, error);
      results.failed.push({ type: 'Journal', name: journal.name, file: journal.img, error: error.message });
    }
  }

  // Macro images
  const macros = game.macros?.contents || [];
  forgeCleanerLog(`Organizing ${macros.length} macros...`);

  for (const macro of macros) {
    if (!macro.img) continue;

    try {
      await moveFileAndUpdateReference(macro.img, config.assetsFolder, macro, 'img', results);
    } catch (error) {
      forgeCleanerLog(`Failed to organize macro ${macro.name}:`, error);
      results.failed.push({ type: 'Macro', name: macro.name, file: macro.img, error: error.message });
    }
  }
}

/**
 * Move a file to a new location and update the reference in the document.
 * If updating fails, the operation is logged but not rolled back (as the file is already uploaded).
 * @param {string} filePath - Current file path
 * @param {string} targetFolder - Target folder path
 * @param {Document} document - Document to update
 * @param {string|Object} field - Field name or embedded document
 * @param {Object} results - Results tracking object
 */
async function moveFileAndUpdateReference(filePath, targetFolder, document, field, results) {
  // Handle embedded document updates (for playlist sounds)
  const isEmbeddedUpdate = typeof field === 'object';
  const embeddedDoc = isEmbeddedUpdate ? field : null;
  const fieldName = isEmbeddedUpdate ? 'path' : field;

  // Check if file is already in the target folder
  const normalizedPath = filePath.replace(/^\/+/, ''); // Remove leading slashes
  const targetFolderNorm = targetFolder.replace(/^\/+/, '').replace(/\/+$/, '');
  
  if (normalizedPath.startsWith(targetFolderNorm)) {
    forgeCleanerLog(`File already in target folder: ${filePath}`);
    return;
  }

  // Construct new path
  const fileName = normalizedPath.split('/').pop();
  const newPath = `${targetFolderNorm}/${fileName}`;

  // Move the file using Foundry's file API
  try {
    forgeCleanerLog(`Moving ${filePath} to ${newPath}`);
    
    // Get the full URL for the file (construct Foundry data URL)
    const fileUrl = `/assets/data/${filePath}`;
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const fileData = await response.blob();
    
    // Upload to new location - FilePicker.upload returns the path directly
    const uploadResult = await FilePicker.upload('data', newPath, fileData, {});
    
    if (!uploadResult || uploadResult.path === undefined) {
      throw new Error('Failed to upload file to new location');
    }

    const actualNewPath = uploadResult.path;

    // Update the document with new path
    if (isEmbeddedUpdate) {
      // Update embedded document
      await document.updateEmbeddedDocuments('PlaylistSound', [{
        _id: embeddedDoc.id,
        path: actualNewPath
      }]);
    } else {
      // Update regular field
      const updateData = { [fieldName]: actualNewPath };
      await document.update(updateData);
    }
    
    results.success++;
    forgeCleanerLog(`Successfully moved and updated: ${filePath} -> ${actualNewPath}`);
  } catch (error) {
    forgeCleanerLog(`Failed to move file:`, error);
    throw error;
  }
}

/**
 * Optimize files by converting to webp format.
 * @param {Array<string>} folders - List of folders to optimize
 */
async function optimizeFiles(folders) {
  if (!game.user?.isGM) {
    ui.notifications.error(game.i18n.localize('FORGE_CLEANER.Error.GMOnly'));
    return;
  }

  forgeCleanerLog('Starting file optimization...');
  
  // Note: File conversion is complex and requires backend processing
  // This is a placeholder for the actual implementation
  ui.notifications.warn(game.i18n.localize('FORGE_CLEANER.OptimizeFiles.NotImplemented'));
}

/**
 * Send a summary of the organization results to the GM.
 * @param {Object} results - Results tracking object
 */
async function sendOrganizationSummary(results) {
  let message = `<strong>Forge Cleaner Organization Complete</strong><br>`;
  message += `${game.i18n.localize('FORGE_CLEANER.Summary.Success')}: ${results.success}<br>`;

  if (results.failed.length > 0) {
    message += `<br><strong>${game.i18n.localize('FORGE_CLEANER.Summary.Failed')}:</strong><br>`;
    results.failed.forEach(item => {
      message += `- ${item.type}: ${item.name} - ${item.error}<br>`;
    });
  }

  ChatMessage.create({
    content: message,
    whisper: [game.user.id]
  });
}

module.exports = {
  applyOrganization,
  optimizeFiles,
  getOrganizationConfig,
};
