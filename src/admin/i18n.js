// src/admin/i18n.js
// Admin panel UI string translations. EN is the default; FR is activated when
// CMSProvider receives isLocalized: true and the editor sets locale to 'fr'.
// Key sets MUST match exactly between en and fr (enforced by src/admin/i18n.test.js).
// Add a key to both locales at the same time.
export const ADMIN_STRINGS = {
  en: {
    // Publishing
    publish: 'Publish',
    publishPage: 'Publish page',
    publishing: 'Publishing...',
    published: 'Published',
    lastPublished: 'Last published',
    unpublishedChanges: 'Unpublished changes',
    // Draft / Save
    draft: 'Draft',
    saving: 'Saving...',
    saved: 'Saved',
    saveError: 'Save failed — retry',
    // Blocks
    addBlock: 'Add block',
    deleteBlock: 'Delete block',
    undoDelete: 'Undo',
    // Navigation
    back: 'Back',
    pages: 'Pages',
    // Locale switcher
    contentLanguage: 'Content language',
    english: 'English',
    french: 'French',
    // Errors
    loadError: "This page couldn't be loaded",
    loadErrorBody: 'Check your connection and try again.',
    reload: 'Reload',
  },
  fr: {
    publish: 'Publier',
    publishPage: 'Publier la page',
    publishing: 'Publication...',
    published: 'Publié',
    lastPublished: 'Dernière publication',
    unpublishedChanges: 'Modifications non publiées',
    draft: 'Brouillon',
    saving: 'Enregistrement...',
    saved: 'Enregistré',
    saveError: 'Échec — réessayer',
    addBlock: 'Ajouter un bloc',
    deleteBlock: 'Supprimer le bloc',
    undoDelete: 'Annuler',
    back: 'Retour',
    pages: 'Pages',
    contentLanguage: 'Langue du contenu',
    english: 'Anglais',
    french: 'Français',
    loadError: "Cette page n'a pas pu être chargée",
    loadErrorBody: 'Vérifiez votre connexion et réessayez.',
    reload: 'Recharger',
  },
}
