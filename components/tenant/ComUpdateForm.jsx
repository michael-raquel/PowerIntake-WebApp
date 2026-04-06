"use client";

import { useEffect, useMemo, useState } from "react";
import { X, RefreshCw, Save, AlertCircle, Building2 } from "lucide-react";
import { useUpdateTenant } from "@/hooks/UseUpdateTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readField = (tenant, keys, fallback = "") => {
  for (const key of keys) {
    const value = tenant?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return fallback;
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "active", "consented"].includes(lowered)) {
      return true;
    }
    if (
      ["false", "0", "no", "n", "inactive", "not consented"].includes(lowered)
    ) {
      return false;
    }
  }
  return fallback;
};

const toText = (value) =>
  value === null || value === undefined ? "" : String(value);

const buildFormData = (tenant) => ({
  entratenantid: toText(
    readField(tenant, ["entratenantid", "v_entratenantid"]),
  ),
  tenantname: toText(readField(tenant, ["tenantname", "v_tenantname"])),
  tenantemail: toText(readField(tenant, ["tenantemail", "v_tenantemail"])),
  dynamicsaccountid: toText(
    readField(tenant, ["dynamicsaccountid", "v_dynamicsaccountid"]),
  ),
  admingroupid: toText(readField(tenant, ["admingroupid", "v_admingroupid"])),
  usergroupid: toText(readField(tenant, ["usergroupid", "v_usergroupid"])),

  isactive: normalizeBoolean(
    readField(tenant, ["isactive", "v_isactive"], false),
  ),
  isconsented: normalizeBoolean(
    readField(tenant, ["isconsented", "v_isconsented"], false),
  ),
  isapproved: normalizeBoolean(
    // ✅ ADD THIS
    readField(tenant, ["isapproved", "v_isapproved"], false),
  ),
});

const trimOrEmpty = (value) => String(value || "").trim();
const OUTLINE_BUTTON_CLASS =
  "bg-white text-gray-900 border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:border-gray-600 dark:hover:bg-gray-800 appearance-none";

export default function ComUpdateForm({ tenant, onClose, onUpdated }) {
  const [formData, setFormData] = useState(() => buildFormData(tenant));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { updateTenant, loading } = useUpdateTenant();
  const tenantUuid = useMemo(
    () => trimOrEmpty(readField(tenant, ["tenantuuid", "v_tenantuuid"], "")),
    [tenant],
  );

  const initialForm = useMemo(() => buildFormData(tenant), [tenant]);

  useEffect(() => {
    setFormData(initialForm);
    setErrors({});
  }, [initialForm]);

  const isBusy = submitting || loading;

  const hasChanges = useMemo(() => {
    const fields = [
      "entratenantid",
      "tenantname",
      "tenantemail",
      "dynamicsaccountid",
      "admingroupid",
      "usergroupid",
    ];

    for (const field of fields) {
      if (trimOrEmpty(formData[field]) !== trimOrEmpty(initialForm[field])) {
        return true;
      }
    }

    return (
      Boolean(formData.isactive) !== Boolean(initialForm.isactive) ||
      Boolean(formData.isconsented) !== Boolean(initialForm.isconsented) ||
      Boolean(formData.isapproved) !== Boolean(initialForm.isapproved) // ✅ ADD
    );
  }, [formData, initialForm]);

  const validationErrors = useMemo(() => {
    const next = {};

    if (!trimOrEmpty(formData.tenantname)) {
      next.tenantname = "Tenant name is required.";
    }

    if (!trimOrEmpty(formData.entratenantid)) {
      next.entratenantid = "Entra tenant ID is required.";
    } else if (!UUID_REGEX.test(trimOrEmpty(formData.entratenantid))) {
      next.entratenantid = "Entra tenant ID must be a valid UUID.";
    }

    if (
      trimOrEmpty(formData.tenantemail) &&
      !EMAIL_REGEX.test(trimOrEmpty(formData.tenantemail))
    ) {
      next.tenantemail = "Enter a valid tenant email address.";
    }

    return next;
  }, [formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleToggle = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: Boolean(value) }));
  };

  const handleReset = () => {
    setFormData(initialForm);
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors(validationErrors);

    if (!tenantUuid) {
      toast.error("Missing tenant UUID.");
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    if (!hasChanges) {
      toast.message("No changes to update.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateTenant({
        tenantuuid: tenantUuid,
        entratenantid: formData.entratenantid,
        tenantname: formData.tenantname,
        tenantemail: formData.tenantemail,
        dynamicsaccountid: formData.dynamicsaccountid,
        admingroupid: formData.admingroupid,
        usergroupid: formData.usergroupid,
        isactive: formData.isactive,
        isconsented: formData.isconsented,
        isapproved: formData.isapproved, // ✅ ADD
      });

      toast.success("Tenant updated successfully.");
      onUpdated?.(result?.tenantuuid || tenantUuid);
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to update tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tenant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Tenant
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Review and save tenant changes
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isBusy}
            className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/40 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Required fields: Entra Tenant ID and Tenant Name.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entratenantid" className="text-xs mb-1 block">
                  Entra Tenant ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="entratenantid"
                  name="entratenantid"
                  value={formData.entratenantid}
                  onChange={handleChange}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  disabled={isBusy}
                  className={
                    errors.entratenantid
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.entratenantid && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {errors.entratenantid}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantname" className="text-xs mb-1 block">
                  Tenant Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenantname"
                  name="tenantname"
                  value={formData.tenantname}
                  onChange={handleChange}
                  placeholder="Contoso Philippines"
                  disabled={isBusy}
                  className={
                    errors.tenantname
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.tenantname && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {errors.tenantname}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tenantemail" className="text-xs mb-1 block">
                  Tenant Email
                </Label>
                <Input
                  id="tenantemail"
                  name="tenantemail"
                  value={formData.tenantemail}
                  onChange={handleChange}
                  type="email"
                  placeholder="admin@tenant.com"
                  disabled={isBusy}
                  className={
                    errors.tenantemail
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.tenantemail && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {errors.tenantemail}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="dynamicsaccountid"
                  className="text-xs mb-1 block"
                >
                  Dynamics Account ID
                </Label>
                <Input
                  id="dynamicsaccountid"
                  name="dynamicsaccountid"
                  value={formData.dynamicsaccountid}
                  onChange={handleChange}
                  placeholder="5f00ecfd-7fd2-f011-8c4d-7c1e520d4978"
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admingroupid" className="text-xs mb-1 block">
                  Admin Group ID
                </Label>
                <Input
                  id="admingroupid"
                  name="admingroupid"
                  value={formData.admingroupid}
                  onChange={handleChange}
                  placeholder="group-id-value"
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usergroupid" className="text-xs mb-1 block">
                  User Group ID
                </Label>
                <Input
                  id="usergroupid"
                  name="usergroupid"
                  value={formData.usergroupid}
                  onChange={handleChange}
                  placeholder="user-group-id-value"
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-5">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Status Flags
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Active
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Controls tenant active state
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(formData.isactive)}
                    onCheckedChange={(value) => handleToggle("isactive", value)}
                    disabled={isBusy}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Consented
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Marks tenant consent status
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(formData.isconsented)}
                    onCheckedChange={(value) =>
                      handleToggle("isconsented", value)
                    }
                    disabled={isBusy}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Approved
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Marks tenant approval status
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(formData.isapproved)}
                    onCheckedChange={(value) =>
                      handleToggle("isapproved", value)
                    }
                    disabled={isBusy}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isBusy || !hasChanges}
                className={OUTLINE_BUTTON_CLASS}
              >
                Reset
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isBusy}
                className={OUTLINE_BUTTON_CLASS}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isBusy || !hasChanges}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 lg:py-2.5"
              >
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Updating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> Update Tenant
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
