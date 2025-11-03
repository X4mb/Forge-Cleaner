/**
 * Forge Cleaner - Foundry VTT v13 Module
 * File organization and optimization tool for Foundry VTT worlds.
 * @author Xamb
 * @license MIT
 */

// --- ApplicationV2 Menus --- (Must be defined before settings registration)

class ForgeCleanerApplyOrganizationMenu extends ApplicationV2 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'forge-cleaner-apply-organization',
      title: game.i18n?.localize('FORGE_CLEANER.ApplyOrganization.Name') || 'Apply Organization',
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
      title: game.i18n?.localize('FORGE_CLEANER.OptimizeFiles.Name') || 'Optimize Files',
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

// --- Initialization ---

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

  // Recreate folder structure for different document types
  game.settings.register('forge-cleaner', 'recreateAssetsFolders', {
    name: game.i18n.localize('FORGE_CLEANER.RecreateAssetsFolders.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.RecreateAssetsFolders.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('forge-cleaner', 'recreateTokenFolders', {
    name: game.i18n.localize('FORGE_CLEANER.RecreateTokenFolders.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.RecreateTokenFolders.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('forge-cleaner', 'recreateSceneFolders', {
    name: game.i18n.localize('FORGE_CLEANER.RecreateSceneFolders.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.RecreateSceneFolders.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('forge-cleaner', 'recreateAudioFolders', {
    name: game.i18n.localize('FORGE_CLEANER.RecreateAudioFolders.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.RecreateAudioFolders.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('forge-cleaner', 'recreateItemsFolders', {
    name: game.i18n.localize('FORGE_CLEANER.RecreateItemsFolders.Name'),
    hint: game.i18n.localize('FORGE_CLEANER.RecreateItemsFolders.Hint'),
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
    audioFolder: game.settings.get('forge-cleaner', 'audioFolder'),
    itemsFolder: game.settings.get('forge-cleaner', 'itemsFolder'),
    recreateAssetsFolders: game.settings.get('forge-cleaner', 'recreateAssetsFolders'),
    recreateTokenFolders: game.settings.get('forge-cleaner', 'recreateTokenFolders'),
    recreateSceneFolders: game.settings.get('forge-cleaner', 'recreateSceneFolders'),
    recreateAudioFolders: game.settings.get('forge-cleaner', 'recreateAudioFolders'),
    recreateItemsFolders: game.settings.get('forge-cleaner', 'recreateItemsFolders'),
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
      <li><strong>Assets:</strong> ${config.assetsFolder}${config.recreateAssetsFolders ? ' (recreate folders)' : ''}</li>
      <li><strong>NPC Tokens:</strong> ${config.npcTokenFolder}${config.recreateTokenFolders ? ' (recreate folders)' : ''}</li>
      <li><strong>Player Tokens:</strong> ${config.playerTokenFolder}${config.recreateTokenFolders ? ' (recreate folders)' : ''}</li>
      <li><strong>Scenes:</strong> ${config.scenesFolder}${config.recreateSceneFolders ? ' (recreate folders)' : ''}</li>
      <li><strong>Audio:</strong> ${config.audioFolder}${config.recreateAudioFolders ? ' (recreate folders)' : ''}</li>
      <li><strong>Items:</strong> ${config.itemsFolder}${config.recreateItemsFolders ? ' (recreate folders)' : ''}</li>
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

    let targetFolder = actor.type === 'character' 
      ? config.playerTokenFolder 
      : config.npcTokenFolder;

    // If recreate folders is enabled and actor has a folder
    if (config.recreateTokenFolders && actor.folder) {
      const folder = game.folders.get(actor.folder);
      if (folder) {
        targetFolder = `${targetFolder}/${folder.name}`;
      }
    }

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

    let targetFolder = config.itemsFolder;

    // If recreate folders is enabled and item has a folder
    if (config.recreateItemsFolders && item.folder) {
      const folder = game.folders.get(item.folder);
      if (folder) {
        targetFolder = `${config.itemsFolder}/${folder.name}`;
      }
    }

    try {
      await moveFileAndUpdateReference(item.img, targetFolder, item, 'img', results);
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

      let targetFolder = config.audioFolder;

      // If recreate folders is enabled and playlist has a folder
      if (config.recreateAudioFolders && playlist.folder) {
        const folder = game.folders.get(playlist.folder);
        if (folder) {
          targetFolder = `${config.audioFolder}/${folder.name}`;
        }
      }

      try {
        // For embedded documents, we need to update the parent
        await moveFileAndUpdateReference(sound.path, targetFolder, playlist, sound, results);
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

    let targetFolder = config.assetsFolder;

    // If recreate folders is enabled and journal has a folder
    if (config.recreateAssetsFolders && journal.folder) {
      const folder = game.folders.get(journal.folder);
      if (folder) {
        targetFolder = `${config.assetsFolder}/${folder.name}`;
      }
    }

    try {
      await moveFileAndUpdateReference(journal.img, targetFolder, journal, 'img', results);
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

    let targetFolder = config.assetsFolder;

    // If recreate folders is enabled and macro has a folder
    if (config.recreateAssetsFolders && macro.folder) {
      const folder = game.folders.get(macro.folder);
      if (folder) {
        targetFolder = `${config.assetsFolder}/${folder.name}`;
      }
    }

    try {
      await moveFileAndUpdateReference(macro.img, targetFolder, macro, 'img', results);
    } catch (error) {
      forgeCleanerLog(`Failed to organize macro ${macro.name}:`, error);
      results.failed.push({ type: 'Macro', name: macro.name, file: macro.img, error: error.message });
    }
  }
}

/**
 * Normalize a file path by removing leading slashes and handling data/ prefix.
 * @param {string} path - File path to normalize
 * @returns {string} Normalized path
 */
function normalizeFilePath(path) {
  if (!path) return '';
  // Remove leading slashes
  let normalized = path.replace(/^\/+/, '');
  // Remove data/ prefix if present (FilePicker handles this)
  normalized = normalized.replace(/^data\//, '');
  return normalized;
}

/**
 * Normalize a folder path by removing leading/trailing slashes.
 * @param {string} path - Folder path to normalize
 * @returns {string} Normalized path
 */
function normalizeFolderPath(path) {
  if (!path) return '';
  // Remove leading and trailing slashes
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * Move a file to a new location and update the reference in the document.
 * Includes rollback on failure and deletes original file after success.
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

  // Normalize paths
  const normalizedPath = normalizeFilePath(filePath);
  const targetFolderNorm = normalizeFolderPath(targetFolder);
  
  if (!normalizedPath || !targetFolderNorm) {
    throw new Error('Invalid file path or target folder');
  }

  // Check if file is already in the target folder
  if (normalizedPath.startsWith(targetFolderNorm + '/') || normalizedPath === targetFolderNorm) {
    forgeCleanerLog(`File already in target folder: ${filePath}`);
    return;
  }

  // Construct new path
  const fileName = normalizedPath.split('/').pop();
  const newPath = `${targetFolderNorm}/${fileName}`;
  const originalPath = normalizedPath;

  let uploadedFilePath = null;

  // Move the file using Foundry's file API
  try {
    forgeCleanerLog(`Moving ${filePath} to ${newPath}`);
    
    // Get the file using Foundry's asset URL
    // File paths in Foundry documents are relative to data root (without leading slash or assets/ prefix)
    // Foundry serves files from /assets/ path
    // Construct the URL by prepending /assets/ to the normalized path
    const fileUrl = `/assets/${normalizedPath}`;
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const fileData = await response.blob();
    
    // Upload to new location
    // FilePicker.upload(source, targetPath, file, options)
    const uploadResult = await FilePicker.upload('data', newPath, fileData, {});
    
    if (!uploadResult || !uploadResult.path) {
      throw new Error('Failed to upload file to new location');
    }

    uploadedFilePath = uploadResult.path;
    forgeCleanerLog(`File uploaded to: ${uploadedFilePath}`);

    // Update the document with new path
    try {
      if (isEmbeddedUpdate) {
        // Update embedded document
        await document.updateEmbeddedDocuments('PlaylistSound', [{
          _id: embeddedDoc.id,
          path: uploadedFilePath,
        }]);
      } else {
        // Update regular field
        const updateData = { [fieldName]: uploadedFilePath };
        await document.update(updateData);
      }
    } catch (updateError) {
      // Rollback: delete the uploaded file if document update fails
      forgeCleanerLog(`Document update failed, attempting to delete uploaded file: ${updateError.message}`);
      try {
        await FilePicker.delete('data', uploadedFilePath);
        forgeCleanerLog('Rollback successful: uploaded file deleted');
      } catch (deleteError) {
        forgeCleanerLog(`Rollback failed: could not delete uploaded file: ${deleteError.message}`);
        results.warnings.push({
          type: 'Warning',
          message: `File ${uploadedFilePath} was uploaded but document update failed and rollback failed. Manual cleanup may be required.`,
        });
      }
      throw updateError;
    }

    // Delete the original file after successful move and update
    try {
      await FilePicker.delete('data', originalPath);
      forgeCleanerLog(`Original file deleted: ${originalPath}`);
    } catch (deleteError) {
      forgeCleanerLog(`Warning: Could not delete original file ${originalPath}: ${deleteError.message}`);
      results.warnings.push({
        type: 'Warning',
        message: `File moved successfully but original file ${originalPath} could not be deleted. Manual cleanup may be required.`,
      });
    }
    
    results.success++;
    forgeCleanerLog(`Successfully moved and updated: ${filePath} -> ${uploadedFilePath}`);
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

  if (results.warnings.length > 0) {
    message += `<br><strong>${game.i18n.localize('FORGE_CLEANER.Summary.Warnings')}:</strong><br>`;
    results.warnings.forEach(warning => {
      message += `- ${warning.message}<br>`;
    });
  }

  ChatMessage.create({
    content: message,
    whisper: [game.user.id],
  });
}
