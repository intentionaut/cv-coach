'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CVData {
  contact?: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary?: string;
  experience?: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
    achievements: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    location: string;
    year: string;
    details: string;
  }>;
  skills?: string[];
  projects?: Array<{
    title: string;
    role: string;
    description: string;
    year: string;
  }>;
}

interface Analysis {
  overallScore: number;
  confidenceBoosters: string[];
  sections: {
    [key: string]: {
      score: number;
      improvements: string[];
      missingSkills?: string[];
    };
  };
  priorityImprovements: Array<{
    priority: number;
    section: string;
    change: string;
    impact: string;
  }>;
  quantificationPrompts: Array<{
    section: string;
    item: string;
    questions: string[];
  }>;
  formattingTips: string[];
  languageUpgrades: Array<{
    current: string;
    suggested: string;
    reason: string;
  }>;
}

export default function CVEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis'>('editor');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setCvData(result.data);
        setActiveTab('editor');
      } else {
        alert('Failed to upload CV: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload CV');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!cvData) return;

    setAnalyzing(true);
    try {
      const response = await fetch('/api/cv/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData, targetRole }),
      });

      const result = await response.json();
      if (result.success) {
        setAnalysis(result.analysis);
        setActiveTab('analysis');
      } else {
        alert('Failed to analyze CV: ' + result.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze CV');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateCVField = (section: keyof CVData, value: any) => {
    setCvData(prev => prev ? { ...prev, [section]: value } : null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CV Editor</h1>
          <p className="text-gray-600">Upload your CV and get personalized improvement suggestions</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Upload Section */}
        {!cvData && (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Your CV</h2>
            <p className="text-gray-600 mb-6">
              Upload your existing CV (TXT, PDF, or DOCX) and we'll help you make it shine for film and theatre industry roles.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".txt,.pdf,.docx,.doc"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="cv-upload"
              />
              <label
                htmlFor="cv-upload"
                className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Processing...' : 'Choose File'}
              </label>
              <p className="mt-4 text-sm text-gray-500">
                Supported formats: TXT, PDF, DOCX
              </p>
            </div>
          </div>
        )}

        {/* CV Editor & Analysis */}
        {cvData && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-6 py-4 font-medium border-b-2 transition ${
                    activeTab === 'editor'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  CV Editor
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-6 py-4 font-medium border-b-2 transition ${
                    activeTab === 'analysis'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analysis & Suggestions
                  {analysis && (
                    <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-purple-600 rounded-full">
                      {analysis.overallScore}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Editor Tab */}
            {activeTab === 'editor' && (
              <div className="p-8">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Role (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Production Assistant, Camera Operator"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="mb-8 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze CV & Get Suggestions'}
                </button>

                {/* Contact Info */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={cvData.contact?.name || ''}
                        onChange={(e) => updateCVField('contact', { ...cvData.contact, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={cvData.contact?.email || ''}
                        onChange={(e) => updateCVField('contact', { ...cvData.contact, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={cvData.contact?.phone || ''}
                        onChange={(e) => updateCVField('contact', { ...cvData.contact, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={cvData.contact?.location || ''}
                        onChange={(e) => updateCVField('contact', { ...cvData.contact, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Summary</h3>
                  <textarea
                    value={cvData.summary || ''}
                    onChange={(e) => updateCVField('summary', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Brief overview of your background and career goals..."
                  />
                </div>

                {/* Experience */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Experience</h3>
                  {cvData.experience?.map((exp, idx) => (
                    <div key={idx} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const newExp = [...(cvData.experience || [])];
                            newExp[idx].title = e.target.value;
                            updateCVField('experience', newExp);
                          }}
                          placeholder="Job Title"
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = [...(cvData.experience || [])];
                            newExp[idx].company = e.target.value;
                            updateCVField('experience', newExp);
                          }}
                          placeholder="Company"
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => {
                          const newExp = [...(cvData.experience || [])];
                          newExp[idx].description = e.target.value;
                          updateCVField('experience', newExp);
                        }}
                        rows={3}
                        placeholder="Description and achievements..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {cvData.skills?.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && analysis && (
              <div className="p-8">
                {/* Overall Score */}
                <div className="mb-8 p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Overall CV Score</h3>
                      <p className="text-purple-100">Based on film & theatre industry standards</p>
                    </div>
                    <div className="text-6xl font-bold">{analysis.overallScore}</div>
                  </div>
                </div>

                {/* Confidence Boosters */}
                <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-xl font-bold text-green-900 mb-4">💪 Your Strengths</h3>
                  <ul className="space-y-2">
                    {analysis.confidenceBoosters.map((booster, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-800">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{booster}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Priority Improvements */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 Priority Improvements</h3>
                  <div className="space-y-4">
                    {analysis.priorityImprovements.map((improvement, idx) => (
                      <div key={idx} className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                            #{improvement.priority}
                          </span>
                          <span className="font-semibold text-gray-900">{improvement.section}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{improvement.change}</p>
                        <p className="text-sm text-purple-700">
                          <strong>Impact:</strong> {improvement.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Scores */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Section Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(analysis.sections).map(([section, data]) => (
                      <div key={section} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-900 capitalize">{section}</h4>
                          <span className={`text-2xl font-bold ${
                            data.score >= 80 ? 'text-green-600' :
                            data.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {data.score}
                          </span>
                        </div>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {data.improvements.slice(0, 3).map((improvement, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-purple-600 mt-0.5">•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quantification Prompts */}
                {analysis.quantificationPrompts.length > 0 && (
                  <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">
                      💡 Add Measurable Details
                    </h3>
                    <p className="text-blue-800 mb-4">
                      Answer these questions to make your achievements more impressive:
                    </p>
                    <div className="space-y-4">
                      {analysis.quantificationPrompts.map((prompt, idx) => (
                        <div key={idx} className="pl-4 border-l-2 border-blue-300">
                          <p className="font-semibold text-blue-900 mb-1">
                            {prompt.section}: {prompt.item}
                          </p>
                          <ul className="space-y-1 text-sm text-blue-700">
                            {prompt.questions.map((q, qIdx) => (
                              <li key={qIdx}>• {q}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Language Upgrades */}
                {analysis.languageUpgrades.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      ✨ Confidence-Building Language
                    </h3>
                    <div className="space-y-3">
                      {analysis.languageUpgrades.map((upgrade, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <div>
                              <span className="text-xs text-gray-500 uppercase">Current</span>
                              <p className="text-gray-700 line-through">{upgrade.current}</p>
                            </div>
                            <div>
                              <span className="text-xs text-green-600 uppercase">Stronger</span>
                              <p className="text-green-700 font-medium">{upgrade.suggested}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{upgrade.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && !analysis && (
              <div className="p-8 text-center text-gray-600">
                Click "Analyze CV & Get Suggestions" in the Editor tab to see your personalized improvement plan.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
