import React, { useState, useCallback, useRef } from 'react';
import { 
  X, Plus, Upload, Clock, MapPin, 
  Calendar as CalendarIcon, AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_SUPPORT_CALL = {
  id: 1, date: undefined, fromTime: '09:00', toTime: '17:00',
  timezone: '', location: ''
};

export default function ComCreateTicket({ onClose }) {
  const { account } = useAuth();
  const [supportCalls, setSupportCalls] = useState([{ ...DEFAULT_SUPPORT_CALL }]);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const fieldRefs = useRef({});

  const handleAddSupportCall = useCallback(() => {
    setSupportCalls(prev => [...prev, { 
      ...DEFAULT_SUPPORT_CALL, 
      id: prev.length + 1,
      date: undefined,
      fromTime: '09:00',
      toTime: '17:00',
      timezone: '',
      location: ''
    }]);
  }, []);

  const handleRemoveSupportCall = useCallback((id) => {
    setSupportCalls(prev => prev.filter(call => call.id !== id));
  }, []);

  const handleSupportCallChange = useCallback((id, field, value) => {
    setSupportCalls(prev => prev.map(call => 
      call.id === id ? { ...call, [field]: value } : call
    ));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFormData({ title: '', description: '' });
    setSupportCalls([{ ...DEFAULT_SUPPORT_CALL }]);
  }, []);

    const handleSubmit = useCallback(async () => {
    if (!formData.title) {
      fieldRefs.current.title?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldRefs.current.title?.focus();
      return;
    }
    if (!formData.description) {
      fieldRefs.current.description?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldRefs.current.description?.focus();
      return;
    }
    for (const call of supportCalls) {
      if (!call.date) {
        fieldRefs.current[`call-${call.id}-date`]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (!call.timezone) {
        fieldRefs.current[`call-${call.id}-timezone`]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (!call.location) {
        fieldRefs.current[`call-${call.id}-location`]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    const body = {
      entrauserid:   account?.id,
      entratenantid: account?.tenantId,
      title:         formData.title,
      description:   formData.description,
      date:          supportCalls.map(call => format(call.date, "yyyy-MM-dd")),
      starttime:     supportCalls.map(call => call.fromTime),
      endtime:       supportCalls.map(call => call.toTime),
      usertimezone:  supportCalls[0].timezone,
      officelocation: supportCalls[0].location,
      attachments:   [],
      createdby:     account?.name,
    };

    try {
      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket');

      console.log('Ticket created:', data.ticketuuid);
      onClose();
    } catch (err) {
      console.error('Submit error:', err.message);
    }
  }, [formData, supportCalls, account, onClose]);


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
            <Card>
              <h2 className="text-lg font-medium mb-4">Incident Information</h2>
              <div className="space-y-4">
                <Field label="Title" required>
                  <div ref={el => fieldRefs.current.title = el}>
                    <Input 
                      name="title" 
                      value={formData.title} 
                      onChange={handleInputChange} 
                      placeholder="Brief summary of the issue"
                    />
                  </div>
                </Field>
                <Field label="Description" required>
                  <div ref={el => fieldRefs.current.description = el}>
                    <Textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      rows={4} 
                      placeholder="Provide as much detail as possible..."
                    />
                  </div>
                </Field>
              </div>
            </Card>

            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Support Call Information</h2>
                <Button variant="outline" size="sm" onClick={handleAddSupportCall} className="gap-1">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              <div className="space-y-4">
                {supportCalls.map((call) => (
                  <SupportCallCard
                    key={call.id}
                    call={call}
                    isRemovable={supportCalls.length > 1}
                    onRemove={handleRemoveSupportCall}
                    onChange={handleSupportCallChange}
                    fieldRefs={fieldRefs}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-medium mb-4">Attachments</h2>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer">
                <Upload className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF, or LOG (max. 10MB)</p>
              </div>
            </Card>

            <div className="block lg:hidden">
              <UserInfoCard account={account} />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClear}>Clear</Button>
              <Button onClick={handleSubmit}>Submit Request</Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <UserInfoCard account={account} />
          </div>
        </div>
      </div>
    </div>
  );
}

const SupportCallCard = ({ call, isRemovable, onRemove, onChange, fieldRefs }) => (
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
              <Calendar mode="single" selected={call.date} onSelect={(date) => onChange(call.id, 'date', date)} disabled={(date) => date < new Date()} captionLayout="dropdown" defaultMonth={call.date} initialFocus />
            </PopoverContent>
          </Popover>
        </Field>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Available Time <span className="text-red-500">*</span></Label>
        <div className="flex items-center gap-1">
          {['fromTime', 'toTime'].map((timeKey, i) => (
            <React.Fragment key={timeKey}>
              {i === 1 && <span className="text-sm text-gray-500 font-medium whitespace-nowrap">to</span>}
              <div className="relative flex-1 min-w-0">
                <Input 
                  type="time" 
                  value={call[timeKey]} 
                  onChange={(e) => onChange(call.id, timeKey, e.target.value)} 
                  step="900" 
                  className="pl-8 text-sm w-full" 
                />
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

       <div ref={el => fieldRefs.current[`call-${call.id}-timezone`] = el}>
        <Field label="Timezone" required>
          <Select value={call.timezone} onValueChange={(value) => onChange(call.id, 'timezone', value)}>
            <SelectTrigger className="w-full justify-start">
              <Clock className="mr-2 h-4 w-4 shrink-0" />
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {[
                'Asia/Manila',
                'Asia/Tokyo',
                'Asia/Singapore',
                'Asia/Hong_Kong',
                'Asia/Seoul',
                'Asia/Shanghai',
                'Asia/Kolkata',
                'Asia/Dubai',
                'Europe/London',
                'Europe/Paris',
                'Europe/Berlin',
                'America/New_York',
                'America/Chicago',
                'America/Denver',
                'America/Los_Angeles',
                'Pacific/Auckland',
                'Australia/Sydney',
              ].map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div ref={el => fieldRefs.current[`call-${call.id}-location`] = el}>
        <Field label="Office Location" required>
          <Select value={call.location} onValueChange={(value) => onChange(call.id, 'location', value)}>
            <SelectTrigger className="w-full justify-start">
              <MapPin className="mr-2 h-4 w-4 shrink-0" />
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {['Remote', 'Hybrid', 'Onsite'].map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
    {children}
  </div>
);

const Field = ({ label, children, required, className = "" }) => (
  <div className={className}>
    <Label className="text-xs mb-1 block">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

const UserInfoCard = ({ account }) => {
  const fields = [
    ['COMPANY',  account?.company],
    ['CREATED',  account?.createdDate],
    ['USER',     account?.name],
    ['MOBILE',   account?.mobilePhone],
    ['TITLE',    account?.jobTitle],
    ['DEPT',     account?.department],
    ['EMAIL',    account?.email,         'col-span-2'],
    ['BUSINESS', account?.businessPhone],
  ];

  return (
    <Card className="sticky top-6">
      <h2 className="text-lg font-medium mb-4">User Information</h2>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(([label, value, span]) => (
          <div key={label} className={span}>
            <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
            <p className="text-sm text-gray-900 dark:text-white mt-1 break-all">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">Please review all details before submitting.</p>
        </div>
      </div>
    </Card>
  );
};