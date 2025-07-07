/**
 * Forge Cleaner Test Script
 * Simulates Foundry VTT environment and tests Forge Cleaner logic in a non-interactive shell.
 */

// Mock Foundry VTT API
const game = {
  settings: {
    _settings: {},
    register: function (module, key, data) {
      this._settings[`${module}.${key}`] = data;
      console.log(`[Test] Registered setting: ${module}.${key}`);
    },
    registerMenu: function (module, key, data) {
      this._settings[`${module}.${key}`] = data;
      console.log(`[Test] Registered menu: ${module}.${key}`);
    },
    get: function (module, key) {
      return this._settings[`${module}.${key}`]?.default;
    }
  },
  i18n: {
    localize: (key) => key
  }
};

const Hooks = {
  _once: {},
  once: function (hook, fn) {
    this._once[hook] = fn;
    console.log(`[Test] Hook registered: ${hook}`);
  },
  callOnce: function (hook) {
    if (this._once[hook]) {
      this._once[hook]();
      console.log(`[Test] Hook called: ${hook}`);
    }
  }
};

const ui = {
  notifications: {
    info: (msg) => console.log(`[Notification] ${msg}`)
  }
};

// Mock FormApplication
class FormApplication {
  static get defaultOptions() { return {}; }
  async render(force, options) { }
}

// Attach mocks to global scope
global.game = game;
global.Hooks = Hooks;
global.ui = ui;
global.FormApplication = FormApplication;

// --- Additional Mocks for Thorough Testing ---

// Mock user as GM
const user = { id: 'gm', name: 'GM', isGM: true };
game.user = user;

game.actors = { contents: [
  { id: 'a1', name: '', type: 'Actor', effects: { contents: [ { id: 'e1', label: 'Orphaned', origin: 'Item.item.a2' } ] }, delete: async function() { this._deleted = true; }, system: {}, data: {} },
  { id: 'a2', name: 'Hero', type: 'Actor', effects: { contents: [] }, delete: async function() { this._deleted = true; }, system: {}, data: {} }
] };
game.items = { contents: [ { id: 'i1', name: 'Sword', type: 'Item', system: { desc: '' }, delete: async function() { this._deleted = true; } } ], get: (id) => null };
game.journal = { contents: [ { id: 'j1', name: '', type: 'JournalEntry', pages: { size: 0, contents: [] }, delete: async function() { this._deleted = true; }, content: '' } ] };
game.macros = { contents: [ { id: 'm1', name: '', type: 'Macro', delete: async function() { this._deleted = true; } } ] };
game.playlists = { contents: [ { id: 'p1', name: '', type: 'Playlist', delete: async function() { this._deleted = true; }, img: 'path/to/asset.png' } ] };
game.tables = { contents: [ { id: 't1', name: '', type: 'RollTable', delete: async function() { this._deleted = true; } } ] };
game.cards = { contents: [ { id: 'c1', name: '', type: 'Cards', delete: async function() { this._deleted = true; } } ] };
game.messages = { contents: [
  { id: 'msg1', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 40, content: 'Old message', user: user, delete: async function() { this._deleted = true; } },
  { id: 'msg2', timestamp: Date.now(), content: 'Recent message', user: user, delete: async function() { this._deleted = true; } }
] };
game.packs = { get: () => null };
game.scenes = { contents: [
  { id: 's1', name: 'Test Scene', tokens: { contents: [ { id: 't1', name: 'Ghost', actorId: 'missing', delete: async function() { this._deleted = true; } } ] }, deleteEmbeddedDocuments: async function(type, ids) { this._deletedTokens = ids; } }
] };

// Add deleteEmbeddedDocuments to actors for orphaned effect cleanup
for (const actor of game.actors.contents) {
  actor.deleteEmbeddedDocuments = async function(type, ids) {
    this._deletedEffects = ids;
    console.log(`[Mock] Actor ${this.id} deleteEmbeddedDocuments(${type}, ${JSON.stringify(ids)})`);
  };
}

// Add .get() methods to collections for lookup compatibility
function makeGettableCollection(arr, idField = 'id') {
  const col = arr;
  col.contents = arr;
  col.get = (id) => arr.find(obj => obj[idField] === id);
  return col;
}
game.actors = makeGettableCollection(game.actors.contents);
game.items = makeGettableCollection(game.items.contents);
game.journal = makeGettableCollection(game.journal.contents);
game.macros = makeGettableCollection(game.macros.contents);
game.playlists = makeGettableCollection(game.playlists.contents);
game.tables = makeGettableCollection(game.tables.contents);
game.cards = makeGettableCollection(game.cards.contents);
game.messages = makeGettableCollection(game.messages.contents);
game.scenes = makeGettableCollection(game.scenes.contents);

// Mock JournalEntry for archiving
class JournalEntry {
  static async create(data) { return new JournalEntry(data); }
  constructor(data) { this.name = data.name; this.content = data.content; }
  async update(data) { this.content = (this.content || '') + (data.content || ''); }
}
global.JournalEntry = JournalEntry;

// Mock CompendiumCollection for quarantine
class CompendiumCollection {
  static async createCompendium(data) { return new CompendiumCollection(data); }
  constructor(data) { this.label = data.label; this.docs = []; }
  async importDocument(doc) { this.docs.push(doc); }
}
global.CompendiumCollection = CompendiumCollection;

global.ChatMessage = { create: ({ content, whisper }) => console.log(`[ChatMessage] ${content} (whisper: ${whisper})`) };

game.i18n.localize = (key) => key;

game.packs = { get: () => null };

global.mergeObject = (a, b) => Object.assign({}, a, b);

// --- Test Settings ---
const testSettings = {
  'forge-cleaner.unlinkedTokensEnabled': true,
  'forge-cleaner.unlinkedTokensAction': 'flag',
  'forge-cleaner.orphanedActiveEffectsEnabled': true,
  'forge-cleaner.orphanedActiveEffectsAction': 'delete',
  'forge-cleaner.emptyDocumentsEnabled': true,
  'forge-cleaner.emptyDocumentsAction': 'move',
  'forge-cleaner.duplicateAssetsEnabled': true,
  'forge-cleaner.duplicateAssetsAction': 'flag',
  'forge-cleaner.oldChatMessagesEnabled': true,
  'forge-cleaner.oldChatMessagesAction': 'archive',
  'forge-cleaner.chatMessageAge': 30,
  'forge-cleaner.scanFrequency': 24,
  'forge-cleaner.scanOnWorldLoad': false
};
game.settings.get = (module, key) => testSettings[`${module}.${key}`];

// Import the Forge Cleaner module logic
const forgeCleaner = require('./forge-cleaner.js');
const performForgeCleanerScan = forgeCleaner.performForgeCleanerScan || global.performForgeCleanerScan;

// --- Run Full Test ---
console.log('--- Forge Cleaner Full Test Start ---');
(async () => {
  await performForgeCleanerScan();
  console.log('--- Forge Cleaner Full Test End ---');
})(); 