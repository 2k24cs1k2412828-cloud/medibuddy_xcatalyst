'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import {
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Heart,
  X,
  PhoneCall,
} from 'lucide-react';

export function FamilyDashboardClient() {
  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [encourageModalOpen, setEncourageModalOpen] = useState(false);
  const [encourageMessage, setEncourageMessage] = useState('');
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const handleCall = (name: string, phone: string) => {
    setCallNotice(`Calling ${name} (${phone})...`);
    setTimeout(() => setCallNotice(null), 5000);
  };

  const handleSendEncouragement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!encourageMessage) return;

    setEncourageModalOpen(false);
    setSentNotice(`Heartfelt message sent to Robert's morning tablet: "${encourageMessage}"`);
    setEncourageMessage('');
    setTimeout(() => setSentNotice(null), 6000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <WelcomeSection userName="David Chen" role="FAMILY" />

      {/* Call Banner */}
      {callNotice && (
        <div className="p-4 rounded-xl bg-blue-700 text-white font-bold text-base flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-amber-300 animate-pulse" />
            <span>{callNotice}</span>
          </div>
          <button onClick={() => setCallNotice(null)} className="p-1 hover:bg-blue-800 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Sent Message Notice */}
      {sentNotice && (
        <div className="p-4 rounded-xl bg-emerald-700 text-white font-bold text-base flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-300 fill-pink-300" />
            <span>{sentNotice}</span>
          </div>
          <button onClick={() => setSentNotice(null)} className="p-1 hover:bg-emerald-800 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          label="Monitored Loved One"
          value="Robert Chen"
          subtitle="Father &bull; 78 yrs"
          iconName="HeartHandshake"
          variant="default"
        />
        <DashboardStatCard
          label="Weekly Medication Adherence"
          value="92%"
          change="Strong compliance"
          trend="up"
          iconName="Activity"
          variant="success"
        />
        <DashboardStatCard
          label="Next Doctor Visit"
          value="Thursday"
          subtitle="10:30 AM &bull; Cardiology"
          iconName="Calendar"
          variant="info"
        />
        <DashboardStatCard
          label="Today's Doses Taken"
          value="2 of 3"
          subtitle="1 dose due 8:00 PM"
          iconName="Pill"
          variant="warning"
        />
      </div>

      {/* Two-Column Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Medication Tracker */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">
                  Today&apos;s Medication Adherence: Robert Chen
                </CardTitle>
                <CardDescription>
                  Real-time status of scheduled prescriptions
                </CardDescription>
              </div>
              <Badge variant="success">92% Compliance</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-base">Metformin 500mg</p>
                  <p className="text-xs text-slate-500">Morning dose &bull; Scheduled 8:00 AM</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Taken 8:05 AM</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-base">Lisinopril 10mg</p>
                  <p className="text-xs text-slate-500">Morning dose &bull; Scheduled 8:00 AM</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Taken 8:05 AM</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl border-2 border-teal-200 bg-teal-50/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-base">Atorvastatin 20mg</p>
                  <p className="text-xs text-slate-500">Evening dose &bull; Scheduled 8:00 PM Tonight</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <Clock className="h-4 w-4" />
                  <span>Due Tonight</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Send Loving Note Button */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                <span>Send Encouragement to Dad</span>
              </h3>
              <p className="text-xs text-slate-600">
                A warm note appears on Robert&apos;s kiosk display to brighten his day.
              </p>
            </div>
            <Button
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold shrink-0"
              onClick={() => setEncourageModalOpen(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              <span>Send Note</span>
            </Button>
          </div>
        </div>

        {/* Care Circle & Escort Reminders */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Upcoming Doctor Visit</CardTitle>
              <CardDescription>Escort reminder for David</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>CARDIOLOGY EVALUATION</span>
                  <Badge variant="info">This Thursday</Badge>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Dr. Arthur Vance, MD</h4>
                <p className="text-xs text-slate-600">
                  St. Jude Medical Centre &bull; Suite 304, 750 Health Plaza Blvd
                </p>
                <div className="pt-1 border-t border-blue-200 text-xs text-blue-950 font-medium">
                  <strong>Reminder:</strong> Pick up Dad at 9:45 AM. Ensure 8-hour fasting before test.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Care Team Contacts</CardTitle>
              <CardDescription>Quick connect for Robert&apos;s circle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Nurse Sarah Jenkins</p>
                  <p className="text-xs text-slate-500">Primary Caretaker</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCall('Nurse Sarah Jenkins', '+1 555-456-7890')}
                >
                  <Phone className="h-3.5 w-3.5 mr-1 text-teal-700" />
                  <span>Call</span>
                </Button>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Robert Chen</p>
                  <p className="text-xs text-slate-500">Dad (Home Landline)</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCall('Robert Chen', '+1 555-234-5678')}
                >
                  <Phone className="h-3.5 w-3.5 mr-1 text-teal-700" />
                  <span>Call</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEND ENCOURAGEMENT MODAL */}
      {encourageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                <span>Encouragement for Dad</span>
              </h3>
              <button
                onClick={() => setEncourageModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSendEncouragement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Your Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={encourageMessage}
                  onChange={(e) => setEncourageMessage(e.target.value)}
                  placeholder="e.g. Great job taking your morning medicines, Dad! See you on Thursday for the appointment."
                  className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEncourageModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  Send to Kiosk Screen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
