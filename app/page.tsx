'use client';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#10121a' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-5xl font-bold" style={{ color: '#ffffff' }}>
              Netwave <span style={{ color: '#00e2ff' }}>Proposal Accelerator</span>
            </h1>
          </div>
          <p className="text-xl mb-8" style={{ color: '#dbe7ef' }}>
            Upload client briefs → Netwave suggests packages → Generate professional proposals instantly
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/proposal-builder"
              className="px-8 py-4 text-xl font-bold rounded-lg hover:shadow-xl transition-all"
              style={{ background: '#00e2ff', color: '#10121a' }}
            >
              📄 Generate Pricing Proposal
            </a>
            <a
              href="/pricing"
              className="px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
            >
              💰 View Pricing Library
            </a>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#00e2ff' }}>
                <span className="text-4xl">📤</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Upload Brief</h3>
              <p className="text-gray-800">Upload client materials, set budget and project requirements</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Netwave Analyzes</h3>
              <p className="text-gray-800">AI reviews requirements and suggests best-fit pricing packages</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✏️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Edit & Generate</h3>
              <p className="text-gray-800">Review, customize hours/costs, and generate final proposals</p>
            </div>
          </div>
          <div className="text-center">
            <a
              href="/proposal-builder"
              className="inline-block px-12 py-5 text-2xl font-bold rounded-lg hover:shadow-xl transition-all"
              style={{ background: '#00e2ff', color: '#10121a' }}
            >
              Get Started →
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">⚡ Lightning Fast</h3>
            <p className="text-gray-800 mb-4">
              Generate complete pricing proposals in minutes, not hours. Netwave analyzes your client's needs and matches them with our comprehensive pricing database.
            </p>
            <ul className="space-y-2 text-gray-800">
              <li>✓ Instant package recommendations</li>
              <li>✓ Budget-based filtering</li>
              <li>✓ Multiple pricing scenarios</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">✏️ Fully Editable</h3>
            <p className="text-gray-800 mb-4">
              Edit proposals two ways: use natural language prompts or click to edit hours and rates directly. Changes recalculate instantly.
            </p>
            <ul className="space-y-2 text-gray-800">
              <li>✓ Prompt-based editing: "Add 10 hours to design"</li>
              <li>✓ Manual inline editing</li>
              <li>✓ Live preview with auto-calculations</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📦 Comprehensive Packages</h3>
            <p className="text-gray-800 mb-4">
              Access our complete pricing library with fixed packages and customizable templates for every project type.
            </p>
            <ul className="space-y-2 text-gray-800">
              <li>✓ Branding (3 tiers: $6k-$14k)</li>
              <li>✓ Website, Video/Photo, SEO</li>
              <li>✓ Social Media & Custom projects</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 Smart Suggestions</h3>
            <p className="text-gray-800 mb-4">
              Netwave doesn't just match packages—it understands your client's needs and budget to recommend the perfect fit.
            </p>
            <ul className="space-y-2 text-gray-800">
              <li>✓ Analyzes uploaded briefs</li>
              <li>✓ Considers budget constraints</li>
              <li>✓ Suggests alternatives & add-ons</li>
            </ul>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-12">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to accelerate your proposals?</h2>
          <p className="text-xl text-blue-100 mb-8">Start generating professional pricing proposals in minutes</p>
          <a
            href="/proposal-builder"
            className="inline-block px-12 py-5 text-2xl font-bold rounded-lg hover:shadow-2xl transition-all"
            style={{ background: '#00e2ff', color: '#10121a' }}
          >
            Generate Your First Proposal
          </a>
        </div>
      </div>
    </div>
  );
}
