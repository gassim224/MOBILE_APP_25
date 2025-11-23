// Application constants

// Authentication
export const TEST_CREDENTIALS = {
  USERNAME: 'eleve1',
  PASSWORD: '1234',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SESSION_TOKEN: 'sessionToken',
  USER_PROFILE: 'userProfile',
  NOTIFICATION_PERMISSION: 'notificationPermissionRequested',
  LAST_APP_OPEN: 'lastAppOpenTimestamp',
  INACTIVITY_NOTIFICATION_ID: 'inactivityNotificationId',
  SIMULATOR_ENABLED: '@connection_simulator_enabled',
  SIMULATED_STATE: '@connection_simulated_state',
  MEDIA_PROGRESS_PREFIX: '@media_progress_',
  COURSE_PROGRESS_PREFIX: 'course_progress_',
  LESSON_REMINDER_PREFIX: 'lesson_reminder_',
} as const;

// Time Intervals
export const TIME_INTERVALS = {
  AUTH_CHECK_DELAY: 500,
  LOGIN_TRANSITION_DELAY: 200,
  DOWNLOAD_SIMULATION: 2000,
  DOWNLOAD_ALL_SIMULATION: 3000,
  INACTIVITY_REMINDER: 48 * 60 * 60, // 48 hours in seconds
  LESSON_CONTINUATION_REMINDER: 24 * 60 * 60, // 24 hours in seconds
  TEST_NOTIFICATION_DELAY: 5, // 5 seconds for testing
} as const;

// UI Messages
export const MESSAGES = {
  // Authentication
  LOGIN_ERROR_GENERIC: 'Une erreur est survenue lors de la connexion',
  LOGOUT_CONFIRM_TITLE: 'Déconnexion',
  LOGOUT_CONFIRM_MESSAGE: 'Êtes-vous sûr de vouloir vous déconnecter?',

  // Download
  DOWNLOAD_ERROR_OFFLINE: 'Vous devez être connecté au kiosque pour télécharger du contenu.',
  DOWNLOAD_ALL_ALREADY: 'Toutes les leçons sont déjà téléchargées.',
  DOWNLOAD_ALL_CONFIRM: 'Télécharger tout le cours',
  DOWNLOAD_COMPLETE: 'Téléchargement terminé',
  DOWNLOAD_COMPLETE_MESSAGE: 'Toutes les leçons ont été téléchargées avec succès !',

  // Deletion
  DELETE_COURSE_TITLE: 'Supprimer le cours',
  DELETE_COURSE_MESSAGE: 'Voulez-vous vraiment supprimer ce cours ? Tous les fichiers associés seront effacés de votre appareil.',
  DELETE_BOOK_TITLE: 'Supprimer le livre',
  DELETE_BOOK_MESSAGE: 'Voulez-vous vraiment supprimer ce livre ? Il sera effacé de votre appareil.',
  DELETE_LESSON_TITLE: 'Supprimer la leçon',
  DELETE_LESSON_MESSAGE: 'Voulez-vous vraiment supprimer cette leçon ? Le fichier sera effacé de votre appareil.',

  // Generic
  CANCEL: 'Annuler',
  OK: 'OK',
  DELETE: 'Supprimer',
  DOWNLOAD: 'Télécharger',
} as const;

// Kiosk detection keywords
export const KIOSK_SSID_KEYWORDS = ['ecole', 'school', 'kiosk'] as const;

// App Info
export const APP_INFO = {
  VERSION: '1.0.0',
  NAME: 'Bonecole',
  TAGLINE: 'votre école au bout du doigt',
} as const;
