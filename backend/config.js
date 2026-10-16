const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const DEMO_EMAIL = "demo@careercompass.local";
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value)
    throw Object.assign(new Error(`Missing server configuration: ${name}`), {
      status: 503,
      publicMessage: `Missing server configuration: ${name}`,
    });
  return value;
};
function assertLocalMode() {
  if (
    process.env.AUTH_MODE !== "demo" ||
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "This server requires explicit AUTH_MODE=demo and a non-production environment. Production requires validated API authentication before deployment.",
    );
  }
}
module.exports = { required, DEMO_EMAIL, assertLocalMode };
