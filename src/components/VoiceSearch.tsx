import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Types ────────────────────────────────────────────────────────────────────
type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface CommandResult {
  matched: boolean;
  label?: string;
  action?: () => void;
}

// Declare the SpeechRecognition constructor shape at module level so TypeScript
// can resolve it even in environments where the global is not in the lib.
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

// ── Voice command matcher ────────────────────────────────────────────────────
//
//  Core commands:
//  1. "show patients"   / "open patients"    → /patients
//  2. "show documents"  / "open documents"   → /documents
//  3. "search <query>"                        → /evidence?q=<query>
//
//  Bonus navigations:
//  "overview" / "go home"                   → /
//  "show reviews" / "open reviews"          → /reviews
//  "show activity" / "activity log"         → /activity
//  "settings"                               → /settings

function buildCommandMatcher(navigate: ReturnType<typeof useNavigate>) {
  return (raw: string): CommandResult => {
    const t = raw.toLowerCase().trim();

    // ── Command 1: Show Patients ─────────────────────────────────────────
    if (/(show|open|go to|view)\s+patient(s|( history| directory))?/.test(t) || t === 'patients') {
      return {
        matched: true,
        label: 'Navigating to Patient Directory',
        action: () => navigate('/patients'),
      };
    }

    // ── Command 2: Show Documents ────────────────────────────────────────
    if (/(show|open|go to|view)\s+doc(ument(s|( repo(sitory)?)?)?)?/.test(t) || t === 'documents') {
      return {
        matched: true,
        label: 'Navigating to Document Repository',
        action: () => navigate('/documents'),
      };
    }

    // ── Command 3: Search <query> ────────────────────────────────────────
    const searchMatch = t.match(/^(?:search|find|look for|query)\s+(.+)$/);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      return {
        matched: true,
        label: `Searching for "${query}"`,
        action: () => navigate(`/evidence?q=${encodeURIComponent(query)}`),
      };
    }

    // ── Bonus: Overview / Home ───────────────────────────────────────────
    if (/(overview|go home|dashboard|home)/.test(t)) {
      return { matched: true, label: 'Navigating to Overview', action: () => navigate('/') };
    }

    // ── Bonus: Reviews ───────────────────────────────────────────────────
    if (/(show|open)?\s*review(s| queue)?/.test(t)) {
      return { matched: true, label: 'Navigating to Review Queue', action: () => navigate('/reviews') };
    }

    // ── Bonus: Activity Log ──────────────────────────────────────────────
    if (/(show|open)?\s*activity( log)?/.test(t)) {
      return { matched: true, label: 'Navigating to Activity Log', action: () => navigate('/activity') };
    }

    // ── Bonus: Settings ──────────────────────────────────────────────────
    if (/settings/.test(t)) {
      return { matched: true, label: 'Navigating to Settings', action: () => navigate('/settings') };
    }

    return { matched: false };
  };
}

// ── Resolve the SpeechRecognition constructor once, at module load ───────────
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const SpeechRecognitionCtor = getSpeechRecognitionCtor();

// ── Component ────────────────────────────────────────────────────────────────
export function VoiceSearch() {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Use a plain object ref so we're not relying on the global SpeechRecognition type
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track state in a ref so event-handler closures always read the current value
  const stateRef = useRef<VoiceState>('idle');
  const setVoiceState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const showFeedback = useCallback((msg: string, duration = 3500) => {
    setFeedback(msg);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(''), duration);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceState('idle');
  }, [setVoiceState]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return;

    if (stateRef.current === 'listening') {
      stopListening();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setVoiceState('listening');
    setTranscript('');
    setFeedback('');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript;
      setTranscript(text);

      if (current.isFinal) {
        setVoiceState('processing');
        const matcher = buildCommandMatcher(navigate);
        const result = matcher(text);
        if (result.matched && result.action) {
          setVoiceState('success');
          showFeedback(`✓ ${result.label}`);
          setTimeout(() => {
            result.action!();
            setVoiceState('idle');
          }, 400);
        } else {
          setVoiceState('error');
          showFeedback(
            `Not recognised: "${text}". Try "show patients", "show documents", or "search AMH result".`,
            4500,
          );
          setTimeout(() => setVoiceState('idle'), 600);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        showFeedback('No speech detected. Try again.');
      } else if (event.error === 'not-allowed') {
        showFeedback('Microphone access denied. Check browser permissions.');
      } else {
        showFeedback(`Voice error: ${event.error}`);
      }
      setVoiceState('idle');
    };

    recognition.onend = () => {
      if (stateRef.current === 'listening') setVoiceState('idle');
      recognitionRef.current = null;
    };

    recognition.start();
  }, [stopListening, navigate, showFeedback, setVoiceState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Hide silently if browser doesn't support voice
  if (!SpeechRecognitionCtor) return null;

  // ── Derived styles ───────────────────────────────────────────────────────
  const isListening = state === 'listening';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  const btnClass = [
    'relative flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
    isListening
      ? 'border-teal-400 bg-teal-50 text-teal-700 shadow-sm'
      : isSuccess
      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
      : isError
      ? 'border-red-300 bg-red-50 text-red-700'
      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50/50',
  ].join(' ');

  return (
    <div className="relative flex items-center">
      {/* Hover tooltip showing available commands */}
      {showTooltip && !isListening && !feedback && (
        <div className="absolute right-0 top-8 z-50 w-60 rounded-md border border-slate-200 bg-white p-2.5 shadow-lg text-xs leading-relaxed pointer-events-none">
          <p className="font-semibold text-slate-800 mb-1.5">Voice Commands</p>
          <ul className="space-y-1 text-slate-500">
            <li>
              <span className="font-medium text-slate-700">"show patients"</span>
              {' '}— Patient Directory
            </li>
            <li>
              <span className="font-medium text-slate-700">"show documents"</span>
              {' '}— Document Repository
            </li>
            <li>
              <span className="font-medium text-slate-700">"search AMH result"</span>
              {' '}— Evidence Search
            </li>
          </ul>
          <p className="mt-1.5 text-slate-400">Also: "overview", "show reviews", "settings"</p>
        </div>
      )}

      {/* Live transcript bubble while listening */}
      {isListening && transcript && (
        <span className="absolute right-full mr-2 whitespace-nowrap rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-800 shadow-sm max-w-[220px] truncate">
          {transcript}
        </span>
      )}

      {/* Feedback toast (bottom-right of screen) */}
      {feedback && (
        <div
          className={[
            'fixed bottom-5 right-5 z-[9999] flex items-start gap-2 rounded-lg border px-4 py-3 text-xs shadow-lg max-w-sm',
            isError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-teal-200 bg-teal-50 text-teal-900',
          ].join(' ')}
        >
          <span className="flex-1 leading-relaxed">{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="ml-1 mt-px text-slate-400 hover:text-slate-700"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Microphone button */}
      <button
        type="button"
        onClick={startListening}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
        aria-pressed={isListening}
        className={btnClass}
      >
        {isListening ? (
          <>
            {/* Pulsing dot animation while listening */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
            </span>
            <span className="hidden sm:inline">Listening…</span>
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Voice</span>
          </>
        )}
      </button>
    </div>
  );
}
