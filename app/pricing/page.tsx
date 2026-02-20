'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function PricingPage() {
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [budgetFilter, setBudgetFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const supabase = createClient();

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      // Load services
      const { data: servicesData } = await supabase
        .from('service_catalog')
        .select('*')
        .order('category, service_name');

      // Load packages with phases and line items
      const { data: packagesData } = await supabase
        .from('package_templates')
        .select(`
          *,
          package_phases (
            *,
            phase_line_items (*)
          )
        `)
        .order('service_type, tier_level');

      setServices(servicesData || []);
      setPackages(packagesData || []);
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    if (budgetFilter && pkg.total_cost > budgetFilter) return false;
    if (categoryFilter !== 'all' && pkg.service_type !== categoryFilter) return false;
    return true;
  });

  const servicesByCategory = services.reduce((acc, service) => {
    const cat = service.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Loading pricing data...</p>
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
                💰 Pricing Library
              </h1>
              <p className="mt-2 text-sm" style={{ color: '#dbe7ef' }}>
                Browse packages, services, and rates
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
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (max)
              </label>
              <input
                type="number"
                placeholder="e.g., 10000"
                value={budgetFilter || ''}
                onChange={(e) => setBudgetFilter(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Categories</option>
                <option value="branding">Branding</option>
                <option value="website">Website</option>
                <option value="seo">SEO</option>
                <option value="social-media">Social Media</option>
                <option value="video-photo">Video/Photo</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setBudgetFilter(null); setCategoryFilter('all'); }}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📦 Packages ({filteredPackages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.package_name}</h3>
                    <p className="text-sm text-gray-800 mt-1">{pkg.description}</p>
                  </div>
                  {pkg.tier_level && (
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      Tier {pkg.tier_level}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-gray-900">
                      ${pkg.total_cost?.toLocaleString() || '0'}
                    </div>
                    {pkg.is_recurring && (
                      <span className="text-sm text-gray-600">/month</span>
                    )}
                  </div>
                  {pkg.total_hours > 0 && (
                    <p className="text-sm text-gray-800 mt-1">
                      {pkg.total_hours} hours total
                    </p>
                  )}
                  {!pkg.is_fixed_package && (
                    <p className="text-sm text-blue-600 mt-2">📝 Customizable template</p>
                  )}
                </div>

                <div className="mt-4">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    View Details
                  </button>
                </div>

                {pkg.package_phases && pkg.package_phases.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-800 mb-2 font-medium">Phases:</p>
                    <div className="space-y-1">
                      {pkg.package_phases.slice(0, 3).map((phase: any) => (
                        <div key={phase.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-800">{phase.phase_name}</span>
                          {phase.total_cost > 0 && (
                            <span className="text-gray-800">${phase.total_cost}</span>
                          )}
                        </div>
                      ))}
                      {pkg.package_phases.length > 3 && (
                        <p className="text-xs text-gray-700 italic">
                          +{pkg.package_phases.length - 3} more phases
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Service Catalog */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🛠️ Service Catalog ({services.length} services)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryServices.map((service: any) => (
                    <div key={service.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-800">{service.service_name}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ${service.default_rate}
                        </span>
                        <span className="text-xs text-gray-800 ml-1">
                          /{service.billing_unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Package Detail Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPackage(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPackage.package_name}</h2>
                <p className="text-sm text-gray-800 mt-1">{selectedPackage.description}</p>
              </div>
              <button
                onClick={() => setSelectedPackage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-600">×</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900">
                  ${selectedPackage.total_cost?.toLocaleString() || '0'}
                </div>
                {selectedPackage.total_hours > 0 && (
                  <p className="text-gray-800 mt-1">{selectedPackage.total_hours} hours total</p>
                )}
              </div>

              {selectedPackage.package_phases?.map((phase: any) => (
                <div key={phase.id} className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{phase.phase_name}</h3>
                    {phase.total_cost > 0 && (
                      <span className="text-lg font-bold text-gray-900">
                        ${phase.total_cost}
                      </span>
                    )}
                  </div>
                  {phase.phase_line_items && phase.phase_line_items.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-900 border-b border-gray-300">
                            <th className="pb-2 font-bold">Item</th>
                            <th className="pb-2 text-right font-bold">Hours</th>
                            <th className="pb-2 text-right font-bold">Rate</th>
                            <th className="pb-2 text-right font-bold">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phase.phase_line_items.map((item: any) => (
                            <tr key={item.id} className="border-b border-gray-200 last:border-0">
                              <td className="py-2 text-gray-900">
                                {item.line_item_name}
                                {item.is_optional && (
                                  <span className="ml-2 text-xs text-blue-600 font-medium">(optional)</span>
                                )}
                              </td>
                              <td className="py-2 text-right text-gray-900">
                                {item.hours || '-'}
                              </td>
                              <td className="py-2 text-right text-gray-900">
                                {item.rate ? `$${item.rate}` : '-'}
                              </td>
                              <td className="py-2 text-right font-semibold text-gray-900">
                                {item.cost > 0 ? `$${item.cost}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedPackage(null)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Use This Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
