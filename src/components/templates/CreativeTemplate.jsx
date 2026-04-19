import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react'

export default function CreativeTemplate({ resume }) {
  if (!resume) return null
  const { personalInfo, summary, experience = [], education = [], skills = {} } = resume

  const allTech = Array.isArray(skills.technical) ? skills.technical : (skills.technical || '').split(',').map(s => s.trim()).filter(Boolean)
  const allSoft = Array.isArray(skills.soft) ? skills.soft : (skills.soft || '').split(',').map(s => s.trim()).filter(Boolean)
  const allCerts = Array.isArray(skills.certifications) ? skills.certifications : (skills.certifications || '').split(',').map(s => s.trim()).filter(Boolean)
  const allLangs = Array.isArray(skills.languages) ? skills.languages : (skills.languages || '').split(',').map(s => s.trim()).filter(Boolean)

  const tagColors = [
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-amber-100 text-amber-700 border-amber-200',
  ]

  return (
    <div id="resume-preview" className="w-full bg-white text-gray-900" style={{ minHeight: '297mm', fontFamily: "'Inter', sans-serif" }}>
      {/* Bold colorful header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #1e40af 60%, #0e7490 100%)', padding: '48px 48px 40px' }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.2)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-32 w-32 h-32 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.15)', transform: 'translate(0, 50%)' }} />

        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-1" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            {personalInfo?.name || 'Your Name'}
          </h1>
          {personalInfo?.title && (
            <p className="text-cyan-200 font-semibold text-sm tracking-widest uppercase mb-5">{personalInfo.title}</p>
          )}

          <div className="flex flex-wrap gap-4">
            {personalInfo?.email && (
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <Mail className="w-3.5 h-3.5 text-cyan-300" />
                {personalInfo.email}
              </div>
            )}
            {personalInfo?.phone && (
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <Phone className="w-3.5 h-3.5 text-cyan-300" />
                {personalInfo.phone}
              </div>
            )}
            {personalInfo?.location && (
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <MapPin className="w-3.5 h-3.5 text-cyan-300" />
                {personalInfo.location}
              </div>
            )}
            {personalInfo?.linkedin && (
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <Linkedin className="w-3.5 h-3.5 text-cyan-300" />
                {personalInfo.linkedin}
              </div>
            )}
            {personalInfo?.website && (
              <div className="flex items-center gap-1.5 text-white/80 text-xs">
                <Globe className="w-3.5 h-3.5 text-cyan-300" />
                {personalInfo.website}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-10">
        {/* Summary */}
        {summary && (
          <div className="mb-8 p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff, #eff6ff)', border: '1px solid #e9d5ff' }}>
            <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main content: 2 cols */}
          <div className="col-span-2 space-y-7">
            {/* Experience */}
            {experience.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #7c3aed, #2563eb)' }} />
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-800">Work Experience</h2>
                </div>
                <div className="space-y-6 relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-3 bottom-3 w-px bg-gray-100" />
                  {experience.map((exp, i) => (
                    <div key={i} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className="absolute left-0.5 top-1 w-5 h-5 rounded-full border-2 border-violet-500 bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                      </div>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{exp.title}</h3>
                          <p className="text-violet-600 text-xs font-semibold">{exp.company}</p>
                          {exp.location && <p className="text-gray-400 text-xs">{exp.location}</p>}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 ml-4 glass px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200">
                          {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                        </span>
                      </div>
                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {exp.bullets.filter(b => b).map((bullet, j) => (
                            <li key={j} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                              <span className="text-violet-400 font-bold mt-0.5 shrink-0">›</span>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #0891b2, #2563eb)' }} />
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-800">Education</h2>
                </div>
                <div className="space-y-4">
                  {education.map((edu, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{edu.school}</h3>
                        <p className="text-blue-600 text-xs font-semibold">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                        {(edu.gpa || edu.honors) && (
                          <p className="text-gray-400 text-xs mt-0.5">{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors ? ' · ' : ''}{edu.honors}</p>
                        )}
                      </div>
                      {edu.year && (
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full shrink-0 ml-4">{edu.year}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: 1 col */}
          <div className="space-y-6">
            {allTech.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-violet-500" />
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-800">Tech Skills</h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allTech.map((skill, i) => (
                    <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tagColors[i % tagColors.length]}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {allSoft.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-emerald-500" />
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-800">Soft Skills</h2>
                </div>
                <div className="space-y-1.5">
                  {allSoft.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-gray-600">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allCerts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-amber-500" />
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-800">Certifications</h2>
                </div>
                <div className="space-y-2">
                  {allCerts.map((cert, i) => (
                    <p key={i} className="text-xs text-gray-600 leading-tight">{cert}</p>
                  ))}
                </div>
              </div>
            )}

            {allLangs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-pink-500" />
                  <h2 className="text-xs font-black tracking-widest uppercase text-gray-800">Languages</h2>
                </div>
                <div className="space-y-1.5">
                  {allLangs.map((lang, i) => (
                    <p key={i} className="text-xs text-gray-600">{lang}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
