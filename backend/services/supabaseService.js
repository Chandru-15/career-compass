const { createClient } = require("@supabase/supabase-js");
const { required } = require("../config");
const { fail, logError } = require("./errors");
let client;
function getClient() {
  if (!client)
    client = createClient(
      required("SUPABASE_URL"),
      required("SUPABASE_SECRET_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (url, options = {}) =>
            fetch(url, {
              ...options,
              signal: AbortSignal.any([
                AbortSignal.timeout(12000),
                ...(options.signal ? [options.signal] : []),
              ]),
            }),
        },
      },
    );
  return client;
}
async function result(query) {
  const { data, error } = await query;
  if (error) {
    logError("Supabase", error);
    if (["PGRST205", "42P01", "PGRST202"].includes(error.code))
      throw fail(
        503,
        "Database schema is not installed. Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor.",
      );
    if (error.code === "23505")
      throw fail(409, "This record already exists. Refresh and try again.");
    if (["23514", "22P02", "23502"].includes(error.code))
      throw fail(400, "One or more fields contain an invalid value.");
    throw fail(
      503,
      "Database unavailable. Check the server configuration or retry shortly. Your changes were not saved.",
    );
  }
  return data;
}
const fields = {
  applications: [
    "job_id",
    "job_title",
    "company",
    "status",
    "applied_date",
    "next_step",
    "notes",
    "interview_date",
    "calendar_added",
  ],
  saved_jobs: ["job_id", "job_title", "company", "saved_date"],
  conversations: ["title", "messages", "mode"],
  skill_progress: [
    "skill_name",
    "category",
    "current_level",
    "target_level",
    "status",
    "importance",
    "resources",
    "progress",
    "target_date",
    "description",
  ],
  resumes: [
    "original_filename",
    "blob_name",
    "mime_type",
    "file_size",
    "extraction_status",
    "extracted_data",
  ],
  jobs: ["data"],
};
const pick = (table, data) =>
  Object.fromEntries(
    fields[table]
      .filter((k) => data[k] !== undefined)
      .map((k) => [
        k,
        [
          "interview_date",
          "applied_date",
          "saved_date",
          "target_date",
        ].includes(k) && data[k] === ""
          ? null
          : data[k],
      ]),
  );
function profileCompleteness(data) {
  const keys = [
    "phone",
    "location",
    "work_authorization",
    "desired_roles",
    "highest_degree",
    "institution",
    "major",
    "hard_skills",
    "soft_skills",
    "employment_status",
    "role_type",
    "work_arrangement",
    "preferred_industries",
    "domains_of_interest",
    "resume_url",
  ];
  return Math.round(
    (keys.filter((k) =>
      Array.isArray(data[k]) ? data[k].length : Boolean(data[k]),
    ).length /
      keys.length) *
      100,
  );
}
const profileView = (row) => ({
  ...row.data,
  id: row.id,
  email: row.email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
class SupabaseService {
  static async getUser(email) {
    let row = await result(
      getClient().from("profiles").select("*").eq("email", email).maybeSingle(),
    );
    if (!row) {
      await result(
        getClient()
          .from("profiles")
          .upsert(
            {
              email,
              data: {
                full_name: "Demo Candidate",
                onboarding_completed: false,
                profile_completeness: 0,
                desired_roles: [],
                hard_skills: [],
                soft_skills: [],
              },
            },
            { onConflict: "email", ignoreDuplicates: true },
          ),
      );
      row = await result(
        getClient().from("profiles").select("*").eq("email", email).single(),
      );
    }
    return profileView(row);
  }
  static async updateUser(email, updates) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await this.getUser(email);
      const data = { ...existing, ...updates };
      for (const key of [
        "id",
        "email",
        "createdAt",
        "updatedAt",
        "created_at",
        "updated_at",
      ])
        delete data[key];
      data.profile_completeness = profileCompleteness(data);
      const row = await result(
        getClient()
          .from("profiles")
          .update({ data })
          .eq("email", email)
          .eq("updated_at", existing.updatedAt)
          .select("*")
          .maybeSingle(),
      );
      if (row) return profileView(row);
    }
    throw fail(409, "The profile changed while saving. Please retry.");
  }
  static async list(table, email) {
    const profile = await this.getUser(email);
    return result(
      getClient()
        .from(table)
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false }),
    );
  }
  static async create(table, email, data) {
    const profile = await this.getUser(email);
    const row = { ...pick(table, data), user_id: profile.id };
    const conflict =
      table === "saved_jobs"
        ? "user_id,job_id"
        : table === "skill_progress"
          ? "user_id,skill_name"
          : null;
    const query = conflict
      ? getClient().from(table).upsert(row, { onConflict: conflict })
      : getClient().from(table).insert(row);
    return result(query.select("*").single());
  }
  static async update(table, email, id, data) {
    const profile = await this.getUser(email);
    const row = await result(
      getClient()
        .from(table)
        .update(pick(table, data))
        .eq("id", id)
        .eq("user_id", profile.id)
        .select("*")
        .maybeSingle(),
    );
    if (!row) throw fail(404, "Record not found.");
    return row;
  }
  static async remove(table, email, id) {
    const profile = await this.getUser(email);
    await result(
      getClient().from(table).delete().eq("id", id).eq("user_id", profile.id),
    );
    return { success: true };
  }
  static async getResume(email, id) {
    const profile = await this.getUser(email);
    const row = await result(
      getClient()
        .from("resumes")
        .select("*")
        .eq("id", id)
        .eq("user_id", profile.id)
        .maybeSingle(),
    );
    if (!row) throw fail(404, "Resume not found.");
    return row;
  }
  static async replaceSkills(email, skills) {
    const user = await this.getUser(email);
    return result(
      getClient().rpc("replace_skill_progress", {
        owner_id: user.id,
        skills: skills.map((s) => pick("skill_progress", s)),
      }),
    );
  }
  static async getJobs() {
    return (await result(getClient().from("jobs").select("*"))).map((r) => ({
      ...r.data,
      id: r.id,
    }));
  }
  static async createJob(data) {
    const row = await result(
      getClient().from("jobs").insert({ data }).select("*").single(),
    );
    return { ...row.data, id: row.id };
  }
}
module.exports = { SupabaseService, getClient, result, profileCompleteness };
