"use client";

import { useState, useRef } from 'react';
import { X, Plus, Upload, Clock, MapPin, Calendar as CalendarIcon, AlertCircle, FileText, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useFetchUserProfile } from "@/hooks/UseFetchUserProfile";
import { useCreateTicket } from "@/hooks/useCreateTicket";
import { toast } from "sonner";
import useUploadImage from '@/hooks/UseUploadImage';
import { useSpartaAssistOnce } from "@/hooks/UseSpartaAssist";
import { Sparkles, X as XIcon } from "lucide-react";
import { useFetchUserSettings } from "@/hooks/UseFetchUserSettings";
import powersuiteaiicon from '../settings/assets/powersuiteai.svg';

const LOCATIONS = ['Remote', 'Hybrid', 'Office'];
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CALL_DURATION_HOURS = 2;
const END_TIME_THRESHOLD_MINUTES = 23 * 60 + 30;
const END_TIME_CAP = '23:59';

const getDefaultStartTime = (now = new Date()) => {
  const totalMinutes = now.getHours() * 60 + now.getMinutes() + 30;
  const rounded = Math.ceil(totalMinutes / 30) * 30;
  const capped = Math.min(rounded, END_TIME_THRESHOLD_MINUTES);
  const time = new Date(now);
  time.setHours(0, capped, 0, 0);
  return format(time, 'HH:mm');
};

const calculateEndTime = (date, startTime) => {
  if (!date || !startTime) return '';
  const [hours, minutes] = startTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';
  const endMinutes = hours * 60 + minutes + CALL_DURATION_HOURS * 60;
  if (endMinutes > END_TIME_THRESHOLD_MINUTES) return END_TIME_CAP;
  const end = new Date(date);
  end.setHours(0, endMinutes, 0, 0);
  return format(end, 'HH:mm');
};

const validateCall = (call, now = new Date()) => {
  const fieldRef = `call-${call.id}-date`;
  
  const formatTime12hr = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const isToday = new Date(call.date).toDateString() === now.toDateString();
  const currentTime = format(now, 'HH:mm');
  
  if (isToday && call.fromTime <= currentTime) {
    const formattedNow = format(now, 'h:mm a');
    const formattedSelected = formatTime12hr(call.fromTime);
    return {
      isValid: false,
      title: 'Start time has passed',
      description: `You selected ${formattedSelected}, but it's currently ${formattedNow}. Please choose a later time.`,
      fieldRef,
    };
  }

  if (call.fromTime >= call.toTime) {
    const formattedStart = formatTime12hr(call.fromTime);
    const formattedEnd = formatTime12hr(call.toTime);
    return {
      isValid: false,
      title: 'Invalid time range',
      description: `End time (${formattedEnd}) must be after start time (${formattedStart}). Same-day calls only.`,
      fieldRef,
    };
  }

  return { isValid: true };
};

const USER_FIELDS = [
  ['NAME', 'displayName'],
  ['JOB TITLE', 'jobTitle'],
  ['DEPARTMENT', 'department'],
  ['EMAIL', 'mail', null, 'col-span-2'],
  ['BUSINESS PHONE', 'businessPhones', v => v?.[0]],
];

const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone').map(tz => {
  try {
    const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'longOffset', hour: 'numeric' })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName')?.value.replace('GMT', '').trim();
    return { label: offset ? `${tz} (UTC${offset})` : tz, value: tz };
  } catch {
    return { label: tz, value: tz };
  }
});

const detectTimezone = () => {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (ALL_TIMEZONES.some(tz => tz.value === detected)) return detected;
  const offsetMinutes = -new Date().getTimezoneOffset();
  const match = ALL_TIMEZONES.find(tz => {
    try {
      const parts = new Intl.DateTimeFormat('en', { timeZone: tz.value, timeZoneName: 'longOffset', hour: 'numeric' })
        .formatToParts(new Date());
      const raw = parts.find(p => p.type === 'timeZoneName')?.value ?? '';
      const sign = raw.includes('-') ? -1 : 1;
      const [h = 0, m = 0] = raw.replace('GMT', '').replace(/[+-]/, '').split(':').map(Number);
      return sign * (h * 60 + m) === offsetMinutes;
    } catch { return false; }
  });
  return match?.value ?? detected;
};

const detectedTimezone = detectTimezone();
const DEFAULT_FORM = { title: '', description: '' };

const buildSupportCall = (overrides = {}) => {
  const date = overrides.date ? new Date(overrides.date) : new Date();
  const fromTime = overrides.fromTime ?? getDefaultStartTime();
  const toTime = overrides.toTime ?? calculateEndTime(date, fromTime);

  return {
    id: overrides.id ?? Date.now(),
    date,
    fromTime,
    toTime,
    timezone: overrides.timezone ?? detectedTimezone,
    location: overrides.location ?? 'Remote',
  };
};

const useSupportCalls = () => {
  const [supportCalls, setSupportCalls] = useState([buildSupportCall()]);

  const handleCallChange = (id, field, value) => {
    setSupportCalls(prev => prev.map(call => {
      if (call.id !== id) return call;

      if (field === 'date') {
        const newDate = value ? new Date(value) : null;
        return { ...call, date: newDate, toTime: calculateEndTime(newDate, call.fromTime) };
      }

      if (field === 'fromTime') {
        return { ...call, fromTime: value, toTime: calculateEndTime(call.date, value) };
      }

      if (field === 'toTime') {
        return { ...call, toTime: value };
      }

      return { ...call, [field]: value };
    }));
  };

  const addCall = () => {
    const usedDates = new Set(supportCalls.map(c => c.date?.toDateString()).filter(Boolean));
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    while (usedDates.has(date.toDateString())) date.setDate(date.getDate() + 1);

    const fromTime = getDefaultStartTime();
    setSupportCalls(prev => [...prev, buildSupportCall({ date, fromTime })]);
    toast.success('Support call added', { description: `Scheduled for ${format(date, 'MM/dd/yyyy')}.` });
  };

  const removeCall = id => setSupportCalls(prev => prev.filter(call => call.id !== id));
  const resetCalls = () => setSupportCalls([buildSupportCall()]);

  return { supportCalls, handleCallChange, addCall, removeCall, resetCalls };
};

function UserInfoPanel({ profile, profileLoading }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {profileLoading
        ? USER_FIELDS.map((f, i) => (
          <div key={i} className={f[3]}>
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        ))
        : USER_FIELDS.map(([label, key, transform, span]) => {
          const value = transform ? transform(profile?.[key]) : profile?.[key];
          return (
            <div key={label} className={span}>
              <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
              <p className="text-sm text-gray-900 dark:text-white mt-1 break-all">{value ?? '—'}</p>
            </div>
          );
        })}
    </div>
  );
}

export default function ComCreateTicket({ onClose, onTicketCreated }) {
  const { account } = useAuth();
  const { profile, loading: profileLoading } = useFetchUserProfile(account?.localAccountId);
  const { uploadImage } = useUploadImage();
  const { createTicket } = useCreateTicket({ account, onSuccess: onTicketCreated });

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const { supportCalls, handleCallChange, addCall, removeCall, resetCalls } = useSupportCalls();
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const fieldRefs = useRef({});
  const { askAssist, loading: aiLoading, suggestion, error: aiError, clear: clearSuggestion } = useSpartaAssistOnce();

  const { userSettings } = useFetchUserSettings({ entrauserid: account?.localAccountId });
  const powersuiteaiEnabled = userSettings?.[0]?.v_powersuiteai ?? false;

  const handleInputChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const processFiles = files => {
    const valid = [];
    Array.from(files).forEach(file => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) toast.error(`"${file.name}" is not an image file`);
      else if (file.size > MAX_FILE_SIZE) toast.error(`"${file.name}" exceeds 10MB`);
      else valid.push(file);
    });
    setAttachments(prev => [...prev, ...valid.filter(f => !prev.some(p => p.name === f.name))]);
  };

  const validateAll = () => {
    if (!formData.title || !formData.description) {
      const errs = {};
      if (!formData.title) errs.title = true;
      if (!formData.description) errs.description = true;
      setErrors(errs);
      fieldRefs.current[!formData.title ? 'title' : 'description']?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error('Missing required details', {
        description: 'Please add a title and description before submitting your request.',
      });
      return false;
    }

    const now = new Date();
    for (const call of supportCalls) {
      const result = validateCall(call, now);
      if (!result.isValid) {
        if (result.fieldRef) {
          fieldRefs.current[result.fieldRef]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        toast.error(result.title, { description: result.description });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    setSubmitting(true);

    try {
      const uploadedAttachments = await Promise.all(
        attachments.map(async file => {
          const result = await uploadImage(file);
          return { name: result.url, blobName: result.blobName, url: result.url };
        })
      );

      const primaryCall = supportCalls[0];
      const callTimezone = primaryCall?.timezone ?? detectedTimezone;
      const callLocation = primaryCall?.location ?? 'Remote';

      await createTicket({
        formData,
        supportCalls,
        attachments: uploadedAttachments,
        timezone: callTimezone,
        location: callLocation,
      });

      toast.success('Ticket submitted successfully!');
      onClose?.();

    } catch (err) {
      setSubmitting(false);
      toast.error(err.message || 'Failed to submit ticket');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Submit Incident</h1>
            <p className="text-sm text-gray-500 mt-1">Fill out the details below to report a new issue and schedule a follow-up.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={submitting}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

           <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300">Please review all details before submitting.</p>
              </div>

              {['title'].map(field => (
                <div key={field} className="mb-4">
                  <Label className="text-xs mb-1 block">
                    {field.charAt(0).toUpperCase() + field.slice(1)} <span className="text-red-500">*</span>
                  </Label>
                  <div ref={el => fieldRefs.current[field] = el}>
                    <Input
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                      placeholder="Brief title of the issue"
                      className={errors[field] ? 'border-red-500' : ''}
                      disabled={submitting}
                    />
                    {errors[field] && <p className="text-xs text-red-500 mt-1">This field is required.</p>}
                  </div>
                </div>
              ))}

              <div className="mb-4">
                <Label className="text-xs mb-1 block">
                  Description <span className="text-red-500">*</span>
                </Label>
                <div ref={el => fieldRefs.current['description'] = el}>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Provide description..."
                    className={errors.description ? 'border-red-500' : ''}
                    disabled={submitting}
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">This field is required.</p>}
                </div>

               {powersuiteaiEnabled && formData.description.trim().split(/\s+/).filter(Boolean).length >= 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                   className="mt-2 
                        bg-gradient-to-r 
                        dark:from-violet-400 dark:via-violet-500 dark:to-blue-500 
                        from-pink-400 via-pink-500 to-red-500 
                        text-white py-4 cursor-pointer hover:text-white"
                   onClick={() => askAssist(`Title: ${formData.title}\n\nDescription: ${formData.description}`)}
                    disabled={aiLoading || submitting || formData.description.length > 1000}
                  >
                     <Image 
                        src={powersuiteaiicon} 
                        alt="PowerSuite AI" 
                        width={16} 
                        height={16} 
                      />
                    {aiLoading ? "Getting suggestions..." : "PowerSuite AI Recommendation"}
                  </Button>
                )}

              {suggestion && (
                <>
                  <div className="mt-3 max-h-[400px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950/30 rounded-lg border-3  border-red-300 dark:border-indigo-500">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        <Image src={powersuiteaiicon} alt="PowerSuite AI" width={16} height={16} />
                        Suggested Resolution Steps
                      </p>
                      {/* <button onClick={clearSuggestion} className="text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button> */}
                    </div>

                    <div
                      className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none
                        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-gray-900 [&_h2]:dark:text-white
                        [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1
                        [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1
                        [&_li]:text-sm [&_p]:mb-2 [&_strong]:font-semibold"
                      dangerouslySetInnerHTML={{ __html: suggestion }}
                    />
                  </div>
                    <div className='flex justify-end gap-2 mt-2'>
                     <ThumbsUp className="w-5 h-5 dark:text-blue-400 text-pink-500 cursor-pointer" />
                     <ThumbsDown className="w-5 h-5 dark:text-blue-400 text-pink-500 cursor-pointer" />
                    </div>
                  </>
                )}

                {aiError && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {aiError}
                  </p>
                )}
              </div>
            </div>

            {/* Support Call Schedule */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-medium">Support Call Schedule</h2>
                  <p className="text-xs text-gray-500">Add one or more available date/time slots.</p>
                </div>
                <Button
                  variant="outline" size="sm" onClick={addCall}
                  className="gap-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-100
    dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-800
    appearance-none"
                  disabled={submitting}
                >
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>

              {supportCalls.map(call => (
                <div key={call.id} className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border mb-4 last:mb-0">
                  {supportCalls.length > 1 && (
                    <Button
                      variant="ghost" size="icon" onClick={() => removeCall(call.id)}
                      className="absolute top-2 right-2 h-8 w-8"
                      disabled={submitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div ref={el => fieldRefs.current[`call-${call.id}-date`] = el}>
                      <Label className="text-xs mb-1 block">Date <span className="text-red-500">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left bg-white text-gray-900 border-gray-300 hover:bg-gray-100
                              dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-800
                              appearance-none"
                            disabled={submitting}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            <span>{call.date ? format(call.date, "MM/dd/yyyy") : "Select date"}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={call.date}
                            onSelect={d => {
                              if (d) handleCallChange(call.id, 'date', d);
                            }}
                            disabled={date => {
                              const today = new Date(); today.setHours(0, 0, 0, 0);
                              const used = supportCalls.filter(c => c.id !== call.id).map(c => c.date?.toDateString());
                              return date < today || used.includes(date.toDateString());
                            }}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-xs mb-1 block">Time <span className="text-red-500">*</span></Label>
                      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                        <div className="relative flex-1 min-w-0">
                          <Input
                            type="time"
                            value={call.fromTime}
                            onChange={e => handleCallChange(call.id, 'fromTime', e.target.value)}
                            step="900"
                            className="pl-8 h-9 text-sm w-full min-w-0 max-w-full truncate bg-white text-gray-900 border-gray-300 appearance-none
                              dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            disabled={submitting}
                          />
                          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        </div>
                        <span className="text-sm text-gray-500 text-center sm:text-left">to</span>
                        <div className="relative flex-1 min-w-0">
                          <Input
                            type="time"
                            value={call.toTime}
                            onChange={e => handleCallChange(call.id, 'toTime', e.target.value)}
                            step="900"
                            className="pl-8 h-9 text-sm w-full min-w-0 max-w-full truncate bg-white text-gray-900 border-gray-300 appearance-none
                              dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            disabled={submitting}
                          />
                          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">Timezone <span className="text-red-500">*</span></Label>
                      <Select value={call.timezone} onValueChange={v => handleCallChange(call.id, 'timezone', v)} disabled={submitting}>
                        <SelectTrigger className="w-full">
                          <Clock className="mr-2 h-4 w-4 shrink-0" />
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_TIMEZONES.map(({ label, value }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-1 block">Location <span className="text-red-500">*</span></Label>
                      <Select value={call.location} onValueChange={v => handleCallChange(call.id, 'location', v)} disabled={submitting}>
                        <SelectTrigger className="w-full">
                          <MapPin className="mr-2 h-4 w-4 shrink-0" />
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Attachments */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">Attachments</h2>
              <div
                onClick={() => !submitting && fileInputRef.current?.click()}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (!submitting) processFiles(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  submitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-400",
                  dragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : ""
                )}
              >
                <Upload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600"><span className="font-medium text-blue-600">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP (max. 10MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => { processFiles(e.target.files); e.target.value = ''; }}
                  className="hidden"
                  disabled={submitting}
                />
              </div>

              {attachments.map(file => (
                <div key={file.name} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md mt-3">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate text-sm">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAttachments(p => p.filter(f => f.name !== file.name))}
                    className="h-6 w-6"
                    disabled={submitting}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(DEFAULT_FORM);
                    resetCalls();
                    setAttachments([]);
                    setErrors({});
                    clearSuggestion();
                  }}
                  disabled={submitting}
                  className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100
                          dark:bg-gray-900 dark:text-white dark:border-gray-600 dark:hover:bg-gray-800
                          appearance-none"
                >
                  Clear
                </Button>

                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                    </span>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile User Info */}
            <div className="block lg:hidden bg-white dark:bg-gray-900 rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">User Information</h2>
              <UserInfoPanel profile={profile} profileLoading={profileLoading} />
            </div>
          </div>

          {/* Desktop User Info */}
          <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg border p-6 sticky top-6 h-fit">
            <h2 className="text-lg font-medium mb-4">User Information</h2>
            <UserInfoPanel profile={profile} profileLoading={profileLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}