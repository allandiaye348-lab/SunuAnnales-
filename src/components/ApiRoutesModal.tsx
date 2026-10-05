import React, { useState, useEffect } from 'react';
import { X, Terminal, CheckCircle2, Play, RefreshCw, Copy, ExternalLink, Code } from 'lucide-react';

interface ApiRoutesModalProps {
  onClose: () => void;
}

export const ApiRoutesModal: React.FC<ApiRoutesModalProps> = ({ onClose }) => {
  const [routesData, setRoutesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/routes')
      .then(res => res.json())
      .then(data => {
        setRoutesData(data);
        if (data.endpoints?.length > 0) {
          setSelectedRoute(data.endpoints[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const executeRouteTest = async (endpoint: any) => {
    setTesting(true);
    setTestResult(null);

    let url = endpoint.path;
    if (url.includes(':id')) {
      url = url.replace(':id', 'annale-police-sn');
    }
    if (url.includes(':reference')) {
      url = url.replace(':reference', 'SN-PAY-POLICE-98412');
    }

    const options: RequestInit = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sunu_token') || ''}`,
        'x-admin-key': sessionStorage.getItem('sunu_admin_key') || localStorage.getItem('sunu_admin_key') || '',
      },
    };

    if (endpoint.method === 'POST') {
      if (url.includes('/acheter')) {
        options.body = JSON.stringify({
          payment_method: 'wave',
          phone: '+221 77 845 12 34',
        });
      } else if (url.includes('/quiz/submit')) {
        options.body = JSON.stringify({
          answers: [
            { question_id: 1, candidate_answer: 'Les candidats doivent remettre...' }
          ]
        });
      } else if (url.includes('/initiate')) {
        options.body = JSON.stringify({
          annale_id: 'annale-police-sn',
          payment_method: 'wave',
          phone: '+221 77 845 12 34',
        });
      }
    }

    try {
      const startTime = performance.now();
      const res = await fetch(url, options);
      const json = await res.json();
      const duration = Math.round(performance.now() - startTime);

      setTestResult({
        status: res.status,
        statusText: res.statusText,
        duration: `${duration} ms`,
        url,
        data: json,
      });
    } catch (err: any) {
      setTestResult({
        status: 500,
        error: err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Explorateur des Routes Backend Express</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Node.js / Express Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Documentation et testeur interactif des routes backend SunuAnnales SN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-950">
          {/* Left list of routes */}
          <div className="w-full md:w-80 bg-slate-900/60 border-r border-slate-800 p-4 overflow-y-auto shrink-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Routes API Disponibles ({routesData?.endpoints?.length || 0})
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Chargement...</div>
            ) : (
              <div className="space-y-1.5">
                {routesData?.endpoints?.map((ep: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedRoute(ep);
                      setTestResult(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition border ${
                      selectedRoute?.path === ep.path && selectedRoute?.method === ep.method
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase ${
                        ep.method === 'POST'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-[11px] truncate text-slate-200">{ep.path}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{ep.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right inspection & Execution */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-5">
            {selectedRoute && (
              <>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs uppercase ${
                        selectedRoute.method === 'POST' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                      }`}>
                        {selectedRoute.method}
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {selectedRoute.path}
                      </span>
                    </div>

                    <button
                      onClick={() => executeRouteTest(selectedRoute)}
                      disabled={testing}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
                      Exécuter la Route
                    </button>
                  </div>

                  <p className="text-xs text-slate-300">
                    {selectedRoute.description}
                  </p>

                  {selectedRoute.body && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                      <span className="text-amber-400 block font-semibold mb-1">Body attendu :</span>
                      {JSON.stringify(selectedRoute.body, null, 2)}
                    </div>
                  )}
                </div>

                {/* Test Result Display */}
                {testResult && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          testResult.status < 300 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          HTTP {testResult.status} {testResult.statusText}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">{testResult.duration}</span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(JSON.stringify(testResult.data, null, 2))}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copié !' : 'Copier JSON'}
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72 leading-relaxed">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}

            {/* Quick curl snippets */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                Exemple cURL pour tester depuis un terminal :
              </span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`curl -X POST http://localhost:3000/api/annales/annale-police-sn/acheter \\
  -H "Content-Type: application/json" \\
  -d '{"payment_method": "wave", "phone": "+221 77 845 12 34"}'`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
