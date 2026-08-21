'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

// Type definitions
interface CVData {
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  summary?: string;
  experience?: Array<{
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description: string;
    achievements?: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    location?: string;
    year?: string;
    details?: string;
  }>;
  skills?: string[];
  projects?: Array<{
    title: string;
    role?: string;
    description: string;
    year?: string;
  }>;
}

interface Analysis {
  overallScore: number;
  confidenceBoosters: string[];
  sections: {
    summary?: { score: number; improvements: string[] };
    experience?: { score: number; improvements: string[] };
    skills?: { score: number; improvements: string[]; missingSkills?: string[] };
    education?: { score: number; improvements: string[] };
    projects?: { score: number; improvements: string[] };
  };
  priorityImprovements: Array<{
    priority: number;
    section: string;
    change: string;
    impact: string;
  }>;
  quantificationPrompts?: Array<{
    section: string;
    item: string;
    questions: string[];
    exampleAnswers?: string[];
  }>;
  formattingTips?: string[];
  languageUpgrades: Array<{
    current: string;
    principle: string;
    example: string;
    reason: string;
  }>;
}

interface CvListItem {
  id: string;
  name: string;
  summary: string;
  updatedAt: string;
  hasAnalysis: boolean;
  score: number | null;
}

// Helper to generate readable CV text from structured data - the single
// source used everywhere the CV's text is displayed or edited, instead of
// having a separate raw-text view and a differently-formatted editable view.
const generateCVText = (cv: CVData): string => {
  let text = '';

  if (cv.contact) {
    if (cv.contact.name) text += `${cv.contact.name}\n`;
    if (cv.contact.email) text += `${cv.contact.email}\n`;
    if (cv.contact.phone) text += `${cv.contact.phone}\n`;
    if (cv.contact.location) text += `${cv.contact.location}\n`;
    text += '\n';
  }

  if (cv.summary) {
    text += `PROFESSIONAL SUMMARY\n${cv.summary}\n\n`;
  }

  if (cv.experience && cv.experience.length > 0) {
    text += 'EXPERIENCE\n';
    cv.experience.forEach(exp => {
      text += `\n${exp.title} - ${exp.company}\n`;
      if (exp.location) text += `${exp.location}\n`;
      if (exp.startDate || exp.endDate) {
        text += `${exp.startDate || ''} - ${exp.endDate || ''}\n`;
      }
      text += `${exp.description}\n`;
    });
    text += '\n';
  }

  if (cv.education && cv.education.length > 0) {
    text += 'EDUCATION\n';
    cv.education.forEach(edu => {
      text += `\n${edu.degree} - ${edu.institution}\n`;
      if (edu.location) text += `${edu.location}\n`;
      if (edu.year) text += `${edu.year}\n`;
      if (edu.details) text += `${edu.details}\n`;
    });
    text += '\n';
  }

  if (cv.skills && cv.skills.length > 0) {
    text += `SKILLS\n${cv.skills.join(', ')}\n\n`;
  }

  if (cv.projects && cv.projects.length > 0) {
    text += 'PROJECTS\n';
    cv.projects.forEach(proj => {
      text += `\n${proj.title}`;
      if (proj.role) text += ` - ${proj.role}`;
      text += '\n';
      if (proj.year) text += `${proj.year}\n`;
      text += `${proj.description}\n`;
    });
  }

  return text;
};

// List is ordered by creation (for stable card numbers), so the default
// selection needs to be found separately rather than assumed to be list[0].
const mostRecentlyUpdated = (list: CvListItem[]): CvListItem =>
  list.reduce((a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b));

const formatRelativeTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

function CVEditorContent() {
  const router = useRouter();

  // CV switcher state
  const [cvs, setCvs] = useState<CvListItem[]>([]);
  const [maxCvs, setMaxCvs] = useState<number | null>(null);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [loadingCvs, setLoadingCvs] = useState(true);
  const [newCvName, setNewCvName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Selected CV's content
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingJob, setUploadingJob] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isDraggingCV, setIsDraggingCV] = useState(false);
  const [isDraggingJob, setIsDraggingJob] = useState(false);
  const [editableCVText, setEditableCVText] = useState<string>('');
  const [completedImprovements, setCompletedImprovements] = useState<Set<string>>(new Set());
  const jobTitleSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobDescriptionSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleCompletion = (id: string) => {
    setCompletedImprovements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const resetSelectedCvContent = () => {
    setCvData(null);
    setAnalysis(null);
    setJobTitle('');
    setJobDescription('');
    setEditableCVText('');
    setUploadError(null);
    setCompletedImprovements(new Set());
  };

  const loadCvList = async (): Promise<CvListItem[]> => {
    const response = await fetch('/api/cv');
    if (!response.ok) return [];
    const data = await response.json();
    setCvs(data.cvs || []);
    setMaxCvs(data.maxCvs ?? null);
    return data.cvs || [];
  };

  const loadCvDetail = async (id: string) => {
    resetSelectedCvContent();
    try {
      const response = await fetch(`/api/cv/${id}`);
      if (!response.ok) return;
      const data = await response.json();
      setCvData(data.cv);
      setEditableCVText(generateCVText(data.cv));
      setJobTitle(data.jobTitle || '');
      setJobDescription(data.jobDescription || '');
      if (data.analysis && data.analysis.priorityImprovements) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Failed to load CV:', error);
    }
  };

  const selectCv = (id: string) => {
    setSelectedCvId(id);
    setNewCvName('');
    loadCvDetail(id);
  };

  const startNewCv = () => {
    setSelectedCvId(null);
    resetSelectedCvContent();
    setNewCvName(cvs.length === 0 ? 'My CV' : '');
  };

  // Load CV list on mount, auto-selecting the most recently updated one.
  useEffect(() => {
    (async () => {
      const list = await loadCvList();
      if (list.length > 0) {
        selectCv(mostRecentlyUpdated(list).id);
      } else {
        startNewCv();
      }
      setLoadingCvs(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAddCv = maxCvs === null || cvs.length < maxCvs;

  const handleRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    try {
      const response = await fetch(`/api/cv/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (response.ok) {
        setCvs(prev => prev.map(cv => (cv.id === id ? { ...cv, name: trimmed } : cv)));
      }
    } catch (error) {
      console.error('Rename error:', error);
    } finally {
      setRenamingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this CV? This cannot be undone.')) return;
    try {
      const response = await fetch(`/api/cv/${id}`, { method: 'DELETE' });
      if (!response.ok) return;
      const list = await loadCvList();
      if (list.length > 0) {
        selectCv(mostRecentlyUpdated(list).id);
      } else {
        startNewCv();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Job title and description: each saved with a short debounce as the user
  // types, decoupled from analysis - editing them is free, only clicking
  // Analyze costs a Claude call. Not saved until the CV itself has been
  // created (a brand-new, not-yet-uploaded CV just keeps this in state).
  const handleJobTitleChange = (value: string) => {
    setJobTitle(value);
    if (!selectedCvId) return;
    if (jobTitleSaveTimeout.current) clearTimeout(jobTitleSaveTimeout.current);
    jobTitleSaveTimeout.current = setTimeout(() => {
      fetch(`/api/cv/${selectedCvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: value })
      }).catch(err => console.error('Failed to save job title:', err));
    }, 800);
  };

  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    if (!selectedCvId) return;
    if (jobDescriptionSaveTimeout.current) clearTimeout(jobDescriptionSaveTimeout.current);
    jobDescriptionSaveTimeout.current = setTimeout(() => {
      fetch(`/api/cv/${selectedCvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: value })
      }).catch(err => console.error('Failed to save job description:', err));
    }, 800);
  };

  // CV file upload handlers
  const MAX_CV_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ACCEPTED_CV_EXTENSIONS = ['.pdf', '.docx', '.txt'];

  const validateCVFile = (file: File): string | null => {
    const nameLower = file.name.toLowerCase();
    const hasAcceptedExtension = ACCEPTED_CV_EXTENSIONS.some((ext) => nameLower.endsWith(ext));

    if (!hasAcceptedExtension) {
      return 'Please upload a PDF, DOCX, or TXT file.';
    }
    if (file.size === 0) {
      return 'That file appears to be empty. Please choose a different file.';
    }
    if (file.size > MAX_CV_FILE_SIZE) {
      return 'That file is too large (max 10MB). Please choose a smaller file.';
    }
    return null;
  };

  const processFile = async (file: File) => {
    setUploadError(null);

    // Job title (if set, e.g. from "I want to be a Camera Trainee") is the
    // default name for a new CV - a manually typed name still wins if given.
    const effectiveName = newCvName.trim() || jobTitle.trim();

    if (!selectedCvId && !effectiveName) {
      setUploadError('Give this CV a name first (e.g. "Production Assistant"), or fill in "I want to be" above.');
      return;
    }

    const validationError = validateCVFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (selectedCvId) {
      formData.append('cvId', selectedCvId);
    } else {
      formData.append('name', effectiveName);
    }

    try {
      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.unchanged) {
        setUploadError('No changes detected in your CV — nothing to re-analyze.');
      } else if (result.success) {
        // If this CV already had analysis before this upload, the point of
        // re-uploading was to get it re-assessed - do that automatically
        // instead of requiring a separate click. A brand-new CV's first
        // upload doesn't auto-analyze (no prior analysis, may want to set
        // a target role first).
        const hadPriorAnalysis = !!analysis;
        setCvData(result.data);
        setAnalysis(null);
        setEditableCVText(result.rawText || '');
        await loadCvList();
        setSelectedCvId(result.cvId);
        setNewCvName('');
        if (hadPriorAnalysis) {
          await handleAnalyze(result.data);
        }
      } else {
        setUploadError(result.error || 'We couldn\'t process that file. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Something went wrong while uploading. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleCVDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCV(true);
  };

  const handleCVDragLeave = () => {
    setIsDraggingCV(false);
  };

  const handleCVDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCV(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  // Target role file upload handlers
  const handleJobFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingJob(true);
    try {
      const text = await file.text();
      handleJobDescriptionChange(text);
    } catch (error) {
      console.error('Job file read error:', error);
      alert('Failed to read job description file');
    } finally {
      setUploadingJob(false);
    }
  };

  const handleJobDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingJob(true);
  };

  const handleJobDragLeave = () => {
    setIsDraggingJob(false);
  };

  const handleJobDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingJob(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const text = await file.text();
      handleJobDescriptionChange(text);
    }
  };

  // Analysis handler
  // Accepts an explicit CV data override for the case right after a
  // re-upload, where `cvData` in closure/state is still the pre-upload
  // value (setCvData hasn't re-rendered yet) - reading from state there
  // would silently re-analyze the old content.
  const handleAnalyze = async (cvDataOverride?: CVData) => {
    const dataToAnalyze = cvDataOverride || cvData;
    if (!dataToAnalyze || !selectedCvId) return;

    setAnalyzing(true);
    try {
      const response = await fetch('/api/cv/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: dataToAnalyze,
          cvId: selectedCvId,
          jobTitle: jobTitle || undefined,
          jobDescription: jobDescription || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAnalysis(result.analysis);
        setEditableCVText(generateCVText(dataToAnalyze));
        setCvs(prev => prev.map(cv => (
          cv.id === selectedCvId ? { ...cv, hasAnalysis: true, score: result.analysis.overallScore } : cv
        )));
      } else {
        alert(`Analysis failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze CV');
    } finally {
      setAnalyzing(false);
    }
  };

  const activeCv = cvs.find(cv => cv.id === selectedCvId);
  const activeName = activeCv?.name || (selectedCvId ? '' : newCvName || jobTitle || 'New CV');

  // Re-analyzing is gated on having addressed every suggestion first,
  // rather than being freely repeatable - it's the last step, not a leading
  // action.
  const totalImprovements = analysis
    ? (analysis.priorityImprovements?.slice(0, 3).length || 0) +
      (analysis.sections?.summary?.improvements?.length || 0) +
      (analysis.sections?.experience?.improvements?.length || 0) +
      (analysis.sections?.skills?.improvements?.length || 0)
    : 0;
  const allImprovementsCompleted = totalImprovements > 0 && completedImprovements.size >= totalImprovements;

  if (loadingCvs) {
    return <div className="min-h-screen bg-bg-main" />;
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">CV Editor</h1>
          <p className="font-body text-text-secondary">
            Build a CV for each type of role you&apos;re going for — your experience is reusable, the framing isn&apos;t.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="font-body text-text-link hover:text-text-cta font-medium mt-4"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* My CVs */}
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold text-text-primary mb-3">My CVs</h2>
          <div className="flex items-stretch gap-3 flex-wrap">
            {cvs.map((cv, index) => {
              const isActive = cv.id === selectedCvId;
              return (
                <div
                  key={cv.id}
                  onClick={() => !renamingId && selectCv(cv.id)}
                  className={`font-body min-w-[200px] px-4 py-3 rounded-lg border-2 cursor-pointer transition ${
                    isActive
                      ? 'border-accent-tertiary bg-accent-secondary/15'
                      : 'border-border-hairline bg-bg-surface hover:border-accent-tertiary/50'
                  }`}
                >
                  {renamingId === cv.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => handleRename(cv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(cv.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="w-full px-2 py-1 rounded border border-accent-tertiary bg-bg-main text-text-primary text-sm"
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="font-body text-xs font-bold text-accent-tertiary mt-0.5">{index + 1}.</span>
                        <div>
                          <p className="font-semibold text-sm text-text-primary">{cv.name}</p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {cv.hasAnalysis && cv.score !== null ? `Analyzed · ${cv.score}/100` : 'Draft'}
                            {' · '}
                            {formatRelativeTime(cv.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(cv.id);
                            setRenameValue(cv.name);
                          }}
                          className="text-text-secondary hover:text-text-primary p-0.5"
                          aria-label={`Rename ${cv.name}`}
                          title="Rename"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(cv.id); }}
                            className="text-text-secondary hover:text-text-cta text-sm p-0.5"
                            aria-label={`Delete ${cv.name}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {canAddCv ? (
              <button
                onClick={startNewCv}
                className={`font-body min-w-[140px] px-4 py-3 rounded-lg border-2 border-dashed text-sm font-semibold transition ${
                  selectedCvId === null
                    ? 'border-accent-tertiary text-accent-tertiary'
                    : 'border-border-hairline text-text-secondary hover:text-text-primary'
                }`}
              >
                + New CV
              </button>
            ) : (
              <Link
                href="/pricing"
                className="font-body min-w-[140px] px-4 py-3 rounded-lg text-sm font-semibold text-text-link hover:text-text-cta flex items-center"
              >
                Upgrade for more CVs →
              </Link>
            )}
          </div>
        </div>

        {/* Target Role - always optional; Analyze works with or without it.
            Collapsed by default so it doesn't dominate the page when there's
            nothing to look at there. */}
        <div className="bg-bg-surface rounded-lg shadow-lg mb-6 border border-border-hairline overflow-hidden">
          <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <h3 className="font-display text-lg font-bold text-text-primary mb-3">Have a specific role in mind?</h3>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <label htmlFor="job-title" className="font-body text-sm font-semibold text-text-primary whitespace-nowrap">
                  I want to be
                </label>
                <input
                  id="job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => handleJobTitleChange(e.target.value)}
                  placeholder="Job role"
                  className="font-body flex-1 min-w-[160px] px-3 py-1.5 border border-border-hairline rounded-lg focus:ring-2 focus:ring-accent-tertiary focus:border-transparent text-sm bg-bg-main text-text-primary"
                />
              </div>
              <p className="font-body text-sm text-text-secondary">
                {jobTitle.trim()
                  ? `Tailoring feedback for ${activeName} to: "${jobTitle.trim()}"${jobDescription.trim() ? ' — using the job description below too' : ''}`
                  : jobDescription.trim()
                    ? `Tailoring feedback for ${activeName} using the job description below.`
                    : `We'll assess your CV against film industry skills and standards and give you tailored feedback if you have a specific role in mind.`}
              </p>
            </div>

            {/* Once analysis exists, re-analyzing moves to the end of the
                suggestions list, gated on having addressed them - not led
                with here. */}
            {!analysis && (
              <button
                onClick={() => handleAnalyze()}
                disabled={analyzing || !cvData}
                className="font-body shrink-0 px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : !cvData ? (
                  'Upload a CV first'
                ) : (
                  'Get Suggestions'
                )}
              </button>
            )}
          </div>

          <details className="group border-t border-border-hairline">
            <summary className="cursor-pointer list-none px-6 py-3 flex items-center gap-2 hover:bg-bg-main transition">
              <span className="font-body text-sm font-medium text-text-link">
                {jobDescription.trim() ? 'Edit job description' : 'Add a job description (optional)'}
              </span>
              <svg className="w-4 h-4 text-text-secondary group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-6">
              <textarea
                value={jobDescription}
                onChange={(e) => handleJobDescriptionChange(e.target.value)}
                placeholder="Paste job description here..."
                rows={4}
                className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg focus:ring-2 focus:ring-accent-tertiary focus:border-transparent resize-none text-sm bg-bg-main text-text-primary"
              />
              <div
                onDragOver={handleJobDragOver}
                onDragLeave={handleJobDragLeave}
                onDrop={handleJobDrop}
                className={`mt-2 border-2 border-dashed rounded-lg px-4 py-2 text-center transition-all ${
                  isDraggingJob
                    ? 'border-accent-tertiary bg-accent-secondary/20'
                    : 'border-border-hairline'
                }`}
              >
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={handleJobFileUpload}
                  disabled={uploadingJob}
                  className="hidden"
                  id="job-upload"
                />
                <label
                  htmlFor="job-upload"
                  className={`font-body cursor-pointer text-xs text-text-link hover:text-text-cta font-medium ${
                    uploadingJob ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingJob ? 'Processing...' : '📎 or upload a file'}
                </label>
              </div>
            </div>
          </details>
        </div>

        {/* Canvas: CV content always visible; analysis appears alongside it
            the moment it's available, fresh or cached - no tab to default. */}
        {!cvData ? (
          <div className="bg-bg-surface rounded-lg shadow-lg overflow-hidden border border-border-hairline">
            <div className="bg-accent-tertiary px-6 py-4">
              <h2 className="font-display text-2xl font-bold text-text-on-tertiary">
                {selectedCvId ? activeName : 'New CV'}
              </h2>
              <p className="font-body text-text-inverse/75 text-sm mt-1">Upload a CV to get started</p>
            </div>
            <div className="p-6">
              {!selectedCvId && (
                <input
                  type="text"
                  value={newCvName || jobTitle}
                  onChange={(e) => setNewCvName(e.target.value)}
                  placeholder='Name this CV (e.g. "Production Assistant")'
                  className="font-body w-full mb-4 px-4 py-3 border-2 border-border-hairline rounded-lg text-text-primary bg-bg-main focus:outline-none focus:border-accent-tertiary"
                />
              )}
              <div
                onDragOver={handleCVDragOver}
                onDragLeave={handleCVDragLeave}
                onDrop={handleCVDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDraggingCV
                    ? 'border-accent-tertiary bg-accent-secondary/20 scale-105'
                    : 'border-border-hairline bg-bg-main'
                }`}
              >
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="cv-upload"
                />

                <div className="mb-4">
                  <svg
                    className={`mx-auto h-12 w-12 ${isDraggingCV ? 'text-accent-tertiary' : 'text-text-secondary'}`}
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <label
                  htmlFor="cv-upload"
                  className={`font-body cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploading ? 'Processing...' : 'Choose File'}
                </label>

                <p className="font-body mt-4 text-sm text-text-secondary">or drag and drop</p>
                <p className="font-body mt-1 text-xs text-text-secondary">TXT, PDF, DOCX &middot; up to 10MB</p>
              </div>

              {uploadError && (
                <div className="mt-3 flex items-start gap-2 bg-cta-primary/10 border border-cta-primary/30 rounded-lg p-3">
                  <span className="text-text-cta text-sm mt-0.5" aria-hidden="true">⚠</span>
                  <p className="font-body text-sm text-text-cta">{uploadError}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 ${analysis ? 'lg:grid-cols-5' : ''}`}>
            {/* CV content - single reusable editable view, always present */}
            <div className={analysis ? 'lg:col-span-2' : ''}>
              <div className="bg-bg-surface rounded-lg shadow-lg overflow-hidden h-[600px] flex flex-col border border-border-hairline">
                {/* No CV name/title here - "My CVs" above is the one place
                    that identifies and switches which CV this is. */}
                <div className="px-4 py-3 border-b border-border-hairline flex items-center justify-end">
                  <label
                    htmlFor="cv-reupload"
                    className={`font-body cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-bg-surface border-2 border-accent-tertiary text-accent-tertiary rounded-lg font-bold hover:bg-accent-secondary/15 transition ${
                      uploading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {uploading ? 'Processing...' : '↻ Re-upload'}
                  </label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="cv-reupload"
                  />
                </div>
                <textarea
                  value={editableCVText}
                  onChange={(e) => setEditableCVText(e.target.value)}
                  className="flex-1 p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-accent-tertiary focus:ring-inset bg-bg-surface text-text-primary"
                  placeholder="Your CV content will appear here..."
                />
              </div>
              {uploadError && (
                <p className="font-body text-sm text-text-cta mt-2">{uploadError}</p>
              )}
            </div>

            {/* Analysis - appears the moment it exists, fresh or cached */}
            {analysis && (
              <div className="lg:col-span-3 bg-bg-surface rounded-lg shadow-lg border border-border-hairline">
                {/* Header */}
                <div className="border-b border-border-hairline px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="font-display text-3xl font-bold text-text-primary">Your CV Score</h2>
                      <p className="font-body text-text-secondary mt-3 max-w-2xl">
                        {analysis.overallScore >= 80 ? (
                          "You're in great shape! A few refinements will make your CV even stronger."
                        ) : analysis.overallScore >= 60 ? (
                          "Good foundation! Most of these improvements are quick formatting and wording tweaks. Focus on the top 3 below and you'll see major progress in 30-45 minutes."
                        ) : analysis.overallScore >= 40 ? (
                          "You have solid experience—we just need to showcase it better. The improvements below are straightforward: clearer wording, better formatting, and highlighting your achievements. Start with the top 3 and tackle one at a time."
                        ) : (
                          "Every professional CV starts somewhere. These improvements might look like a lot, but they're mostly about presentation, not content. Your experience is valuable—let's help it shine. Start with just the first item below."
                        )}
                      </p>
                    </div>
                    <div className="text-right ml-8">
                      <div className="font-display text-5xl font-bold text-accent-tertiary">{analysis.overallScore}</div>
                      <p className="font-body text-sm text-text-secondary mt-1">out of 100</p>
                    </div>
                  </div>
                </div>

                {/* What's already working - leads with strengths, not just
                    problems to fix, before anything else. */}
                {analysis.confidenceBoosters && analysis.confidenceBoosters.length > 0 && (
                  <div className="px-8 py-6 bg-success/10 border-b border-border-hairline">
                    <h3 className="font-display text-lg font-bold text-text-primary mb-3">What&apos;s Already Working</h3>
                    <ul className="space-y-2">
                      {analysis.confidenceBoosters.map((boost, idx) => (
                        <li key={idx} className="font-body text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-success shrink-0">✓</span>
                          <span>{boost}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Priority Improvements - Top 3 Only */}
                <div className="px-8 py-6 bg-accent-secondary/15 border-b border-border-hairline">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold text-text-primary">Start Here</h3>
                    <span className="font-body text-sm text-text-secondary">
                      {completedImprovements.size > 0 && `${completedImprovements.size} completed`}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {analysis.priorityImprovements?.slice(0, 3).map((improvement, idx) => {
                      const improvementId = `priority-${idx}`;
                      const isCompleted = completedImprovements.has(improvementId);
                      return (
                        <div key={idx} className={`bg-bg-surface rounded-lg p-4 shadow-sm transition ${isCompleted ? 'opacity-50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleCompletion(improvementId)}
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-tertiary text-text-on-tertiary flex items-center justify-center font-bold hover:opacity-90 transition cursor-pointer"
                              aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </button>
                            <div className="flex-1">
                              <h4 className={`font-display font-bold mb-1 ${isCompleted ? 'text-text-disabled line-through' : 'text-text-primary'}`}>
                                {improvement.change}
                              </h4>
                              <p className={`font-body text-sm ${isCompleted ? 'text-text-disabled' : 'text-text-secondary'}`}>
                                {improvement.impact}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Simpler Detailed Sections */}
                <div className="px-8 py-6 border-t border-border-hairline">
                  <h3 className="font-display text-lg font-bold text-text-primary mb-6">All Suggestions</h3>
                  <div className="space-y-6">
                    {analysis.sections?.summary && analysis.sections.summary.improvements && analysis.sections.summary.improvements.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center justify-between p-4 hover:bg-bg-main rounded-lg transition">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">📝</span>
                              <div>
                                <h4 className="font-display font-bold text-text-primary">Summary</h4>
                                <p className="font-body text-sm text-text-secondary">{analysis.sections.summary.improvements.length} suggestions</p>
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-text-secondary group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="px-4 pb-4 space-y-2">
                          {analysis.sections.summary.improvements.map((improvement, idx) => {
                            const improvementId = `summary-${idx}`;
                            const isCompleted = completedImprovements.has(improvementId);
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={() => toggleCompletion(improvementId)}
                                  className="mt-1 w-4 h-4 text-accent-tertiary rounded border-border-hairline focus:ring-accent-tertiary cursor-pointer"
                                />
                                <p className={`font-body text-text-secondary flex-1 ${isCompleted ? 'line-through text-text-disabled' : ''}`}>
                                  {improvement}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    )}

                    {analysis.sections?.experience && analysis.sections.experience.improvements && analysis.sections.experience.improvements.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center justify-between p-4 hover:bg-bg-main rounded-lg transition">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">💼</span>
                              <div>
                                <h4 className="font-display font-bold text-text-primary">Experience</h4>
                                <p className="font-body text-sm text-text-secondary">{analysis.sections.experience.improvements.length} suggestions</p>
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-text-secondary group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="px-4 pb-4 space-y-2">
                          {analysis.sections.experience.improvements.map((improvement, idx) => {
                            const improvementId = `experience-${idx}`;
                            const isCompleted = completedImprovements.has(improvementId);
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={() => toggleCompletion(improvementId)}
                                  className="mt-1 w-4 h-4 text-accent-tertiary rounded border-border-hairline focus:ring-accent-tertiary cursor-pointer"
                                />
                                <p className={`font-body text-text-secondary flex-1 ${isCompleted ? 'line-through text-text-disabled' : ''}`}>
                                  {improvement}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    )}

                    {analysis.sections?.skills && analysis.sections.skills.improvements && analysis.sections.skills.improvements.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center justify-between p-4 hover:bg-bg-main rounded-lg transition">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">⚡</span>
                              <div>
                                <h4 className="font-display font-bold text-text-primary">Skills</h4>
                                <p className="font-body text-sm text-text-secondary">{analysis.sections.skills.improvements.length} suggestions</p>
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-text-secondary group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="px-4 pb-4 space-y-2">
                          {analysis.sections.skills.improvements.map((improvement, idx) => {
                            const improvementId = `skills-${idx}`;
                            const isCompleted = completedImprovements.has(improvementId);
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={() => toggleCompletion(improvementId)}
                                  className="mt-1 w-4 h-4 text-accent-tertiary rounded border-border-hairline focus:ring-accent-tertiary cursor-pointer"
                                />
                                <p className={`font-body text-text-secondary flex-1 ${isCompleted ? 'line-through text-text-disabled' : ''}`}>
                                  {improvement}
                                </p>
                              </div>
                            );
                          })}
                          {analysis.sections.skills.missingSkills && analysis.sections.skills.missingSkills.length > 0 && (
                            <div className="pt-3 mt-3 border-t border-border-hairline">
                              <p className="font-body text-sm font-medium text-text-primary mb-2">Skills to consider:</p>
                              <div className="flex flex-wrap gap-2">
                                {analysis.sections.skills.missingSkills.map((skill, idx) => (
                                  <span key={idx} className="font-body px-2 py-1 bg-bg-main rounded text-sm text-text-secondary">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {analysis.quantificationPrompts && analysis.quantificationPrompts.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center justify-between p-4 hover:bg-bg-main rounded-lg transition">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🔢</span>
                              <div>
                                <h4 className="font-display font-bold text-text-primary">Add the Numbers</h4>
                                <p className="font-body text-sm text-text-secondary">{analysis.quantificationPrompts.length} prompts to help you recall specifics</p>
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-text-secondary group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="px-4 pb-4 space-y-4">
                          {analysis.quantificationPrompts.map((prompt, idx) => (
                            <div key={idx} className="border-l-2 border-border-hairline pl-3">
                              <p className="font-body text-sm font-medium text-text-primary mb-1">{prompt.item}</p>
                              <ul className="space-y-1 mb-2">
                                {prompt.questions.map((q, qIdx) => (
                                  <li key={qIdx} className="font-body text-sm text-text-secondary">{q}</li>
                                ))}
                              </ul>
                              {prompt.exampleAnswers && prompt.exampleAnswers.length > 0 && (
                                <div className="mt-2">
                                  <p className="font-body text-xs uppercase tracking-wide text-text-disabled mb-1">For inspiration, not to copy - examples from a different production:</p>
                                  <ul className="space-y-1">
                                    {prompt.exampleAnswers.map((ex, exIdx) => (
                                      <li key={exIdx} className="font-body text-sm text-text-secondary italic">&ldquo;{ex}&rdquo;</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {analysis.languageUpgrades && analysis.languageUpgrades.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center justify-between p-4 hover:bg-bg-main rounded-lg transition">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🗣️</span>
                              <div>
                                <h4 className="font-display font-bold text-text-primary">Language &amp; Voice</h4>
                                <p className="font-body text-sm text-text-secondary">{analysis.languageUpgrades.length} lines worth rethinking in your own words</p>
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-text-secondary group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="px-4 pb-4 space-y-4">
                          {analysis.languageUpgrades.map((upgrade, idx) => (
                            <div key={idx} className="border-l-2 border-border-hairline pl-3">
                              <p className="font-body text-sm text-text-secondary mb-1">
                                Your line: <span className="italic">&ldquo;{upgrade.current}&rdquo;</span>
                              </p>
                              <p className="font-body text-sm font-medium text-text-primary mb-1">{upgrade.principle}</p>
                              <p className="font-body text-xs uppercase tracking-wide text-text-disabled mb-1">Example from a different production, for the pattern only:</p>
                              <p className="font-body text-sm text-text-secondary italic mb-1">&ldquo;{upgrade.example}&rdquo;</p>
                              <p className="font-body text-sm text-text-secondary">{upgrade.reason}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>

                {/* End of flow: re-analyzing is always available - made a
                    change? re-upload above (auto-triggers this) or click
                    here to reassess the current draft as-is. Not gated on
                    the checklist; that's just a progress indicator now. */}
                <div className="px-8 py-6 border-t border-border-hairline flex items-center justify-between flex-wrap gap-3">
                  <p className="font-body text-sm text-text-secondary">
                    {totalImprovements > 0
                      ? `${completedImprovements.size}/${totalImprovements} changes applied. Made changes? Re-upload above for updated feedback, or re-analyze this draft as-is.`
                      : 'Made changes? Re-upload above for updated feedback, or re-analyze this draft as-is.'}
                  </p>
                  <button
                    onClick={() => handleAnalyze()}
                    disabled={analyzing}
                    className="font-body px-6 py-3 bg-bg-surface border-2 border-accent-tertiary text-accent-tertiary rounded-lg font-bold hover:bg-accent-secondary/15 transition disabled:opacity-50"
                  >
                    {analyzing ? 'Re-analyzing...' : 'Re-analyze'}
                  </button>
                </div>

                {/* Nice acknowledgment when the checklist is fully worked
                    through - doesn't gate anything, just a nod plus a
                    natural next step. */}
                {allImprovementsCompleted && (
                  <div className="px-8 py-6 bg-success/15 border-t border-success/30">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="font-display text-2xl font-bold text-text-on-success mb-2">CV Complete!</h3>
                      <p className="font-body text-text-on-success mb-6 max-w-2xl mx-auto">
                        You&apos;ve worked through all the improvements. Your CV is looking strong! Ready to practice answering interview questions?
                      </p>
                      <button
                        onClick={() => router.push('/coaching')}
                        className="font-body px-8 py-4 bg-cta-primary text-text-on-cta rounded-lg text-lg font-bold hover:opacity-90 transition shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Start Interview Practice →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function CVPage() {
  return (
    <ProtectedRoute>
      <CVEditorContent />
    </ProtectedRoute>
  );
}
