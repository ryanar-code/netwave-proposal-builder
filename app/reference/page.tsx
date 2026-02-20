'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ModalType = 'view' | 'edit';

export default function ReferencePage() {
  const [referenceData, setReferenceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<ModalType>('view');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

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

  const openModal = (item: any, type: ModalType) => {
    setSelectedItem(item);
    setModalType(type);
    if (type === 'edit') {
      setEditContent(item.content || '');
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setEditContent('');
  };

  const handleSave = async () => {
    if (!selectedItem) return;

    setSaving(true);
    try {
      const response = await fetch('/api/reference/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          type: selectedItem.type,
          content: editContent
        })
      });

      if (response.ok) {
        await fetchReferenceData();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Loading reference materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: '#10121a' }} className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>
                📚 Reference Library
              </h1>
              <p className="mt-2 text-sm" style={{ color: '#dbe7ef' }}>
                View, edit, and manage all templates, pricing tables, and reference documents
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 font-semibold rounded-lg transition-colors"
              style={{ background: '#00e2ff', color: '#10121a' }}
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
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{proposal.name}</h3>
                        <p className="text-sm text-gray-800 mt-1">
                          {proposal.description || proposal.preview.substring(0, 100)}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {proposal.category}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {proposal.content?.length || 0} chars
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openModal(proposal, 'view')}
                          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() => openModal(proposal, 'edit')}
                          className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                      </div>
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
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 capitalize">{estimate.name}</h3>
                        <p className="text-xs text-gray-800 mt-1">
                          {estimate.rows || 0} line items
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal({ ...estimate, type: 'estimate' }, 'view')}
                        className="flex-1 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => openModal({ ...estimate, type: 'estimate' }, 'edit')}
                        className="flex-1 px-3 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        ✏️ Edit
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
              <p className="text-sm text-gray-800 mb-4">
                Default client profile template for proposals and briefs
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal({
                    content: referenceData?.clientProfile,
                    name: 'Client Profile Template',
                    type: 'profile'
                  }, 'view')}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  👁️ View
                </button>
                <button
                  onClick={() => openModal({
                    content: referenceData?.clientProfile,
                    name: 'Client Profile Template',
                    type: 'profile'
                  }, 'edit')}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-blue-600">
              {referenceData?.proposals?.length || 0}
            </div>
            <div className="text-sm text-gray-800 mt-1">Proposal Templates</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-green-600">
              {referenceData?.estimates?.length || 0}
            </div>
            <div className="text-sm text-gray-800 mt-1">Pricing Tables</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-purple-600">1</div>
            <div className="text-sm text-gray-800 mt-1">Client Profile</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-orange-600">
              {(referenceData?.proposals?.length || 0) + (referenceData?.estimates?.length || 0) + 1}
            </div>
            <div className="text-sm text-gray-800 mt-1">Total Documents</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📌 How This Helps</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Quick verification:</strong> Ensure all templates and pricing are accurate</li>
            <li>• <strong>Easy access:</strong> Claude can reference this data without reading files</li>
            <li>• <strong>Fast generation:</strong> Generate proposals instantly with up-to-date info</li>
            <li>• <strong>Editable:</strong> Update templates and pricing directly in the database</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalType === 'view' ? '👁️ View' : '✏️ Edit'}: {selectedItem.name}
                </h2>
                {selectedItem.category && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {selectedItem.category}
                  </span>
                )}
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-600">×</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalType === 'view' ? (
                <div className="prose prose-sm max-w-none">
                  {selectedItem.type === 'estimate' ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Line Items ({selectedItem.rows})</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-gray-900">Tier</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-900">Line Item</th>
                              <th className="px-4 py-2 text-right font-semibold text-gray-900">Hours</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedItem.items?.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-blue-600">{item.tier_name || '-'}</td>
                                <td className="px-4 py-2 text-gray-900">{item.line_item}</td>
                                <td className="px-4 py-2 text-right text-gray-900">{item.hours || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed text-sm">
                      {selectedItem.content}
                    </pre>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Enter content..."
                  />
                  <p className="mt-2 text-xs text-gray-700">
                    {editContent.length.toLocaleString()} characters
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              {modalType === 'edit' ? (
                <>
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
