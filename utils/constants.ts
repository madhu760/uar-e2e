// Stores user's session information including cookies and localstorage.
// which will be shared across tests.
export const sessionStorageFilePath = '.playwright/.auth/user-session.json';

// How long the expect.poll function can poll until it times out.
export const expectPollTimeout = 60 * 2 * 1000; // 2 minutes
