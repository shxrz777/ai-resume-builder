import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Sparkles, Eye, CheckCircle2, RotateCcw, Lightbulb } from 'lucide-react'
import ModernTemplate from './templates/ModernTemplate'
import MinimalTemplate from './templates/MinimalTemplate'
import CreativeTemplate from './templates/CreativeTemplate'
import PaymentModal from './PaymentModal'
import { generatePDF } from '../lib/pdfGenerator'

const TEMPLATES = [
  { id: 'modern', label: 'Modern', desc: 'Two-column with color sidebar' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean single-column elegance' },
  { id: 'creative', label: 'Creative', desc: 'Bold gradient with timeline' },
]

const DEMO_RESUME = {
  personalInfo: {
    name: 'Alexandra Reynolds',
    title: 'Senior Software Engineer',
    email: 'alex.reynolds@email.com',
    phone: '+1 (415) 555-0192',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexreynolds',
    website: 'alexreynolds.dev',
  },
  summary: 'Results-driven Senior Software Engineer with 6+ years architecting high-performance distributed systems at scale. Led engineering teams of 8–12 delivering mission-critical products serving 20M+ users. Deep expertise in React, Node.js, and cloud infrastructure, with a proven track record of reducing system latency by 40% and cutting infrastructure costs by $2M annually.',
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Stripe',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: 'Present',
      bullets: [
        'Architected a real-time payment reconciliation engine processing $3B+ in daily transactions with 99.99% uptime SLA',
        'Led a team of 8 engineers to deliver the Stripe Terminal SDK ahead of schedule, adopted by 15,000+ merchants in Q1',
        'Reduced API response latency by 42% through distributed caching strategy, improving developer experience scores by 28%',
        'Mentored 4 junior engineers, with 2 promoted to mid-level within 12 months',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'Airbnb',
      location: 'San Francisco, CA',
      startDate: 'Jun 2019',
      endDate: 'Dec 2021',
      bullets: [
        'Built and scaled the host dashboard serving 4M+ active hosts, achieving 99.9% availability during 3x traffic spikes',
        'Spearheaded migration from monolith to microservices, reducing deployment time from 2 hours to 8 minutes',
        'Shipped A/B testing framework adopted by 12 product teams, increasing experiment velocity by 300%',
      ],
    },
  ],
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      year: '2019',
      gpa: '3.9',
      honors: 'Magna Cum Laude',
    },
  ],
  skills: {
    technical: ['TypeScript', 'React', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Redis', 'Kubernetes', 'AWS', 'GraphQL'],
    soft: ['Technical Leadership', 'System Design', 'Cross-functional Collaboration', 'Mentorship'],
    certifications: ['AWS Solutions Architect Professional', 'Google Cloud Professional'],
    languages: ['English (Native)', 'Spanish (Fluent)'],
  },
  atsScore: 94,
  tips: [
    'Add more quantified metrics to your experience bullets to increase ATS score',
    'Consider adding a Projects section to showcase personal work',
    'Include more keywords from your target job descriptions',
  ],
}

const TemplateComponent = { modern: ModernTemplate, minimal: MinimalTemplate, creative: CreativeTemplate }

export default function ResumePreview({ formData, generatedResume, selectedTemplate, setSelectedTemplate, onBack, onRestart }) {
  const [showPayment, setShowPayment] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const resume = generatedResume || DEMO_RESUME
  const Template = TemplateComponent[selectedTemplate]

  const handleDownloadClick = () => {
    setShowPayment(true)
  }

  const handleDirectDownload = async () => {
    setDownloading(true)
    try {
      await generatePDF('resume-preview', `resume-${resume.personalInfo?.name?.replace(/\s+/g, '-').toLowerCase() || 'my'}.pdf`)
    } catch (e) {
      console.error('PDF error:', e)
    }
    setDownloading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-16 pb-10"
    >
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5 flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-sm">
            <ArrowLeft className="w-4 h-4" /> Edit
          </button>
          <span className="text-sm text-white/40 hidden sm:block">Preview Mode</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Template switcher */}
          <div className="hidden sm:flex items-center gap-1 glass rounded-xl p-1">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTemplate === t.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadClick}
            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline text-violet-300 font-normal">· $9</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Template selector mobile */}
            <div className="lg:hidden glass-card p-4">
              <p className="text-xs text-white/50 mb-3 font-medium uppercase tracking-wider">Template</p>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-2 rounded-xl text-center text-xs font-medium transition-all ${
                      selectedTemplate === t.id
                        ? 'bg-violet-600 text-white'
                        : 'glass text-white/50 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template info */}
            <div className="hidden lg:block glass-card p-5">
              <p className="text-xs text-white/50 mb-4 font-medium uppercase tracking-wider">Choose Template</p>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                      selectedTemplate === t.id
                        ? 'bg-violet-600/20 border border-violet-500/40'
                        : 'glass-hover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm ${selectedTemplate === t.id ? 'text-violet-300' : 'text-white/70'}`}>
                        {t.label}
                      </span>
                      {selectedTemplate === t.id && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ATS Score */}
            {resume.atsScore && (
              <div className="hidden lg:block glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold">ATS Score</span>
                  </div>
                  <span className={`text-2xl font-black ${resume.atsScore >= 80 ? 'text-emerald-400' : resume.atsScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {resume.atsScore}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${resume.atsScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    className={`h-full rounded-full ${resume.atsScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-yellow-500 to-amber-400'}`}
                  />
                </div>
                <p className="text-xs text-white/30">
                  {resume.atsScore >= 80 ? '✅ Excellent ATS compatibility' : '⚠️ Room for improvement'}
                </p>
              </div>
            )}

            {/* AI Tips */}
            {resume.tips && resume.tips.length > 0 && (
              <div className="hidden lg:block glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold">AI Tips</span>
                </div>
                <ul className="space-y-3">
                  {resume.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-white/50 leading-relaxed flex items-start gap-2">
                      <span className="text-yellow-400 shrink-0 mt-0.5">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="hidden lg:block space-y-2">
              <button onClick={handleDownloadClick} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <Download className="w-4 h-4" /> Download PDF · $9
              </button>
              <button onClick={onRestart} className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                <RotateCcw className="w-3.5 h-3.5" /> Start Over
              </button>
            </div>

            {!generatedResume && (
              <div className="hidden lg:block glass rounded-xl p-4 border-amber-500/20 text-xs text-amber-300/70" style={{ borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}>
                <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                Showing demo resume. Add your ANTHROPIC_API_KEY to generate from your info.
              </div>
            )}
          </div>

          {/* Resume preview */}
          <div className="lg:col-span-3">
            <motion.div
              key={selectedTemplate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="shadow-2xl"
              style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
            >
              <Template resume={resume} />
            </motion.div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handleDirectDownload}
      />
    </motion.div>
  )
}
