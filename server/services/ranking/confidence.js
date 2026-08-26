/**
 * Confidence Engine
 * Estimates confidence based on evidence quality and completeness.
 * Confidence reflects evidence strength — NOT candidate quality.
 */

function computeConfidence(analysisData, scores) {
  let confidence = 0;
  let factors = 0;

  // Factor 1: Number of matched skills (0-30 points)
  const matchedSkillCount = (analysisData.matchedSkills || []).length;
  const skillConfidence = Math.min(matchedSkillCount / 5, 1) * 30;
  confidence += skillConfidence;
  factors++;

  // Factor 2: Experience evidence (0-20 points)
  const hasExp = (analysisData.extractedData?.yearsOfExperience ?? 0) > 0;
  const expDetails = (analysisData.extractedData?.experienceDetails || []).length;
  const expConfidence = (hasExp ? 10 : 0) + Math.min(expDetails / 2, 1) * 10;
  confidence += expConfidence;
  factors++;

  // Factor 3: Resume completeness (0-20 points)
  const hasProjects = (analysisData.extractedData?.projects || []).length > 0;
  const hasEdu = (analysisData.extractedData?.education || []).length > 0;
  const hasCerts = (analysisData.extractedData?.certifications || []).length > 0;
  const completeness = (hasProjects ? 8 : 0) + (hasEdu ? 7 : 0) + (hasCerts ? 5 : 0);
  confidence += completeness;
  factors++;

  // Factor 4: Semantic score agreement (0-20 points)
  const sem = scores.semanticScore || 0;
  const skill = scores.skillScore || 0;
  const agreement = 1 - Math.abs(sem - skill) / 100;
  confidence += agreement * 20;
  factors++;

  // Factor 5: Total skills extracted (0-10 points)
  const totalSkills = (analysisData.extractedData?.skills || []).length;
  confidence += Math.min(totalSkills / 10, 1) * 10;
  factors++;

  const raw = Math.min(100, Math.max(0, confidence));
  let label = 'Low';
  if (raw >= 80) label = 'High';
  else if (raw >= 60) label = 'Medium';
  else if (raw >= 40) label = 'Low-Medium';

  let note = '';
  if (raw < 40) note = 'Insufficient evidence — recruiter review recommended.';
  else if (raw < 60) note = 'Moderate evidence. Confidence reflects available data completeness.';
  else note = 'Confidence reflects the strength and completeness of evidence available to the ranking system.';

  return { confidence: Math.round(raw * 10) / 10, confidenceLabel: label, confidenceNote: note };
}

module.exports = { computeConfidence };
