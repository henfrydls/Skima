import { ArrowRight, Download, Github, LayoutGrid, TrendingUp, BarChart3, Shield, Clock, Eye, Search, Users, LineChart, Target, Database, Cpu, Monitor } from 'lucide-react';

const GITHUB_URL = 'https://github.com/henfrydls/Skima';
const GITHUB_RELEASES = 'https://github.com/henfrydls/Skima/releases';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ===== NAV ===== */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img alt="Skima Logo" className="h-8 w-auto" src="/skima-full.svg" />
          </div>
          <div className="flex items-center gap-8">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block text-sm font-medium hover:text-primary transition-colors"
            >
              View on GitHub
            </a>
            <a
              href="/demo"
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
            >
              Try Live Demo
            </a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden bg-white px-6 lg:px-20 py-16 lg:py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="flex flex-col gap-8">
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-slate-900">
              Know what your team <span className="text-primary">can do.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
              Map skills. Spot gaps. Track growth.<br />
              Free and open source. Your data never leaves your machine.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="/demo"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-200 transition-all"
              >
                Try Live Demo
                <ArrowRight size={18} />
              </a>
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Download size={16} />
                Download for Windows, Linux & macOS
              </a>
            </div>
            <p className="text-xs text-slate-400">
              No sign-up required. Explore with sample data.
            </p>
          </div>

          {/* Right: Screenshot */}
          <div className="relative">
            <div className="aspect-video bg-slate-100 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
              <img
                src="/screenshots/skima-dashboard.png"
                alt="Skima Dashboard — Executive KPIs, team maturity index, and strategic insights"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 hidden md:flex items-center gap-4">
              <div className="size-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Privacy Status</p>
                <p className="text-sm font-bold text-slate-900">Fully Local (GDPR Compliant)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== WHY NOT A SPREADSHEET ===== */}
      <section className="bg-slate-50 px-6 lg:px-20 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Why not a spreadsheet?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Your team probably tracks skills in a spreadsheet. It works. Until it doesn't.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PainCard
              icon={<Clock size={24} />}
              title="No history"
              description="You overwrite last quarter's data. There's no way to see how your team has grown."
            />
            <PainCard
              icon={<Eye size={24} />}
              title="No visualization"
              description="Just rows and columns. No dashboard, no trends, no insights at a glance."
            />
            <PainCard
              icon={<Search size={24} />}
              title="No gap analysis"
              description="Comparing skills across people means manual work across tabs and formulas."
            />
          </div>

          <p className="mt-12 text-center text-base text-slate-600 font-medium">
            Skima gives you all of that. Without the enterprise price tag.
          </p>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="bg-white px-6 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
              Everything you need to manage team skills
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Four views. One source of truth.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard
              icon={<LayoutGrid size={24} />}
              title="Team Matrix"
              description="See your entire team's competencies at a glance. Filter by role, category, or criticality."
              image="/screenshots/skima-matrix.png"
            />
            <FeatureCard
              icon={<TrendingUp size={24} />}
              title="Evolution Tracking"
              description="Measure skill growth over time. Identify top performers and who needs support."
              image="/screenshots/skima-evolution.png"
            />
            <FeatureCard
              icon={<BarChart3 size={24} />}
              title="Executive Dashboard"
              description="Maturity index, talent risk, expert density — KPIs and strategic insights for leadership."
              image="/screenshots/skima-dashboard.png"
            />
            <FeatureCard
              icon={<Shield size={24} />}
              title="Role Profiles"
              description="Define expected skills per role. Measure coverage and identify training priorities."
              image="/screenshots/skima-matrix.png"
            />
          </div>
        </div>
      </section>

      {/* ===== BUILT FOR YOUR ROLE ===== */}
      <section className="bg-slate-900 text-white px-6 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Built for your role</h2>
            <p className="text-slate-400">
              Whether you lead a team or lead the company. Skima shows you what matters.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <RoleCard
              icon={<Cpu size={24} />}
              role="Engineering Managers"
              description="Staff projects with confidence. See which skills exist on your team and where the gaps are. Before they become blockers."
            />
            <RoleCard
              icon={<Users size={24} />}
              role="HR & Talent"
              description="Track competency levels across the organization. Identify training needs, compliance gaps, and succession risks."
            />
            <RoleCard
              icon={<LineChart size={24} />}
              role="Directors & VPs"
              description="Get strategic visibility into bench strength. Track improvement over time and make evidence-based decisions."
            />
            <RoleCard
              icon={<Target size={24} />}
              role="CEOs & Founders"
              description="Answer the hardest staffing question: should you hire or build internally? See your team's real capabilities."
            />
            <RoleCard
              icon={<BarChart3 size={24} />}
              role="Ops & PMO"
              description="Match skills to project requirements. Allocate resources based on actual capabilities, not guesswork."
            />
            <RoleCard
              icon={<Database size={24} />}
              role="Analysts"
              description="Structured skill data you can track, trend, and report. No more manual spreadsheet aggregation."
            />
          </div>
        </div>
      </section>

      {/* ===== TECH + PRIVACY ===== */}
      <section className="bg-white px-6 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Content */}
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-black text-slate-900 mb-6 leading-tight">
              Your data. Your machine. Always.
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Skima is a desktop application built with privacy as the core feature. Your team's data never leaves your machine unless you choose to export it. No subscriptions, no cloud accounts, no data harvesting.
            </p>

            {/* Tech badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <LayoutGrid size={14} />, label: 'React' },
                { icon: <Database size={14} />, label: 'SQLite' },
                { icon: <Cpu size={14} />, label: 'Tauri' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  {icon} {label}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Available for Windows, macOS, and Linux
            </p>
          </div>

          {/* Right: Feature box */}
          <div className="lg:w-1/2 bg-primary/5 rounded-3xl p-10 border border-primary/10 relative">
            {/* Floating badge */}
            <div className="absolute -top-6 left-10 bg-primary text-white p-4 rounded-2xl shadow-lg flex items-center gap-3">
              <span className="material-symbols-outlined">security</span>
              <span className="font-bold">Zero-Cloud Architecture</span>
            </div>

            {/* Feature list */}
            <div className="space-y-6 pt-4">
              <PrivacyCheckItem text="Data stored in local SQLite database" />
              <PrivacyCheckItem text="Offline-first desktop application" />
              <PrivacyCheckItem text="Direct CSV/JSON export/import" />
              <PrivacyCheckItem text="Open source transparency" />
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">
          PolyForm Noncommercial 1.0.0. Free for personal use. Commercial license available.
        </p>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="px-6 lg:px-20 pt-6 pb-20">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#35797f] via-primary to-[#1e4a50] rounded-[2.5rem] p-12 lg:p-20 text-center text-white relative overflow-hidden">
          {/* Radial highlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_rgba(255,255,255,0.12)_0%,_transparent_70%)]" />
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <h2 className="text-4xl lg:text-6xl font-black leading-tight text-white">
              Ready to see what your <br />team can do?
            </h2>
            <p className="text-white/90 font-medium text-lg max-w-md mx-auto">
              Free and open source. Set up in under 5 minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-200/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Download Free
                <Download size={18} />
              </a>
              <a
                href="/demo"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium text-base transition-colors"
              >
                Try Live Demo
                <ArrowRight size={18} />
              </a>
            </div>
            <p className="text-white/60 text-sm">
              Windows, macOS & Linux. No account needed.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-50 border-t border-slate-200 px-6 lg:px-20 py-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <img alt="Skima Logo" className="h-5 w-auto opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0" src="/skima-full.svg" />
            <span className="leading-none">Built by <a href="https://henfrydls.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary transition-colors font-medium">DLSLabs</a></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">GitHub</a>
            <a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">Releases</a>
            <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">License</a>
            <span>© 2026 Skima</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===== INTERNAL COMPONENTS =====

function PainCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="size-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description, image }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="p-8">
        <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
      {image && (
        <div className="px-8 pb-6">
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <img src={image} alt={title} className="w-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          </div>
        </div>
      )}
    </div>
  );
}

function RoleCard({ icon, role, description }) {
  return (
    <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-primary transition-all">
      <div className="text-primary text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{role}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function PrivacyCheckItem({ text }) {
  return (
    <div className="flex gap-4">
      <div className="text-primary">
        <span className="material-symbols-outlined">check_circle</span>
      </div>
      <p className="text-slate-700 font-medium">{text}</p>
    </div>
  );
}
