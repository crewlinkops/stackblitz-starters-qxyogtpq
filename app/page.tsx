import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-sans selection:bg-red-600/30 overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-zinc-100 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-zinc-600 rounded-xl flex items-center justify-center font-bold text-zinc-900 dark:text-white shadow-lg shadow-red-600/20">
              C
            </div>
            <span className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight">Crewlink</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-zinc-900 dark:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-zinc-900 dark:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-5 py-2.5 text-sm font-bold text-zinc-900 dark:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-zinc-200 dark:border-white/5 hover:border-zinc-200 dark:border-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/admin"
              className="px-5 py-2.5 text-sm font-bold text-zinc-900 dark:text-white bg-gradient-to-r from-red-700 to-zinc-600 hover:from-red-600 hover:to-zinc-500 rounded-xl shadow-lg shadow-red-600/25 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -tranzinc-x-1/2 -tranzinc-y-1/2 w-[800px] h-[800px] bg-red-700/20 blur-[120px] rounded-full"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-zinc-600/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-sm font-bold tracking-wide uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            The Future of Field Service
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 dark:text-white tracking-tight lg:leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Streamline your operations <br className="hidden md:block" /> and book more jobs.
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Crewlink gives you the tools to manage your team, accept bookings instantly, and keep your customers in the loop with automated SMS—all from one beautiful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin"
              className="w-full sm:w-auto px-8 py-4 text-center text-lg font-bold text-zinc-900 dark:text-white bg-gradient-to-r from-red-700 to-zinc-600 hover:from-red-600 hover:to-zinc-500 rounded-2xl shadow-xl shadow-red-600/25 transition-all hover:scale-105"
            >
              Start Your Free Trial
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 text-center text-lg font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl transition-all"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Dashboard Preview Image/Mockup */}
        <div className="mt-20 max-w-6xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="aspect-[16/9] md:aspect-[21/9] bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl shadow-emerald-900/20 overflow-hidden relative">
            {/* Mockup Header */}
            <div className="absolute top-0 inset-x-0 h-12 bg-zinc-100 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-white/5 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
              <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
            </div>
            {/* Fake UI Content */}
            <div className="absolute top-12 inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-transparent"></div>
            <div className="absolute bottom-10 left-10 right-10 flex gap-6 hidden md:flex">
              <div className="flex-1 bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 bg-red-600/20 rounded-lg mb-4"></div>
                <div className="w-24 h-4 bg-white/20 rounded mb-2"></div>
                <div className="w-16 h-8 bg-white/40 rounded"></div>
              </div>
              <div className="flex-1 bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 bg-red-600/20 rounded-lg mb-4"></div>
                <div className="w-24 h-4 bg-white/20 rounded mb-2"></div>
                <div className="w-16 h-8 bg-white/40 rounded"></div>
              </div>
              <div className="flex-1 bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg mb-4"></div>
                <div className="w-24 h-4 bg-white/20 rounded mb-2"></div>
                <div className="w-16 h-8 bg-white/40 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="py-10 border-y border-zinc-200 dark:border-white/5 bg-zinc-100/20 dark:bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-8">Trusted by growing service businesses</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale">
            <div className="text-2xl font-bold font-serif">AeroFix</div>
            <div className="text-2xl font-black italic tracking-tighter">SparkElectric</div>
            <div className="text-2xl font-semibold uppercase tracking-widest">LawnMasters</div>
            <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-full"></div>CleanCo</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">Everything you need, nothing you don&apos;t.</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">We stripped away the clutter to build a platform that actually helps you work faster, not one that requires a manual.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-100/40 dark:bg-zinc-900/40 p-8 rounded-3xl border border-zinc-200 dark:border-white/5 hover:bg-zinc-200/40 dark:bg-zinc-800/40 transition-colors group">
              <div className="w-14 h-14 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-red-600/20 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Unified Google Calendar Sync</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Connect your business Google Calendar in one click. Crewlink automatically blocks out busy times ensuring double-bookings are a thing of the past.
              </p>
            </div>

            <div className="bg-zinc-100/40 dark:bg-zinc-900/40 p-8 rounded-3xl border border-zinc-200 dark:border-white/5 hover:bg-zinc-200/40 dark:bg-zinc-800/40 transition-colors group">
              <div className="w-14 h-14 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-red-600/20 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Automated SMS Outreach</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Stop playing phone tag. Send direct booking links right to your customers&apos; phones, letting them describe their issue and pick a time effortlessly.
              </p>
            </div>

            <div className="bg-zinc-100/40 dark:bg-zinc-900/40 p-8 rounded-3xl border border-zinc-200 dark:border-white/5 hover:bg-zinc-200/40 dark:bg-zinc-800/40 transition-colors group">
              <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Smart Booking Wizard</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Provide a premium booking experience for your clients. Our responsive wizard guides them step-by-step, increasing conversion rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 px-6 bg-zinc-100/20 dark:bg-zinc-900/20 border-t border-zinc-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6">Simple, transparent pricing.</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">Start for free, upgrade when your business demands it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Tier 1 */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-8 rounded-3xl border border-zinc-200 dark:border-white/10 flex flex-col">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Starter</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">Perfect for solo technicians just getting started.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">$0</span>
                <span className="text-zinc-500 dark:text-zinc-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Up to 30 bookings/month
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Basic booking wizard
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  1 Technician access
                </li>
              </ul>
              <Link href="/admin" className="w-full block py-3 text-center rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold transition-colors">
                Get Started
              </Link>
            </div>

            {/* Tier 2 */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-8 rounded-3xl border border-red-600 shadow-xl shadow-red-600/10 flex flex-col relative transform md:-tranzinc-y-4">
              <div className="absolute top-0 left-1/2 -tranzinc-x-1/2 -tranzinc-y-1/2 bg-red-700 text-zinc-900 dark:text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Professional</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">For growing service teams needing automation.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">$49</span>
                <span className="text-zinc-500 dark:text-zinc-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Unlimited bookings
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Premium SMS Outreach
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Google Calendar Two-Way Sync
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Up to 10 Technicians
                </li>
              </ul>
              <Link href="/admin" className="w-full block py-3 text-center rounded-xl bg-gradient-to-r from-red-700 to-zinc-600 hover:from-red-600 hover:to-zinc-500 text-zinc-900 dark:text-white font-bold transition-all hover:scale-[1.02]">
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Tier 3 */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-8 rounded-3xl border border-zinc-200 dark:border-white/10 flex flex-col">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Enterprise</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">Custom solutions for large scale operations.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">Custom</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Everything in Pro
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Unlimited Technicians
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Dedicated Account Manager
                </li>
              </ul>
              <Link href="/admin" className="w-full block py-3 text-center rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 dark:bg-zinc-950 py-12 px-6 border-t border-zinc-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center font-bold text-zinc-900 dark:text-white">
              C
            </div>
            <span className="font-bold text-lg text-zinc-900 dark:text-white">Crewlink</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="#" className="hover:text-zinc-900 dark:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-900 dark:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-900 dark:text-white transition-colors">Contact</a>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Crewlink Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
