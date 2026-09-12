import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Instantiates a secure server-side Supabase client.
// All authentication is computed on the server side to protect secrets from frontend bundle exposures.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Optional admin client for programmatic bypass of email confirmation (requires SUPABASE_SERVICE_ROLE_KEY)
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Missing email or password." }, { status: 400 });
    }

    // 1. Attempt to authenticate with Supabase Auth
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 2. Fallback: If user is the default admin and doesn't exist yet, auto-provision them in Supabase
    if (error && email === "admin@triplesproduction.com" && password === "TSP@2024") {
      if (supabaseAdmin) {
        if (error.message === "Email not confirmed") {
          // User already exists but is unconfirmed. Auto-confirm them programmatically!
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const targetUser = userList?.users.find(u => u.email === email);
          if (targetUser) {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
              email_confirm: true
            });
            if (!updateError) {
              const retry = await supabase.auth.signInWithPassword({ email, password });
              data = retry.data;
              error = retry.error;
            }
          }
        } else {
          // User does not exist. Create them with email_confirm: true
          const { error: adminError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
          });

          if (!adminError) {
            const retry = await supabase.auth.signInWithPassword({ email, password });
            data = retry.data;
            error = retry.error;
          } else {
            error = adminError;
          }
        }
      } else {
        // Standard fallback if no service role key is provided
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (!signUpError) {
          const retry = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          data = retry.data;
          error = retry.error;
        } else {
          error = signUpError;
        }
      }
    }

    if (error) {
      let friendlyError = error.message;
      if (email === "admin@triplesproduction.com" && password === "TSP@2024") {
        if (error.message === "Email not confirmed") {
          friendlyError = "Supabase Email Confirmation is active. Please disable 'Confirm email' under Auth Providers in Supabase, or run the SQL seed script to confirm this user.";
        } else if (error.message === "Invalid login credentials") {
          friendlyError = "Admin user not found. Please disable 'Confirm email' under Auth Providers in Supabase so we can auto-provision them, or run the SQL seed script.";
        }
      }
      return NextResponse.json({ success: false, error: friendlyError }, { status: 401 });
    }

    // Auth succeeded! Return success and session details
    return NextResponse.json({ 
      success: true, 
      session: data.session,
      token: data.session?.access_token
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Internal authentication error." }, { status: 500 });
  }
}
