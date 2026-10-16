const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");

test("PostgreSQL migration, access restrictions, uniqueness and atomic rollback", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    const migration = fs.readFileSync(
      path.join(__dirname, "../../supabase/migrations/001_initial_schema.sql"),
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration); // Re-running the migration must not destroy data or fail.
    const {
      rows: [user],
    } = await db.query(
      "insert into profiles (email) values ('schema-test@example.test') returning id",
    );
    await db.query("insert into saved_jobs (user_id, job_id) values ($1, $2)", [
      user.id,
      "csv-test",
    ]);
    await assert.rejects(
      db.query("insert into saved_jobs (user_id, job_id) values ($1, $2)", [
        user.id,
        "csv-test",
      ]),
      /unique/,
    );
    await db.query("select * from replace_skill_progress($1, $2::jsonb)", [
      user.id,
      JSON.stringify([{ skill_name: "Python", progress: 40 }]),
    ]);
    await assert.rejects(
      db.query("select * from replace_skill_progress($1, $2::jsonb)", [
        user.id,
        JSON.stringify([{ skill_name: "SQL", progress: 101 }]),
      ]),
      /check constraint/,
    );
    const { rows: skills } = await db.query(
      "select skill_name, progress from skill_progress where user_id = $1",
      [user.id],
    );
    assert.deepEqual(skills, [{ skill_name: "Python", progress: 40 }]);
    const { rows: permissions } = await db.query(
      "select has_table_privilege('anon','public.profiles','select') as anon, has_table_privilege('authenticated','public.resumes','select') as authenticated, has_function_privilege('anon','public.replace_skill_progress(uuid,jsonb)','execute') as rpc",
    );
    assert.deepEqual(permissions[0], {
      anon: false,
      authenticated: false,
      rpc: false,
    });
    const { rows: tables } = await db.query(
      "select relname from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity",
    );
    assert.equal(tables.length, 7);
  } finally {
    await db.close();
  }
});
