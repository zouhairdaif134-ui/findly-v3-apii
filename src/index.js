import { createClient } from "@supabase/supabase-js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({
        success: true,
        data: {
          service: "findly-v3-api",
          version: "3.0.0",
          status: "healthy"
        },
        error: null
      });
    }

    // Supabase connection test
    if (url.pathname === "/api/test-supabase") {
      try {
        if (!env.SUPABASE_URL) {
          throw new Error("SUPABASE_URL is missing");
        }

        if (!env.SUPABASE_SECRET_KEY) {
          throw new Error("SUPABASE_SECRET_KEY is missing");
        }

        const secretStatus = {
          exists: Boolean(env.SUPABASE_SECRET_KEY),
          length: env.SUPABASE_SECRET_KEY?.length ?? 0
        };

        const supabase = createClient(
          env.SUPABASE_URL,
          env.SUPABASE_SECRET_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          }
        );

        const { count, error } = await supabase
          .from("bots")
          .select("id", {
            count: "exact",
            head: true
          });

        if (error) {
          throw error;
        }

        return Response.json({
          success: true,
          data: {
            secret: secretStatus,
            bots: [],
            count
          },
          error: null
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            data: null,
            error: {
              code: "SUPABASE_ERROR",
              message: error.message
            }
          },
          { status: 500 }
        );
      }
    }

    return Response.json(
      {
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Endpoint not found"
        }
      },
      { status: 404 }
    );
  }
};
