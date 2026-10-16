export const DEMO_SESSION_KEY = "career-compass.demo-session";
export const DEMO_IDENTITY = Object.freeze({
  id: "local-demo",
  email: "demo@careercompass.local",
  full_name: "Demo Candidate",
});
export function readDemoSession(storage) {
  return storage.getItem(DEMO_SESSION_KEY) === "signed-out"
    ? null
    : { ...DEMO_IDENTITY };
}
export function startDemoSession(storage) {
  storage.setItem(DEMO_SESSION_KEY, "active");
  return { ...DEMO_IDENTITY };
}
export function endDemoSession(storage) {
  storage.setItem(DEMO_SESSION_KEY, "signed-out");
}
