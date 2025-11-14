/* eslint-disable no-console */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = "admin@voices.mn";
const ADMIN_PASSWORD = "YWRtaW5hY2MK";

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (listError) {
    console.error("Failed to list Supabase users:", listError);
    process.exit(1);
  }

  const existing = users.find(
    (user) => user.email?.toLowerCase() === ADMIN_EMAIL
  );

  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password: ADMIN_PASSWORD,
        email: ADMIN_EMAIL,
        email_confirm: true,
        user_metadata: {
          role: "admin",
          display_name: "Administrator",
        },
        app_metadata: {
          role: "admin",
        },
      }
    );

    if (updateError) {
      console.error("Failed to update existing admin user:", updateError);
      process.exit(1);
    }

    console.log("Admin user updated successfully.");
    return;
  }

  const { error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: "admin",
      display_name: "Administrator",
    },
    app_metadata: {
      role: "admin",
    },
  });

  if (createError) {
    console.error("Failed to create admin user:", createError);
    process.exit(1);
  }

  console.log("Admin user created successfully.");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unexpected error while seeding admin user:", error);
    process.exit(1);
  });
