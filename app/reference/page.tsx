'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReferencePage() {
  const [referenceData, setReferenceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const response = await fetch('/api/reference');
      const data = await response.json();
      setReferenceData(data);
    } catch (error) {
      console.error('Error fetching reference data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reference materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reference Library</h1>
              <p className="mt-2 text-sm text-gray-600">
                All templates, pricing tables, and reference documents in one place
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Generator
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proposal Templates */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  📄 Proposal Templates
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {referenceData?.proposals?.length || 0} templates
                </span>
              </div>

              <div className="space-y-3">
                {referenceData?.proposals?.map((proposal: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{proposal.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {proposal.preview}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {proposal.type}
                          </span>
                          {proposal.hasContent && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              ✓ Content loaded
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="ml-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Tables */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  💰 Pricing Tables
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {referenceData?.estimates?.length || 0} tables
                </span>
              </div>

              <div className="space-y-3">
                {referenceData?.estimates?.map((estimate: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{estimate.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {estimate.rows || 0} line items
                        </p>
                      </div>
                      <button className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Profile */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  👤 Client Profile
                </h2>
                {referenceData?.clientProfile && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    ✓ Loaded
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Default client profile template for proposals and briefs
              </p>
              <button className="mt-4 w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                View Profile Template
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-blue-600">
              {referenceData?.proposals?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Proposal Templates</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-green-600">
              {referenceData?.estimates?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pricing Tables</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-purple-600">1</div>
            <div className="text-sm text-gray-600 mt-1">Client Profile</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-orange-600">
              {(referenceData?.proposals?.length || 0) + (referenceData?.estimates?.length || 0) + 1}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Documents</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📌 How This Helps</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Quick verification:</strong> Ensure all templates and pricing are accurate</li>
            <li>• <strong>Easy access:</strong> Claude can reference this data without reading files</li>
            <li>• <strong>Fast generation:</strong> Generate proposals instantly with up-to-date info</li>
            <li>• <strong>No repeated questions:</strong> All context is available in one place</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
