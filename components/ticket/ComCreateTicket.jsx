"use client";

import { useState, useRef, useCallback, Fragment } from 'react';
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
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf', 'text/plain']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SLOT_MINUTES = 30;
const CALL_DURATION_MS = 2 * 60 * 60 * 1000;

const USER_FIELDS = [
  ['NAME', 'displayName'],
  ['JOB TITLE', 'jobTitle'],
  ['DEPARTMENT', 'department'],
  ['EMAIL', 'mail', null, 'col-span-2'],
  ['BUSINESS PHONE', 'businessPhones', v => v?.[0]],
];

const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone').map(tz => {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'longOffset', hour: 'numeric' }).formatToParts(new Date());
    const offset = parts.find(p => p.type === 'timeZoneName')?.value.replace('GMT', '').trim();
    return { label: offset ? `${tz} (UTC${offset})` : tz, value: tz };
  } catch {
    return { label: tz, value: tz };
  }
});

const toHHMM = (date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
const parseHHMM = (t) => ({ h: +t.slice(0, 2), m: +t.slice(3) });
const ceilToSlot = (date) => new Date(Math.ceil(date.getTime() / (SLOT_MINUTES * 60 * 1000)) * (SLOT_MINUTES * 60 * 1000));
const addDuration = (hhmm) => {
  const { h, m } = parseHHMM(hhmm);
  const end = new Date(0, 0, 0, h, m + (CALL_DURATION_MS / 60000));
  return toHHMM(end.getHours() > 23 ? new Date(0, 0, 0, 23, 30) : end);
};

const minTimeForDate = (date) => {
  if (!date) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(date).setHours(0, 0, 0, 0) === today.getTime() ? toHHMM(ceilToSlot(new Date())) : '';
};

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const initialStart = toHHMM(ceilToSlot(new Date()));

const DEFAULT_FORM = { title: '', description: '', timezone: detectedTimezone, location: 'Remote' };
const DEFAULT_SUPPORT_CALL = { id: 1, date: new Date(), fromTime: initialStart, toTime: addDuration(initialStart), timezone: detectedTimezone, location: 'Remote' };

export default function ComCreateTicket({ onClose }) {
  const { account } = useAuth();
  const { profile, loading: profileLoading } = useFetchUserProfile(account?.localAccountId);
  const { createTicket, loading: submitting } = useCreateTicket({ account, onSuccess: onClose });
  const { uploadImage } = useUploadImage();

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [supportCalls, setSupportCalls] = useState([DEFAULT_SUPPORT_CALL]);
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const fieldRefs = useRef({});

  const handleInputChange = useCallback(({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: false }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'timezone' || name === 'location') {
      setSupportCalls(prev => prev.map(c => ({ ...c, [name]: value })));
    }
  }, []);

  const handleCallChange = useCallback((id, field, value) => {
    setSupportCalls(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (field === 'fromTime') {
        const min = minTimeForDate(c.date);
        if (min && value < min) {
          toast.error('Cannot select a past time.', { description: `Earliest available slot is ${min}.` });
          return c;
        }
        return { ...c, fromTime: value, toTime: addDuration(value) };
      }
      if (field === 'toTime') {
        const min = minTimeForDate(c.date);
        if (min && value < min) {
          toast.error('Cannot select a past time.', { description: `Earliest available slot is ${min}.` });
          return c;
        }
        return { ...c, toTime: value };
      }
      if (field === 'date') {
        const min = minTimeForDate(value);
        const fromTime = min && c.fromTime < min ? min : c.fromTime;
        return { ...c, date: value, fromTime, toTime: addDuration(fromTime) };
      }
      return { ...c, [field]: value };
    }));
  }, []);

  const handleAddCall = useCallback(() => {
    const usedDates = new Set(supportCalls.map(c => c.date?.toDateString()).filter(Boolean));
    const next = new Date(); next.setHours(0, 0, 0, 0); next.setDate(next.getDate() + 1);
    while (usedDates.has(next.toDateString())) next.setDate(next.getDate() + 1);
    const start = toHHMM(ceilToSlot(new Date()));
    setSupportCalls(prev => [...prev, {
      id: Date.now(), date: new Date(next), fromTime: start, toTime: addDuration(start),
      timezone: formData.timezone, location: formData.location
    }]);
    toast.success('Support call added', { description: `Scheduled for ${format(next, 'MMM d, yyyy')}` });
  }, [supportCalls, formData.timezone, formData.location]);

  const processFiles = useCallback((files) => {
    const all = Array.from(files);
    all.filter(f => !ACCEPTED_TYPES.has(f.type)).forEach(f => toast.error(`"${f.name}" is not supported`));
    all.filter(f => ACCEPTED_TYPES.has(f.type) && f.size > MAX_FILE_SIZE).forEach(f => toast.error(`"${f.name}" exceeds 10MB`));
    const valid = all.filter(f => ACCEPTED_TYPES.has(f.type) && f.size <= MAX_FILE_SIZE);
    setAttachments(prev => [...prev, ...valid.filter(f => !prev.some(p => p.name === f.name))]);
  }, []);

  const handleSubmit = useCallback(async () => {
    const newErrors = Object.fromEntries(Object.keys(DEFAULT_FORM).filter(k => !formData[k]).map(k => [k, true]));
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      fieldRefs.current[Object.keys(newErrors)[0]]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});

    for (const call of supportCalls) {
      if (!call.date) {
        fieldRefs.current[`call-${call.id}-date`]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (call.fromTime >= call.toTime) {
        toast.error('Start time must be earlier than end time.');
        return;
      }
    }

    try {
      const uploadedAttachments = await Promise.all(attachments.map(async (file) => {
        const result = await uploadImage(file);
        return { name: result.url, blobName: result.blobName, url: result.url };
      }));
      await createTicket({ formData, supportCalls, attachments: uploadedAttachments });
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Failed to submit ticket');
    }
  }, [formData, supportCalls, attachments, createTicket, uploadImage, onClose]);

  const UserInfoPanel = (
    <div className="grid grid-cols-2 gap-4">
      {profileLoading ? USER_FIELDS.map((f, i) => <div key={i} className={f[3]}><div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" /><div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></div>)
        : USER_FIELDS.map(([label, key, transform, span]) => {
          const value = transform ? transform(profile?.[key]) : profile?.[key];
          return <div key={label} className={span}><p className="text-xs font-medium text-gray-500 uppercase">{label}</p><p className="text-sm text-gray-900 dark:text-white mt-1 break-all">{value ?? '—'}</p></div>;
        })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-6 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Submit Incident</h1><p className="text-sm text-gray-500 mt-1">Fill out the details below to report a new issue and schedule a follow-up.</p></div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 flex gap-2"><AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /><p className="text-xs text-blue-800">Please review all details before submitting.</p></div>
              <h2 className="text-lg font-medium mb-4 mt-4">Incident Information</h2>
              <div className="space-y-4">
                {['title', 'description'].map(field => (
                  <div key={field}>
                    <Label className="text-xs mb-1 block">{field.charAt(0).toUpperCase() + field.slice(1)} <span className="text-red-500">*</span></Label>
                    <div ref={el => fieldRefs.current[field] = el}>
                      {field === 'description' ?
                        <Textarea name={field} value={formData[field]} onChange={handleInputChange} rows={4} placeholder={`Provide ${field}...`} className={errors[field] ? 'border-red-500' : ''} />
                        : <Input name={field} value={formData[field]} onChange={handleInputChange} placeholder={`Brief ${field} of the issue`} className={errors[field] ? 'border-red-500' : ''} />}
                      {errors[field] && <p className="text-xs text-red-500 mt-1">This field is required.</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Calls */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-medium">Support Call Schedule</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Add one or more available date/time slots.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddCall} className="gap-1 shrink-0">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>

              <div className="space-y-4">
                {supportCalls.map(call => (
                  <div key={call.id} className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    {supportCalls.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSupportCalls(prev => prev.filter(c => c.id !== call.id))}
                        className="absolute top-2 right-2 h-8 w-8 z-10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div ref={el => fieldRefs.current[`call-${call.id}-date`] = el}>
                        <Label className="text-xs mb-1 block">Available Date <span className="text-red-500">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                              <span className="truncate">{call.date ? format(call.date, "dd/MM/yyyy") : "Select date"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={call.date}
                              onSelect={d => handleCallChange(call.id, 'date', d)}
                              disabled={date => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const usedDates = supportCalls
                                  .filter(c => c.id !== call.id)
                                  .map(c => c.date?.toDateString())
                                  .filter(Boolean);
                                return date < today || usedDates.includes(date.toDateString());
                              }}
                              captionLayout="dropdown"
                              defaultMonth={call.date}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Available Time <span className="text-red-500">*</span></Label>
                        <div className="flex items-center gap-2">
                          {['fromTime', 'toTime'].map((key, i) => (
                            <Fragment key={key}>
                              {i === 1 && <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">to</span>}
                              <div className="relative flex-1 min-w-0">
                                <Input
                                  type="time"
                                  value={call[key]}
                                  min={minTimeForDate(call.date) || undefined}
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
                      <div>
                        <Label className="text-xs mb-1 block">Timezone <span className="text-red-500">*</span></Label>
                        <Select value={call.timezone} onValueChange={v => handleSelectChange('timezone', v)}>
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
                        <Label className="text-xs mb-1 block">Office Location <span className="text-red-500">*</span></Label>
                        <Select value={call.location} onValueChange={v => handleSelectChange('location', v)}>
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
            </div>

            {/* Attachments */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-medium mb-4">Attachments</h2>
              <div onClick={() => fileInputRef.current?.click()} onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                className={cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors", dragOver ? "border-blue-500 bg-blue-50" : "hover:border-blue-400")}>
                <Upload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600"><span className="font-medium text-blue-600">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF, or LOG (max. 10MB)</p>
                <input ref={fileInputRef} type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.log,.txt" onChange={e => { processFiles(e.target.files); e.target.value = ''; }} className="hidden" />
              </div>
              {attachments.map(file => (
                <div key={file.name} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border text-sm mt-3">
                  <div className="flex items-center gap-2 truncate"><FileText className="w-4 h-4 text-blue-500 shrink-0" /><span className="truncate">{file.name}</span><span className="text-xs text-gray-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span></div>
                  <Button variant="ghost" size="icon" onClick={() => setAttachments(p => p.filter(f => f.name !== file.name))} className="h-6 w-6 shrink-0"><X className="w-3 h-3" /></Button>
                </div>
              ))}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => { setFormData(DEFAULT_FORM); setSupportCalls([DEFAULT_SUPPORT_CALL]); setAttachments([]); setErrors({}); }} disabled={submitting}>Clear</Button>
                <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
              </div>
            </div>

            <div className="block lg:hidden bg-white dark:bg-gray-900 rounded-lg border p-6"><h2 className="text-lg font-medium mb-4">User Information</h2>{UserInfoPanel}</div>
          </div>

          <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg border p-6 sticky top-6"><h2 className="text-lg font-medium mb-4">User Information</h2>{UserInfoPanel}</div>
        </div>
      </div>
    </div>
  );
}