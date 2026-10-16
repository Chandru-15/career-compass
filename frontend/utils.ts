export function createPageUrl(page: string): string {
  const [path, query] = page.split('?');
  const routes: Record<string, string> = {
    Dashboard: '/',
    Onboarding: '/onboarding',
    Profile: '/profile',
    JobSearch: '/jobs',
    AIPlanner: '/ai-planner',
    Applications: '/applications',
    SkillsRoadmap: '/skills',
    CompanyProfile: '/company',
  };

  const resolved = routes[path] ?? `/${path.toLowerCase()}`;
  return query ? `${resolved}?${query}` : resolved;
}
