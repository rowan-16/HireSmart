/**
 * Rubric Scoring Engine
 * Multi-criteria weighted scoring — transparent and configurable.
 * Protected attributes are NEVER used in this calculation.
 */

const DEFAULT_WEIGHTS = { skills: 0.50, experience: 0.25, projects: 0.15, education: 0.10 };

function computeExperienceScore(yearsOfExperience, minRequired) {
  if (minRequired === 0) return 100;
  if (yearsOfExperience >= minRequired * 1.5) return 100;
  if (yearsOfExperience >= minRequired) return 90 + (yearsOfExperience - minRequired) * 3;
  if (yearsOfExperience >= minRequired * 0.75) return 70 + (yearsOfExperience / minRequired) * 15;
  return Math.max(0, (yearsOfExperience / minRequired) * 70);
}

function computeProjectScore(projects, requiredSkills) {
  if (!projects || projects.length === 0) return 30;
  const reqLower = requiredSkills.map(s => s.toLowerCase());
  let relevanceScore = 0;
  projects.forEach(proj => {
    const techs = (proj.technologies || []).map(t => t.toLowerCase());
    const desc = (proj.description || '' + proj.title || '').toLowerCase();
    const techMatch = techs.filter(t => reqLower.some(r => t.includes(r) || r.includes(t))).length;
    const descMatch = reqLower.filter(r => desc.includes(r)).length;
    relevanceScore += Math.min(1, (techMatch + descMatch * 0.5) / Math.max(1, reqLower.length));
  });
  const avgRelevance = relevanceScore / projects.length;
  // Quantity bonus (up to 3 projects is ideal)
  const quantityBonus = Math.min(projects.length / 3, 1) * 20;
  return Math.min(100, Math.round(avgRelevance * 80 + quantityBonus));
}

function computeEducationScore(education, educationRequirement) {
  if (!educationRequirement || educationRequirement.trim() === '') return 80;
  if (!education || education.length === 0) return 40;
  const req = educationRequirement.toLowerCase();
  const levels = { 'phd': 5, 'master': 4, 'msc': 4, 'mtech': 4, 'mba': 4, 'bachelor': 3, 'btech': 3, 'bsc': 3, 'associate': 2, 'diploma': 1 };
  let maxLevel = 0;
  education.forEach(edu => {
    const deg = (edu.degree || '').toLowerCase();
    Object.entries(levels).forEach(([key, val]) => {
      if (deg.includes(key) && val > maxLevel) maxLevel = val;
    });
  });
  let reqLevel = 0;
  Object.entries(levels).forEach(([key, val]) => {
    if (req.includes(key) && val > reqLevel) reqLevel = val;
  });
  if (reqLevel === 0) return 80; // no specific level required
  if (maxLevel >= reqLevel) return 100;
  if (maxLevel === reqLevel - 1) return 70;
  return 50;
}

function computeRubricScore(analysisData, jobData, semanticScore) {
  const weights = { ...DEFAULT_WEIGHTS, ...(jobData.scoringWeights || {}) };
  const totalWeight = weights.skills + weights.experience + weights.projects + weights.education;
  // Normalize weights
  Object.keys(weights).forEach(k => { weights[k] /= totalWeight; });

  const skillScore = analysisData.scores?.skillScore ?? 0;
  const experienceScore = computeExperienceScore(
    analysisData.extractedData?.yearsOfExperience ?? 0,
    jobData.minExperience ?? 0
  );
  const projectScore = computeProjectScore(
    analysisData.extractedData?.projects ?? [],
    jobData.requiredSkills ?? []
  );
  const educationScore = computeEducationScore(
    analysisData.extractedData?.education ?? [],
    jobData.educationRequirement ?? ''
  );

  const finalScore =
    skillScore * weights.skills +
    experienceScore * weights.experience +
    projectScore * weights.projects +
    educationScore * weights.education;

  // Blend with semantic score (30% weight on semantic if available)
  const blended = semanticScore > 0
    ? finalScore * 0.70 + semanticScore * 0.30
    : finalScore;

  return {
    skillScore: Math.round(skillScore * 10) / 10,
    experienceScore: Math.round(experienceScore * 10) / 10,
    projectScore: Math.round(projectScore * 10) / 10,
    educationScore: Math.round(educationScore * 10) / 10,
    semanticScore: Math.round(semanticScore * 10) / 10,
    finalScore: Math.round(Math.min(100, Math.max(0, blended)) * 10) / 10,
  };
}

module.exports = { computeRubricScore, computeExperienceScore, computeProjectScore, computeEducationScore };
