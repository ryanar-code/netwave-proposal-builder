'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

type Step = 'upload' | 'analyzing' | 'review' | 'editing' | 'sow-editor';

export default function ProposalBuilderPage() {
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [clientName, setClientName] = useState('');
  const [budget, setBudget] = useState('');
  const [projectType, setProjectType] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [sowContent, setSowContent] = useState('');
  const [sowEditPrompt, setSowEditPrompt] = useState('');
  const [sowEditMode, setSowEditMode] = useState<'preview' | 'edit'>('preview');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'txt', 'md', 'doc', 'docx'].includes(extension || '');
    });

    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
    }

    if (validFiles.length < droppedFiles.length) {
      setErrorMessage('Some files were skipped. Only PDF, TXT, MD, DOC, and DOCX files are supported.');
    }
  };

  const handleAnalyze = async () => {
    if (!clientName || !budget) {
      setErrorMessage('Please enter client name and budget');
      return;
    }

    setStep('analyzing');
    setLoading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('clientName', clientName);
      formData.append('budget', budget);
      formData.append('projectType', projectType);
      formData.append('additionalContext', additionalContext);
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/analyze-brief', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
        setProposal(data.proposal);
        setStep('review');
        setErrorMessage('');
      } else {
        const errorMsg = data.error || 'Unknown error';
        if (errorMsg.includes('credit balance is too low')) {
          setErrorMessage('⚠️ API Credits Needed: Please add credits to your Anthropic account at console.anthropic.com/settings/billing');
        } else {
          setErrorMessage('Error analyzing: ' + errorMsg);
        }
        setStep('upload');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to analyze brief. Please check your connection and try again.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrompt = async () => {
    if (!editPrompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/edit-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal?.id,
          prompt: editPrompt,
          currentProposal: proposal
        })
      });

      const data = await response.json();

      if (data.success) {
        setProposal(data.proposal);
        setEditPrompt('');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const dataStr = JSON.stringify(proposal, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${proposal.clientName.replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateSOW = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sow',
          proposal,
          clientName,
          budget
        })
      });

      const data = await response.json();

      if (data.success) {
        setSowContent(data.content);
        setStep('sow-editor');
      } else {
        alert('Error generating SOW: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate SOW');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSOW = async () => {
    if (!sowEditPrompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/edit-sow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSOW: sowContent,
          prompt: sowEditPrompt,
          proposal
        })
      });

      const data = await response.json();

      if (data.success) {
        setSowContent(data.content);
        setSowEditPrompt('');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSOW = (format: 'doc' | 'pdf') => {
    if (format === 'doc') {
      // Export as HTML that Word can open
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Statement of Work - ${clientName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #10121a; border-bottom: 3px solid #00e2ff; padding-bottom: 10px; }
    h2 { color: #10121a; margin-top: 30px; }
    h3 { color: #333; }
  </style>
</head>
<body>
${sowContent.split('\n').map(line => {
  if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
  if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
  if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
  if (line.startsWith('- ')) return `<li>${line.substring(2)}</li>`;
  if (line.trim() === '') return '<br>';
  return `<p>${line}</p>`;
}).join('\n')}
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOW-${clientName.replace(/\s+/g, '-')}-${Date.now()}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // For PDF, we'll use the browser's print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Statement of Work - ${clientName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #10121a; border-bottom: 3px solid #00e2ff; padding-bottom: 10px; }
    h2 { color: #10121a; margin-top: 30px; }
    h3 { color: #333; }
    @media print {
      body { margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
${sowContent.split('\n').map(line => {
  if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
  if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
  if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
  if (line.startsWith('- ')) return `<li>${line.substring(2)}</li>`;
  if (line.trim() === '') return '<br>';
  return `<p>${line}</p>`;
}).join('\n')}
</body>
</html>`);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleGenerateBrief = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'brief',
          proposal,
          clientName,
          budget
        })
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = `/output?content=${encodeURIComponent(data.content)}&title=${encodeURIComponent('Client Brief')}`;
      } else {
        alert('Error generating brief: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate brief');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEdit = (phaseId: string, lineItemId: string, field: string, value: number) => {
    // Update proposal state with manual edits
    setProposal((prev: any) => {
      const updated = { ...prev };
      // Find and update the specific line item
      updated.phases = updated.phases.map((phase: any) => {
        if (phase.id === phaseId) {
          phase.lineItems = phase.lineItems.map((item: any) => {
            if (item.id === lineItemId) {
              const newItem = { ...item, [field]: value };
              if (field === 'hours' || field === 'rate') {
                newItem.cost = (newItem.hours || 0) * (newItem.rate || 0);
              }
              newItem.isEdited = true;
              return newItem;
            }
            return item;
          });
        }
        return phase;
      });
      // Recalculate totals
      updated.subtotal = updated.phases.reduce((sum: number, phase: any) =>
        sum + phase.lineItems.reduce((psum: number, item: any) => psum + (item.cost || 0), 0), 0
      );
      updated.total = updated.subtotal - (updated.discount || 0);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: '#10121a' }} className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>
                🚀 Proposal Builder
              </h1>
              <p className="mt-2 text-sm" style={{ color: '#dbe7ef' }}>
                Upload client materials → Netwave suggests packages → Edit & preview
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 font-semibold rounded-lg transition-colors"
              style={{ background: '#00e2ff', color: '#10121a' }}
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="font-medium">Upload</span>
            </div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'analyzing' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'analyzing' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="font-medium">Analyze</span>
            </div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'review' || step === 'editing' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' || step === 'editing' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="font-medium">Review & Edit</span>
            </div>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-900">{errorMessage}</p>
                    {errorMessage.includes('API Credits') && (
                      <a
                        href="https://console.anthropic.com/settings/billing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-red-700 underline hover:text-red-900"
                      >
                        Add credits to your Anthropic account →
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => setErrorMessage('')}
                    className="ml-auto flex-shrink-0 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Client Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget *
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type (optional)
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Auto-detect</option>
                    <option value="branding">Branding</option>
                    <option value="website">Website</option>
                    <option value="seo">SEO</option>
                    <option value="social-media">Social Media</option>
                    <option value="video-photo">Video/Photo</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Any specific requirements, deadlines, or preferences..."
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Documents</h2>
              <p className="text-sm text-gray-800 mb-4">
                Upload client briefs, requirements, previous proposals, or any relevant materials
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-100'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm text-gray-800">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-700 mt-1">PDF, TXT, MD, DOC, DOCX (max 10MB each)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                        <span className="text-xs text-gray-700">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={!clientName || !budget}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Analyze & Generate Suggestions
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Brief...</h2>
            <p className="text-gray-800">
              Netwave is reviewing your materials and matching them with our pricing packages
            </p>
          </div>
        )}

        {/* Step 3: Review & Edit */}
        {(step === 'review' || step === 'editing') && proposal && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Netwave's Suggestions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">💡 Netwave's Suggestions</h2>
                  {suggestions && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      suggestions.usePackages ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {suggestions.usePackages ? '📦 Packages' : '🎯 Custom Build'}
                    </span>
                  )}
                </div>

                {suggestions && (
                  <div className="space-y-4">
                    {suggestions.usePackages && suggestions.packages?.length > 0 ? (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Recommended Packages:</h3>
                        <div className="space-y-2">
                          {suggestions.packages.map((pkg: any, idx: number) => (
                            <div key={idx} className="bg-blue-50 rounded-lg p-3">
                              <div className="font-medium text-blue-900">{pkg.name}</div>
                              <div className="text-sm text-blue-700">${pkg.cost?.toLocaleString()}</div>
                              <p className="text-xs text-blue-600 mt-1">{pkg.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : suggestions.customBuild?.roles?.length > 0 ? (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Custom Build - Suggested Hours by Role:</h3>
                        <div className="space-y-2">
                          {suggestions.customBuild.roles.map((role: any, idx: number) => (
                            <div key={idx} className="bg-green-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium text-green-900">{role.serviceName}</div>
                                <div className="text-sm text-green-700">{role.hours}h</div>
                              </div>
                              <div className="text-xs text-green-600 mb-1">
                                ${role.rate}/hr × {role.hours}h = ${role.cost?.toLocaleString()}
                              </div>
                              {role.reasoning && (
                                <p className="text-xs text-green-700">{role.reasoning}</p>
                              )}
                            </div>
                          ))}
                          <div className="bg-green-100 rounded-lg p-3 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-green-900">Estimated Total:</span>
                              <span className="font-bold text-green-900">
                                ${suggestions.customBuild.estimatedTotal?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {suggestions.reasoning && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Analysis:</h3>
                        <p className="text-sm text-gray-700">{suggestions.reasoning}</p>
                      </div>
                    )}

                    {suggestions.alternatives && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Alternatives:</h3>
                        <p className="text-sm text-gray-700">{suggestions.alternatives}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Edit via Prompt:</h3>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., 'Add 10 hours to design phase' or 'Remove video editing'"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  />
                  <button
                    onClick={handleEditPrompt}
                    disabled={loading || !editPrompt.trim()}
                    className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {loading ? 'Applying...' : '✨ Apply Edit'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Proposal Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{proposal.clientName}</h2>
                      <p className="text-sm text-gray-800 mt-1">{proposal.projectType}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        ${proposal.total?.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-800">Total Project Cost</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {proposal.phases?.map((phase: any) => (
                    <div key={phase.id} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                        <span className="text-lg font-bold text-gray-900">
                          ${phase.total?.toLocaleString() || 0}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 text-left text-gray-900">
                              <th className="p-3 font-bold">Item</th>
                              <th className="p-3 text-right font-bold">Hours</th>
                              <th className="p-3 text-right font-bold">Rate</th>
                              <th className="p-3 text-right font-bold">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phase.lineItems?.map((item: any) => (
                              <tr key={item.id} className="border-t border-gray-200">
                                <td className="p-3 text-gray-900">
                                  {item.name}
                                  {item.isEdited && (
                                    <span className="ml-2 text-xs text-green-600">✓ edited</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <input
                                    type="number"
                                    value={item.hours || 0}
                                    onChange={(e) => handleManualEdit(phase.id, item.id, 'hours', Number(e.target.value))}
                                    className="w-16 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                                  />
                                </td>
                                <td className="p-3 text-right">
                                  <input
                                    type="number"
                                    value={item.rate || 0}
                                    onChange={(e) => handleManualEdit(phase.id, item.id, 'rate', Number(e.target.value))}
                                    className="w-20 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-gray-900"
                                  />
                                </td>
                                <td className="p-3 text-right font-semibold text-gray-900">
                                  ${item.cost?.toLocaleString() || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 pt-6 border-t-2 border-gray-300">
                    <div className="flex items-center justify-between text-lg mb-2">
                      <span className="text-gray-900">Subtotal:</span>
                      <span className="font-semibold text-gray-900">${proposal.subtotal?.toLocaleString()}</span>
                    </div>
                    {proposal.discount > 0 && (
                      <div className="flex items-center justify-between text-sm text-green-600 mb-2">
                        <span>Discount:</span>
                        <span>-${proposal.discount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-2xl font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-600">${proposal.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveDraft}
                      className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                    >
                      💾 Save Draft
                    </button>
                    <button
                      onClick={handleGenerateSOW}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {loading ? '⏳ Generating...' : '📄 Generate SOW'}
                    </button>
                    <button
                      onClick={handleGenerateBrief}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {loading ? '⏳ Generating...' : '📋 Generate Brief'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: SOW Editor */}
        {step === 'sow-editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Edit Controls */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Edit SOW</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Edit via Prompt:
                    </label>
                    <textarea
                      value={sowEditPrompt}
                      onChange={(e) => setSowEditPrompt(e.target.value)}
                      placeholder="e.g., 'Make the timeline more specific' or 'Add a section about deliverables'"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    />
                    <button
                      onClick={handleEditSOW}
                      disabled={loading || !sowEditPrompt.trim()}
                      className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      {loading ? 'Applying...' : '✨ Apply Edit'}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Export Options:</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleExportSOW('doc')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                      >
                        📄 Export as Word Doc
                      </button>
                      <button
                        onClick={() => handleExportSOW('pdf')}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                      >
                        📑 Export as PDF
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setStep('review')}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                    >
                      ← Back to Proposal
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: SOW Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Statement of Work</h2>
                    <p className="text-sm text-gray-800 mt-1">{clientName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSowEditMode('preview')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        sowEditMode === 'preview'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      👁️ Preview
                    </button>
                    <button
                      onClick={() => setSowEditMode('edit')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        sowEditMode === 'edit'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ✏️ Edit Text
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {sowEditMode === 'preview' ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                        {sowContent.split('\n').map((line, idx) => {
                          if (line.startsWith('# ')) {
                            return <h1 key={idx} className="text-3xl font-bold text-gray-900 mt-6 mb-4 border-b-2 border-blue-500 pb-2">{line.substring(2)}</h1>;
                          }
                          if (line.startsWith('## ')) {
                            return <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{line.substring(3)}</h2>;
                          }
                          if (line.startsWith('### ')) {
                            return <h3 key={idx} className="text-xl font-semibold text-gray-900 mt-4 mb-2">{line.substring(4)}</h3>;
                          }
                          if (line.startsWith('- ')) {
                            return <li key={idx} className="ml-6 text-gray-900">{line.substring(2)}</li>;
                          }
                          if (line.startsWith('* ')) {
                            return <li key={idx} className="ml-6 text-gray-900">{line.substring(2)}</li>;
                          }
                          if (line.trim() === '') {
                            return <br key={idx} />;
                          }
                          return <p key={idx} className="text-gray-900 mb-2">{line}</p>;
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3 text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        💡 <strong>Tip:</strong> Edit the SOW text directly below. Use markdown formatting:
                        <code className="mx-1 px-1 bg-white rounded"># Header</code>
                        <code className="mx-1 px-1 bg-white rounded">## Subheader</code>
                        <code className="mx-1 px-1 bg-white rounded">- Bullet</code>
                      </div>
                      <textarea
                        value={sowContent}
                        onChange={(e) => setSowContent(e.target.value)}
                        className="w-full h-[600px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900"
                        placeholder="SOW content..."
                      />
                      <p className="mt-2 text-xs text-gray-700">
                        {sowContent.length.toLocaleString()} characters
                      </p>
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
