"use client";

import { useState, useRef, Fragment } from 'react';
import { X, Plus, Upload, Clock, MapPin, Calendar as CalendarIcon, AlertCircle, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCreateTicket } from "@/hooks/useCreateTicket";
import { useFetchUserProfile } from "@/hooks/UseFetchUserProfile";
import { toast } from "sonner";
import useUploadImage from '@/hooks/UseUploadImage';

const LOCATIONS = ['Remote', 'Hybrid', 'Office'];
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CALL_DURATION_HOURS = 2;

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

const toHHMM = d => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

const formatTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getMinTimeForToday = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  const minutes = now.getMinutes();
  if (minutes % 30 !== 0) now.setMinutes(Math.ceil(minutes / 30) * 30);
  now.setSeconds(0, 0);
  if (now.getMinutes() === 60) {
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  }
  if (now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() > 30)) return '23:30';
  return toHHMM(now);
};

const calcEndTime = (date, startTime) => {
  if (!date || !startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const end = new Date(date);
  end.setHours(h, m, 0, 0);
  end.setTime(end.getTime() + CALL_DURATION_HOURS * 3600000);
  if (end.getDate() > new Date(date).getDate()) return '23:59';
  if (end.getHours() > 23 || (end.getHours() === 23 && end.getMinutes() > 30)) return '23:30';
  return toHHMM(end);
};

const detectedTimezone = detectTimezone();
const initialStart = getMinTimeForToday();

const DEFAULT_FORM = { title: '', description: '', timezone: detectedTimezone, location: 'Remote' };
const newCall = (overrides = {}) => ({
  id: Date.now(),
  date: new Date(),
  fromTime: initialStart,
  toTime: calcEndTime(new Date(), initialStart),
  timezone: detectedTimezone,
  location: 'Remote',
  ...overrides,
});

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

export default function ComCreateTicket({ onClose }) {
  const { account } = useAuth();
  const { profile, loading: profileLoading } = useFetchUserProfile(account?.localAccountId);
  const { createTicket, loading: submitting } = useCreateTicket({ account, onSuccess: onClose });
  const { uploadImage } = useUploadImage();

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [supportCalls, setSupportCalls] = useState([newCall()]);
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const fieldRefs = useRef({});
  const [openPopovers, setOpenPopovers] = useState({});

  const handleInputChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const isToday = date => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(date).toDateString() === today.toDateString();
  };

  const handleCallChange = (id, field, value) => {
    setSupportCalls(prev => {
      const call = prev.find(c => c.id === id);
      if (!call) return prev;

      if (field === 'date') {
        const newDate = new Date(value);
        let fromTime = call.fromTime;
        if (isToday(newDate)) {
          const min = getMinTimeForToday();
          if (fromTime < min) fromTime = min;
        }
        return prev.map(c => c.id === id ? { ...c, date: newDate, fromTime, toTime: calcEndTime(newDate, fromTime) } : c);
      }

      if (field === 'fromTime') {
        return prev.map(c => c.id === id ? { ...c, fromTime: value, toTime: calcEndTime(call.date, value) } : c);
      }

      if (field === 'toTime') {
        return prev.map(c => c.id === id ? { ...c, toTime: value } : c);
      }

      return prev.map(c => c.id === id ? { ...c, [field]: value } : c);
    });
  };

  const handleAddCall = () => {
    const usedDates = new Set(supportCalls.map(c => c.date?.toDateString()).filter(Boolean));
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1);
    while (usedDates.has(d.toDateString())) d.setDate(d.getDate() + 1);
    const from = getMinTimeForToday();
    setSupportCalls(prev => [...prev, newCall({ id: Date.now(), date: d, fromTime: from, toTime: calcEndTime(d, from) })]);
    toast.success('Support call added', { description: `Scheduled for ${format(d, 'MM/dd/yyyy')}` });
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
      toast.error('Please fill in all required fields');
      return false;
    }

    const now = new Date();
    const currentTime = toHHMM(now);

    for (const call of supportCalls) {
      if (!call.date) {
        toast.error('Please select a date for all support calls');
        return false;
      }

      if (isToday(call.date)) {
        if (call.fromTime < currentTime) {
          fieldRefs.current[`call-${call.id}-date`]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast.error('Invalid start time', { description: `Start time cannot be in the past. Current time is ${formatTo12Hour(currentTime)}` });
          return false;
        }
      }

      if (call.fromTime >= call.toTime && call.toTime !== '23:59') {
        toast.error('Start time must be earlier than end time');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    try {
      const uploadedAttachments = await Promise.all(
        attachments.map(async file => {
          const result = await uploadImage(file);
          return { name: result.url, blobName: result.blobName, url: result.url };
        })
      );
      await createTicket({
        formData,
        supportCalls: supportCalls.map(({ date, fromTime, toTime, timezone, location }) => ({ date, fromTime, toTime, timezone, location })),
        attachments: uploadedAttachments,
      });
      onClose?.();
    } catch (err) {
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
          <Button variant="ghost" size="icon" onClick={onClose}>
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
              {['title', 'description'].map(field => (
                <div key={field} className="mb-4">
                  <Label className="text-xs mb-1 block">
                    {field.charAt(0).toUpperCase() + field.slice(1)} <span className="text-red-500">*</span>
                  </Label>
                  <div ref={el => fieldRefs.current[field] = el}>
                    {field === 'description' ? (
                      <Textarea name={field} value={formData[field]} onChange={handleInputChange} rows={4}
                        placeholder={`Provide ${field}...`} className={errors[field] ? 'border-red-500' : ''} />
                    ) : (
                      <Input name={field} value={formData[field]} onChange={handleInputChange}
                        placeholder={`Brief ${field} of the issue`} className={errors[field] ? 'border-red-500' : ''} />
                    )}
                    {errors[field] && <p className="text-xs text-red-500 mt-1">This field is required.</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-medium">Support Call Schedule</h2>
                  <p className="text-xs text-gray-500">Add one or more available date/time slots.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddCall} className="gap-1">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>

              {supportCalls.map(call => (
                <div key={call.id} className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border mb-4 last:mb-0">
                  {supportCalls.length > 1 && (
                    <Button variant="ghost" size="icon"
                      onClick={() => setSupportCalls(prev => prev.filter(c => c.id !== call.id))}
                      className="absolute top-2 right-2 h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div ref={el => fieldRefs.current[`call-${call.id}-date`] = el}>
                      <Label className="text-xs mb-1 block">Date <span className="text-red-500">*</span></Label>
                      <Popover
                        open={openPopovers[call.id] || false}
                        onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [call.id]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            <span>{call.date ? format(call.date, "MM/dd/yyyy") : "Select date"}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={call.date}
                            onSelect={(d) => {
                              if (d) {
                                handleCallChange(call.id, 'date', d);
                                setOpenPopovers(prev => ({ ...prev, [call.id]: false }));
                              }
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
                        {(['fromTime', 'toTime']).map((key, i) => (
                          <Fragment key={key}>
                            {i === 1 && (
                              <span className="text-sm text-gray-500 text-center sm:text-left">to</span>
                            )}
                            <div className="relative flex-1 min-w-0">
                              <Input
                                type="time"
                                value={call[key]}
                                onChange={e => handleCallChange(call.id, key, e.target.value)}
                                step="900"
                                className="pl-8 w-full text-sm"
                              />
                              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">Timezone <span className="text-red-500">*</span></Label>
                      <Select value={call.timezone} onValueChange={v => handleCallChange(call.id, 'timezone', v)}>
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
                      <Select value={call.location} onValueChange={v => handleCallChange(call.id, 'location', v)}>
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

            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">Attachments</h2>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  dragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "hover:border-blue-400"
                )}>
                <Upload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600"><span className="font-medium text-blue-600">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP (max. 10MB)</p>
                <input ref={fileInputRef} type="file" multiple accept="image/*"
                  onChange={e => { processFiles(e.target.files); e.target.value = ''; }} className="hidden" />
              </div>

              {attachments.map(file => (
                <div key={file.name} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md mt-3">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate text-sm">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button variant="ghost" size="icon"
                    onClick={() => setAttachments(p => p.filter(f => f.name !== file.name))} className="h-6 w-6">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => {
                  setFormData(DEFAULT_FORM);
                  setSupportCalls([newCall()]);
                  setAttachments([]);
                  setErrors({});
                }} disabled={submitting}>Clear</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
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