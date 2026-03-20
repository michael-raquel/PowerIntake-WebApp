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

const getOffsetString = (tz) => {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'longOffset',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    if (offsetPart) {
      return offsetPart.value.replace('GMT', '').trim();
    }
  } catch (e) {
  }
  return '';
};

const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone').map(tz => {
  const offset = getOffsetString(tz);
  return {
    label: offset ? `${tz} (UTC${offset})` : tz,
    value: tz,
  };
});

const LOCATIONS = ['Remote', 'Hybrid', 'Office'];
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf', 'text/plain']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const getRoundedCurrentTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
  const roundedHour = minutes >= 45 ? now.getHours() + 1 : now.getHours();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), roundedHour % 24, roundedMinutes);
};

const today = new Date();
const startTime = getRoundedCurrentTime();
const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const validTimezone = detectedTimezone;

const DEFAULT_FORM = {
  title: '',
  description: '',
  timezone: validTimezone,
  location: 'Remote',
};

const DEFAULT_SUPPORT_CALL = {
  id: 1,
  date: today,
  fromTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
  toTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
  timezone: DEFAULT_FORM.timezone,
  location: DEFAULT_FORM.location,
};

const USER_FIELDS = [
  // ['CREATED',  'createdDateTime', v => v ? format(new Date(v), 'MMM dd, yyyy') : null],
  ['NAME',     'displayName'],
  // ['MOBILE',   'mobilePhone'],
  ['JOB TITLE',    'jobTitle'],
  ['DEPARTMENT',     'department'],
  ['EMAIL',    'mail', null, 'col-span-2'],
  ['BUSINESS PHONE', 'businessPhones', v => v?.[0]],
];

export default function ComCreateTicket({ onClose }) {
  const { account } = useAuth();
  const { profile, loading: profileLoading } = useFetchUserProfile(account?.localAccountId);
  const { createTicket, loading: submitting } = useCreateTicket({ account, onSuccess: onClose });

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [supportCalls, setSupportCalls] = useState([DEFAULT_SUPPORT_CALL]);
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});                                                   
  const { uploadImage, loading: uploadLoading } = useUploadImage();

  const fileInputRef = useRef(null);
  const fieldRefs = useRef({});

  const getSelectedDates = useCallback(() => {
    return supportCalls.map(call => 
      call.date ? new Date(call.date).toDateString() : null
    ).filter(Boolean);
  }, [supportCalls]);

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
    setSupportCalls(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const handleAddCall = useCallback(() => {
    const selectedDates = supportCalls.map(call => 
      call.date ? new Date(call.date).toDateString() : null
    ).filter(Boolean);
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);
    
    while (selectedDates.includes(nextDate.toDateString())) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    const newStart = getRoundedCurrentTime();
    const newEnd = new Date(newStart.getTime() + 2 * 60 * 60 * 1000);

    setSupportCalls(prev => [...prev, {
      id: Date.now(),
      date: new Date(nextDate), 
      fromTime: `${newStart.getHours().toString().padStart(2, '0')}:${newStart.getMinutes().toString().padStart(2, '0')}`,
      toTime: `${newEnd.getHours().toString().padStart(2, '0')}:${newEnd.getMinutes().toString().padStart(2, '0')}`,
      timezone: formData.timezone,
      location: formData.location,
    }]);
    
    toast.success("Support call added", {
      description: `Scheduled for ${format(nextDate, 'MMM d, yyyy')}`
    });
  }, [supportCalls, formData.timezone, formData.location]);

  const handleRemoveCall = useCallback((id) => {
    setSupportCalls(prev => prev.filter(c => c.id !== id));
  }, []);

  const processFiles = useCallback((files) => {
    const all = Array.from(files);
    const valid = all.filter(f => ACCEPTED_TYPES.has(f.type) && f.size <= MAX_FILE_SIZE);
    all.filter(f => !ACCEPTED_TYPES.has(f.type)).forEach(f =>                                
      toast.error(`"${f.name}" is not supported`, { description: 'Accepted types: PNG, JPG, PDF, TXT.' })
    );
    all.filter(f => ACCEPTED_TYPES.has(f.type) && f.size > MAX_FILE_SIZE).forEach(f =>      
      toast.error(`"${f.name}" exceeds the 10MB limit`)
    );
    setAttachments(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleSubmit = useCallback(async () => {
    const newErrors = {};                                                                      
    for (const key of Object.keys(DEFAULT_FORM)) {
      if (!formData[key]) newErrors[key] = true;
    }
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
      if (call.fromTime && call.toTime && call.fromTime >= call.toTime) {
        toast.error('Start time must be earlier than end time for each support call.');
        return;
      }
    }

    try {
      const uploadedAttachments = await Promise.all(
        attachments.map(async (file) => {
          const result = await uploadImage(file);
          return {
            name: result.url,
            blobName: result.blobName,
            url: result.url,
          };
        })
      );

      await createTicket({ 
        formData, 
        supportCalls, 
        attachments: uploadedAttachments 
      });
      
      onClose?.();
    } catch (err) {
      console.error('Submission failed:', err);
      toast.error(err.message || 'Failed to submit ticket');
    }
  }, [formData, supportCalls, attachments, createTicket, uploadImage, onClose]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-6 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Submit Incident</h1>
            <p className="text-sm text-gray-500 mt-1">Fill out the details below to report a new issue and schedule a follow-up.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
               
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
               <div className=" p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">Please review all details before submitting.</p>
              </div>
              
              <h2 className="text-lg font-medium mb-4 mt-4">Incident Information</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs mb-1 block">Title <span className="text-red-500">*</span></Label>
                  <div ref={el => fieldRefs.current.title = el}>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Brief summary of the issue"
                      className={errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}  
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1">This field is required.</p>}  
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Description <span className="text-red-500">*</span></Label>
                  <div ref={el => fieldRefs.current.description = el}>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Provide as much detail as possible..."
                      className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}  
                    />
                    {errors.description && <p className="text-xs text-red-500 mt-1">This field is required.</p>} 
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-medium">Support Call Schedule</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Add one or more available date/time slots.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddCall} className="gap-1">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>

              <div className="space-y-4">
                {supportCalls.map(call => (
                  <div key={call.id} className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    {supportCalls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveCall(call.id)} className="absolute top-2 right-2 h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div ref={el => fieldRefs.current[`call-${call.id}-date`] = el}>
                        <Label className="text-xs mb-1 block">Available Date <span className="text-red-500">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !call.date && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                              <span className="truncate">{call.date ? format(call.date, "dd/MM/yyyy") : "Select date"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={call.date}
                              onSelect={d => handleCallChange(call.id, 'date', d)}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const dateStr = date.toDateString();
                                const selectedDates = getSelectedDates();
                                return date < today || selectedDates.includes(dateStr);
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
                        <div className="flex items-center gap-1">
                          {['fromTime', 'toTime'].map((key, i) => (
                            <Fragment key={key}>
                              {i === 1 && <span className="text-sm text-gray-500 font-medium whitespace-nowrap">to</span>}
                              <div className="relative flex-1 min-w-0">
                                <Input
                                  type="time"
                                  value={call[key]}
                                  onChange={e => handleCallChange(call.id, key, e.target.value)}
                                  step="900"
                                  className="pl-8 text-sm w-full"
                                />
                                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs mb-1 block">Timezone <span className="text-red-500">*</span></Label>
                        <Select value={call.timezone || ''} onValueChange={v => handleSelectChange('timezone', v)}>
                          <SelectTrigger className="w-full justify-start">
                            <Clock className="mr-2 h-4 w-4 shrink-0" />
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {ALL_TIMEZONES.map(({ label, value }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs mb-1 block">Office Location <span className="text-red-500">*</span></Label>
                        <Select value={call.location || ''} onValueChange={v => handleSelectChange('location', v)}>
                          <SelectTrigger className="w-full justify-start">
                            <MapPin className="mr-2 h-4 w-4 shrink-0" />
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          <div className="bg-white dark:bg-gray-900 min-h-[300px] rounded-lg border border-gray-200 dark:border-gray-800 p-6 sticky bottom-6">
            <h2 className="text-lg font-medium mb-4">Attachments</h2>
            <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    dragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "hover:border-blue-400"
                )}
            >
                <Upload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF, or LOG (max. 10MB)</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf,.log,.txt"
                    onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
                    className="hidden"
                />
            </div>
            {attachments.map(file => (
                <div key={file.name} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-sm mt-3 first:mt-0">
                    <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="truncate text-gray-700 dark:text-gray-300">{file.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setAttachments(p => p.filter(f => f.name !== file.name))} className="h-6 w-6 shrink-0 ml-2">
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            ))}
            <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => {
                    setFormData(DEFAULT_FORM);
                    setSupportCalls([DEFAULT_SUPPORT_CALL]);
                    setAttachments([]);
                    setErrors({});
                }} disabled={submitting}>Clear</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
            </div>
        </div>

            <div className="block lg:hidden bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto h-fit">
              <h2 className="text-lg font-medium mb-4">User Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {profileLoading ? (
                  Array.from({ length: USER_FIELDS.length }).map((_, i) => (
                    <div key={i} className={USER_FIELDS[i]?.[3]}>
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                      <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                  ))
                ) : (
                  USER_FIELDS.map(([label, key, transform, span]) => {
                    const raw = profile?.[key];
                    const value = transform ? transform(raw) : raw;
                    return (
                      <div key={label} className={span}>
                        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
                        <p className="text-sm text-gray-900 dark:text-white mt-1 break-all">{value ?? '—'}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 sticky top-6">
            <h2 className="text-lg font-medium mb-4">User Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {profileLoading ? (
                Array.from({ length: USER_FIELDS.length }).map((_, i) => (
                  <div key={i} className={USER_FIELDS[i]?.[3]}>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                    <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                ))
              ) : (
                USER_FIELDS.map(([label, key, transform, span]) => {
                  const raw = profile?.[key];
                  const value = transform ? transform(raw) : raw;
                  return (
                    <div key={label} className={span}>
                      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 break-all">{value ?? '—'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}