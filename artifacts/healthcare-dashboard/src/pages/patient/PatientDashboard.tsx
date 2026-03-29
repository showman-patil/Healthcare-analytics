import React, { useRef } from "react";
import { Link } from "wouter";
import { 
  Heart, Activity, Thermometer, Calendar, ArrowRight, FileText, Bell 
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function PatientDashboard() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".animate-card", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out"
    });
  }, { scope: container });

  return (
    <div ref={container} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Health Overview</h1>
          <p className="text-muted-foreground mt-1">Good morning, Jason! Here is your daily health summary.</p>
        </div>
        <Link href="/patient/prediction" className="premium-button flex items-center gap-2">
          Check Symptoms
        </Link>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VitalCard title="Heart Rate" value="72" unit="bpm" icon={Heart} color="text-red-500" bg="bg-red-50" trend="Normal" />
        <VitalCard title="Blood Pressure" value="120/80" unit="mmHg" icon={Activity} color="text-blue-500" bg="bg-blue-50" trend="Optimal" />
        <VitalCard title="Temperature" value="98.6" unit="°F" icon={Thermometer} color="text-orange-500" bg="bg-orange-50" trend="Normal" />
        <VitalCard title="Weight" value="165" unit="lbs" icon={UserIcon} color="text-emerald-500" bg="bg-emerald-50" trend="-2 lbs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointments */}
        <div className="premium-card p-6 animate-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="text-primary" size={20} />
              Upcoming Appointments
            </h3>
            <Link href="/patient/booking" className="text-sm text-primary font-medium hover:underline">Book New</Link>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-lg text-center shadow-sm border border-border">
                  <div className="text-xs font-bold text-primary uppercase">May</div>
                  <div className="text-xl font-display font-bold text-foreground">20</div>
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Dr. Sarah Chen</h4>
                  <p className="text-sm text-muted-foreground">Cardiology Consultation</p>
                  <p className="text-xs font-semibold text-primary mt-1">09:00 AM - Room 402</p>
                </div>
              </div>
              <button className="hidden sm:block premium-button-outline px-4 py-2 text-sm">Reschedule</button>
            </div>
          </div>
        </div>

        {/* Doctor Recommendations */}
        <div className="premium-card p-6 animate-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="text-emerald-500" size={20} />
              Doctor's Recommendations
            </h3>
          </div>
          
          <ul className="space-y-4">
            <li className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">Continue prescribed ACE inhibitors daily.</p>
                <p className="text-xs text-muted-foreground mt-1">Added by Dr. Chen on May 10</p>
              </div>
            </li>
            <li className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">Schedule a follow-up blood test before next visit.</p>
                <p className="text-xs text-muted-foreground mt-1">Added by Dr. Thorne on April 22</p>
              </div>
            </li>
            <li className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="mt-1 w-2 h-2 rounded-full bg-orange-500 shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-foreground">Maintain 30 mins of moderate cardiovascular exercise daily.</p>
                <p className="text-xs text-muted-foreground mt-1">Added by Dr. Chen on March 15</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function UserIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

function VitalCard({ title, value, unit, icon: Icon, color, bg, trend }: any) {
  return (
    <div className="premium-card p-5 animate-card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full ${bg} ${color} flex items-center justify-center shrink-0`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <h4 className="text-2xl font-display font-bold text-foreground">{value}</h4>
          <span className="text-xs text-muted-foreground font-medium">{unit}</span>
        </div>
        <p className="text-xs font-semibold text-emerald-600 mt-1">{trend}</p>
      </div>
    </div>
  );
}
