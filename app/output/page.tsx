'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function OutputContent() {
  const searchParams = useSearchParams();
  const content = searchParams.get('content');
  const title = searchParams.get('title') || 'Generated Document';

  const decodedContent = content ? decodeURIComponent(content) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(decodedContent);
    alert('Copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([decodedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600 mt-1">Generated output ready to use</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📋 Copy
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                ⬇️ Download
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Display */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            {decodedContent ? (
              <div className="prose prose-sm sm:prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {decodedContent}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No content to display</p>
                <Link
                  href="/"
                  className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Generator
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Document Info */}
        {decodedContent && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Word Count</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {decodedContent.split(/\s+/).length.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Character Count</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {decodedContent.length.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Lines</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {decodedContent.split('\n').length.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OutputPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading output...</p>
        </div>
      </div>
    }>
      <OutputContent />
    </Suspense>
  );
}
