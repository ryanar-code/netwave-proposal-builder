'use client';

import { useState, useRef, DragEvent } from 'react';
import { PROJECT_TYPES, DocumentType } from '@/types';
import { saveAs } from 'file-saver';

type LoadingState = {
  [key in DocumentType]?: boolean;
};

type DocumentContent = {
  [key in DocumentType]?: string;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState<LoadingState>({});
  const [documents, setDocuments] = useState<DocumentContent>({});
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validExtensions = ['.pdf', '.txt', '.md', '.doc', '.docx'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = validExtensions.includes(extension);
      const isValidSize = file.size <= 10 * 1024 * 1024;

      if (!isValidType) {
        setError(`File ${file.name} has an invalid type. Accepted: PDF, TXT, MD, DOC, DOCX`);
        return false;
      }
      if (!isValidSize) {
        setError(`File ${file.name} exceeds 10MB size limit`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateDocument = async (docType: DocumentType) => {
    setError(null);

    if (!clientName || !projectType || !deadline) {
      setError('Please fill in all required fields');
      return;
    }

    if (files.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    setLoading(prev => ({ ...prev, [docType]: true }));

    try {
      const formData = new FormData();
      formData.append('clientName', clientName);
      formData.append('projectType', projectType);
      formData.append('deadline', deadline);
      formData.append('documentType', docType);
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(prev => ({ ...prev, [docType]: data.content }));
      } else {
        setError(data.error || 'Failed to generate document');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const downloadDocument = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename);
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    alert(`${section} copied to clipboard!`);
  };

  const documentCards = [
    {
      type: 'statementOfWork' as DocumentType,
      title: 'Statement of Work',
      subtitle: 'Client-facing proposal with pricing',
      icon: '📄',
      color: '#00e2ff',
      filename: 'SOW.txt'
    },
    {
      type: 'internalBrief' as DocumentType,
      title: 'Internal Team Brief',
      subtitle: 'Strategy & creative direction',
      icon: '🎯',
      color: '#dbe7ef',
      filename: 'Internal_Brief.txt'
    },
    {
      type: 'timeline' as DocumentType,
      title: 'Project Timeline',
      subtitle: 'Phases & milestones',
      icon: '📅',
      color: '#dbe7ef',
      filename: 'Timeline.txt'
    },
    {
      type: 'kickoffPresentation' as DocumentType,
      title: 'Kickoff Presentation',
      subtitle: 'Internal meeting outline',
      icon: '🚀',
      color: '#dbe7ef',
      filename: 'Kickoff.txt'
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#10121a' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-5xl font-bold" style={{ color: '#ffffff' }}>
              Netwave <span style={{ color: '#00e2ff' }}>Proposal Accelerator</span>
            </h1>
            <a
              href="/reference"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title="View all templates and pricing tables"
            >
              📚 Reference Library
            </a>
          </div>
          <p className="text-xl" style={{ color: '#dbe7ef' }}>
            Generate professional proposals, SOWs, and project documentation in seconds using AI
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Details</h2>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Reference Documents
            </label>
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Rate cards, previous proposals, client briefs, transcripts
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 mb-6">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-700 font-medium">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="clientName" className="block text-sm font-semibold text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-gray-900"
                style={{ color: '#10121a' }}
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label htmlFor="projectType" className="block text-sm font-semibold text-gray-700 mb-2">
                Project Type
              </label>
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-gray-900"
                style={{ color: '#10121a' }}
              >
                <option value="">Select type</option>
                {PROJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-semibold text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="date"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all text-gray-900"
                style={{ color: '#10121a', colorScheme: 'light' }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Document Generation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documentCards.map((card) => (
            <div
              key={card.type}
              className="bg-white rounded-2xl shadow-xl p-6 transition-all hover:shadow-2xl"
              style={{
                borderTop: `4px solid ${card.type === 'statementOfWork' ? '#00e2ff' : '#dbe7ef'}`
              }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{card.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                    <p className="text-sm text-gray-500">{card.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Content or Generate Button */}
              {documents[card.type] ? (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {documents[card.type]!.substring(0, 300)}
                      {documents[card.type]!.length > 300 && '...'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadDocument(
                        documents[card.type]!,
                        `${clientName.replace(/\s+/g, '_')}_${card.filename}`
                      )}
                      className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
                      style={{ background: card.type === 'statementOfWork' ? '#00e2ff' : '#dbe7ef', color: '#10121a' }}
                    >
                      📥 Download
                    </button>
                    <button
                      onClick={() => copyToClipboard(documents[card.type]!, card.title)}
                      className="px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => generateDocument(card.type)}
                      className="px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      disabled={loading[card.type]}
                    >
                      🔄
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => generateDocument(card.type)}
                  disabled={loading[card.type]}
                  className="w-full py-4 rounded-lg font-semibold transition-all disabled:opacity-50"
                  style={{
                    background: card.type === 'statementOfWork' ? '#00e2ff' : '#e0e0e0',
                    color: '#10121a'
                  }}
                >
                  {loading[card.type] ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Generating...
                    </span>
                  ) : (
                    `✨ Generate ${card.title}`
                  )}
                </button>
              )}

              {/* Cost estimate */}
              <p className="text-xs text-gray-400 text-center mt-2">
                ~${card.type === 'statementOfWork' ? '0.05' : '0.02-0.03'} per generation
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {files.length > 0 && clientName && projectType && deadline && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                documentCards.forEach(card => generateDocument(card.type));
              }}
              className="px-8 py-4 rounded-lg font-bold text-lg transition-all"
              style={{ background: '#00e2ff', color: '#10121a' }}
            >
              ⚡ Generate All Documents (~$0.12)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
