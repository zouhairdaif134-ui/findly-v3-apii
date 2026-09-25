import { getSupabase } from "./supabase.js";

const JWKS_TTL_MS = 10 * 60 * 1000;

let jwksCache = null;
let jwksFetchedAt = 0;

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded =
    normalized + (padding ? "=".repeat(4 - padding) : "");

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function base64UrlToJson(value) {
  return JSON.parse(
    new TextDecoder().decode(base64UrlToBytes(value))
  );
}

function getAuthorizationToken(request) {
  const header = request.headers.get("Authorization");

  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);

  return match ? match[1] : null;
}

async function getJwks(env) {
  const now = Date.now();

  if (
    jwksCache &&
    now - jwksFetchedAt < JWKS_TTL_MS
  ) {
    return jwksCache;
  }

  const response = await fetch(
    env.SUPABASE_URL +
      "/auth/v1/.well-known/jwks.json"
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load Supabase JWT signing keys"
    );
  }

  const jwks = await response.json();

  if (
    !Array.isArray(jwks.keys) ||
    jwks.keys.length === 0
  ) {
    throw new Error(
      "Supabase JWT signing keys are unavailable"
    );
  }

  jwksCache = jwks.keys;
  jwksFetchedAt = now;

  return jwksCache;
}

async function verifyJwt(env, token) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [
    encodedHeader,
    encodedPayload,
    encodedSignature
  ] = parts;

  const header = base64UrlToJson(encodedHeader);
  const payload = base64UrlToJson(encodedPayload);
  const signature =
    base64UrlToBytes(encodedSignature);

  if (header.alg !== "ES256") {
    throw new Error(
      "Unsupported JWT algorithm"
    );
  }

  if (!header.kid) {
    throw new Error(
      "JWT key ID is missing"
    );
  }

  const jwks = await getJwks(env);

  const jwk = jwks.find(
    (key) => key.kid === header.kid
  );

  if (!jwk) {
    throw new Error(
      "JWT signing key not found"
    );
  }

  const publicKey =
    await crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["verify"]
    );

  const valid =
    await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: "SHA-256"
      },
      publicKey,
      signature,
      new TextEncoder().encode(
        encodedHeader +
          "." +
          encodedPayload
      )
    );

  if (!valid) {
    throw new Error(
      "Invalid JWT signature"
    );
  }

  const now =
    Math.floor(Date.now() / 1000);

  if (!payload.sub) {
    throw new Error(
      "JWT subject is missing"
    );
  }

  if (
    !payload.exp ||
    payload.exp <= now
  ) {
    throw new Error(
      "JWT has expired"
    );
  }

  const expectedIssuer =
    env.SUPABASE_URL +
    "/auth/v1";

  if (
    payload.iss !== expectedIssuer
  ) {
    throw new Error(
      "Invalid JWT issuer"
    );
  }

  const audience =
    Array.isArray(payload.aud)
      ? payload.aud
      : [payload.aud];

  if (
    !audience.includes(
      "authenticated"
    )
  ) {
    throw new Error(
      "Invalid JWT audience"
    );
  }

  return payload;
}

async function getAdminContext(
  env,
  userId
) {
  const supabase =
    getSupabase(env);

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("admin_profiles")
    .select(
      "id, display_name, is_active"
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (
    !profile ||
    !profile.is_active
  ) {
    return null;
  }

  const {
    data: adminRoles,
    error: rolesError
  } = await supabase
    .from("admin_roles")
    .select("role_id")
    .eq("admin_id", userId);

  if (rolesError) {
    throw rolesError;
  }

  if (
    !adminRoles ||
    adminRoles.length === 0
  ) {
    return null;
  }

  const roleIds =
    adminRoles.map(
      (item) => item.role_id
    );

  const {
    data: roleRows,
    error: roleError
  } = await supabase
    .from("roles")
    .select("id, name")
    .in("id", roleIds);

  if (roleError) {
    throw roleError;
  }

  const roleNames =
    (roleRows || []).map(
      (role) => role.name
    );

  const {
    data: rolePermissions,
    error: rolePermissionsError
  } =
    await supabase
      .from("role_permissions")
      .select("permission_id")
      .in("role_id", roleIds);

  if (rolePermissionsError) {
    throw rolePermissionsError;
  }

  const permissionIds =
    (rolePermissions || []).map(
      (item) => item.permission_id
    );

  let permissionCodes = [];

  if (permissionIds.length > 0) {
    const {
      data: permissionRows,
      error: permissionError
    } = await supabase
      .from("permissions")
      .select("code")
      .in(
        "id",
        permissionIds
      );

    if (permissionError) {
      throw permissionError;
    }

    permissionCodes =
      (permissionRows || []).map(
        (permission) =>
          permission.code
      );
  }

  return {
    userId,
    displayName:
      profile.display_name,
    roles: roleNames,
    permissions:
      permissionCodes
  };
}

function authResponse(
  code,
  message,
  status,
  meta = {}
) {
  return new Response(
    JSON.stringify({
      success: false,
      data: null,
      error: {
        code,
        message
      },
      meta
    }),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
        "Access-Control-Allow-Origin":
          "*"
      }
    }
  );
}

export async function authorizeRequest(
  env,
  request,
  requiredPermission = null
) {
  const token =
    getAuthorizationToken(
      request
    );

  if (!token) {
    return {
      response: authResponse(
        "UNAUTHORIZED",
        "Authorization token is required",
        401
      )
    };
  }

  try {
    const claims =
      await verifyJwt(
        env,
        token
      );

    const admin =
      await getAdminContext(
        env,
        claims.sub
      );

    if (!admin) {
      return {
        response: authResponse(
          "FORBIDDEN",
          "Admin access is required",
          403
        )
      };
    }

    if (
      requiredPermission &&
      !admin.permissions.includes(
        requiredPermission
      )
    ) {
      return {
        response: authResponse(
          "FORBIDDEN",
          "Insufficient permissions",
          403,
          {
            required_permission:
              requiredPermission
          }
        )
      };
    }

    return {
      claims,
      admin
    };
  } catch (error) {
    console.error(
      "JWT authorization failed",
      error
    );

    return {
      response: authResponse(
        "UNAUTHORIZED",
        "Invalid or expired authorization token",
        401
      )
    };
  }
}
