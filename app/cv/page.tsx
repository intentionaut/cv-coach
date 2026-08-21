'use client';

import { useState, useEffect } from 'react';
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
  }>;
  formattingTips?: string[];
  languageUpgrades: Array<{
    current: string;
    suggested: string;
    reason: string;
  }>;
}

// Helper function to convert score to tier label
const getScoreTier = (score: number): string => {
  if (score >= 70) return `${score}/100`;
  if (score >= 50) return 'Getting There';
  return 'Room for Improvement';
};

// Helper function to get encouragement message for scores 70+
const getScoreMessage = (score: number): string | null => {
  if (score === 100) return 'Perfect!';
  if (score >= 90) return 'Excellent!';
  if (score >= 80) return 'Strong!';
  if (score >= 70) return 'Almost There!';
  return null;
};

// Helper function to get actionable next step for a section
const getNextAction = (sectionName: string, score: number, improvements: string[]): string => {
  if (score >= 70) return `${score}/100`;

  // Return the first improvement as the actionable next step
  if (improvements && improvements.length > 0) {
    const action = improvements[0];
    // Truncate if too long
    return action.length > 50 ? action.substring(0, 47) + '...' : action;
  }

  // Fallback generic actions
  const fallbacks: { [key: string]: string } = {
    'summary': 'Add specific achievements',
    'experience': 'Quantify your impact',
    'skills': 'Add industry-relevant skills',
    'education': 'Highlight relevant coursework',
    'projects': 'Describe your role clearly'
  };

  return fallbacks[sectionName.toLowerCase()] || 'Review this section';
};

// Helper function to convert CV data to editable text
const cvDataToText = (data: CVData | null): string => {
  if (!data) return '';

  let text = '';

  // Contact
  if (data.contact?.name) text += `${data.contact.name}\n`;
  if (data.contact?.email) text += `${data.contact.email}\n`;
  if (data.contact?.phone) text += `${data.contact.phone}\n`;
  if (data.contact?.location) text += `${data.contact.location}\n`;

  // Summary
  if (data.summary) {
    text += `\nPROFESSIONAL SUMMARY\n${data.summary}\n`;
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    text += `\nEXPERIENCE\n`;
    data.experience.forEach(exp => {
      text += `\n${exp.title} - ${exp.company}\n`;
      if (exp.startDate || exp.endDate) text += `${exp.startDate || ''} - ${exp.endDate || ''}\n`;
      if (exp.location) text += `${exp.location}\n`;
      text += `${exp.description}\n`;
      if (exp.achievements) {
        exp.achievements.forEach(ach => text += `• ${ach}\n`);
      }
    });
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    text += `\nSKILLS\n${data.skills.join(', ')}\n`;
  }

  // Education
  if (data.education && data.education.length > 0) {
    text += `\nEDUCATION\n`;
    data.education.forEach(edu => {
      text += `\n${edu.degree} - ${edu.institution}\n`;
      if (edu.year) text += `${edu.year}\n`;
      if (edu.location) text += `${edu.location}\n`;
      if (edu.details) text += `${edu.details}\n`;
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    text += `\nPROJECTS\n`;
    data.projects.forEach(proj => {
      text += `\n${proj.title}`;
      if (proj.role) text += ` - ${proj.role}`;
      if (proj.year) text += ` (${proj.year})`;
      text += `\n${proj.description}\n`;
    });
  }

  return text;
};

function CVEditorContent() {
  const router = useRouter();

  // State management
  const [masterCV, setMasterCV] = useState<CVData | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingJob, setUploadingJob] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isDraggingCV, setIsDraggingCV] = useState(false);
  const [isDraggingJob, setIsDraggingJob] = useState(false);
  const [dismissedImprovements, setDismissedImprovements] = useState<Set<number>>(new Set());
  const [editableCVText, setEditableCVText] = useState<string>('');
  const [rawCVText, setRawCVText] = useState<string>(''); // Store the original uploaded CV text
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [mainTab, setMainTab] = useState<'cv' | 'analysis'>('cv');
  const [completedImprovements, setCompletedImprovements] = useState<Set<string>>(new Set());

  // Toggle completion for an improvement
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

  // Load existing CV data on mount
  useEffect(() => {
    const loadExistingCV = async () => {
      try {
        const response = await fetch('/api/cv');
        if (response.ok) {
          const data = await response.json();
          if (data.exists && data.cv) {
            // Set CV data - also mark as the master CV so the upload
            // screen doesn't show again for a user who's already uploaded.
            setCvData(data.cv);
            setMasterCV(data.cv);

            // Generate editable text from CV data
            const cvText = generateCVText(data.cv);
            setEditableCVText(cvText);
            setRawCVText(cvText);

            // If there's existing analysis, load it from the cached copy -
            // no need to spend another Claude call re-analyzing a CV we've
            // already scored.
            if (data.analysis && data.analysis.priorityImprovements) {
              setAnalysis(data.analysis);
              setEditableCVText(cvDataToText(data.cv));
              // Land on the analysis tab instead of the CV tab, since
              // this user has already been through the upload flow.
              setMainTab('analysis');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load existing CV:', error);
      }
    };

    loadExistingCV();
  }, []);

  // Helper to generate readable CV text from structured data
  const generateCVText = (cv: CVData): string => {
    let text = '';

    // Contact info
    if (cv.contact) {
      if (cv.contact.name) text += `${cv.contact.name}\n`;
      if (cv.contact.email) text += `${cv.contact.email}\n`;
      if (cv.contact.phone) text += `${cv.contact.phone}\n`;
      if (cv.contact.location) text += `${cv.contact.location}\n`;
      text += '\n';
    }

    // Summary
    if (cv.summary) {
      text += `PROFESSIONAL SUMMARY\n${cv.summary}\n\n`;
    }

    // Experience
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

    // Education
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

    // Skills
    if (cv.skills && cv.skills.length > 0) {
      text += `SKILLS\n${cv.skills.join(', ')}\n\n`;
    }

    // Projects
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

    // Validate before spending an API call: type, empty, and size checks all
    // happen instantly, client-side, with no network request.
    const validationError = validateCVFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        console.log('Received CV data from API:', result.data);
        setMasterCV(result.data);
        setCvData(result.data);
        setRawCVText(result.rawText || ''); // Store the raw extracted text
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

  // Job description upload handlers
  const handleJobFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingJob(true);
    try {
      const text = await file.text();
      setJobDescription(text);
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
      setJobDescription(text);
    }
  };

  // Analysis handler
  const handleAnalyze = async () => {
    if (!cvData) return;

    setAnalyzing(true);
    try {
      const response = await fetch('/api/cv/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          targetRole: jobDescription || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAnalysis(result.analysis);
        setEditableCVText(cvDataToText(cvData));
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

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">CV Editor</h1>
          <p className="font-body text-text-secondary">Upload your CV and get personalized improvement suggestions</p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="font-body text-text-link hover:text-text-cta font-medium"
            >
              ← Back to Dashboard
            </button>
            {masterCV && (
              <button
                onClick={() => {
                  setMasterCV(null);
                  setCvData(null);
                  setAnalysis(null);
                  setJobDescription(null);
                  setDismissedImprovements(new Set());
                  setRawCVText('');
                  setEditableCVText('');
                }}
                className="font-body text-text-secondary hover:text-text-primary font-medium"
              >
                ↻ Upload New CV
              </button>
            )}
          </div>
        </div>

        {/* Upload Section - only show when no CV uploaded */}
        {!masterCV && (
          <div className="bg-bg-surface rounded-lg shadow-lg p-8 max-w-4xl mx-auto border border-border-hairline">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Get Started</h2>

            {/* Unified Split Upload Container */}
            <div className="border-2 border-border-hairline rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-hairline">

                {/* CV Upload - Left Panel */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-body flex items-center justify-center w-6 h-6 rounded-full bg-accent-secondary/30 text-accent-tertiary text-sm font-semibold">1</span>
                    <h3 className="font-display text-lg font-bold text-text-primary">Upload Your CV</h3>
                  </div>
                  <p className="font-body text-sm text-text-secondary mb-4">
                    Upload your existing CV and we&apos;ll extract your experience, skills, and projects.
                  </p>

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

                {/* Job Description - Right Panel */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-body flex items-center justify-center w-6 h-6 rounded-full bg-accent-secondary/30 text-accent-tertiary text-sm font-semibold">2</span>
                    <h3 className="font-display text-lg font-bold text-text-primary">Job Description</h3>
                    <span className="font-body text-xs text-text-secondary ml-auto">(Optional)</span>
                  </div>
                  <p className="font-body text-sm text-text-secondary mb-4">
                    Paste or upload a job posting to get tailored suggestions.
                  </p>

                  <textarea
                    value={jobDescription || ''}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    rows={6}
                    className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg focus:ring-2 focus:ring-accent-tertiary focus:border-transparent resize-none text-sm bg-bg-surface text-text-primary"
                  />

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-hairline"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="font-body px-2 bg-bg-surface text-xs text-text-secondary">or upload file</span>
                    </div>
                  </div>

                  <div
                    onDragOver={handleJobDragOver}
                    onDragLeave={handleJobDragLeave}
                    onDrop={handleJobDrop}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                      isDraggingJob
                        ? 'border-accent-tertiary bg-accent-secondary/20'
                        : 'border-border-hairline bg-bg-main'
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
                      className={`font-body cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-accent-tertiary text-text-on-tertiary rounded-lg text-sm font-semibold hover:opacity-90 transition ${
                        uploadingJob ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingJob ? 'Processing...' : '📎 Upload File'}
                    </label>
                    <p className="font-body mt-2 text-xs text-text-secondary">TXT, PDF, DOCX</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* CV Preview - show when CV uploaded but no analysis yet */}
        {masterCV && !analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Raw CV Text (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="bg-bg-surface rounded-lg shadow-lg overflow-hidden h-[800px] flex flex-col border border-border-hairline">
                <div className="bg-accent-tertiary px-6 py-4">
                  <h2 className="font-display text-2xl font-bold text-text-on-tertiary">Your CV - Uploaded Successfully ✓</h2>
                  <p className="font-body text-text-inverse/75 text-sm mt-1">This is exactly what we received from your file</p>
                </div>

                <div className="flex-1 overflow-hidden">
                  <pre className="h-full overflow-auto p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap bg-bg-main text-text-primary">
                    {rawCVText || 'No content extracted yet...'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right: Hidden structured preview for now - we'll remove this section */}
            <div className="hidden lg:col-span-2">
              <div className="bg-bg-surface rounded-lg shadow-lg overflow-hidden border border-border-hairline">
                <div className="bg-accent-tertiary px-6 py-4">
                  <h2 className="font-display text-2xl font-bold text-text-on-tertiary">Structured Data (Debug)</h2>
                  <p className="font-body text-text-inverse/75 text-sm mt-1">What our parser extracted</p>
                </div>

                <div className="p-6 space-y-6 max-h-[700px] overflow-y-auto">

                  {/* Contact Information */}
                  {cvData?.contact && (
                    <div>
                      <h3 className="font-display text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent-tertiary rounded"></span>
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-3">
                        {cvData.contact.name && (
                          <div className="font-body flex items-start gap-2">
                            <span className="text-text-secondary text-sm font-medium min-w-[80px]">Name:</span>
                            <span className="text-text-primary">{cvData.contact.name}</span>
                          </div>
                        )}
                        {cvData.contact.email && (
                          <div className="font-body flex items-start gap-2">
                            <span className="text-text-secondary text-sm font-medium min-w-[80px]">Email:</span>
                            <span className="text-text-primary">{cvData.contact.email}</span>
                          </div>
                        )}
                        {cvData.contact.phone && (
                          <div className="font-body flex items-start gap-2">
                            <span className="text-text-secondary text-sm font-medium min-w-[80px]">Phone:</span>
                            <span className="text-text-primary">{cvData.contact.phone}</span>
                          </div>
                        )}
                        {cvData.contact.location && (
                          <div className="font-body flex items-start gap-2">
                            <span className="text-text-secondary text-sm font-medium min-w-[80px]">Location:</span>
                            <span className="text-text-primary">{cvData.contact.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Professional Summary */}
                  {cvData?.summary && (
                    <div>
                      <h3 className="font-display text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent-tertiary rounded"></span>
                        Professional Summary
                      </h3>
                      <p className="font-body text-text-secondary ml-3 leading-relaxed">{cvData.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {cvData?.experience && cvData.experience.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent-tertiary rounded"></span>
                        Experience
                      </h3>
                      <div className="space-y-4 ml-3">
                        {cvData.experience.map((exp, idx) => (
                          <div key={idx} className="border-l-2 border-border-hairline pl-4 pb-4">
                            <h4 className="font-display font-bold text-text-primary">{exp.title}</h4>
                            <p className="font-body text-text-secondary text-sm">{exp.company}</p>
                            {(exp.startDate || exp.endDate || exp.location) && (
                              <p className="font-body text-text-secondary text-sm mt-1">
                                {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate)}
                                {exp.location && ` • ${exp.location}`}
                              </p>
                            )}
                            <p className="font-body text-text-secondary mt-2 text-sm leading-relaxed">{exp.description}</p>
                            {exp.achievements && exp.achievements.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {exp.achievements.map((achievement, aidx) => (
                                  <li key={aidx} className="font-body text-text-secondary text-sm flex items-start gap-2">
                                    <span className="text-accent-tertiary mt-1">•</span>
                                    <span>{achievement}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {cvData?.education && cvData.education.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent-tertiary rounded"></span>
                        Education
                      </h3>
                      <div className="space-y-3 ml-3">
                        {cvData.education.map((edu, idx) => (
                          <div key={idx}>
                            <h4 className="font-display font-bold text-text-primary">{edu.degree}</h4>
                            <p className="font-body text-text-secondary text-sm">{edu.institution}</p>
                            {(edu.year || edu.location) && (
                              <p className="font-body text-text-secondary text-sm">
                                {edu.year}
                                {edu.location && ` • ${edu.location}`}
                              </p>
                            )}
                            {edu.details && <p className="font-body text-text-secondary text-sm mt-1">{edu.details}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {cvData?.skills && cvData.skills.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent-tertiary rounded"></span>
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2 ml-3">
                        {cvData.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="font-body px-3 py-1 bg-accent-secondary/25 text-accent-tertiary rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {cvData?.projects && cvData.projects.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent-tertiary rounded"></span>
                        Projects
                      </h3>
                      <div className="space-y-3 ml-3">
                        {cvData.projects.map((project, idx) => (
                          <div key={idx}>
                            <h4 className="font-display font-bold text-text-primary">{project.title}</h4>
                            {project.role && <p className="font-body text-text-secondary text-sm">{project.role}</p>}
                            {project.year && <p className="font-body text-text-secondary text-sm">{project.year}</p>}
                            <p className="font-body text-text-secondary text-sm mt-1">{project.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Right: Target Role & CTA (1/3 width) */}
            <div className="bg-bg-surface rounded-lg shadow-lg p-6 h-fit sticky top-6 border border-border-hairline">
              <h3 className="font-display text-lg font-bold text-text-primary mb-3">Target Role</h3>
              <p className="font-body text-sm text-text-secondary mb-4">
                Add a job description to get tailored suggestions
              </p>

              <textarea
                value={jobDescription || ''}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description here..."
                rows={8}
                className="font-body w-full px-3 py-2 border border-border-hairline rounded-lg focus:ring-2 focus:ring-accent-tertiary focus:border-transparent resize-none text-sm mb-4 bg-bg-main text-text-primary"
              />

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="font-body w-full px-6 py-3 bg-cta-primary text-text-on-cta rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Get Suggestions'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Results - show when analysis is complete */}
        {analysis && (
          <div className="space-y-6">

            {/* Main Tab Navigation */}
            <div className="bg-bg-surface rounded-lg shadow-lg overflow-hidden border border-border-hairline">
              <div className="flex border-b border-border-hairline">
                <button
                  onClick={() => setMainTab('cv')}
                  className={`font-body flex-1 px-6 py-4 text-sm font-medium transition ${
                    mainTab === 'cv'
                      ? 'border-b-2 border-accent-tertiary text-accent-tertiary bg-accent-secondary/15'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-main'
                  }`}
                >
                  Your CV
                </button>
                <button
                  onClick={() => setMainTab('analysis')}
                  className={`font-body flex-1 px-6 py-4 text-sm font-medium transition ${
                    mainTab === 'analysis'
                      ? 'border-b-2 border-accent-tertiary text-accent-tertiary bg-accent-secondary/15'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-main'
                  }`}
                >
                  Analysis & Improvements
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {mainTab === 'cv' && (
            <div className="space-y-4">

                {/* Collapsible Summary Header */}
                <div className="bg-bg-surface rounded-lg shadow-lg overflow-hidden border border-border-hairline">
                  <button
                    onClick={() => setSummaryCollapsed(!summaryCollapsed)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-main transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <h2 className="font-display text-xl font-bold text-text-primary">Overall Score</h2>
                        <p className="font-body text-sm text-text-secondary mt-0.5">
                          {summaryCollapsed ? 'Click to expand' : 'Click to collapse'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {analysis.overallScore >= 70 ? (
                          <>
                            <div className="font-display text-3xl font-bold text-accent-tertiary">{analysis.overallScore}</div>
                            <p className="font-body text-xs text-accent-tertiary font-semibold">
                              {getScoreMessage(analysis.overallScore)}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="font-display text-xl font-bold text-accent-tertiary">
                              {getScoreTier(analysis.overallScore)}
                            </div>
                            <p className="font-body text-xs text-text-secondary">Keep improving!</p>
                          </>
                        )}
                      </div>
                      <svg
                        className={`w-6 h-6 text-text-secondary transition-transform ${summaryCollapsed ? '' : 'rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {!summaryCollapsed && (
                    <div className="px-6 pb-6 border-t border-border-hairline">
                      <div className="pt-4 space-y-3">
                        {/* Show top 3 priority improvements as actionable items */}
                        {analysis.priorityImprovements && analysis.priorityImprovements.slice(0, 3).map((improvement, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-accent-secondary/15 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-tertiary text-text-on-tertiary flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-body text-sm font-semibold text-text-primary">{improvement.section}</p>
                              <p className="font-body text-sm text-text-secondary mt-1">{improvement.change}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CV Editor */}
                <div className="bg-bg-surface rounded-lg shadow-lg overflow-hidden h-[600px] flex flex-col border border-border-hairline">
                  <div className="bg-accent-tertiary px-4 py-3 border-b border-border-hairline flex items-center justify-between">
                    <h3 className="font-display font-bold text-text-on-tertiary">Your CV</h3>
                    <button className="font-body text-sm text-text-inverse/75 hover:text-text-inverse font-medium">
                      Download
                    </button>
                  </div>
                  <textarea
                    value={editableCVText}
                    onChange={(e) => setEditableCVText(e.target.value)}
                    className="flex-1 p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-accent-tertiary focus:ring-inset bg-bg-surface text-text-primary"
                    placeholder="Your CV content will appear here..."
                  />
                </div>
            </div>
            )}

            {/* Analysis Tab */}
            {mainTab === 'analysis' && (
              <div className="bg-bg-surface rounded-lg shadow-lg border border-border-hairline">
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
                    {/* Each section - minimal styling */}
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
                  </div>
                </div>

                {/* Completion Celebration - Show when all improvements are checked off */}
                {(() => {
                  // Calculate total improvements
                  const totalImprovements =
                    (analysis.priorityImprovements?.slice(0, 3).length || 0) +
                    (analysis.sections?.summary?.improvements?.length || 0) +
                    (analysis.sections?.experience?.improvements?.length || 0) +
                    (analysis.sections?.skills?.improvements?.length || 0);

                  const allCompleted = totalImprovements > 0 && completedImprovements.size >= totalImprovements;

                  if (allCompleted) {
                    return (
                      <div className="px-8 py-6 bg-success/15 border-t border-success/30">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🎉</div>
                          <h3 className="font-display text-2xl font-bold text-text-on-success mb-2">CV Complete!</h3>
                          <p className="font-body text-text-on-success mb-6 max-w-2xl mx-auto">
                            You've worked through all the improvements. Your CV is looking strong! Ready to practice answering interview questions?
                          </p>
                          <button
                            onClick={() => router.push('/coaching')}
                            className="font-body px-8 py-4 bg-cta-primary text-text-on-cta rounded-lg text-lg font-bold hover:opacity-90 transition shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Start Interview Practice →
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Footer */}
                <div className="px-8 py-6 bg-bg-main border-t border-border-hairline flex justify-between items-center">
                  <button
                    onClick={() => setMainTab('cv')}
                    className="font-body px-6 py-3 text-text-link hover:text-text-cta font-semibold transition"
                  >
                    ← Back to CV
                  </button>
                  <p className="font-body text-sm text-text-secondary">Make changes one at a time for best results</p>
                </div>
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
