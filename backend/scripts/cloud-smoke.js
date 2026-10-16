require("../config");
const { getClient } = require("../services/supabaseService");
const { chat } = require("../services/openaiService");
const { BlobService } = require("../services/blobService");
(async () => {
  for (const [name, fn] of [
    [
      "Supabase",
      async () => {
        const { error } = await getClient()
          .from("profiles")
          .select("id")
          .limit(1);
        if (error) {
          console.log(
            "Supabase safe status:",
            String(error.code).replace(/[^A-Za-z0-9]/g, ""),
          );
          if (["PGRST205", "42P01"].includes(error.code)) {
            console.log(
              "Authenticated connection reached; migration required.",
            );
            throw new Error("Schema pending");
          } else throw new Error("Database connectivity failed.");
        } else console.log("Profiles table accessible.");
      },
    ],
    [
      "Azure chat interview",
      async () => {
        const text = await chat({
          systemPrompt:
            "You are an interview preparation coach. Greet the user briefly.",
          messages: [{ role: "user", content: "hello" }],
        });
        console.log("Real interview response received:", text.length > 0);
      },
    ],
    [
      "Azure chat roadmap",
      async () => {
        const text = await chat({
          systemPrompt:
            "You are a career roadmap coach. Greet the user briefly.",
          messages: [{ role: "user", content: "hello" }],
        });
        console.log("Real roadmap response received:", text.length > 0);
      },
    ],
    [
      "Blob privacy",
      async () =>
        console.log(
          "Existing container is private:",
          await BlobService.verifyPrivate(),
        ),
    ],
  ]) {
    try {
      await fn();
      console.log(name + ": PASS");
    } catch (e) {
      console.log(
        name +
          ": NOT READY; code=" +
          String(e.code || e.name).replace(/[^A-Za-z0-9_-]/g, ""),
      );
      process.exitCode = 1;
    }
  }
  console.log(
    "Deployment matches requested configuration:",
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME === "career-compass-chat",
  );
})().catch(() => {
  console.log("Cloud smoke failed");
  process.exitCode = 1;
});
