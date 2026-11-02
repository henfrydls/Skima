/**
 * GET /api/collaborators lists every collaborator, archived ones included, but not
 * their current skill levels; /api/data has those for the active ones. Settings tabs
 * that list everyone and edit levels need both.
 */
export function withCurrentSkills(allCollaborators, dataCollaborators) {
  const current = new Map((dataCollaborators || []).map((c) => [c.id, c.skills]));
  return (allCollaborators || []).map((c) => ({ ...c, skills: current.get(c.id) || {} }));
}
