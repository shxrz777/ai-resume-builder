import { motion } from 'framer-motion'
import { Sparkles, FileText, Download, CreditCard, Zap, Shield, Star, ArrowRight, CheckCircle2, Wand2 } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
}

const features = [
  { icon: Wand2, title: 'AI-Powered Writing', desc: 'Claude AI enhances your bullet points with strong action verbs and quantified achievements that impress hiring managers.' },
  { icon: FileText, title: '3 Pro Templates', desc: 'Modern, Minimal, and Creative templates designed by professional resume writers to stand out.' },
  { icon: Zap, title: 'ATS Optimized', desc: 'Every resume is structured to pass Applicant Tracking Systems and reach human recruiters.' },
  { icon: Download, title: 'PDF Download', desc: 'Export a pixel-perfect PDF ready to send to employers, formatted for both print and digital.' },
  { icon: Shield, title: 'Privacy First', desc: 'Your data is never stored or sold. Process locally, download, done.' },
  { icon: CreditCard, title: 'One-Time Payment', desc: 'Just $9 per resume. No subscriptions, no hidden fees, no nonsense.' },
]

const testimonials = [
  { name: 'Sarah Chen', role: 'Software Engineer @ Google', text: 'Got 3 interviews in one week after using ResumeAI. The AI made my bullet points 10x stronger.', stars: 5 },
  { name: 'Marcus Johnson', role: 'Product Manager @ Stripe', text: 'The modern template is absolutely gorgeous. Worth every penny — landed my dream job at Stripe!', stars: 5 },
  { name: 'Priya Patel', role: 'Data Scientist @ Meta', text: "I was skeptical but the ATS optimization actually works. My resume finally started getting responses.", stars: 5 },
]

const steps = [
  { num: '01', title: 'Enter Your Info', desc: 'Fill in your experience, education, and skills in our intuitive form.' },
  { num: '02', title: 'AI Enhances It', desc: 'Claude AI rewrites your content with powerful language that gets noticed.' },
  { num: '03', title: 'Download & Apply', desc: 'Choose your template, pay once, download your polished PDF resume.' },
]

export default function LandingPage({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">ResumeAI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-white/50">Powered by Claude AI</span>
          <button onClick={onStart} className="btn-primary text-sm py-2 px-5">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-violet-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by Claude AI • Trusted by 50,000+ professionals</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] mb-6"
          >
            Your Dream Resume,{' '}
            <span className="gradient-text">Built by AI</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Transform your experience into a stunning, ATS-optimized resume in minutes.
            Choose from 3 professional templates. Download as PDF instantly.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={onStart}
              className="btn-primary flex items-center gap-2 text-lg py-4 px-8"
            >
              Build My Resume <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No account needed • $9 one-time
            </div>
          </motion.div>

          {/* Hero mockup */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="relative mx-auto max-w-4xl"
          >
            <div className="glass-card p-1 overflow-hidden" style={{ boxShadow: '0 40px 100px rgba(124, 58, 237, 0.2), 0 0 0 1px rgba(255,255,255,0.05)' }}>
              <div className="bg-[#0d0d14] rounded-xl overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0a0a10]">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <div className="ml-3 flex-1 glass rounded-md py-1 px-3 text-xs text-white/30">resumeai.app/builder</div>
                </div>

                {/* App preview */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="glass rounded-xl p-4 border border-white/5">
                      <div className="text-xs text-violet-400 mb-2 font-medium">AI ENHANCEMENT</div>
                      <div className="space-y-2">
                        <div className="h-2.5 bg-white/5 rounded-full w-full shimmer" />
                        <div className="h-2.5 bg-white/5 rounded-full w-4/5 shimmer" style={{ animationDelay: '0.2s' }} />
                        <div className="h-2.5 bg-white/5 rounded-full w-3/5 shimmer" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['Modern', 'Minimal', 'Creative'].slice(0, 2).map(t => (
                        <div key={t} className="glass rounded-lg p-3 text-center text-xs text-white/40 border border-white/5">
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resume preview mockup */}
                  <div className="bg-white rounded-xl p-4 text-gray-800">
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="h-4 bg-violet-600 rounded w-2/3 mb-1" />
                      <div className="h-2.5 bg-gray-300 rounded w-1/2" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-full" />
                      <div className="h-2 bg-gray-200 rounded w-5/6" />
                      <div className="h-2 bg-gray-200 rounded w-4/5" />
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="h-2.5 bg-gray-400 rounded w-1/3 mb-2" />
                      <div className="space-y-1.5">
                        <div className="h-1.5 bg-gray-200 rounded w-full" />
                        <div className="h-1.5 bg-gray-200 rounded w-11/12" />
                        <div className="h-1.5 bg-gray-200 rounded w-4/5" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {['React', 'TypeScript', 'Node.js'].map(s => (
                        <span key={s} className="text-[10px] bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -left-4 hidden sm:flex glass rounded-xl px-3 py-2 items-center gap-2 text-sm"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white/80 font-medium">ATS Score: 94/100</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-4 -right-4 hidden sm:flex glass rounded-xl px-3 py-2 items-center gap-2 text-sm"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-white/80 font-medium">AI Enhanced ✨</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-violet-400 text-sm font-medium tracking-widest uppercase mb-4">How It Works</div>
            <h2 className="text-4xl sm:text-5xl font-bold">Ready in <span className="gradient-text">3 minutes</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="relative"
              >
                <div className="glass-card p-8 h-full glass-hover">
                  <div className="text-5xl font-black gradient-text mb-4">{step.num}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-white/20 text-2xl">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-violet-400 text-sm font-medium tracking-widest uppercase mb-4">Everything You Need</div>
            <h2 className="text-4xl sm:text-5xl font-bold">Features that <span className="gradient-text">actually matter</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.5}
                className="glass-card glass-hover p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-violet-400 text-sm font-medium tracking-widest uppercase mb-4">Social Proof</div>
            <h2 className="text-4xl sm:text-5xl font-bold">Real people, <span className="gradient-text">real results</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.5}
                className="glass-card p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="text-violet-400 text-sm font-medium tracking-widest uppercase mb-4">Simple Pricing</div>
            <h2 className="text-4xl sm:text-5xl font-bold">One price, <span className="gradient-text">forever yours</span></h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
          >
            <div className="glass-card p-8 relative overflow-hidden" style={{ background: 'rgba(124, 58, 237, 0.08)', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
              <div className="absolute top-4 right-4">
                <span className="text-xs font-bold text-violet-300 glass px-3 py-1 rounded-full border border-violet-500/30">MOST POPULAR</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-6xl font-black text-white">$9</span>
                <span className="text-white/40 mb-3">one-time</span>
              </div>
              <p className="text-white/60 mb-8">Everything you need to land your dream job.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'AI-powered resume enhancement',
                  '3 professional templates',
                  'ATS optimization score',
                  'PDF download (unlimited)',
                  'No watermarks',
                  'Lifetime access to your resume',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white/70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onStart} className="btn-primary w-full text-center flex items-center justify-center gap-2 text-lg py-4">
                Start Building <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl sm:text-6xl font-black mb-6">
            Ready to land your <span className="gradient-text">dream job?</span>
          </h2>
          <p className="text-white/50 text-lg mb-8">Join 50,000+ professionals who got hired faster with ResumeAI.</p>
          <button onClick={onStart} className="btn-primary flex items-center gap-2 text-xl py-5 px-10 mx-auto">
            Build My Resume Now <ArrowRight className="w-6 h-6" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-white/30 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-white/60">ResumeAI</span>
        </div>
        <p>© 2025 ResumeAI. Powered by Claude AI. All rights reserved.</p>
      </footer>
    </motion.div>
  )
}
