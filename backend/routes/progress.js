const router = require("express").Router();
const {
  SupabaseService: db,
  profileCompleteness,
} = require("../services/supabaseService");
const { route } = require("../services/errors");
async function analytics(email) {
  const [user, applications, saved, skills, conversations] = await Promise.all([
    db.getUser(email),
    db.list("applications", email),
    db.list("saved_jobs", email),
    db.list("skill_progress", email),
    db.list("conversations", email),
  ]);
  const avg = skills.length
    ? Math.round(skills.reduce((sum, s) => sum + s.progress, 0) / skills.length)
    : 0;
  const progress = {
    profileCompleteness: user.profile_completeness || 0,
    applicationsSubmitted: applications.length,
    jobsSaved: saved.length,
    skillsLearning: avg,
    conversationsStarted: conversations.length,
  };
  progress.overallScore = Math.round(
    (30 * progress.profileCompleteness) / 100 +
      25 * Math.min(applications.length / 10, 1) +
      15 * Math.min(saved.length / 20, 1) +
      (20 * avg) / 100 +
      10 * Math.min(conversations.length / 5, 1),
  );
  return {
    profile: {
      completeness: progress.profileCompleteness,
      onboardingCompleted: user.onboarding_completed,
      lastUpdated: user.updatedAt,
    },
    applications: {
      total: applications.length,
      pending: applications.filter((a) =>
        ["applied", "under_review"].includes(a.status),
      ).length,
      interviewing: applications.filter((a) => a.status === "interview").length,
      offered: applications.filter((a) => a.status === "offer").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    },
    jobs: { saved: saved.length },
    skills: {
      total: skills.length,
      inProgress: skills.filter((s) => s.progress > 0 && s.progress < 100)
        .length,
      completed: skills.filter((s) => s.progress >= 100).length,
      averageProgress: avg,
    },
    conversations: {
      total: conversations.length,
      lastConversation: conversations[0]?.updated_at || null,
    },
    progress,
  };
}
router.post(
  "/users",
  route(async (req, res) =>
    res.json({
      success: true,
      user: await db.updateUser(req.userEmail, {
        ...req.body.profileData,
        ...(req.body.name ? { full_name: req.body.name } : {}),
      }),
    }),
  ),
);
router.get(
  "/analytics/:email",
  route(async (req, res) =>
    res.json({ success: true, analytics: await analytics(req.userEmail) }),
  ),
);
for (const method of ["get", "post"])
  router[method](
    "/progress/:email",
    route(async (req, res) =>
      res.json({
        success: true,
        progress: (await analytics(req.userEmail)).progress,
      }),
    ),
  );
router.post(
  "/calculate-completeness/:email",
  route(async (req, res) => {
    const profile = await db.getUser(req.userEmail);
    res.json({
      success: true,
      completeness: profileCompleteness(profile),
      totalFields: 15,
    });
  }),
);
router.post(
  "/activity/:email",
  route(async (req, res) => {
    const user = await db.getUser(req.userEmail);
    const activity = {
      type: String(req.body.activityType || "activity").slice(0, 100),
      data: req.body.activityData || {},
      timestamp: new Date().toISOString(),
    };
    await db.updateUser(req.userEmail, {
      activityLog: [...(user.activityLog || []), activity].slice(-100),
      lastActivity: activity,
    });
    res.json({ success: true });
  }),
);
module.exports = router;
