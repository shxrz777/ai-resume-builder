import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './components/LandingPage'
import BuilderForm from './components/BuilderForm'
import ResumePreview from './components/ResumePreview'

const defaultFormData = {
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    title: '',
  },
  summary: '',
  experience: [
    { id: 1, title: '', company: '', location: '', startDate: '', endDate: '', bullets: [''] }
  ],
  education: [
    { id: 1, school: '', degree: '', field: '', year: '', gpa: '', honors: '' }
  ],
  skills: {
    technical: '',
    soft: '',
    certifications: '',
    languages: '',
  },
}

export default function App() {
  const [page, setPage] = useState('landing')
  const [formData, setFormData] = useState(defaultFormData)
  const [generatedResume, setGeneratedResume] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <AnimatePresence mode="wait">
        {page === 'landing' && (
          <LandingPage key="landing" onStart={() => setPage('builder')} />
        )}
        {page === 'builder' && (
          <BuilderForm
            key="builder"
            formData={formData}
            setFormData={setFormData}
            onBack={() => setPage('landing')}
            onComplete={(resume) => {
              setGeneratedResume(resume)
              setPage('preview')
            }}
          />
        )}
        {page === 'preview' && (
          <ResumePreview
            key="preview"
            formData={formData}
            generatedResume={generatedResume}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            onBack={() => setPage('builder')}
            onRestart={() => {
              setFormData(defaultFormData)
              setGeneratedResume(null)
              setPage('landing')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
