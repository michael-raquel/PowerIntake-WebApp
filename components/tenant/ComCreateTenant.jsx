"use client";

import { useMemo, useState } from "react";
import { X, Building2, Loader2, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCreateTenant } from "@/hooks/UseCreateTenant";
import { useFetchUserProfile } from "@/hooks/UseFetchUserProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_FORM = {
  tenantname: "",
  entratenantid: "",
  tenantemail: "",
  dynamicsaccountid: "",
  superadmingroupid: "",
  admingroupid: "",
  companyallgroupid: "",
};

const USER_FIELDS = [
  ["NAME", "displayName"],
  ["JOB TITLE", "jobTitle"],
  ["DEPARTMENT", "department"],
  ["EMAIL", "mail", null, "col-span-2"],
  ["BUSINESS PHONE", "businessPhones", (value) => value?.[0]],
];

function UserInfoPanel({ profile, profileLoading }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {profileLoading
        ? USER_FIELDS.map((field, index) => (
            <div key={index} className={field[3]}>
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))
        : USER_FIELDS.map(([label, key, transform, span]) => {
            const value = transform ? transform(profile?.[key]) : profile?.[key];
            return (
              <div key={label} className={span}>
                <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1 break-all">
                  {value ?? "-"}
                </p>
              </div>
            );
          })}
    </div>
  );
}

export default function ComCreateTenant({ onClose, onTenantCreated }) {
  const { tokenInfo } = useAuth();
  const account = tokenInfo?.account;
  const { profile, loading: profileLoading } = useFetchUserProfile(
    account?.localAccountId,
  );
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { createTenant, loading } = useCreateTenant({ account });

  const isBusy = submitting || loading;

  const validated = useMemo(() => {
    const nextErrors = {};

    if (!formData.tenantname.trim()) {
      nextErrors.tenantname = "Tenant name is required.";
    }

    if (!formData.entratenantid.trim()) {
      nextErrors.entratenantid = "Entra tenant ID is required.";
    } else if (!UUID_REGEX.test(formData.entratenantid.trim())) {
      nextErrors.entratenantid = "Entra tenant ID must be a valid UUID.";
    }

    if (formData.tenantemail.trim() && !EMAIL_REGEX.test(formData.tenantemail.trim())) {
      nextErrors.tenantemail = "Enter a valid tenant email address.";
    }

    return nextErrors;
  }, [formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors(validated);

    if (Object.keys(validated).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const createdUuid = await createTenant({
        tenantname: formData.tenantname.trim(),
        entratenantid: formData.entratenantid.trim(),
        tenantemail: formData.tenantemail.trim() || null,
        createdby: account?.localAccountId ?? null,
        dynamicsaccountid: formData.dynamicsaccountid.trim() || null,
        superadmingroupid: formData.superadmingroupid.trim() || null,
        admingroupid: formData.admingroupid.trim() || null,
        companyallgroupid: formData.companyallgroupid.trim() || null,
      });

      toast.success("Tenant created successfully.");
      onTenantCreated?.(createdUuid);
      onClose?.();
    } catch (error) {
      toast.error(error?.message || "Failed to create tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData(DEFAULT_FORM);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Create Tenant
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Fill out the details below to register a new tenant workspace.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isBusy}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Please review all details before creating this tenant.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Tenant Details
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Required: tenant name and Entra tenant ID.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tenantname" className="text-xs mb-1 block">
                      Tenant Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tenantname"
                      name="tenantname"
                      value={formData.tenantname}
                      onChange={handleChange}
                      placeholder="Enter tenant name"
                      className={
                        errors.tenantname
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      disabled={isBusy}
                    />
                    {errors.tenantname && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        {errors.tenantname}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="entratenantid"
                      className="text-xs mb-1 block"
                    >
                      Entra Tenant ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="entratenantid"
                      name="entratenantid"
                      value={formData.entratenantid}
                      onChange={handleChange}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className={
                        errors.entratenantid
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      disabled={isBusy}
                    />
                    {errors.entratenantid && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        {errors.entratenantid}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenantemail" className="text-xs mb-1 block">
                      Tenant Email
                    </Label>
                    <Input
                      id="tenantemail"
                      name="tenantemail"
                      type="email"
                      value={formData.tenantemail}
                      onChange={handleChange}
                      placeholder="admin@tenant.com"
                      className={
                        errors.tenantemail
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      disabled={isBusy}
                    />
                    {errors.tenantemail && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        {errors.tenantemail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-5">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Optional Integrations And Groups
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 mb-4">
                    Add IDs now, or leave blank and update later.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                      <Label htmlFor="superadmingroupid" className="text-xs mb-1 block">
                      Super Admin Group ID
                      </Label>
                      <Input
                        id="superadmingroupid"
                        name="superadmingroupid"
                        value={formData.superadmingroupid}
                        onChange={handleChange}
                        placeholder="superadmin-group-id-value"
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

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="companyallgroupid" className="text-xs mb-1 block">
                      Company All Group ID
                      </Label>
                      <Input
                        id="companyallgroupid"
                        name="companyallgroupid"
                        value={formData.companyallgroupid}
                        onChange={handleChange}
                        placeholder="company-all-group-id-value"
                        disabled={isBusy}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={isBusy}
                    className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:border-gray-600 dark:hover:bg-gray-800 appearance-none"
                  >
                    Clear
                  </Button>

                  <Button
                    type="submit"
                    disabled={isBusy}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isBusy ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" /> Create Tenant
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <div className="block lg:hidden bg-white dark:bg-gray-900 rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">User Information</h2>
              <UserInfoPanel profile={profile} profileLoading={profileLoading} />
            </div>
          </div>

          <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg border p-6 sticky top-6 h-fit">
            <h2 className="text-lg font-medium mb-4">User Information</h2>
            <UserInfoPanel profile={profile} profileLoading={profileLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
