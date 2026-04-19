import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react'

function ContactItem({ icon: Icon, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-1.5 text-slate-300 text-xs">
      <Icon className="w-3 h-3 text-violet-400 shrink-0" />
      <span>{value}</span>
    </div>
  )
}

export default function ModernTemplate({ resume }) {
  if (!resume) return null
  const { personalInfo, summary, experience = [], education = [], skills = {} } = resume

  const allTech = Array.isArray(skills.technical) ? skills.technical : (skills.technical || '').split(',').map(s => s.trim()).filter(Boolean)
  const allSoft = Array.isArray(skills.soft) ? skills.soft : (skills.soft || '').split(',').map(s => s.trim()).filter(Boolean)
  const allCerts = Array.isArray(skills.certifications) ? skills.certifications : (skills.certifications || '').split(',').map(s => s.trim()).filter(Boolean)
  const allLangs = Array.isArray(skills.languages) ? skills.languages : (skills.languages || '').split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div id="resume-preview" className="w-full bg-white text-gray-900 flex" style={{ minHeight: '297mm', fontFamily: "'Inter', sans-serif" }}>
      {/* Left sidebar */}
      <div className="w-72 shrink-0 bg-[#1e1b4b] text-white flex flex-col">
        {/* Name header */}
        <div className="p-7 pb-6 bg-gradient-to-b from-[#4c1d95] to-[#1e1b4b]">
          <h1 className="text-2xl font-black text-white leading-tight mb-1">{personalInfo?.name || 'Your Name'}</h1>
          <p className="text-violet-300 text-sm font-semibold tracking-wide">{personalInfo?.title || 'Professional Title'}</p>
        </div>

        {/* Contact */}
        <div className="px-7 py-5 border-b border-white/10">
          <h3 className="text-violet-300 text-xs font-bold tracking-widest uppercase mb-3">Contact</h3>
          <div className="space-y-2">
            <ContactItem icon={Mail} value={personalInfo?.email} />
            <ContactItem icon={Phone} value={personalInfo?.phone} />
            <ContactItem icon={MapPin} value={personalInfo?.location} />
            <ContactItem icon={Linkedin} value={personalInfo?.linkedin} />
            <ContactItem icon={Globe} value={personalInfo?.website} />
          </div>
        </div>

        {/* Technical Skills */}
        {allTech.length > 0 && (
          <div className="px-7 py-5 border-b border-white/10">
            <h3 className="text-violet-300 text-xs font-bold tracking-widest uppercase mb-3">Technical Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {allTech.map((skill, i) => (
                <span key={i} className="text-xs bg-violet-900/60 text-violet-200 rounded-md px-2 py-1 border border-violet-700/50">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Soft Skills */}
        {allSoft.length > 0 && (
          <div className="px-7 py-5 border-b border-white/10">
            <h3 className="text-violet-300 text-xs font-bold tracking-widest uppercase mb-3">Soft Skills</h3>
            <div className="space-y-1.5">
              {allSoft.map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-xs text-slate-300">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {allCerts.length > 0 && (
          <div className="px-7 py-5 border-b border-white/10">
            <h3 className="text-violet-300 text-xs font-bold tracking-widest uppercase mb-3">Certifications</h3>
            <div className="space-y-1.5">
              {allCerts.map((cert, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">◆</span>
                  <span className="text-xs text-slate-300 leading-tight">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {allLangs.length > 0 && (
          <div className="px-7 py-5">
            <h3 className="text-violet-300 text-xs font-bold tracking-widest uppercase mb-3">Languages</h3>
            <div className="space-y-1.5">
              {allLangs.map((lang, i) => (
                <div key={i} className="text-xs text-slate-300">{lang}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right main content */}
      <div className="flex-1 p-8">
        {/* Summary */}
        {summary && (
          <div className="mb-7">
            <h2 className="text-sm font-bold tracking-widest uppercase text-violet-700 mb-2">Professional Summary</h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-violet-600 to-blue-500 mb-3" />
            <p className="text-gray-600 text-sm leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-7">
            <h2 className="text-sm font-bold tracking-widest uppercase text-violet-700 mb-2">Work Experience</h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-violet-600 to-blue-500 mb-4" />
            <div className="space-y-6">
              {experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{exp.title}</h3>
                      <p className="text-violet-600 font-semibold text-xs">{exp.company}{exp.location ? ` — ${exp.location}` : ''}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                      </p>
                    </div>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {exp.bullets.filter(b => b).map((bullet, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                          <span className="text-violet-500 mt-1 shrink-0">▸</span>
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
            <h2 className="text-sm font-bold tracking-widest uppercase text-violet-700 mb-2">Education</h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-violet-600 to-blue-500 mb-4" />
            <div className="space-y-3">
              {education.map((edu, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{edu.degree} {edu.field && `in ${edu.field}`}</h3>
                    <p className="text-violet-600 text-xs font-semibold">{edu.school}</p>
                    {(edu.gpa || edu.honors) && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        {edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors ? ' • ' : ''}{edu.honors}
                      </p>
                    )}
                  </div>
                  {edu.year && <span className="text-xs text-gray-500 shrink-0 ml-4">{edu.year}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
