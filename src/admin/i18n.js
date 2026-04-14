// src/admin/i18n.js
// Admin panel UI string translations. EN is the default; FR is activated when
// the editor's browser language is French (detected once in CMSProvider as uiLocale).
// Key sets MUST match exactly between en and fr (enforced by src/admin/i18n.test.js).
// Add a key to both locales at the same time.
// React-dependent hooks (useT, tf, BLOCK_DISPLAY_KEYS) live in ./useT.js.
export const ADMIN_STRINGS = {
  en: {
    // Publishing
    publish: 'Publish',
    publishPage: 'Publish page',
    publishing: 'Publishing\u2026',
    published: 'Published',
    lastPublished: 'Last published',
    unpublishedChanges: 'Unpublished changes',
    // Draft / Save
    draft: 'Draft',
    saving: 'Saving\u2026',
    saved: 'Saved',
    saveError: 'Save failed \u2014 retry',
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
    // Load errors
    loadError: "This page couldn\u2019t be loaded",
    loadErrorBody: 'Check your connection and try again.',
    reload: 'Reload',

    // ── Auth ──────────────────────────────────────────────────────────
    emailAddress: 'Email address',
    password: 'Password',
    hidePassword: 'Hide password',
    showPassword: 'Show password',
    signingIn: 'Signing in\u2026',
    signIn: 'Sign in',
    invalidCredentials: 'Invalid email or password.',

    // ── Navigation / nav bar ──────────────────────────────────────────
    signOut: 'Sign out',
    adminNavLabel: 'Admin navigation',

    // ── Editor header ─────────────────────────────────────────────────
    backToPages: 'Back to Pages',
    pageNameLabel: 'Page name',
    pageNameEdit: 'Page name: {{name}}. Click to edit',
    pageSlugLabel: 'Page slug',
    pageSlugEdit: 'Page slug: {{slug}}. Click to edit',
    enterToSave: 'Enter to save',
    settings: 'Settings',
    pageSettings: 'Page settings',
    viewPage: 'View page',
    viewPageAriaLabel: 'View published page: {{url}}',
    copyUrl: 'Copy URL',
    copyUrlAriaLabel: 'Copy page URL: {{url}}',
    copied: 'Copied!',
    urlCopied: 'URL copied',
    tryAgain: 'Try again',
    notYetLive: 'Not yet live',
    saveFailed: 'Save failed',
    unsavedChanges: 'Unsaved changes',
    unpublishedSaved: 'Unpublished, saved',
    publishedTodayAt: 'Published today at {{time}}',
    publishedOn: 'Published {{date}}',
    lastPublishedTodayAt: 'Last published today at {{time}}',
    lastPublishedOn: 'Last published {{date}} at {{time}}',

    // ── Shared modal actions ──────────────────────────────────────────
    cancel: 'Cancel',
    discard: 'Discard',
    save: 'Save',

    // ── Create page modal ─────────────────────────────────────────────
    createNewPage: 'Create New Page',
    pageTypeLabel: 'Page type',
    pageOption: 'Page',
    collectionOption: 'Collection',
    parentCollection: 'Parent collection',
    noneTopLevel: 'None (top-level page)',
    slugLabel: 'Slug',
    fullPathHint: 'Full path: /{{path}}',
    slugHint: 'e.g. /about or /blog/my-post',
    templateLabel: 'Template',
    selectTemplate: 'Select a template',
    createPage: 'Create Page',
    slugPatternError: 'Slug does not match the {{template}} pattern.',
    slugInUse: 'That slug is already in use. Choose a different one.',

    // ── Delete page modal ─────────────────────────────────────────────
    deletePageTitle: 'Delete page?',
    deletePageBody: 'Delete /{{slug}}? This cannot be undone.',
    keepPage: 'Keep Page',
    deletePageAction: 'Delete Page',

    // ── Publish confirm modal ─────────────────────────────────────────
    publishConfirmTitle: 'Publish \u2018{{name}}\u2019?',
    publishConfirmBody: 'This will replace the current live version with your latest draft. Visitors will see the new content immediately.',
    publishFailedError: 'Failed to publish. Please try again.',
    publishNow: 'Publish now',

    // ── Toasts ────────────────────────────────────────────────────────
    pagePublished: 'Page published successfully.',
    blockDeleted: '{{blockType}} block deleted.',
    undoDeleteAriaLabel: 'Undo delete {{blockType}} block',

    // ── Unsaved changes warning ───────────────────────────────────────
    unsavedTitle: 'You have unsaved changes',
    unsavedBody: 'Your recent edits have not been saved yet. Do you want to leave without saving?',
    leaveWithoutSaving: 'Leave without saving',
    stayAndSave: 'Stay and save',

    // ── Sign out modal ────────────────────────────────────────────────
    signOutAnyway: 'Sign out anyway',
    signOutBody: '{{pageName}} has changes saved as a draft but not yet published. Publish now to make them live, or sign out and publish later.',
    publishFailedSignOut: 'Publish failed. Sign out anyway or try again.',
    publishAndSignOut: 'Publish and sign out',

    // ── Page meta modal ───────────────────────────────────────────────
    metaDescription: 'Description',
    descriptionHint: 'Shown in search results and social share previews.',
    shareImage: 'Share image',
    shareImageHint: 'Used as the Open Graph image for social sharing.',
    shareImageAlt: 'Share image preview',
    removeShareImage: 'Remove share image',
    libraryBtn: 'Library',

    // ── Block type picker ─────────────────────────────────────────────
    chooseBlockType: 'Choose block type',
    blockTypeHeading: 'Heading',
    blockTypeText: 'Text',
    blockTypeBulletList: 'Bullet List',
    blockTypeNumberedList: 'Numbered List',
    blockTypePullQuote: 'Pull Quote',
    blockTypeImage: 'Image',
    blockTypeVideo: 'Video',
    blockTypeGallery: 'Gallery',
    blockHintHeading: 'title or subtitle',
    blockHintText: 'paragraphs with formatting',
    blockHintBulletList: 'points without ranking',
    blockHintNumberedList: 'steps or ranked items',
    blockHintPullQuote: 'highlighted quote or callout',
    blockHintImage: 'photo or graphic',
    blockHintVideo: 'YouTube or Vimeo link',
    blockHintGallery: 'photo grid',

    // ── Block display names (gutter, undo toast) ──────────────────────
    blockTitle: 'Title',
    blockRichtext: 'Text',
    blockList: 'List',
    blockPullquote: 'Pull Quote',

    // ── Block gutter aria-labels ──────────────────────────────────────
    dragToReorder: 'Drag to reorder {{blockType}} block',
    deleteBlockAriaLabel: 'Delete {{blockType}} block',

    // ── Page manager ──────────────────────────────────────────────────
    newPage: 'New Page',
    createFirstPage: 'Create your first page',
    uploadMedia: 'Upload Media',
    noPagesYet: 'No pages yet.',
    noPagesEmptyBody: "Each page is a section of your website \u2014 like \u2018About\u2019, \u2018Contact\u2019, or \u2018Blog\u2019. Fill it with text, images, and galleries, then publish when it\u2019s ready.",
    failedToLoadPages: 'Failed to load pages.',
    searchPagesPlaceholder: 'Search pages\u2026',
    searchPagesLabel: 'Search pages',
    clearSearch: 'Clear search',
    clearFilter: 'Clear filter',
    dismiss: 'Dismiss',
    colName: 'Name',
    colSlug: 'Slug',
    colStatus: 'Status',
    colLastPublished: 'Last Published',
    colActions: 'Actions',
    notYet: 'Not yet',
    collections: 'Collections',
    statusPublished: 'Published',
    statusDraft: 'Draft',
    statusChanges: 'Changes',
    editBlocksFor: 'Edit blocks for {{slug}}',
    paginationLabel: 'Page navigation',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    sortRecent: 'Recently edited',
    sortAlpha: 'Alphabetical',
    filterDrafts: 'Drafts only',
    filterChanges: 'Unpublished changes',
    filterPublished: 'Published only',
    sortRecentHint: 'most recently changed first',
    sortAlphaHint: 'A\u2013Z by page name',
    filterDraftsHint: 'never been published',
    filterChangesHint: 'published but with edits',
    filterPublishedHint: 'live, no pending changes',
  },
  fr: {
    // Publishing
    publish: 'Publier',
    publishPage: 'Publier la page',
    publishing: 'Publication\u2026',
    published: 'Publi\u00e9',
    lastPublished: 'Derni\u00e8re publication',
    unpublishedChanges: 'Modifications non publi\u00e9es',
    // Draft / Save
    draft: 'Brouillon',
    saving: 'Enregistrement\u2026',
    saved: 'Enregistr\u00e9',
    saveError: '\u00c9chec \u2014 r\u00e9essayer',
    // Blocks
    addBlock: 'Ajouter un bloc',
    deleteBlock: 'Supprimer le bloc',
    undoDelete: 'Annuler',
    // Navigation
    back: 'Retour',
    pages: 'Pages',
    // Locale switcher
    contentLanguage: 'Langue du contenu',
    english: 'Anglais',
    french: 'Fran\u00e7ais',
    // Load errors
    loadError: 'Cette page n\u2019a pas pu \u00eatre charg\u00e9e',
    loadErrorBody: 'V\u00e9rifiez votre connexion et r\u00e9essayez.',
    reload: 'Recharger',

    // ── Auth ──────────────────────────────────────────────────────────
    emailAddress: 'Adresse e-mail',
    password: 'Mot de passe',
    hidePassword: 'Masquer le mot de passe',
    showPassword: 'Afficher le mot de passe',
    signingIn: 'Connexion\u2026',
    signIn: 'Se connecter',
    invalidCredentials: 'Identifiant ou mot de passe invalide.',

    // ── Navigation / nav bar ──────────────────────────────────────────
    signOut: 'Se d\u00e9connecter',
    adminNavLabel: 'Navigation admin',

    // ── Editor header ─────────────────────────────────────────────────
    backToPages: 'Retour aux pages',
    pageNameLabel: 'Nom de la page',
    pageNameEdit: 'Nom\u00a0: {{name}}. Cliquer pour modifier',
    pageSlugLabel: 'Identifiant',
    pageSlugEdit: 'Identifiant\u00a0: {{slug}}. Cliquer pour modifier',
    enterToSave: 'Entr\u00e9e pour enregistrer',
    settings: 'Param\u00e8tres',
    pageSettings: 'Param\u00e8tres de page',
    viewPage: 'Voir la page',
    viewPageAriaLabel: 'Voir la page publi\u00e9e\u00a0: {{url}}',
    copyUrl: "Copier l\u2019URL",
    copyUrlAriaLabel: "Copier l\u2019URL\u00a0: {{url}}",
    copied: 'Copi\u00e9\u00a0!',
    urlCopied: 'URL copi\u00e9e',
    tryAgain: 'R\u00e9essayer',
    notYetLive: 'Pas encore en ligne',
    saveFailed: '\u00c9chec de sauvegarde',
    unsavedChanges: 'Modifications non enregistr\u00e9es',
    unpublishedSaved: 'Non publi\u00e9, enregistr\u00e9',
    publishedTodayAt: "Publi\u00e9 aujourd\u2019hui \u00e0 {{time}}",
    publishedOn: 'Publi\u00e9 le {{date}}',
    lastPublishedTodayAt: "Derni\u00e8re publication aujourd\u2019hui \u00e0 {{time}}",
    lastPublishedOn: 'Derni\u00e8re publication le {{date}} \u00e0 {{time}}',

    // ── Shared modal actions ──────────────────────────────────────────
    cancel: 'Annuler',
    discard: 'Abandonner',
    save: 'Enregistrer',

    // ── Create page modal ─────────────────────────────────────────────
    createNewPage: 'Cr\u00e9er une page',
    pageTypeLabel: 'Type de page',
    pageOption: 'Page',
    collectionOption: 'Collection',
    parentCollection: 'Collection parente',
    noneTopLevel: 'Aucune (page racine)',
    slugLabel: 'Identifiant',
    fullPathHint: 'Chemin complet\u00a0: /{{path}}',
    slugHint: 'ex.\u00a0: /a-propos ou /blog/mon-article',
    templateLabel: 'Mod\u00e8le',
    selectTemplate: 'Choisir un mod\u00e8le',
    createPage: 'Cr\u00e9er la page',
    slugPatternError: "L\u2019identifiant ne correspond pas au mod\u00e8le {{template}}.",
    slugInUse: 'Cet identifiant est d\u00e9j\u00e0 utilis\u00e9. Choisissez-en un autre.',

    // ── Delete page modal ─────────────────────────────────────────────
    deletePageTitle: 'Supprimer la page\u00a0?',
    deletePageBody: 'Supprimer /{{slug}}\u00a0? Cette action est irr\u00e9versible.',
    keepPage: 'Garder la page',
    deletePageAction: 'Supprimer la page',

    // ── Publish confirm modal ─────────────────────────────────────────
    publishConfirmTitle: 'Publier \u00ab\u00a0{{name}}\u00a0\u00bb\u00a0?',
    publishConfirmBody: 'Cela remplacera la version en ligne par votre dernier brouillon. Les visiteurs verront le nouveau contenu imm\u00e9diatement.',
    publishFailedError: 'Erreur de publication. Veuillez r\u00e9essayer.',
    publishNow: 'Publier maintenant',

    // ── Toasts ────────────────────────────────────────────────────────
    pagePublished: 'Page publi\u00e9e avec succ\u00e8s.',
    blockDeleted: 'Bloc {{blockType}} supprim\u00e9.',
    undoDeleteAriaLabel: 'Annuler la suppression du bloc {{blockType}}',

    // ── Unsaved changes warning ───────────────────────────────────────
    unsavedTitle: 'Modifications non enregistr\u00e9es',
    unsavedBody: "Vos modifications r\u00e9centes n\u2019ont pas \u00e9t\u00e9 enregistr\u00e9es. Quitter sans enregistrer\u00a0?",
    leaveWithoutSaving: 'Quitter sans enregistrer',
    stayAndSave: 'Rester et enregistrer',

    // ── Sign out modal ────────────────────────────────────────────────
    signOutAnyway: 'Se d\u00e9connecter quand m\u00eame',
    signOutBody: '{{pageName}} a des modifications en brouillon non publi\u00e9es. Publiez maintenant ou d\u00e9connectez-vous et publiez plus tard.',
    publishFailedSignOut: 'Erreur de publication. D\u00e9connectez-vous quand m\u00eame ou r\u00e9essayez.',
    publishAndSignOut: 'Publier et se d\u00e9connecter',

    // ── Page meta modal ───────────────────────────────────────────────
    metaDescription: 'Description',
    descriptionHint: 'Affich\u00e9e dans les r\u00e9sultats de recherche et les aper\u00e7us de partage.',
    shareImage: 'Image de partage',
    shareImageHint: 'Utilis\u00e9e comme image Open Graph pour le partage.',
    shareImageAlt: "Aper\u00e7u de l\u2019image de partage",
    removeShareImage: "Supprimer l\u2019image de partage",
    libraryBtn: 'Biblioth\u00e8que',

    // ── Block type picker ─────────────────────────────────────────────
    chooseBlockType: 'Choisir un type de bloc',
    blockTypeHeading: 'Titre',
    blockTypeText: 'Texte',
    blockTypeBulletList: 'Liste \u00e0 puces',
    blockTypeNumberedList: 'Liste num\u00e9rot\u00e9e',
    blockTypePullQuote: 'Citation',
    blockTypeImage: 'Image',
    blockTypeVideo: 'Vid\u00e9o',
    blockTypeGallery: 'Galerie',
    blockHintHeading: 'titre ou sous-titre',
    blockHintText: 'paragraphes avec mise en forme',
    blockHintBulletList: 'points sans hi\u00e9rarchie',
    blockHintNumberedList: '\u00e9tapes ou \u00e9l\u00e9ments class\u00e9s',
    blockHintPullQuote: 'citation mise en valeur',
    blockHintImage: 'photo ou illustration',
    blockHintVideo: 'lien YouTube ou Vimeo',
    blockHintGallery: 'grille de photos',

    // ── Block display names (gutter, undo toast) ──────────────────────
    blockTitle: 'Titre',
    blockRichtext: 'Texte',
    blockList: 'Liste',
    blockPullquote: 'Citation',

    // ── Block gutter aria-labels ──────────────────────────────────────
    dragToReorder: 'Glisser pour r\u00e9ordonner le bloc {{blockType}}',
    deleteBlockAriaLabel: 'Supprimer le bloc {{blockType}}',

    // ── Page manager ──────────────────────────────────────────────────
    newPage: 'Nouvelle page',
    createFirstPage: 'Cr\u00e9er votre premi\u00e8re page',
    uploadMedia: 'Importer un m\u00e9dia',
    noPagesYet: 'Aucune page.',
    noPagesEmptyBody: "Chaque page est une section de votre site \u2014 comme \u00ab\u00a0\u00c0 propos\u00a0\u00bb, \u00ab\u00a0Contact\u00a0\u00bb ou \u00ab\u00a0Blog\u00a0\u00bb. Remplissez-la avec du texte, des images et des galeries, puis publiez quand vous \u00eates pr\u00eat.",
    failedToLoadPages: 'Impossible de charger les pages.',
    searchPagesPlaceholder: 'Rechercher des pages\u2026',
    searchPagesLabel: 'Rechercher des pages',
    clearSearch: 'Effacer la recherche',
    clearFilter: 'Effacer le filtre',
    dismiss: 'Fermer',
    colName: 'Nom',
    colSlug: 'Identifiant',
    colStatus: 'Statut',
    colLastPublished: 'Derni\u00e8re publication',
    colActions: 'Actions',
    notYet: 'Jamais',
    collections: 'Collections',
    statusPublished: 'Publi\u00e9',
    statusDraft: 'Brouillon',
    statusChanges: 'Modifi\u00e9',
    editBlocksFor: 'Modifier les blocs de {{slug}}',
    paginationLabel: 'Pagination',
    previousPage: 'Page pr\u00e9c\u00e9dente',
    nextPage: 'Page suivante',
    sortRecent: 'R\u00e9cemment modifi\u00e9',
    sortAlpha: 'Alphab\u00e9tique',
    filterDrafts: 'Brouillons seulement',
    filterChanges: 'Modifications non publi\u00e9es',
    filterPublished: 'Publi\u00e9s seulement',
    sortRecentHint: 'les plus r\u00e9cemment modifi\u00e9s',
    sortAlphaHint: 'A\u2013Z par nom de page',
    filterDraftsHint: 'jamais publi\u00e9s',
    filterChangesHint: 'publi\u00e9s avec des modifications',
    filterPublishedHint: 'en ligne, sans modifications',
  },
}

// React-dependent helpers (useT, tf, BLOCK_DISPLAY_KEYS) are in ./useT.js.
