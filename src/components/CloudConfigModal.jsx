import React, { useState } from 'react';
import { X, Cloud, Check, ExternalLink, RefreshCw, KeyRound } from 'lucide-react';
import { getFirebaseConfig, saveFirebaseConfig, isCloudEnabled } from '../services/firebase';

export function CloudConfigModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getFirebaseConfig();
  const [jsonText, setJsonText] = useState(
    currentConfig ? JSON.stringify(currentConfig, null, 2) : ''
  );
  const [statusMsg, setStatusMsg] = useState('');
  const cloudActive = isCloudEnabled();

  if (!isOpen) return null;

  function handleSave() {
    try {
      const parsed = JSON.parse(jsonText.trim());
      if (!parsed.apiKey || !parsed.projectId) {
        setStatusMsg('Error: Config must contain at least apiKey and projectId.');
        return;
      }
      saveFirebaseConfig(parsed);
      setStatusMsg('Success! Reloading to connect to Firebase...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      setStatusMsg('Error: Invalid JSON format. Make sure you paste valid JSON.');
    }
  }

  function handleDisconnect() {
    saveFirebaseConfig(null);
    setStatusMsg('Disconnected. Switched back to Local Mode.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${cloudActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Cloud size={20} />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold">Cloud Database Connection</h3>
              <p className="text-xs text-slate-400">
                {cloudActive ? '🟢 Connected to Firebase Firestore' : '🟡 Running in Local Mode (Offline)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 mb-4 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-slate-200">How to connect free Firebase Firestore:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-[#d7f24c] hover:underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink size={11} /></a> and create a free project.</li>
            <li>Click <strong>Firestore Database</strong> &rarr; <strong>Create Database</strong> (start in test mode).</li>
            <li>In Project Settings, add a Web App and paste your <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-200">firebaseConfig</code> object below:</li>
          </ol>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
            Firebase Config (JSON format)
          </label>
          <textarea
            rows={7}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-project.firebaseapp.com",\n  "projectId": "my-project",\n  "storageBucket": "my-project.appspot.com",\n  "messagingSenderId": "123...",\n  "appId": "1:123..."\n}`}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d7f24c]"
          />
        </div>

        {statusMsg && (
          <p className={`text-xs font-semibold mb-4 ${statusMsg.startsWith('Error') ? 'text-red-400' : 'text-[#d7f24c]'}`}>
            {statusMsg}
          </p>
        )}

        <div className="flex gap-2">
          {cloudActive && (
            <button
              onClick={handleDisconnect}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-red-400 text-xs font-bold transition active:scale-95"
            >
              Disconnect Cloud
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#d7f24c] hover:bg-[#c6e140] text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-[#d7f24c]/10"
          >
            <Check size={15} /> Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
