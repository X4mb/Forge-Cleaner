/**
 * Forge Cleaner - Foundry VTT v13 Module
 * Periodically scans and cleans up unused, orphaned, or redundant data in the active world.
 * @author Xamb
 * @license MIT
 */

Hooks.once('init', () => {
  console.log('Forge Cleaner | Initializing module');
  registerForgeCleanerSettings();
});

Hooks.once('ready', () => {
  setupForgeCleanerScheduler();
});

/**
 * Register module settings in the Foundry VTT settings menu.
 */
function registerForgeCleanerSettings() {
  // Cleanup categories and their actions
  const categories = [
    {
      key: 'unlinkedTokens',
      name: 'FORGE_CLEANER.UnlinkedTokens.Name',
      hint: 'FORGE_CLEANER.UnlinkedTokens.Hint',
      defaultEnabled: true,
      defaultAction: 'flag',
    },
    {
      key: 'orphanedActiveEffects',
      name: 'FORGE_CLEANER.OrphanedActiveEffects.Name',
      hint: 'FORGE_CLEANER.OrphanedActiveEffects.Hint',
      defaultEnabled: true,
      defaultAction: 'flag',
    },
    {
      key: 'emptyDocuments',
      name: 'FORGE_CLEANER.EmptyDocuments.Name',
      hint: 'FORGE_CLEANER.EmptyDocuments.Hint',
      defaultEnabled: true,
      defaultAction: 'flag',
    },
    {
      key: 'duplicateAssets',
      name: 'FORGE_CLEANER.DuplicateAssets.Name',
      hint: 'FORGE_CLEANER.DuplicateAssets.Hint',
      defaultEnabled: false,
      defaultAction: 'flag',
    },
    {
      key: 'oldChatMessages',
      name: 'FORGE_CLEANER.OldChatMessages.Name',
      hint: 'FORGE_CLEANER.OldChatMessages.Hint',
      defaultEnabled: true,
      defaultAction: 'archive',
    },
  ];

  const actions = {
    delete: 'FORGE_CLEANER.Action.Delete',
    move: 'FORGE_CLEANER.Action.Move',
    flag: 'FORGE_CLEANER.Action.Flag',
    ignore: 'FORGE_CLEANER.Action.Ignore',
    archive: 'FORGE_CLEANER.Action.Archive',
  };

  // Register settings for each category
  for (const cat of categories) {
    game.settings.register('forge-cleaner', `${cat.key}Enabled`, {
      name: cat.name,
      hint: cat.hint,
      scope: 'world',
      config: true,
      type: Boolean,
      default: cat.defaultEnabled,
    });
    game.settings.register('forge-cleaner', `${cat.key}Action`, {
      name: `${cat.name} - FORGE_CLEANER.Action`,
      hint: 'FORGE_CLEANER.Action.Hint',
      scope: 'world',
      config: true,
      type: String,
      choices: actions,
      default: cat.defaultAction,
    });
  }

  // Scan frequency (hours)
  game.settings.register('forge-cleaner', 'scanFrequency', {
    name: 'FORGE_CLEANER.ScanFrequency.Name',
    hint: 'FORGE_CLEANER.ScanFrequency.Hint',
    scope: 'world',
    config: true,
    type: Number,
    default: 24,
    range: { min: 1, max: 168, step: 1 },
  });

  // Scan on world load
  game.settings.register('forge-cleaner', 'scanOnWorldLoad', {
    name: 'FORGE_CLEANER.ScanOnWorldLoad.Name',
    hint: 'FORGE_CLEANER.ScanOnWorldLoad.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  // Age of chat messages to delete/archive (days)
  game.settings.register('forge-cleaner', 'chatMessageAge', {
    name: 'FORGE_CLEANER.ChatMessageAge.Name',
    hint: 'FORGE_CLEANER.ChatMessageAge.Hint',
    scope: 'world',
    config: true,
    type: Number,
    default: 30,
    range: { min: 1, max: 365, step: 1 },
  });

  // Manual scan trigger button (uses a menu setting for button)
  game.settings.registerMenu('forge-cleaner', 'manualScan', {
    name: 'FORGE_CLEANER.ManualScan.Name',
    label: 'FORGE_CLEANER.ManualScan.Label',
    hint: 'FORGE_CLEANER.ManualScan.Hint',
    icon: 'fas fa-broom',
    type: ForgeCleanerManualScanMenu,
    restricted: true,
  });

  // Debug logging setting
  game.settings.register('forge-cleaner', 'debugLogging', {
    name: 'FORGE_CLEANER.DebugLogging.Name',
    hint: 'FORGE_CLEANER.DebugLogging.Hint',
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

/**
 * Settings menu for manual scan trigger.
 */
class ForgeCleanerManualScanMenu extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'forge-cleaner-manual-scan',
      title: game.i18n.localize('FORGE_CLEANER.ManualScan.Name'),
      template: '', // No template needed
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: false,
      width: 400,
      height: 'auto',
    });
  }
  async render(force, options) {
    ui.notifications.info(game.i18n.localize('FORGE_CLEANER.ManualScan.Triggered'));
    await performForgeCleanerScan();
  }
}

/**
 * Set up the scheduled scan logic and manual scan trigger.
 */
function setupForgeCleanerScheduler() {
  // Only the GM should schedule or run scans
  if (!game.user?.isGM && typeof game.user !== 'undefined') return;

  // Read settings
  const scanFrequency = game.settings.get('forge-cleaner', 'scanFrequency') || 24; // hours
  const scanOnWorldLoad = game.settings.get('forge-cleaner', 'scanOnWorldLoad');

  // Schedule periodic scan
  if (scanFrequency > 0) {
    const ms = scanFrequency * 60 * 60 * 1000;
    setInterval(() => {
      performForgeCleanerScan();
    }, ms);
    console.log(`Forge Cleaner | Scheduled scan every ${scanFrequency} hours.`);
  }

  // Scan on world load
  if (scanOnWorldLoad) {
    performForgeCleanerScan();
    console.log('Forge Cleaner | Scan triggered on world load.');
  }
}

/**
 * Main entry point for performing a scan and cleanup.
 */
async function performForgeCleanerScan() {
  forgeCleanerLog('Starting scan...');
  // Only the GM should run cleanup
  if (!game.user?.isGM && typeof game.user !== 'undefined') return;

  let summary = [];

  // 1. Unlinked Tokens
  if (game.settings.get('forge-cleaner', 'unlinkedTokensEnabled')) {
    const action = game.settings.get('forge-cleaner', 'unlinkedTokensAction');
    forgeCleanerLog('Scanning for unlinked tokens, action:', action);
    const result = await cleanupUnlinkedTokens(action);
    forgeCleanerLog('Unlinked tokens result:', result);
    if (result && result.length) summary.push(`Unlinked Tokens: ${result.length}`);
  }

  // 2. Orphaned Active Effects
  if (game.settings.get('forge-cleaner', 'orphanedActiveEffectsEnabled')) {
    const action = game.settings.get('forge-cleaner', 'orphanedActiveEffectsAction');
    forgeCleanerLog('Scanning for orphaned active effects, action:', action);
    const result = await cleanupOrphanedActiveEffects(action);
    forgeCleanerLog('Orphaned active effects result:', result);
    if (result && result.length) summary.push(`Orphaned Effects: ${result.length}`);
  }

  // 3. Empty Documents
  if (game.settings.get('forge-cleaner', 'emptyDocumentsEnabled')) {
    const action = game.settings.get('forge-cleaner', 'emptyDocumentsAction');
    forgeCleanerLog('Scanning for empty documents, action:', action);
    const result = await cleanupEmptyDocuments(action);
    forgeCleanerLog('Empty documents result:', result);
    if (result && result.length) summary.push(`Empty Documents: ${result.length}`);
  }

  // 4. Duplicate Assets
  if (game.settings.get('forge-cleaner', 'duplicateAssetsEnabled')) {
    const action = game.settings.get('forge-cleaner', 'duplicateAssetsAction');
    forgeCleanerLog('Scanning for duplicate assets, action:', action);
    const result = await cleanupDuplicateAssets(action);
    forgeCleanerLog('Duplicate assets result:', result);
    if (result && result.length) summary.push(`Duplicate Assets: ${result.length}`);
  }

  // 5. Old Chat Messages
  if (game.settings.get('forge-cleaner', 'oldChatMessagesEnabled')) {
    const action = game.settings.get('forge-cleaner', 'oldChatMessagesAction');
    const age = game.settings.get('forge-cleaner', 'chatMessageAge');
    forgeCleanerLog('Scanning for old chat messages, action:', action, 'age:', age);
    const result = await cleanupOldChatMessages(action, age);
    forgeCleanerLog('Old chat messages result:', result);
    if (result && result.length) summary.push(`Old Chat Messages: ${result.length}`);
  }

  forgeCleanerLog('Scan summary:', summary);
  // Notify GM
  if (summary.length) {
    sendForgeCleanerSummary(`Automated Cleanup: ${summary.join(', ')}.`);
  }
}

// --- Cleanup Routines ---

/**
 * Orphaned Active Effects: Remove effects referencing missing items/sources.
 */
async function cleanupOrphanedActiveEffects(action) {
  let affected = [];
  for (const actor of game.actors?.contents || []) {
    for (const effect of actor.effects.contents) {
      // Check if effect references a source (item) that no longer exists
      const sourceId = effect.origin?.split('.')?.[2];
      if (sourceId && !game.items.get(sourceId)) {
        affected.push({ actor, effect });
      }
    }
  }
  if (!affected.length) return [];
  switch (action) {
    case 'delete':
      for (const { actor, effect } of affected) {
        await actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id]);
      }
      break;
    case 'move':
      // Not applicable for effects; flag instead
      sendForgeCleanerSummary('Move to compendium not supported for effects. Flagging for review.');
      // fallthrough
    case 'flag':
      sendForgeCleanerSummary(`Orphaned Effects found: ${affected.map(a => `${a.actor.name} [${a.effect.label}]`).join(', ')}`);
      break;
    case 'ignore':
    default:
      break;
  }
  return affected;
}

/**
 * Empty Documents: Remove documents with no content or only default properties.
 */
async function cleanupEmptyDocuments(action) {
  let affected = [];
  // Check Actors, Items, Journals, Macros, Playlists, Tables, Cards
  const types = [
    { collection: game.actors, type: 'Actor' },
    { collection: game.items, type: 'Item' },
    { collection: game.journal, type: 'JournalEntry' },
    { collection: game.macros, type: 'Macro' },
    { collection: game.playlists, type: 'Playlist' },
    { collection: game.tables, type: 'RollTable' },
    { collection: game.cards, type: 'Cards' }
  ];
  for (const { collection, type } of types) {
    for (const doc of collection?.contents || []) {
      if (isEmptyDocument(doc)) {
        affected.push({ doc, type });
      }
    }
  }
  if (!affected.length) return [];
  switch (action) {
    case 'delete':
      for (const { doc, type } of affected) {
        await doc.delete();
      }
      break;
    case 'move':
      await moveDocumentsToQuarantine(affected.map(a => a.doc));
      break;
    case 'flag':
      sendForgeCleanerSummary(`Empty Documents found: ${affected.map(a => `${a.type} [${a.doc.name}]`).join(', ')}`);
      break;
    case 'ignore':
    default:
      break;
  }
  return affected;
}

/**
 * Helper: Determine if a document is empty (no name/content or only default properties).
 */
function isEmptyDocument(doc) {
  // Consider empty if name is blank and no description/content fields
  if (!doc.name || doc.name.trim() === '') return true;
  if (doc.data && doc.data.description && doc.data.description.value) {
    if (doc.data.description.value.trim() !== '') return false;
  }
  // For JournalEntry, check pages
  if (doc.pages && doc.pages.size > 0) {
    for (const page of doc.pages.contents) {
      if (page.text?.content?.trim()) return false;
    }
    return true;
  }
  // For Items, check if any system data is set
  if (doc.type === 'Item' && doc.system && Object.keys(doc.system).length > 0) {
    for (const key in doc.system) {
      if (doc.system[key]) return false;
    }
    return true;
  }
  // Fallback: if no content fields, consider empty
  return true;
}

/**
 * Duplicate Assets: Find documents referencing the same asset path redundantly.
 */
async function cleanupDuplicateAssets(action) {
  let affected = [];
  // Only check image/sound fields for Actors, Items, Journals, Macros, Playlists
  const assetMap = new Map();
  const types = [
    { collection: game.actors, type: 'Actor', field: 'img' },
    { collection: game.items, type: 'Item', field: 'img' },
    { collection: game.journal, type: 'JournalEntry', field: 'img' },
    { collection: game.macros, type: 'Macro', field: 'img' },
    { collection: game.playlists, type: 'Playlist', field: 'img' }
  ];
  for (const { collection, type, field } of types) {
    for (const doc of collection?.contents || []) {
      const asset = doc[field];
      if (asset && asset !== '' && asset !== 'icons/svg/mystery-man.svg') {
        if (!assetMap.has(asset)) assetMap.set(asset, []);
        assetMap.get(asset).push({ doc, type });
      }
    }
  }
  // Find assets referenced by more than one document
  for (const [asset, docs] of assetMap.entries()) {
    if (docs.length > 1) {
      affected.push({ asset, docs });
    }
  }
  if (!affected.length) return [];
  switch (action) {
    case 'delete':
      // Not safe to delete docs just for duplicate asset; flag instead
      sendForgeCleanerSummary('Delete not supported for duplicate assets. Flagging for review.');
      // fallthrough
    case 'move':
      // Not safe to move; flag instead
      sendForgeCleanerSummary('Move to compendium not supported for duplicate assets. Flagging for review.');
      // fallthrough
    case 'flag':
      sendForgeCleanerSummary(`Duplicate Assets found: ${affected.map(a => `${a.asset} [${a.docs.map(d => d.doc.name).join(', ')}]`).join('; ')}`);
      break;
    case 'ignore':
    default:
      break;
  }
  return affected;
}

/**
 * Old Chat Messages: Delete or archive messages older than a threshold (days).
 */
async function cleanupOldChatMessages(action, ageDays) {
  let affected = [];
  const now = Date.now();
  const cutoff = now - ageDays * 24 * 60 * 60 * 1000;
  for (const msg of game.messages?.contents || []) {
    if (msg.timestamp < cutoff) {
      affected.push(msg);
    }
  }
  if (!affected.length) return [];
  switch (action) {
    case 'delete':
      for (const msg of affected) {
        await msg.delete();
      }
      break;
    case 'archive':
      await archiveChatMessages(affected);
      for (const msg of affected) {
        await msg.delete();
      }
      break;
    case 'move':
      // Not applicable; flag instead
      sendForgeCleanerSummary('Move to compendium not supported for chat messages. Archiving or deleting instead.');
      break;
    case 'flag':
      sendForgeCleanerSummary(`Old Chat Messages found: ${affected.length}`);
      break;
    case 'ignore':
    default:
      break;
  }
  return affected;
}

/**
 * Archive chat messages into a single Journal Entry.
 */
async function archiveChatMessages(messages) {
  if (!messages.length) return;
  // Create or find a Journal Entry for archived chat
  let journal = game.journal.contents.find(j => j.name === 'Forge Cleaner Chat Archive');
  if (!journal) {
    journal = await JournalEntry.create({ name: 'Forge Cleaner Chat Archive', content: '' });
  }
  // Append messages to the journal
  let content = journal.content || '';
  for (const msg of messages) {
    content += `<p><b>${msg.user?.name || 'User'}:</b> ${msg.content}</p>`;
  }
  await journal.update({ content });
}

/**
 * Move documents to the quarantine compendium.
 */
async function moveDocumentsToQuarantine(docs) {
  // Find or create the quarantine compendium
  let pack = game.packs.get('forge-cleaner.forge-cleaner-quarantine');
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      entity: docs[0]?.documentName || 'Actor',
      label: 'Forge Cleaner Quarantine',
      name: 'forge-cleaner-quarantine',
      package: 'forge-cleaner'
    });
  }
  for (const doc of docs) {
    await pack.importDocument(doc);
    await doc.delete();
  }
}

/**
 * Find and handle tokens on all scenes that reference missing actors.
 * @param {string} action - The configured action for this category.
 * @returns {Promise<Array>} - List of affected tokens.
 */
async function cleanupUnlinkedTokens(action) {
  let affected = [];
  for (const scene of game.scenes?.contents || []) {
    for (const token of scene.tokens.contents) {
      if (token.actorId && !game.actors.get(token.actorId)) {
        affected.push({ scene, token });
      }
    }
  }
  if (!affected.length) return [];

  switch (action) {
    case 'delete':
      for (const { scene, token } of affected) {
        await scene.deleteEmbeddedDocuments('Token', [token.id]);
      }
      break;
    case 'move':
      // Not applicable for tokens; flag instead
      sendForgeCleanerSummary('Move to compendium not supported for tokens. Flagging for review.');
      // fallthrough
    case 'flag':
      sendForgeCleanerSummary(`Unlinked Tokens found: ${affected.map(a => `${a.scene.name} [${a.token.name}]`).join(', ')}`);
      break;
    case 'ignore':
    default:
      // Do nothing
      break;
  }
  return affected;
}

/**
 * Send a private chat message to the GM summarizing actions taken.
 * @param {string} message
 */
function sendForgeCleanerSummary(message) {
  // In Foundry, use ChatMessage.create with whisper to GM
  if (typeof ChatMessage !== 'undefined') {
    ChatMessage.create({ content: message, whisper: [game.user.id] });
  } else {
    // Fallback for test environment
    console.log(`[Forge Cleaner] ${message}`);
  }
}

module.exports = {
  performForgeCleanerScan,
  cleanupUnlinkedTokens,
  cleanupOrphanedActiveEffects,
  cleanupEmptyDocuments,
  cleanupDuplicateAssets,
  cleanupOldChatMessages,
  archiveChatMessages,
  moveDocumentsToQuarantine,
  isEmptyDocument
}; 