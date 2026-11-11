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
  // Playback speed chosen in the audio/video players (shared, remembered)
  PLAYBACK_RATE: '@playback_rate',
  SIMULATED_STATE: '@connection_simulated_state',
  MEDIA_PROGRESS_PREFIX: '@media_progress_',
  COURSE_PROGRESS_PREFIX: 'course_progress_',
  LESSON_REMINDER_PREFIX: 'lesson_reminder_',
  // Analytics events
  // Once-emit flag prefixes carry a version suffix. Bumping the version
  // invalidates all stale flags from prior builds so events can fire again
  // for the same (user, content) pair — used to recover from earlier
  // versions that set the flag without successfully enqueueing.
  ANALYTICS_EVENT_QUEUE: '@analytics_event_queue',
  ANALYTICS_FIRST_LOGIN_EMITTED_PREFIX: '@analytics_first_login_emitted_',
  ANALYTICS_CONSUMED_EMITTED_PREFIX: '@analytics_consumed_emitted_v2_',
  ANALYTICS_EXERCISE_EMITTED_PREFIX: '@analytics_exercise_completed_v2_',
  // Teacher's currently selected grade (from their assigned list).
  // Students never read this — their grade is fixed on the JWT.
  ACTIVE_GRADE: '@active_grade',
} as const;

// Analytics events backend.
// Two paths:
//   - direct cloud: device has real internet (cellular / home WiFi)
//   - kiosk relay : device is on the Pi soft AP with no internet — push to
//     the Pi which will forward to cloud during the school admin's Sync Now.
// flushQueue() probes the kiosk first; if reachable it uses the relay,
// otherwise it falls back to direct cloud.
// Kiosk (Raspberry Pi) origin — single source of truth for every kiosk URL
// (API base, connectivity ping, analytics relay). Resolved via mDNS on the
// school WiFi. Previously the hotspot IP http://10.42.0.1:8001.
export const KIOSK_ORIGIN = 'http://bonecole.local';

export const ANALYTICS = {
  EVENTS_BATCH_URL: 'https://admin-api.bonecole.com/api/v1/events/batch',
  KIOSK_QUEUE_URL: `${KIOSK_ORIGIN}/events/queue`,
  KIOSK_PROBE_URL: `${KIOSK_ORIGIN}/cloud/school/update`,
  // Strict completion per May 2026 product clarification:
  //   - video / audio: user reaches >= 90% of duration
  //   - pdf / ebook : last page reached (handled separately in pdf-reader)
  //   - exercise    : last page reached (handled separately in pdf-reader)
  // This threshold is used by video/audio players only. PDF logic fires on
  // last-page-reached, not on a ratio.
  CONSUMED_THRESHOLD: 0.9,
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

// Kiosk detection keywords — add your Raspberry Pi's WiFi SSID (or part of it) here
export const KIOSK_SSID_KEYWORDS = ['ecole', 'school', 'kiosk', 'raspberry', 'raspi', 'bonecole'] as const;

// App Info
export const APP_INFO = {
  VERSION: '1.0.0',
  NAME: 'Bonecole',
  TAGLINE: 'votre école au bout du doigt',
} as const;
