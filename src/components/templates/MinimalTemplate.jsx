export default function MinimalTemplate({ resume }) {
  if (!resume) return null
  const { personalInfo, summary, experience = [], education = [], skills = {} } = resume

  const allTech = Array.isArray(skills.technical) ? skills.technical : (skills.technical || '').split(',').map(s => s.trim()).filter(Boolean)
  const allSoft = Array.isArray(skills.soft) ? skills.soft : (skills.soft || '').split(',').map(s => s.trim()).filter(Boolean)
  const allCerts = Array.isArray(skills.certifications) ? skills.certifications : (skills.certifications || '').split(',').map(s => s.trim()).filter(Boolean)
  const allLangs = Array.isArray(skills.languages) ? skills.languages : (skills.languages || '').split(',').map(s => s.trim()).filter(Boolean)
  const allSkills = [...allTech, ...allSoft, ...allCerts, ...allLangs]

  const contactParts = [
    personalInfo?.email,
    personalInfo?.phone,
    personalInfo?.location,
    personalInfo?.linkedin,
    personalInfo?.website,
  ].filter(Boolean)

  return (
    <div id="resume-preview" className="w-full bg-white text-gray-900 px-14 py-12" style={{ minHeight: '297mm', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{personalInfo?.name || 'Your Name'}</h1>
        {personalInfo?.title && (
          <p className="text-gray-500 text-sm font-medium tracking-widest uppercase mb-4">{personalInfo.title}</p>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
          {contactParts.map((part, i) => (
            <span key={i}>{part}</span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-7">
          <p className="text-gray-600 text-sm leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-7">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">Experience</h2>
          <div className="space-y-5">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-0.5">
                  <h3 className="font-semibold text-gray-900 text-sm">{exp.title}</h3>
                  <span className="text-xs text-gray-400 shrink-0 ml-4">
                    {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mb-2">{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="space-y-1">
                    {exp.bullets.filter(b => b).map((bullet, j) => (
                      <li key={j} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                        <span className="text-gray-300 mt-0.5 shrink-0">—</span>
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
        <div className="mb-7">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">Education</h2>
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="flex items-baseline justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{edu.school}</h3>
                  <p className="text-xs text-gray-500">
                    {edu.degree}{edu.field ? `, ${edu.field}` : ''}
                    {edu.gpa ? ` • GPA: ${edu.gpa}` : ''}
                    {edu.honors ? ` • ${edu.honors}` : ''}
                  </p>
                </div>
                {edu.year && <span className="text-xs text-gray-400 shrink-0 ml-4">{edu.year}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">Skills</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{allSkills.join(' · ')}</p>
        </div>
      )}
    </div>
  )
}
