import firebaseConfig from '../../firebase-applet-config.json';

// In-memory token storage (never localStorage for access tokens)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export const CLIENT_ID = firebaseConfig.oAuthClientId;
export const API_KEY = firebaseConfig.apiKey;

export const ALL_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/classroom.courses',
].join(' ');

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export function getCachedToken(): string | null {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  return null;
}

export function setCachedToken(token: string, expiresInSeconds = 3500) {
  cachedAccessToken = token;
  tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
}

export function clearCachedToken() {
  cachedAccessToken = null;
  tokenExpiresAt = 0;
}

/**
 * Request OAuth Token using Google Identity Services (GSI) Token Client
 */
export function requestWorkspaceToken(scopeOverride?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services script not yet loaded. Please refresh or try in a few seconds.'));
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: scopeOverride || ALL_SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('Google OAuth Error:', response);
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            setCachedToken(response.access_token, response.expires_in || 3600);
            resolve(response.access_token);
          } else {
            reject(new Error('No access token returned.'));
          }
        },
      });

      client.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Common fetch helper with auto token attachment
 */
async function workspaceFetch(url: string, options: RequestInit = {}, token?: string): Promise<any> {
  const activeToken = token || getCachedToken();
  if (!activeToken) {
    throw new Error('AUTH_REQUIRED');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${activeToken}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearCachedToken();
    throw new Error('TOKEN_EXPIRED');
  }
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Google API Error (${res.status}): ${errorBody || res.statusText}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

// ----------------------------------------------------
// 1. Google Drive API
// ----------------------------------------------------
export async function listDriveFiles(queryParam = "trashed = false") {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    queryParam
  )}&pageSize=20&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime,size)`;
  return workspaceFetch(url);
}

export async function createDriveFolder(folderName: string, parentId?: string) {
  const body: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) body.parents = [parentId];
  return workspaceFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ----------------------------------------------------
// 2. Google Sheets API
// ----------------------------------------------------
export async function createSpreadsheet(title: string, sheetTitles: string[] = ['Sheet1']) {
  const body = {
    properties: { title },
    sheets: sheetTitles.map((st) => ({ properties: { title: st } })),
  };
  return workspaceFetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function appendSpreadsheetRows(spreadsheetId: string, range: string, rows: (string | number)[][]) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED`;
  return workspaceFetch(url, {
    method: 'POST',
    body: JSON.stringify({ values: rows }),
  });
}

export async function getSpreadsheetValues(spreadsheetId: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  return workspaceFetch(url);
}

// ----------------------------------------------------
// 3. Gmail API
// ----------------------------------------------------
export async function getGmailProfile() {
  return workspaceFetch('https://gmail.googleapis.com/gmail/v1/users/me/profile');
}

export async function listGmailMessages(maxResults = 10, q = '') {
  const query = q ? `&q=${encodeURIComponent(q)}` : '';
  const list = await workspaceFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${query}`);
  if (!list.messages || list.messages.length === 0) return [];

  // Fetch snippets for recent messages
  const messageDetails = await Promise.all(
    list.messages.slice(0, 8).map(async (m: any) => {
      try {
        return await workspaceFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`);
      } catch {
        return null;
      }
    })
  );
  return messageDetails.filter(Boolean);
}

export async function sendGmailEmail(to: string, subject: string, bodyText: string) {
  // Construct RFC 2822 email string
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
  ];
  const emailRaw = emailLines.join('\r\n');
  const base64Encoded = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return workspaceFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw: base64Encoded }),
  });
}

// ----------------------------------------------------
// 4. Google Calendar API
// ----------------------------------------------------
export async function listCalendarEvents(maxResults = 10) {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    now
  )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;
  return workspaceFetch(url);
}

export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
}) {
  const body = {
    summary: event.summary,
    description: event.description || '',
    location: event.location || 'Arambh Construction Project Site',
    start: { dateTime: event.startDateTime },
    end: { dateTime: event.endDateTime },
  };
  return workspaceFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ----------------------------------------------------
// 5. Google Docs API
// ----------------------------------------------------
export async function createGoogleDoc(title: string) {
  return workspaceFetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

// ----------------------------------------------------
// 6. Google Slides API
// ----------------------------------------------------
export async function createGooglePresentation(title: string) {
  return workspaceFetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

// ----------------------------------------------------
// 7. Google Tasks API
// ----------------------------------------------------
export async function listTaskLists() {
  return workspaceFetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
}

export async function listTasks(taskListId = '@default') {
  return workspaceFetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&maxResults=20`);
}

export async function createGoogleTask(title: string, notes?: string, due?: string, taskListId = '@default') {
  const body: any = { title, notes: notes || '' };
  if (due) body.due = due;
  return workspaceFetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ----------------------------------------------------
// 8. Google Chat API
// ----------------------------------------------------
export async function listChatSpaces() {
  return workspaceFetch('https://chat.googleapis.com/v1/spaces');
}

export async function sendChatMessage(spaceName: string, text: string) {
  return workspaceFetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

// ----------------------------------------------------
// 9. Google Forms API
// ----------------------------------------------------
export async function createGoogleForm(title: string, documentTitle?: string) {
  return workspaceFetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    body: JSON.stringify({
      info: {
        title,
        documentTitle: documentTitle || title,
      },
    }),
  });
}

// ----------------------------------------------------
// 10. Google Meet API
// ----------------------------------------------------
export async function createMeetSpace() {
  return workspaceFetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ----------------------------------------------------
// 11. Google Contacts / People API
// ----------------------------------------------------
export async function listGoogleContacts(pageSize = 30) {
  const fields = 'names,emailAddresses,phoneNumbers,organizations,photos';
  const url = `https://people.googleapis.com/v1/people/me/connections?pageSize=${pageSize}&personFields=${fields}&sortOrder=LAST_MODIFIED_DESCENDING`;
  return workspaceFetch(url);
}

export async function createGoogleContact(contact: {
  givenName: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
  organization?: string;
}) {
  const body: any = {
    names: [{ givenName: contact.givenName, familyName: contact.familyName || '' }],
  };
  if (contact.email) {
    body.emailAddresses = [{ value: contact.email, type: 'work' }];
  }
  if (contact.phoneNumber) {
    body.phoneNumbers = [{ value: contact.phoneNumber, type: 'work' }];
  }
  if (contact.organization) {
    body.organizations = [{ name: contact.organization, title: 'Contractor / Client' }];
  }
  return workspaceFetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ----------------------------------------------------
// 12. Google Classroom API
// ----------------------------------------------------
export async function listClassroomCourses() {
  return workspaceFetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=20');
}

// ----------------------------------------------------
// 13. Google Picker API Helper
// ----------------------------------------------------
export function openGooglePicker(onPicked: (file: { id: string; name: string; url: string; mimeType: string }) => void) {
  const token = getCachedToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  if (typeof window === 'undefined' || !window.gapi) {
    throw new Error('Google API Client (gapi) script not ready.');
  }

  window.gapi.load('picker', () => {
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(firebaseConfig.appId)
      .setOAuthToken(token)
      .addView(view)
      .addView(new window.google.picker.DocsUploadView())
      .setDeveloperKey(API_KEY)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          onPicked({
            id: doc.id,
            name: doc.name,
            url: doc.url,
            mimeType: doc.mimeType,
          });
        }
      })
      .build();
    picker.setVisible(true);
  });
}
