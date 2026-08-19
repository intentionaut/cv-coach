'use client';

import { useState } from 'react';
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
  const [analyzing, setAnalyzing] = useState(false);
  const [isDraggingCV, setIsDraggingCV] = useState(false);
  const [isDraggingJob, setIsDraggingJob] = useState(false);
  const [dismissedImprovements, setDismissedImprovements] = useState<Set<number>>(new Set());
  const [editableCVText, setEditableCVText] = useState<string>('');
  const [rawCVText, setRawCVText] = useState<string>(''); // Store the original uploaded CV text
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'improvements'>('overview');

  // CV file upload handlers
  const processFile = async (file: File) => {
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
        alert(`Failed to upload CV: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload CV');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CV Editor</h1>
          <p className="text-gray-600">Upload your CV and get personalized improvement suggestions</p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-purple-600 hover:text-purple-700 font-medium"
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
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                ↻ Upload New CV
              </button>
            )}
          </div>
        </div>

        {/* Upload Section - only show when no CV uploaded */}
        {!masterCV && (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Started</h2>

            {/* Unified Split Upload Container */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">

                {/* CV Upload - Left Panel */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold">1</span>
                    <h3 className="text-lg font-semibold text-gray-900">Upload Your CV</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your existing CV and we&apos;ll extract your experience, skills, and projects.
                  </p>

                  <div
                    onDragOver={handleCVDragOver}
                    onDragLeave={handleCVDragLeave}
                    onDrop={handleCVDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      isDraggingCV
                        ? 'border-purple-500 bg-purple-50 scale-105'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx,.doc"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="cv-upload"
                    />

                    <div className="mb-4">
                      <svg
                        className={`mx-auto h-12 w-12 ${isDraggingCV ? 'text-purple-500' : 'text-gray-400'}`}
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
                      className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition ${
                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading ? 'Processing...' : 'Choose File'}
                    </label>

                    <p className="mt-4 text-sm text-gray-600">or drag and drop</p>
                    <p className="mt-1 text-xs text-gray-500">TXT, PDF, DOCX</p>
                  </div>
                </div>

                {/* Job Description - Right Panel */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">2</span>
                    <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
                    <span className="text-xs text-gray-500 ml-auto">(Optional)</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Paste or upload a job posting to get tailored suggestions.
                  </p>

                  <textarea
                    value={jobDescription || ''}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  />

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white text-xs text-gray-500">or upload file</span>
                    </div>
                  </div>

                  <div
                    onDragOver={handleJobDragOver}
                    onDragLeave={handleJobDragLeave}
                    onDrop={handleJobDrop}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                      isDraggingJob
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx,.doc"
                      onChange={handleJobFileUpload}
                      disabled={uploadingJob}
                      className="hidden"
                      id="job-upload"
                    />

                    <label
                      htmlFor="job-upload"
                      className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition ${
                        uploadingJob ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingJob ? 'Processing...' : '📎 Upload File'}
                    </label>
                    <p className="mt-2 text-xs text-gray-500">TXT, PDF, DOCX</p>
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
              <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[800px] flex flex-col">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">Your CV - Uploaded Successfully ✓</h2>
                  <p className="text-purple-100 text-sm mt-1">This is exactly what we received from your file</p>
                </div>

                <div className="flex-1 overflow-hidden">
                  <pre className="h-full overflow-auto p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap bg-gray-50" style={{ color: '#1C1C1C' }}>
                    {rawCVText || 'No content extracted yet...'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right: Hidden structured preview for now - we'll remove this section */}
            <div className="hidden lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">Structured Data (Debug)</h2>
                  <p className="text-purple-100 text-sm mt-1">What our parser extracted</p>
                </div>

                <div className="p-6 space-y-6 max-h-[700px] overflow-y-auto">

                  {/* Contact Information */}
                  {cvData?.contact && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-600 rounded"></span>
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-3">
                        {cvData.contact.name && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-sm font-medium min-w-[80px]">Name:</span>
                            <span className="text-gray-900">{cvData.contact.name}</span>
                          </div>
                        )}
                        {cvData.contact.email && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-sm font-medium min-w-[80px]">Email:</span>
                            <span className="text-gray-900">{cvData.contact.email}</span>
                          </div>
                        )}
                        {cvData.contact.phone && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-sm font-medium min-w-[80px]">Phone:</span>
                            <span className="text-gray-900">{cvData.contact.phone}</span>
                          </div>
                        )}
                        {cvData.contact.location && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-sm font-medium min-w-[80px]">Location:</span>
                            <span className="text-gray-900">{cvData.contact.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Professional Summary */}
                  {cvData?.summary && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-600 rounded"></span>
                        Professional Summary
                      </h3>
                      <p className="text-gray-700 ml-3 leading-relaxed">{cvData.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {cvData?.experience && cvData.experience.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-600 rounded"></span>
                        Experience
                      </h3>
                      <div className="space-y-4 ml-3">
                        {cvData.experience.map((exp, idx) => (
                          <div key={idx} className="border-l-2 border-gray-200 pl-4 pb-4">
                            <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                            <p className="text-gray-600 text-sm">{exp.company}</p>
                            {(exp.startDate || exp.endDate || exp.location) && (
                              <p className="text-gray-500 text-sm mt-1">
                                {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate)}
                                {exp.location && ` • ${exp.location}`}
                              </p>
                            )}
                            <p className="text-gray-700 mt-2 text-sm leading-relaxed">{exp.description}</p>
                            {exp.achievements && exp.achievements.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {exp.achievements.map((achievement, aidx) => (
                                  <li key={aidx} className="text-gray-700 text-sm flex items-start gap-2">
                                    <span className="text-purple-600 mt-1">•</span>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-600 rounded"></span>
                        Education
                      </h3>
                      <div className="space-y-3 ml-3">
                        {cvData.education.map((edu, idx) => (
                          <div key={idx}>
                            <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                            <p className="text-gray-600 text-sm">{edu.institution}</p>
                            {(edu.year || edu.location) && (
                              <p className="text-gray-500 text-sm">
                                {edu.year}
                                {edu.location && ` • ${edu.location}`}
                              </p>
                            )}
                            {edu.details && <p className="text-gray-700 text-sm mt-1">{edu.details}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {cvData?.skills && cvData.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-600 rounded"></span>
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2 ml-3">
                        {cvData.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-600 rounded"></span>
                        Projects
                      </h3>
                      <div className="space-y-3 ml-3">
                        {cvData.projects.map((project, idx) => (
                          <div key={idx}>
                            <h4 className="font-semibold text-gray-900">{project.title}</h4>
                            {project.role && <p className="text-gray-600 text-sm">{project.role}</p>}
                            {project.year && <p className="text-gray-500 text-sm">{project.year}</p>}
                            <p className="text-gray-700 text-sm mt-1">{project.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Right: Target Role & CTA (1/3 width) */}
            <div className="bg-white rounded-lg shadow-lg p-6 h-fit sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Target Role</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add a job description to get tailored suggestions
              </p>

              <textarea
                value={jobDescription || ''}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description here..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm mb-4"
              />

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Split View: Editable CV (2/3) + Suggestions (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left: Editable CV (2/3 width) */}
              <div className="lg:col-span-2 space-y-4">

                {/* Collapsible Summary Header */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={() => setSummaryCollapsed(!summaryCollapsed)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <h2 className="text-xl font-bold text-gray-900">Overall Score</h2>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {summaryCollapsed ? 'Click to expand' : 'Click to collapse'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {analysis.overallScore >= 70 ? (
                          <>
                            <div className="text-3xl font-bold text-purple-600">{analysis.overallScore}</div>
                            <p className="text-xs text-purple-600 font-semibold">
                              {getScoreMessage(analysis.overallScore)}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-xl font-bold text-purple-600">
                              {getScoreTier(analysis.overallScore)}
                            </div>
                            <p className="text-xs text-gray-600">Keep improving!</p>
                          </>
                        )}
                      </div>
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform ${summaryCollapsed ? '' : 'rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {!summaryCollapsed && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      <div className="pt-4 space-y-3">
                        {/* Show top 3 priority improvements as actionable items */}
                        {analysis.priorityImprovements && analysis.priorityImprovements.slice(0, 3).map((improvement, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{improvement.section}</p>
                              <p className="text-sm text-gray-700 mt-1">{improvement.change}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CV Editor */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] flex flex-col">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Your CV</h3>
                    <button className="text-sm text-purple-300 hover:text-purple-200 font-medium">
                      Download
                    </button>
                  </div>
                  <textarea
                    value={editableCVText}
                    onChange={(e) => setEditableCVText(e.target.value)}
                    className="flex-1 p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset bg-white"
                    style={{ color: '#1C1C1C' }}
                    placeholder="Your CV content will appear here..."
                  />
                </div>
              </div>

              {/* Right: Tabbed Sidebar (1/3 width) */}
              <div className="h-[800px] flex flex-col">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 bg-white rounded-t-lg">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-purple-600 text-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('improvements')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                      activeTab === 'improvements'
                        ? 'border-b-2 border-purple-600 text-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Improvements
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto bg-white rounded-b-lg">
                  {activeTab === 'overview' && (
                    <div className="p-4 space-y-4">
                      {/* Confidence Boosters */}
                      {analysis.confidenceBoosters && analysis.confidenceBoosters.length > 0 && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                          <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                            <span>🌟</span>
                            What's Great
                          </h3>
                          <ul className="space-y-1">
                            {analysis.confidenceBoosters.map((booster, idx) => (
                              <li key={idx} className="text-sm text-green-900 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>{booster}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Priority Improvements */}
                      {analysis.priorityImprovements && analysis.priorityImprovements.length > 0 && (
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                          <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                            <span>🎯</span>
                            Top Priorities
                          </h3>
                          <div className="space-y-3">
                            {analysis.priorityImprovements.slice(0, 3).map((improvement) => (
                              <div key={improvement.priority} className="bg-white rounded p-3">
                                <div className="flex items-start gap-2">
                                  <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex-shrink-0 mt-0.5">
                                    {improvement.priority}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{improvement.change}</p>
                                    <p className="text-xs text-gray-600 mt-1">{improvement.impact}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Back Button */}
                      <button
                        onClick={() => {
                          setAnalysis(null);
                          setDismissedImprovements(new Set());
                        }}
                        className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                      >
                        ← New Analysis
                      </button>
                    </div>
                  )}

                  {activeTab === 'improvements' && (
                    <div className="p-4 space-y-4">
                      {/* Summary Section */}
                      {analysis.sections?.summary && (
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-purple-900 text-sm">Summary</h3>
                            <span className="text-sm font-bold text-purple-600">
                              {analysis.sections.summary.score}/100
                            </span>
                          </div>
                          {analysis.sections.summary.improvements && analysis.sections.summary.improvements.length > 0 && (
                            <ul className="space-y-2">
                              {analysis.sections.summary.improvements.map((improvement, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                  <span className="text-purple-600 mt-0.5">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Experience Section */}
                      {analysis.sections?.experience && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-blue-900 text-sm">Experience</h3>
                            <span className="text-sm font-bold text-blue-600">
                              {analysis.sections.experience.score}/100
                            </span>
                          </div>
                          {analysis.sections.experience.improvements && analysis.sections.experience.improvements.length > 0 && (
                            <ul className="space-y-2">
                              {analysis.sections.experience.improvements.map((improvement, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                  <span className="text-blue-600 mt-0.5">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Skills Section */}
                      {analysis.sections?.skills && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-green-900 text-sm">Skills</h3>
                            <span className="text-sm font-bold text-green-600">
                              {analysis.sections.skills.score}/100
                            </span>
                          </div>
                          {analysis.sections.skills.improvements && analysis.sections.skills.improvements.length > 0 && (
                            <ul className="space-y-2">
                              {analysis.sections.skills.improvements.map((improvement, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                  <span className="text-green-600 mt-0.5">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {analysis.sections.skills.missingSkills && analysis.sections.skills.missingSkills.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-green-300">
                              <p className="text-xs font-semibold text-green-900 mb-2">Consider Adding:</p>
                              <div className="flex flex-wrap gap-1">
                                {analysis.sections.skills.missingSkills.map((skill, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-white rounded text-xs text-gray-700">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Education Section */}
                      {analysis.sections?.education && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-yellow-900 text-sm">Education</h3>
                            <span className="text-sm font-bold text-yellow-700">
                              {analysis.sections.education.score}/100
                            </span>
                          </div>
                          {analysis.sections.education.improvements && analysis.sections.education.improvements.length > 0 && (
                            <ul className="space-y-2">
                              {analysis.sections.education.improvements.map((improvement, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                  <span className="text-yellow-600 mt-0.5">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Projects Section */}
                      {analysis.sections?.projects && (
                        <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-pink-900 text-sm">Projects</h3>
                            <span className="text-sm font-bold text-pink-600">
                              {analysis.sections.projects.score}/100
                            </span>
                          </div>
                          {analysis.sections.projects.improvements && analysis.sections.projects.improvements.length > 0 && (
                            <ul className="space-y-2">
                              {analysis.sections.projects.improvements.map((improvement, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                  <span className="text-pink-600 mt-0.5">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Quantification Prompts */}
                      {analysis.quantificationPrompts && analysis.quantificationPrompts.length > 0 && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                          <h3 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2">
                            <span>📊</span>
                            Add Measurable Details
                          </h3>
                          <div className="space-y-3">
                            {analysis.quantificationPrompts.map((prompt, idx) => (
                              <div key={idx} className="bg-white rounded p-3">
                                <p className="text-xs font-semibold text-gray-900 mb-1">
                                  {prompt.section}: {prompt.item}
                                </p>
                                <ul className="space-y-1">
                                  {prompt.questions.map((question, qIdx) => (
                                    <li key={qIdx} className="text-xs text-gray-600 flex items-start gap-2">
                                      <span className="text-blue-600 mt-0.5">?</span>
                                      <span>{question}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Language Upgrades */}
                      {analysis.languageUpgrades && analysis.languageUpgrades.length > 0 && (
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                          <h3 className="font-bold text-purple-900 mb-3 text-sm flex items-center gap-2">
                            <span>✍️</span>
                            Stronger Language
                          </h3>
                          <div className="space-y-3">
                            {analysis.languageUpgrades.map((upgrade, idx) => (
                              <div key={idx} className="bg-white rounded p-3">
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-0.5">Current:</p>
                                    <p className="text-xs text-gray-700 italic">&ldquo;{upgrade.current}&rdquo;</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-purple-600 mb-0.5">Suggested:</p>
                                    <p className="text-xs text-gray-900 font-medium">&ldquo;{upgrade.suggested}&rdquo;</p>
                                  </div>
                                  <p className="text-xs text-gray-600">{upgrade.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formatting Tips */}
                      {analysis.formattingTips && analysis.formattingTips.length > 0 && (
                        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                          <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                            <span>🎨</span>
                            Formatting & Presentation
                          </h3>
                          <ul className="space-y-2">
                            {analysis.formattingTips.map((tip, idx) => (
                              <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="text-gray-600 mt-0.5">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

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
