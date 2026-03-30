const axios = require("axios");
const client = require("../config/db");
const { getAccessToken } = require("../config/authService");

// ✅ Use env (fallback to prod URL if missing)
const FRONTEND_BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://powerintake.spartaserv.com";

const consent_Callback = async (req, res) => {
  const { tenant, admin_consent, error } = req.query;

  console.log("[CONSENT] Incoming callback:", {
    tenant,
    admin_consent,
    error,
  });

  // ❌ Consent rejected / cancelled
  if (error || admin_consent !== "True") {
    console.warn("[CONSENT] Failed or cancelled:", {
      tenant,
      error,
      admin_consent,
    });

    return res.redirect(
      `${FRONTEND_BASE}/no-consent?reason=error`
    );
  }

  try {
    // ── 1. Get access token ────────────────────────
    const token = await getAccessToken(tenant);
    const headers = { Authorization: `Bearer ${token}` };

    // ── 2. Fetch org info ──────────────────────────
    const orgRes = await axios.get(
      "https://graph.microsoft.com/v1.0/organization",
      { headers }
    );

    const org = orgRes.data.value?.[0];
    const tenantName = org?.displayName ?? "Unknown";
    const tenantEmail =
      org?.verifiedDomains?.find((d) => d.isDefault)?.name ?? null;

    console.log("[CONSENT] Org:", { tenantName, tenantEmail });

    // ── 3. Ensure tenant exists ────────────────────
    await client.query(
      `SELECT public.batch_tenant_insert($1, $2, $3)`,
      [[tenantName], [null], [tenant]]
    );

    console.log("[CONSENT] Tenant ensured in DB");

    // ── 4. Update consent (STRICT) ─────────────────
    const consentResult = await client.query(
      `SELECT * FROM public.tenant_update_isconsented($1, $2)`,
      [tenant, true]
    );

    const updateRow = consentResult.rows[0];

    if (!updateRow?.updated) {
      console.error("[CONSENT] DB update failed:", updateRow);

      // 🚨 Send user to retry scenario
      return res.redirect(
        `${FRONTEND_BASE}/no-consent?reason=consent-update-failed`
      );
    }

    console.log("[CONSENT] DB update:", updateRow);
    console.log(`[CONSENT] Tenant consented: ${tenantName} (${tenant})`);

    // ── 5. Redirect success → go through checking flow ──
    return res.redirect(
      `${FRONTEND_BASE}/checking?consent=success`
    );

  } catch (err) {
    console.error("[CONSENT] Callback error:", {
      message: err.message,
      tenant,
    });

    // 🚨 Generic failure → retry scenario
    return res.redirect(
      `${FRONTEND_BASE}/no-consent?reason=consent-update-failed`
    );
  }
};

module.exports = { consent_Callback };