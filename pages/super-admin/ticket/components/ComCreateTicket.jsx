import React, { useState, useCallback, useRef } from 'react';
import { X, Plus, Upload, Clock, MapPin, Calendar as CalendarIcon, AlertCircle, FileText } from 'lucide-react';
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }    from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger }                       from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn }     from "@/lib/utils";
import { useAuth }             from "@/context/AuthContext";
import { useCreateTicket }     from "@/hooks/useCreateTicket";
import { useFetchUserProfile } from "@/hooks/UseFetchUserProfile";

const TIMEZONES = [
  { label: 'UTC-08:00 Pacific Time (US & Canada)',  value: 'America/Los_Angeles' },
  { label: 'UTC-07:00 Mountain Time (US & Canada)', value: 'America/Denver'      },
  { label: 'UTC-06:00 Central Time (US & Canada)',  value: 'America/Chicago'     },
  { label: 'UTC-05:00 Eastern Time (US & Canada)',  value: 'America/New_York'    },
  { label: 'UTC-04:00 Atlantic Time (Canada)',      value: 'America/Halifax'     },
  { label: 'UTC-03:00 Brasilia Time',               value: 'America/Sao_Paulo'   },
  { label: 'UTC+00:00 Greenwich Mean Time (UK)',    value: 'Europe/London'       },
  { label: 'UTC+01:00 Central European Time',       value: 'Europe/Paris'        },
  { label: 'UTC+02:00 Eastern European Time',       value: 'Europe/Helsinki'     },
  { label: 'UTC+03:00 Moscow Standard Time',        value: 'Europe/Moscow'       },
  { label: 'UTC+04:00 Gulf Standard Time (UAE)',    value: 'Asia/Dubai'          },
  { label: 'UTC+05:30 India Standard Time',         value: 'Asia/Kolkata'        },
  { label: 'UTC+07:00 Indochina Time (Bangkok)',    value: 'Asia/Bangkok'        },
  { label: 'UTC+08:00 China Standard Time',         value: 'Asia/Shanghai'       },
  { label: 'UTC+08:00 Philippine Time',             value: 'Asia/Manila'         },
  { label: 'UTC+09:00 Japan Standard Time',         value: 'Asia/Tokyo'          },
  { label: 'UTC+10:00 Australian Eastern Time',     value: 'Australia/Sydney'    },
  { label: 'UTC+12:00 New Zealand Standard Time',   value: 'Pacific/Auckland'    },
];

const LOCATIONS      = ['Remote', 'Hybrid', 'Onsite'];
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf', 'text/plain']);
const MAX_FILE_SIZE  = 10 * 1024 * 1024;
const DEFAULT_FORM   = { title: '', description: '', timezone: '', location: '' };

const USER_FIELDS = [
  ['COMPANY',  'companyName'],
  ['CREATED',  'createdDateTime', v => v ? format(new Date(v), 'MMM dd, yyyy') : null],
  ['USER',     'displayName'],
  ['MOBILE',   'mobilePhone'],
  ['TITLE',    'jobTitle'],
  ['DEPT',     'department'],
  ['EMAIL',    'mail', null, 'col-span-2'],
  ['BUSINESS', 'businessPhones', v => v?.[0]],
];

export default function ComCreateTicket({ onClose }) {
  const { account } = useAuth();
  const { profile, loading: profileLoading } = useFetchUserProfile(account?.localAccountId);
  const { createTicket, loading: submitting } = useCreateTicket({ account, onSuccess: onClose });

  const [formData,     setFormData]     = useState(DEFAULT_FORM);
  const [supportCalls, setSupportCalls] = useState([{ id: 1, date: undefined, fromTime: '09:00', toTime: '17:00', timezone: '', location: '' }]);
  const [attachments,  setAttachments]  = useState([]);
  const [dragOver,     setDragOver]     = useState(false);

  const fileInputRef = useRef(null);
  const fieldRefs    = useRef({});

  const handleInputChange = useCallback(({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setSupportCalls(prev => [...prev, { 
      id: Date.now(), 
      date: undefined, 
      fromTime: '09:00', 
      toTime: '17:00', 
      timezone: formData.timezone, 
      location: formData.location 
    }]);
  }, [formData.timezone, formData.location]);

  const handleRemoveCall = useCallback((id) => {
    setSupportCalls(prev => prev.filter(c => c.id !== id));
  }, []);

  const processFiles = useCallback((files) => {
    const valid = Array.from(files).filter(f => ACCEPTED_TYPES.has(f.type) && f.size <= MAX_FILE_SIZE);
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
    for (const key of Object.keys(DEFAULT_FORM)) {
      if (!formData[key]) {
        fieldRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    for (const call of supportCalls) {
      if (!call.date) {
        fieldRefs.current[`call-${call.id}-date`]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    await createTicket({ formData, supportCalls, attachments });
  }, [formData, supportCalls, attachments, createTicket]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-6 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Submit Incident</h1>
            <p className="text-sm text-gray-500 mt-1">Fill out the details below to report a new issue and schedule a follow-up.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Incident Information">
              <div className="space-y-4">
                <Field label="Title" required>
                  <div ref={el => fieldRefs.current.title = el}>
                    <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Brief summary of the issue" />
                  </div>
                </Field>
                <Field label="Description" required>
                  <div ref={el => fieldRefs.current.description = el}>
                    <Textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="Provide as much detail as possible..." />
                  </div>
                </Field>
              </div>
            </Card>

            <Card
              title="Support Call Schedule"
              subtitle="Add one or more available date/time slots."
              action={<Button variant="outline" size="sm" onClick={handleAddCall} className="gap-1"><Plus className="w-4 h-4" /> Add</Button>}
            >
              <div className="space-y-4">
                {supportCalls.map(call => (
                  <SupportCallCard
                    key={call.id}
                    call={call}
                    isRemovable={supportCalls.length > 1}
                    fieldRefs={fieldRefs}
                    onRemove={handleRemoveCall}
                    onChange={handleCallChange}
                    onSelectChange={handleSelectChange}
                  />
                ))}
              </div>
            </Card>

            <Card title="Attachments">
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
                <input ref={fileInputRef} type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.log,.txt"
                  onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }} className="hidden" />
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
            </Card>

            <div className="block lg:hidden">
              <UserInfoCard profile={profile} loading={profileLoading} />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setFormData(DEFAULT_FORM);
                setSupportCalls([{ id: 1, date: undefined, fromTime: '09:00', toTime: '17:00', timezone: '', location: '' }]);
                setAttachments([]);
              }} disabled={submitting}>Clear</Button>
              <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <UserInfoCard profile={profile} loading={profileLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}

const Card = ({ children, title, subtitle, action, className = '' }) => (
  <div className={cn("bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6", className)}>
    {(title || action) && (
      <div className="flex justify-between items-start mb-4">
        <div>
          {title && <h2 className="text-lg font-medium">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const Field = ({ label, children, required, className = '' }) => (
  <div className={className}>
    <Label className="text-xs mb-1 block">{label} {required && <span className="text-red-500">*</span>}</Label>
    {children}
  </div>
);

const SupportCallCard = ({ call, isRemovable, fieldRefs, onRemove, onChange, onSelectChange }) => (
  <div className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
    {isRemovable && (
      <Button variant="ghost" size="icon" onClick={() => onRemove(call.id)} className="absolute top-2 right-2 h-8 w-8">
        <X className="w-4 h-4" />
      </Button>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div ref={el => fieldRefs.current[`call-${call.id}-date`] = el}>
        <Field label="Available Date" required>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !call.date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{call.date ? format(call.date, "dd/MM/yyyy") : "Select date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={call.date} onSelect={d => onChange(call.id, 'date', d)}
                disabled={d => d < new Date()} captionLayout="dropdown" defaultMonth={call.date} initialFocus />
            </PopoverContent>
          </Popover>
        </Field>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Available Time <span className="text-red-500">*</span></Label>
        <div className="flex items-center gap-1">
          {['fromTime', 'toTime'].map((key, i) => (
            <React.Fragment key={key}>
              {i === 1 && <span className="text-sm text-gray-500 font-medium whitespace-nowrap">to</span>}
              <div className="relative flex-1 min-w-0">
                <Input type="time" value={call[key]} onChange={e => onChange(call.id, key, e.target.value)} step="900" className="pl-8 text-sm w-full" />
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <Field label="Timezone" required>
        <Select value={call.timezone || ''} onValueChange={v => onSelectChange('timezone', v)}>
          <SelectTrigger className="w-full justify-start">
            <Clock className="mr-2 h-4 w-4 shrink-0" />
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(({ label, value }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Office Location" required>
        <Select value={call.location || ''} onValueChange={v => onSelectChange('location', v)}>
          <SelectTrigger className="w-full justify-start">
            <MapPin className="mr-2 h-4 w-4 shrink-0" />
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
    </div>
  </div>
);

const UserInfoCard = ({ profile, loading }) => (
  <Card className="sticky top-6">
    <h2 className="text-lg font-medium mb-4">User Information</h2>
    <div className="grid grid-cols-2 gap-4">
      {loading
        ? Array.from({ length: USER_FIELDS.length }).map((_, i) => (
            <div key={i} className={USER_FIELDS[i]?.[3]}>
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))
        : USER_FIELDS.map(([label, key, transform, span]) => {
            const raw = profile?.[key];
            const value = transform ? transform(raw) : raw;
            return (
              <div key={label} className={span}>
                <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1 break-all">{value ?? '—'}</p>
              </div>
            );
          })
      }
    </div>
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 flex gap-2">
      <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-800">Please review all details before submitting.</p>
    </div>
  </Card>
);