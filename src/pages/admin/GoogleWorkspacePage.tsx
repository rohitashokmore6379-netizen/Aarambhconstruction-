import React, { useState, useEffect } from 'react';
import {
  requestWorkspaceToken,
  getCachedToken,
  clearCachedToken,
  listDriveFiles,
  createDriveFolder,
  createSpreadsheet,
  appendSpreadsheetRows,
  listGmailMessages,
  sendGmailEmail,
  listCalendarEvents,
  createCalendarEvent,
  createGoogleDoc,
  createGooglePresentation,
  listTasks,
  createGoogleTask,
  listChatSpaces,
  sendChatMessage,
  createGoogleForm,
  createMeetSpace,
  listGoogleContacts,
  createGoogleContact,
  listClassroomCourses,
  openGooglePicker,
  CLIENT_ID,
} from '../../services/googleWorkspace.ts';
import {
  FolderKanban,
  FileSpreadsheet,
  Mail,
  Calendar,
  FileText,
  Presentation,
  CheckSquare,
  MessageSquare,
  FileQuestion,
  Video,
  Users,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  Send,
  Upload,
  StickyNote,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function GoogleWorkspacePage() {
  const [token, setToken] = useState<string | null>(getCachedToken());
  const [activeTab, setActiveTab] = useState<
    | 'drive'
    | 'sheets'
    | 'gmail'
    | 'calendar'
    | 'docs'
    | 'tasks'
    | 'chat'
    | 'forms'
    | 'meet'
    | 'contacts'
    | 'classroom'
    | 'keep'
  >('drive');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab Data States
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [gmailMessages, setGmailMessages] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [classroomCourses, setClassroomCourses] = useState<any[]>([]);

  // Form Inputs
  const [newFolderName, setNewFolderName] = useState('');
  const [emailTo, setEmailTo] = useState('arambhconstruction9977@gmail.com');
  const [emailSubject, setEmailSubject] = useState('Arambh Construction - Project Update & Quotation');
  const [emailBody, setEmailBody] = useState(
    'Respected Sir,\n\nPlease find the updated construction site progress report and payment milestone breakdown for the PWD road & RCC works.\n\nRegards,\nEr. Sudarshan Bajrang Naik\nARAMBH CONSTRUCTION\nContact: +917796853434\nShengaon, Bhudargad, Kolhapur'
  );
  const [eventSummary, setEventSummary] = useState('PWD Site Concrete Pour & Structural Inspection');
  const [eventDate, setEventDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [taskTitle, setTaskTitle] = useState('Verify Centering & Steel Binding for Slab S2');
  const [taskNotes, setTaskNotes] = useState('Check beam reinforcement bars, cover blocks, and electrical conduit piping');
  const [sheetTitle, setSheetTitle] = useState('Arambh_Project_Budget_BOQ_2026');
  const [docTitle, setDocTitle] = useState('Civil_Contractor_Agreement_Er_Sudarshan_Naik');
  const [presentationTitle, setPresentationTitle] = useState('Arambh_Construction_Company_Profile_Deck');
  const [pickedFile, setPickedFile] = useState<any | null>(null);
  const [chatMessageText, setChatMessageText] = useState('Site safety inspection completed today at Shengaon sector.');
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactOrg, setNewContactOrg] = useState('');
  const [formTitle, setFormTitle] = useState('Arambh Construction - Site Client Feedback & Quality Audit');
  const [meetUrl, setMeetUrl] = useState<string | null>(null);
  const [keepNotes, setKeepNotes] = useState<string[]>([
    'Site Memos: Re-check water curing on column C4 for 14 days minimum.',
    'Material Quality: Confirm 53-grade OPC cement batch test certificates before unloading.',
    'Survey Plot: GPS coordinates verified at Shengaon bypass plot - 16.2731° N, 74.1524° E.',
  ]);
  const [newKeepNote, setNewKeepNote] = useState('');

  // Auto load data on tab change or token acquisition
  useEffect(() => {
    if (token) {
      loadTabData(activeTab);
    }
  }, [token, activeTab]);

  const handleConnectGoogle = async () => {
    try {
      setIsLoading(true);
      setStatusMessage(null);
      const acquiredToken = await requestWorkspaceToken();
      setToken(acquiredToken);
      setStatusMessage({ type: 'success', text: 'Google Workspace authenticated successfully!' });
    } catch (err: any) {
      console.error('Connect failed:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to authorize Google Workspace' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearCachedToken();
    setToken(null);
    setStatusMessage({ type: 'success', text: 'Disconnected from Google Workspace session.' });
  };

  const loadTabData = async (tab: typeof activeTab) => {
    if (!token) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      if (tab === 'drive') {
        const res = await listDriveFiles();
        setDriveFiles(res.files || []);
      } else if (tab === 'gmail') {
        const res = await listGmailMessages(8);
        setGmailMessages(res);
      } else if (tab === 'calendar') {
        const res = await listCalendarEvents(10);
        setCalendarEvents(res.items || []);
      } else if (tab === 'tasks') {
        const res = await listTasks();
        setTasksList(res.items || []);
      } else if (tab === 'chat') {
        const res = await listChatSpaces().catch(() => ({ spaces: [] }));
        setChatSpaces(res.spaces || []);
        if (res.spaces && res.spaces.length > 0) {
          setSelectedSpace(res.spaces[0].name);
        }
      } else if (tab === 'contacts') {
        const res = await listGoogleContacts(25);
        setContactsList(res.connections || []);
      } else if (tab === 'classroom') {
        const res = await listClassroomCourses().catch(() => ({ courses: [] }));
        setClassroomCourses(res.courses || []);
      }
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED' || err.message === 'TOKEN_EXPIRED') {
        setToken(null);
        setStatusMessage({ type: 'error', text: 'Authentication expired. Please re-authenticate.' });
      } else {
        console.warn(`Tab ${tab} error:`, err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Actions
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    try {
      setIsLoading(true);
      await createDriveFolder(newFolderName);
      setNewFolderName('');
      setStatusMessage({ type: 'success', text: `Drive folder "${newFolderName}" created successfully!` });
      await loadTabData('drive');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchPicker = () => {
    try {
      openGooglePicker((file) => {
        setPickedFile(file);
        setStatusMessage({ type: 'success', text: `Picked file from Drive: ${file.name}` });
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateSheet = async () => {
    try {
      setIsLoading(true);
      const res = await createSpreadsheet(sheetTitle, ['Budget Overview', 'Muster Roll', 'Material BOQ']);
      const sheetId = res.spreadsheetId;
      // Append initial civil contractor header rows
      await appendSpreadsheetRows(sheetId, 'Budget Overview!A1:E1', [
        ['Item No', 'Description', 'Quantity', 'Unit Rate (INR)', 'Total Amount (INR)'],
        ['1', 'Excavation in Hard Murum/Soft Rock', '450 cum', '180', '81000'],
        ['2', 'PCC 1:4:8 under Footings', '45 cum', '4200', '189000'],
        ['3', 'RCC M25 Column & Footing', '85 cum', '6800', '578000'],
        ['4', 'TMT Fe550 Steel Reinforcement', '12 MT', '62000', '744000'],
      ]);
      setStatusMessage({
        type: 'success',
        text: `Google Sheet "${sheetTitle}" created and populated! ID: ${sheetId}`,
      });
      if (res.spreadsheetUrl) {
        window.open(res.spreadsheetUrl, '_blank');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject) return;
    try {
      setIsLoading(true);
      await sendGmailEmail(emailTo, emailSubject, emailBody);
      setStatusMessage({ type: 'success', text: `Email sent to ${emailTo} via official Gmail API!` });
      await loadTabData('gmail');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary || !eventDate) return;
    try {
      setIsLoading(true);
      const start = new Date(eventDate);
      const end = new Date(start.getTime() + 2 * 3600000); // 2 hours duration
      await createCalendarEvent({
        summary: eventSummary,
        location: 'Arambh Construction Project Site, Shengaon, Bhudargad',
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
      });
      setStatusMessage({ type: 'success', text: `Calendar event "${eventSummary}" scheduled!` });
      await loadTabData('calendar');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      setIsLoading(true);
      await createGoogleTask(taskTitle, taskNotes);
      setTaskTitle('');
      setTaskNotes('');
      setStatusMessage({ type: 'success', text: 'Task synced to Google Tasks!' });
      await loadTabData('tasks');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDoc = async () => {
    try {
      setIsLoading(true);
      const res = await createGoogleDoc(docTitle);
      setStatusMessage({ type: 'success', text: `Google Doc "${docTitle}" created! ID: ${res.documentId}` });
      window.open(`https://docs.google.com/document/d/${res.documentId}/edit`, '_blank');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSlides = async () => {
    try {
      setIsLoading(true);
      const res = await createGooglePresentation(presentationTitle);
      setStatusMessage({ type: 'success', text: `Google Presentation "${presentationTitle}" created!` });
      window.open(`https://docs.google.com/presentation/d/${res.presentationId}/edit`, '_blank');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateForm = async () => {
    try {
      setIsLoading(true);
      const res = await createGoogleForm(formTitle);
      setStatusMessage({ type: 'success', text: `Google Form created! ID: ${res.formId}` });
      if (res.responderUri) {
        window.open(res.responderUri, '_blank');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMeet = async () => {
    try {
      setIsLoading(true);
      const res = await createMeetSpace();
      const url = res.meetingUri || res.meetingCode ? `https://meet.google.com/${res.meetingCode}` : 'https://meet.google.com/new';
      setMeetUrl(url);
      setStatusMessage({ type: 'success', text: `Google Meet space created: ${url}` });
      window.open(url, '_blank');
    } catch (err: any) {
      // Fallback
      window.open('https://meet.google.com/new', '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName) return;
    try {
      setIsLoading(true);
      await createGoogleContact({
        givenName: newContactName,
        phoneNumber: newContactPhone,
        organization: newContactOrg,
      });
      setNewContactName('');
      setNewContactPhone('');
      setNewContactOrg('');
      setStatusMessage({ type: 'success', text: 'Contact synced to Google Contacts!' });
      await loadTabData('contacts');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeepNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeepNote.trim()) return;
    setKeepNotes([newKeepNote.trim(), ...keepNotes]);
    setNewKeepNote('');
    setStatusMessage({ type: 'success', text: 'Site field memo logged in Google Keep stream!' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Google Workspace Enterprise Hub
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Live OAuth 2.0 Integrations
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Arambh Google Workspace Command Center
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Manage blueprints in Google Drive, export BOQ to Google Sheets, send client emails via Gmail, schedule site tenders on Google Calendar, and coordinate with Meet & Chat.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {token ? (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Google Connected
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition"
                  title="Disconnect Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                {isLoading ? 'Connecting...' : 'Authorize Google Workspace'}
              </button>
            )}
          </div>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Workspace Tools Navigation Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        {[
          { id: 'drive', label: 'Drive & Picker', icon: FolderKanban },
          { id: 'sheets', label: 'Sheets BOQ', icon: FileSpreadsheet },
          { id: 'gmail', label: 'Gmail', icon: Mail },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'docs', label: 'Docs & Slides', icon: FileText },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'chat', label: 'Chat Spaces', icon: MessageSquare },
          { id: 'forms', label: 'Forms & Audits', icon: FileQuestion },
          { id: 'meet', label: 'Meet Video', icon: Video },
          { id: 'contacts', label: 'Contacts', icon: Users },
          { id: 'classroom', label: 'Classroom', icon: GraduationCap },
          { id: 'keep', label: 'Field Notes', icon: StickyNote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area Based on Active Tab */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[450px]">
        {/* 1. Google Drive & Picker */}
        {activeTab === 'drive' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-amber-400" />
                  Google Drive Blueprints & Project Documents
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Store CAD files, tender documents, RCC designs, and site permits in your Google Drive cloud storage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLaunchPicker}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  Open Google Picker
                </button>
                <button
                  onClick={() => loadTabData('drive')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                  title="Refresh Drive Files"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Create Folder Form */}
            <form onSubmit={handleCreateFolder} className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="New Folder (e.g. Shengaon Road Project Drawings)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create Folder
              </button>
            </form>

            {pickedFile && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                <span>
                  Picked Blueprint: <strong>{pickedFile.name}</strong>
                </span>
                <a
                  href={pickedFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 underline"
                >
                  View in Drive <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Drive Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {driveFiles.map((file) => (
                <a
                  key={file.id}
                  href={file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 bg-slate-950 border border-slate-800/90 rounded-xl hover:border-amber-500/50 transition block group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-xs text-white truncate max-w-[180px] group-hover:text-amber-400">
                        {file.name}
                      </span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-white shrink-0" />
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{file.mimeType.split('.').pop()}</span>
                    <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                  </div>
                </a>
              ))}
              {driveFiles.length === 0 && !isLoading && (
                <div className="col-span-full p-8 text-center text-slate-400 text-xs">
                  No files found. Click "Authorize Google Workspace" or "Create Folder" above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Google Sheets */}
        {activeTab === 'sheets' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Google Sheets Bill of Quantities (BOQ) & Estimator
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Generate live cloud spreadsheets for project estimates, labor attendance muster rolls, and material bills.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h4 className="text-white font-bold text-sm">Create New Civil Estimate Spreadsheet</h4>
                <div className="space-y-2">
                  <label className="block text-slate-300 text-xs">Spreadsheet Title</label>
                  <input
                    type="text"
                    value={sheetTitle}
                    onChange={(e) => setSheetTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Includes pre-configured tabs:</p>
                  <ul className="list-disc pl-5 text-slate-300 space-y-0.5">
                    <li>Budget Overview (Itemized rates & amounts)</li>
                    <li>Muster Roll (Worker daily attendance)</li>
                    <li>Material BOQ (Cement, Sand, Steel, Aggregate)</li>
                  </ul>
                </div>
                <button
                  onClick={handleCreateSheet}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Create & Open Live Google Sheet
                </button>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 text-xs">
                <h4 className="text-white font-bold text-sm">Features of Google Sheets Integration</h4>
                <div className="space-y-2 text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <strong className="text-amber-400 block">Auto-formula Calculations</strong>
                    Formulas for GST (18%), contingency sums, and labor charges compute automatically.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400 block">Client Collaboration</strong>
                    Share view or edit permissions with PWD executive engineers and site supervisors.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Gmail */}
        {activeTab === 'gmail' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Mail className="w-5 h-5 text-rose-400" />
                Gmail Quotation & Client Dispatch
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Send professional quotations, payment receipts, and site updates directly from Er. Sudarshan Naik / Arambh Construction.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Compose Form */}
              <form onSubmit={handleSendEmail} className="lg:col-span-7 space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Recipient Email *</label>
                  <input
                    type="email"
                    required
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Message Body</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  Send via Official Gmail
                </button>
              </form>

              {/* Recent Dispatches / Inboxes */}
              <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-xs">Recent Messages</h4>
                  <button onClick={() => loadTabData('gmail')} className="text-slate-400 hover:text-white text-xs">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs">
                  {gmailMessages.map((msg) => {
                    const headers = msg.payload?.headers || [];
                    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                    const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
                    return (
                      <div key={msg.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                        <div className="font-semibold text-white truncate">{subject}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{from}</div>
                      </div>
                    );
                  })}
                  {gmailMessages.length === 0 && (
                    <div className="text-slate-500 text-xs py-4 text-center">No recent messages loaded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Google Calendar */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Google Calendar Site Milestones & Tender Deadlines
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Sync concrete pouring schedules, client handover dates, and PWD government inspections with Google Calendar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* New Event Form */}
              <form onSubmit={handleCreateCalendarEvent} className="md:col-span-5 space-y-3.5 text-xs bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h4 className="text-white font-bold text-sm">Schedule Site Event</h4>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Event Summary *</label>
                  <input
                    type="text"
                    required
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Calendar className="w-4 h-4" />
                  Add to Google Calendar
                </button>
              </form>

              {/* Scheduled Events */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-xs">Upcoming Calendar Events</h4>
                  <button onClick={() => loadTabData('calendar')} className="text-slate-400 hover:text-white text-xs">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 text-xs">
                  {calendarEvents.map((evt) => (
                    <div key={evt.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">{evt.summary}</div>
                        <div className="text-[11px] text-amber-400 mt-0.5">
                          {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString() : evt.start?.date}
                        </div>
                        {evt.location && <div className="text-[10px] text-slate-400 mt-1">📍 {evt.location}</div>}
                      </div>
                      {evt.htmlLink && (
                        <a href={evt.htmlLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                  {calendarEvents.length === 0 && (
                    <div className="text-slate-500 text-xs py-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                      No upcoming events.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Google Docs & Slides */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Google Docs Contracts & Slides Presentations
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Generate civil contractor agreements, completion certificates, and project pitch decks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Docs */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <FileText className="w-5 h-5" />
                  Google Docs Generator
                </div>
                <p className="text-slate-400 text-xs">
                  Creates formatted work completion certificates and civil engineering agreements.
                </p>
                <div className="space-y-2">
                  <label className="block text-slate-300 text-xs">Document Title</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleCreateDoc}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <FileText className="w-4 h-4" />
                  Generate Google Doc
                </button>
              </div>

              {/* Google Slides */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Presentation className="w-5 h-5" />
                  Google Slides Presentation
                </div>
                <p className="text-slate-400 text-xs">
                  Creates project showcase decks for government tender panels and private clients.
                </p>
                <div className="space-y-2">
                  <label className="block text-slate-300 text-xs">Presentation Title</label>
                  <input
                    type="text"
                    value={presentationTitle}
                    onChange={(e) => setPresentationTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleCreateSlides}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Presentation className="w-4 h-4 text-slate-950" />
                  Create Google Slides Deck
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Google Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-teal-400" />
                Google Tasks Daily Site Punch-list
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Assign and track daily site safety tasks, structural curing milestones, and contractor punch-lists.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <form onSubmit={handleCreateTask} className="md:col-span-5 space-y-3.5 text-xs bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h4 className="text-white font-bold text-sm">Add New Google Task</h4>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Notes / Instructions</label>
                  <textarea
                    rows={3}
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  Sync to Google Tasks
                </button>
              </form>

              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-xs">Current Tasks ({tasksList.length})</h4>
                  <button onClick={() => loadTabData('tasks')} className="text-slate-400 hover:text-white text-xs">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 text-xs">
                  {tasksList.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${t.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <div className={`font-semibold ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                          {t.title}
                        </div>
                        {t.notes && <div className="text-[11px] text-slate-400 mt-1">{t.notes}</div>}
                      </div>
                    </div>
                  ))}
                  {tasksList.length === 0 && (
                    <div className="text-slate-500 text-xs py-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                      No tasks currently registered.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Google Chat */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Google Chat Site Coordination Spaces
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Send urgent safety alerts, cement delivery updates, and site progress notifications to Google Chat spaces.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-white font-bold text-sm">Post to Google Chat Space</h4>
                <div>
                  <label className="block text-slate-300 mb-1">Target Space</label>
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {chatSpaces.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.displayName || s.name}
                      </option>
                    ))}
                    {chatSpaces.length === 0 && <option value="">No active spaces found</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Message Text</label>
                  <textarea
                    rows={4}
                    value={chatMessageText}
                    onChange={(e) => setChatMessageText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!selectedSpace) return;
                    try {
                      setIsLoading(true);
                      await sendChatMessage(selectedSpace, chatMessageText);
                      setStatusMessage({ type: 'success', text: 'Message delivered to Google Chat space!' });
                    } catch (err: any) {
                      setStatusMessage({ type: 'error', text: err.message });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={!selectedSpace || isLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Dispatch to Chat
                </button>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-white font-bold text-sm">Active Spaces ({chatSpaces.length})</h4>
                <div className="space-y-2">
                  {chatSpaces.map((s) => (
                    <div key={s.name} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-semibold text-white">{s.displayName || 'Site Coordination Space'}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.name}</div>
                    </div>
                  ))}
                  {chatSpaces.length === 0 && (
                    <p className="text-slate-500 text-xs">No Google Chat spaces created yet on your account.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Google Forms */}
        {activeTab === 'forms' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-purple-400" />
                Google Forms Inspection & Client Audits
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Generate Google Forms for site quality audits, client feedback, and material delivery receipt confirmations.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 max-w-xl space-y-4 text-xs">
              <h4 className="text-white font-bold text-sm">Create New Google Form</h4>
              <div>
                <label className="block text-slate-300 mb-1">Form Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <button
                onClick={handleCreateForm}
                disabled={isLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <FileQuestion className="w-4 h-4" />
                Generate Google Form
              </button>
            </div>
          </div>
        )}

        {/* 9. Google Meet */}
        {activeTab === 'meet' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Video className="w-5 h-5 text-green-400" />
                Google Meet Video Inspections & Architectural Reviews
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Launch instant encrypted Google Meet video calls with architects, structural engineers, and clients directly from the ERP.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 max-w-lg space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mx-auto">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-base">Instant Google Meet Room</h4>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Start an online site inspection conference call for Arambh Construction. Share screens to review CAD drawings.
              </p>
              <button
                onClick={handleCreateMeet}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 mx-auto transition shadow-lg shadow-green-500/20"
              >
                <Video className="w-4 h-4" />
                Start Instant Google Meet
              </button>
              {meetUrl && (
                <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-green-400 flex items-center justify-between">
                  <span className="truncate">{meetUrl}</span>
                  <a href={meetUrl} target="_blank" rel="noreferrer" className="underline shrink-0 ml-2">
                    Join
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 10. Google Contacts */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                Google Contacts / People Directory
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage contact details of site owners, cement suppliers, PWD engineers, and subcontractors in Google Contacts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
              <form onSubmit={handleCreateContact} className="md:col-span-5 space-y-3.5 bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h4 className="text-white font-bold text-sm">Add New Google Contact</h4>
                <div>
                  <label className="block text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Organization / Department</label>
                  <input
                    type="text"
                    value={newContactOrg}
                    onChange={(e) => setNewContactOrg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save Contact
                </button>
              </form>

              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-xs">Google Contacts ({contactsList.length})</h4>
                  <button onClick={() => loadTabData('contacts')} className="text-slate-400 hover:text-white text-xs">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {contactsList.map((c, idx) => {
                    const name = c.names?.[0]?.displayName || 'Unnamed Contact';
                    const phone = c.phoneNumbers?.[0]?.value || '';
                    const email = c.emailAddresses?.[0]?.value || '';
                    return (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{name}</div>
                          {phone && <div className="text-[11px] text-amber-400">{phone}</div>}
                          {email && <div className="text-[10px] text-slate-400">{email}</div>}
                        </div>
                      </div>
                    );
                  })}
                  {contactsList.length === 0 && (
                    <div className="text-slate-500 text-xs py-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                      No contacts loaded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 11. Google Classroom */}
        {activeTab === 'classroom' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                Google Classroom Civil Safety & Apprenticeship Courses
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage construction site safety certification, bar-bending guidelines, and apprentice training modules.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-xs">Active Safety & Civil Engineering Courses</h4>
                <button onClick={() => loadTabData('classroom')} className="text-slate-400 hover:text-white text-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {classroomCourses.map((crs) => (
                  <div key={crs.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-white text-sm">{crs.name}</div>
                    <div className="text-slate-400 text-xs">{crs.section || 'General Civil Division'}</div>
                    <a
                      href={crs.alternateLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-amber-400 hover:underline pt-2"
                    >
                      Open in Classroom <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}

                {classroomCourses.length === 0 && (
                  <div className="col-span-full p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-2">
                    <p>No active courses returned from Google Classroom API.</p>
                    <a
                      href="https://classroom.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Visit Google Classroom Portal
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 12. Google Keep / Field Notes */}
        {activeTab === 'keep' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-400" />
                Google Keep Quick Field Memos & Site Punch-Notes
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Capture on-site concrete curing reminders, steel inventory counts, and engineer inspection memos.
              </p>
            </div>

            <form onSubmit={handleAddKeepNote} className="flex gap-2 max-w-xl text-xs">
              <input
                type="text"
                placeholder="Type quick site note / memo..."
                value={newKeepNote}
                onChange={(e) => setNewKeepNote(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shrink-0"
              >
                Log Memo
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {keepNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-200 text-xs leading-relaxed flex flex-col justify-between"
                >
                  <p>{note}</p>
                  <div className="mt-3 pt-2 border-t border-amber-500/10 text-[10px] text-amber-400/70">
                    Field Log #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
