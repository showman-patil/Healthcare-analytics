import React, { useRef } from "react";
import { 
  Users, Activity, Calendar, AlertTriangle, TrendingUp, TrendingDown, Settings
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGetAnalyticsOverview, useGetDiseaseTrends } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MOCK_ANALYTICS, MOCK_TRENDS } from "@/lib/mock-data";

export default function AdminDashboard() {
  const container = useRef<HTMLDivElement>(null);
  
  // Use hooks with fallback to mock data
  const { data: analytics = MOCK_ANALYTICS, isLoading: loadingAnalytics } = useGetAnalyticsOverview();
  const { data: trends = MOCK_TRENDS, isLoading: loadingTrends } = useGetDiseaseTrends();

  useGSAP(() => {
    gsap.from(".gsap-card", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power3.out"
    });
  }, { scope: container });

  if (loadingAnalytics || loadingTrends) {
    return <div className="p-8 text-center text-muted-foreground">Loading Analytics...</div>;
  }

  return (
    <div ref={container} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Facility Overview</h1>
          <p className="text-muted-foreground mt-1">Live metrics and analytics for your healthcare system.</p>
        </div>
        <Link
          href="/admin/settings"
          aria-label="Open settings"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings size={19} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients" 
          value={analytics.totalPatients.toLocaleString()} 
          trend={analytics.patientGrowth}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard 
          title="Active Doctors" 
          value={analytics.totalDoctors.toString()} 
          trend={2.4}
          icon={Activity}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Appointments" 
          value={analytics.totalAppointments.toLocaleString()} 
          trend={analytics.appointmentGrowth}
          icon={Calendar}
          color="bg-indigo-500"
        />
        <StatCard 
          title="Critical Cases" 
          value={analytics.criticalCases.toString()} 
          trend={-5.2}
          icon={AlertTriangle}
          color="bg-red-500"
          isInverseGood
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className="premium-card p-6 gsap-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Disease Trends (6 Months)</h3>
              <p className="text-sm text-muted-foreground">Monthly prediction and diagnosis frequency</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDiabetes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(348 83% 47%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(348 83% 47%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(215 16% 47%)', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(215 16% 47%)', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="diabetes" name="Diabetes" stroke="hsl(221 83% 53%)" strokeWidth={3} fillOpacity={1} fill="url(#colorDiabetes)" />
                <Area type="monotone" dataKey="heartDisease" name="Heart Disease" stroke="hsl(348 83% 47%)" strokeWidth={3} fillOpacity={1} fill="url(#colorHeart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color, isInverseGood = false }: any) {
  const isPositive = trend >= 0;
  const isGood = isInverseGood ? !isPositive : isPositive;

  return (
    <div className="premium-card p-6 gsap-card">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md ${isGood ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-display font-bold text-foreground">{value}</h4>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{title}</p>
      </div>
    </div>
  );
}
