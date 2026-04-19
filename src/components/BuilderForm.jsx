import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Plus, Trash2, Sparkles, User, Briefcase, GraduationCap, Code, ChevronRight } from 'lucide-react'
import { generateResume } from '../lib/api'

const STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'generate', label: 'Generate', icon: Sparkles },
]

const pageVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.3 } }),
}

function InputField({ label, name, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-2">
        {label} {required && <span className="text-violet-400">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-glass"
        required={required}
      />
    </div>
  )
}

function TextAreaField({ label, name, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-2">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="input-glass resize-none"
      />
    </div>
  )
}

function PersonalStep({ formData, setFormData }) {
  const update = (e) => setFormData(prev => ({
    ...prev,
    personalInfo: { ...prev.personalInfo, [e.target.name]: e.target.value }
  }))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Full Name" name="name" value={formData.personalInfo.name} onChange={update} placeholder="Jane Smith" required />
        <InputField label="Job Title / Target Role" name="title" value={formData.personalInfo.title} onChange={update} placeholder="Senior Product Manager" required />
        <InputField label="Email" name="email" value={formData.personalInfo.email} onChange={update} placeholder="jane@example.com" type="email" required />
        <InputField label="Phone" name="phone" value={formData.personalInfo.phone} onChange={update} placeholder="+1 (555) 000-0000" required />
        <InputField label="Location" name="location" value={formData.personalInfo.location} onChange={update} placeholder="San Francisco, CA" required />
        <InputField label="LinkedIn" name="linkedin" value={formData.personalInfo.linkedin} onChange={update} placeholder="linkedin.com/in/janesmith" />
        <InputField label="Portfolio / Website" name="website" value={formData.personalInfo.website} onChange={update} placeholder="janesmith.dev" />
      </div>
      <TextAreaField
        label="Professional Summary (optional — AI will generate one)"
        name="summary"
        value={formData.summary}
        onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
        placeholder="Briefly describe your professional background and key strengths... or leave blank and let AI write it!"
        rows={4}
      />
    </div>
  )
}

function ExperienceStep({ formData, setFormData }) {
  const addExp = () => setFormData(prev => ({
    ...prev,
    experience: [...prev.experience, { id: Date.now(), title: '', company: '', location: '', startDate: '', endDate: '', bullets: [''] }]
  }))

  const removeExp = (id) => setFormData(prev => ({
    ...prev,
    experience: prev.experience.filter(e => e.id !== id)
  }))

  const updateExp = (id, field, value) => setFormData(prev => ({
    ...prev,
    experience: prev.experience.map(e => e.id === id ? { ...e, [field]: value } : e)
  }))

  const addBullet = (id) => setFormData(prev => ({
    ...prev,
    experience: prev.experience.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ''] } : e)
  }))

  const updateBullet = (id, idx, val) => setFormData(prev => ({
    ...prev,
    experience: prev.experience.map(e => {
      if (e.id !== id) return e
      const bullets = [...e.bullets]
      bullets[idx] = val
      return { ...e, bullets }
    })
  }))

  const removeBullet = (id, idx) => setFormData(prev => ({
    ...prev,
    experience: prev.experience.map(e => {
      if (e.id !== id) return e
      return { ...e, bullets: e.bullets.filter((_, i) => i !== idx) }
    })
  }))

  return (
    <div className="space-y-6">
      {formData.experience.map((exp, expIdx) => (
        <div key={exp.id} className="glass-card p-5 relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-violet-400">Position {expIdx + 1}</span>
            {formData.experience.length > 1 && (
              <button onClick={() => removeExp(exp.id)} className="text-red-400/60 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <InputField label="Job Title" value={exp.title} onChange={e => updateExp(exp.id, 'title', e.target.value)} placeholder="Software Engineer" required />
            <InputField label="Company" value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} placeholder="Acme Corp" required />
            <InputField label="Location" value={exp.location} onChange={e => updateExp(exp.id, 'location', e.target.value)} placeholder="New York, NY" />
            <div className="grid grid-cols-2 gap-2">
              <InputField label="Start Date" value={exp.startDate} onChange={e => updateExp(exp.id, 'startDate', e.target.value)} placeholder="Jan 2021" required />
              <InputField label="End Date" value={exp.endDate} onChange={e => updateExp(exp.id, 'endDate', e.target.value)} placeholder="Present" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Responsibilities & Achievements <span className="text-violet-400">*</span>
              <span className="text-white/30 font-normal ml-2">— AI will enhance these</span>
            </label>
            <div className="space-y-2">
              {exp.bullets.map((bullet, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-white/30 mt-3 text-sm">•</span>
                  <input
                    value={bullet}
                    onChange={e => updateBullet(exp.id, idx, e.target.value)}
                    placeholder="Developed and maintained 5 microservices serving 10M+ users..."
                    className="input-glass flex-1"
                  />
                  {exp.bullets.length > 1 && (
                    <button onClick={() => removeBullet(exp.id, idx)} className="mt-2.5 text-red-400/40 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => addBullet(exp.id)}
              className="mt-2 text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add bullet
            </button>
          </div>
        </div>
      ))}

      {formData.experience.length < 5 && (
        <button
          onClick={addExp}
          className="w-full btn-secondary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Another Position
        </button>
      )}
    </div>
  )
}

function EducationStep({ formData, setFormData }) {
  const addEdu = () => setFormData(prev => ({
    ...prev,
    education: [...prev.education, { id: Date.now(), school: '', degree: '', field: '', year: '', gpa: '', honors: '' }]
  }))

  const removeEdu = (id) => setFormData(prev => ({
    ...prev,
    education: prev.education.filter(e => e.id !== id)
  }))

  const updateEdu = (id, field, value) => setFormData(prev => ({
    ...prev,
    education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e)
  }))

  return (
    <div className="space-y-6">
      {formData.education.map((edu, i) => (
        <div key={edu.id} className="glass-card p-5 relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-violet-400">Education {i + 1}</span>
            {formData.education.length > 1 && (
              <button onClick={() => removeEdu(edu.id)} className="text-red-400/60 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="School Name" value={edu.school} onChange={e => updateEdu(edu.id, 'school', e.target.value)} placeholder="MIT" required />
            <InputField label="Degree" value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="Bachelor of Science" required />
            <InputField label="Field of Study" value={edu.field} onChange={e => updateEdu(edu.id, 'field', e.target.value)} placeholder="Computer Science" />
            <InputField label="Graduation Year" value={edu.year} onChange={e => updateEdu(edu.id, 'year', e.target.value)} placeholder="2022" />
            <InputField label="GPA (optional)" value={edu.gpa} onChange={e => updateEdu(edu.id, 'gpa', e.target.value)} placeholder="3.8" />
            <InputField label="Honors / Awards (optional)" value={edu.honors} onChange={e => updateEdu(edu.id, 'honors', e.target.value)} placeholder="Summa Cum Laude" />
          </div>
        </div>
      ))}

      {formData.education.length < 3 && (
        <button onClick={addEdu} className="w-full btn-secondary flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Education
        </button>
      )}
    </div>
  )
}

function SkillsStep({ formData, setFormData }) {
  const update = (e) => setFormData(prev => ({
    ...prev,
    skills: { ...prev.skills, [e.target.name]: e.target.value }
  }))

  return (
    <div className="space-y-5">
      <div className="glass-card p-4 border-violet-500/20" style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.05)' }}>
        <div className="flex items-center gap-2 text-violet-300 text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Separate skills with commas. AI will organize and optimize them.</span>
        </div>
      </div>
      <TextAreaField
        label="Technical Skills"
        name="technical"
        value={formData.skills.technical}
        onChange={update}
        placeholder="Python, JavaScript, React, Node.js, PostgreSQL, Docker, AWS, Machine Learning..."
        rows={3}
      />
      <TextAreaField
        label="Soft Skills"
        name="soft"
        value={formData.skills.soft}
        onChange={update}
        placeholder="Leadership, Project Management, Cross-functional Collaboration, Strategic Planning..."
        rows={2}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextAreaField
          label="Certifications (optional)"
          name="certifications"
          value={formData.skills.certifications}
          onChange={update}
          placeholder="AWS Solutions Architect, Google Analytics, PMP..."
          rows={2}
        />
        <TextAreaField
          label="Languages (optional)"
          name="languages"
          value={formData.skills.languages}
          onChange={update}
          placeholder="English (Native), Spanish (Fluent), Mandarin (Conversational)..."
          rows={2}
        />
      </div>
    </div>
  )
}

const generatingSteps = [
  { label: 'Analyzing your experience...', duration: 1200 },
  { label: 'Enhancing bullet points with AI...', duration: 1500 },
  { label: 'Optimizing for ATS systems...', duration: 1000 },
  { label: 'Crafting professional summary...', duration: 1200 },
  { label: 'Finalizing your resume...', duration: 800 },
]

function GenerateStep({ formData, onComplete }) {
  const [status, setStatus] = useState('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setStatus('loading')
    setError('')
    setCurrentStep(0)

    let stepIdx = 0
    const interval = setInterval(() => {
      stepIdx++
      if (stepIdx < generatingSteps.length) setCurrentStep(stepIdx)
      else clearInterval(interval)
    }, 1200)

    try {
      const resume = await generateResume(formData)
      clearInterval(interval)
      setCurrentStep(generatingSteps.length)
      setTimeout(() => onComplete(resume), 600)
    } catch (err) {
      clearInterval(interval)
      setStatus('error')
      setError(err.response?.data?.error || err.message || 'Generation failed. Check your API key.')
    }
  }

  if (status === 'idle') {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-violet-400" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Ready to Generate!</h3>
        <p className="text-white/50 mb-8 max-w-md mx-auto">
          Claude AI will analyze your information and craft a powerful, ATS-optimized resume.
          This takes about 10–15 seconds.
        </p>
        <button onClick={handleGenerate} className="btn-primary flex items-center gap-2 mx-auto text-lg py-4 px-10">
          <Sparkles className="w-5 h-5" /> Generate My Resume
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-xl font-bold mb-2 text-red-400">Generation Failed</h3>
        <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setStatus('idle')} className="btn-secondary">Try Again</button>
          <button onClick={() => onComplete(null)} className="btn-primary">Use Demo Resume</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-4"
        >
          <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 border-t-violet-500" style={{ borderTopColor: '#7c3aed' }} />
        </motion.div>
        <h3 className="text-xl font-bold mb-1">Claude AI is working...</h3>
        <p className="text-white/40 text-sm">Crafting your professional resume</p>
      </div>

      <div className="max-w-md mx-auto space-y-3">
        {generatingSteps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: i <= currentStep ? 1 : 0.3 }}
            className="flex items-center gap-3 py-2"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
              i < currentStep ? 'bg-emerald-500' : i === currentStep ? 'bg-violet-500 animate-pulse' : 'bg-white/10'
            }`}>
              {i < currentStep && <span className="text-white text-xs">✓</span>}
              {i === currentStep && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            <span className={`text-sm transition-all duration-300 ${i <= currentStep ? 'text-white' : 'text-white/30'}`}>
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function BuilderForm({ formData, setFormData, onBack, onComplete }) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)

  const goTo = (newStep) => {
    setDir(newStep > step ? 1 : -1)
    setStep(newStep)
  }

  const next = () => goTo(Math.min(step + 1, STEPS.length - 1))
  const prev = () => goTo(Math.max(step - 1, 0))

  const isLastBeforeGenerate = step === STEPS.length - 2
  const isGenerateStep = step === STEPS.length - 1

  const handleDemoResume = () => {
    onComplete(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 pb-10 px-4"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">Build Your Resume</h1>
            <p className="text-white/40 text-sm">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => !isGenerateStep && goTo(i)}
              disabled={isGenerateStep}
              className="group relative flex-1"
            >
              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                i < step ? 'bg-violet-500' : i === step ? 'bg-gradient-to-r from-violet-500 to-blue-500' : 'bg-white/10'
              }`} />
              <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap transition-colors hidden sm:block ${
                i === step ? 'text-violet-400' : 'text-white/30'
              }`}>
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Step icon */}
        <div className="mt-10 mb-6 flex items-center gap-3">
          {(() => {
            const S = STEPS[step]
            return (
              <>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center">
                  <S.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold">{S.label}</h2>
              </>
            )
          })()}
        </div>

        {/* Form content */}
        <div className="glass-card p-6 mb-6 min-h-[400px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {step === 0 && <PersonalStep formData={formData} setFormData={setFormData} />}
              {step === 1 && <ExperienceStep formData={formData} setFormData={setFormData} />}
              {step === 2 && <EducationStep formData={formData} setFormData={setFormData} />}
              {step === 3 && <SkillsStep formData={formData} setFormData={setFormData} />}
              {step === 4 && <GenerateStep formData={formData} onComplete={onComplete} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {!isGenerateStep && (
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className={`btn-secondary flex items-center gap-2 ${step === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={next} className="btn-primary flex items-center gap-2">
              {isLastBeforeGenerate ? (
                <><Sparkles className="w-4 h-4" /> Generate Resume</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
