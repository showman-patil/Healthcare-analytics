import React, { useRef } from "react";
import { Brain, TrendingUp, AlertTriangle, Activity, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const riskFactorData = [
  { factor: "Hypertension", patients: 320, percentage: 68 },
  { factor: "Diabetes", patients: 245, percentage: 52 },
  { factor: "Obesity", patients: 198, percentage: 42 },
  { factor: "Smoking", patients: 156, percentage: 33 },
  { factor: "Family History", patients: 289, percentage: 61 },
  { factor: "Sedentary Lifestyle", patients: 412, percentage: 87 },
];

const diseaseDistribution = [
  { name: "Cardiovascular", value: 28 },
  { name: "Diabetes", value: 22 },
  { name: "Respiratory", value: 18 },
  { name: "Neurological", value: 15 },
  { name: "Cancer", value: 17 },
];

const radarData = [
  { subject: "Cardiology", A: 120, B: 110 },
  { subject: "Endocrine", A: 98, B: 130 },
  { subject: "Neurology", A: 86, B: 130 },
  { subject: "Pulmonology", A: 99, B: 100 },
  { subject: "Oncology", A: 85, B: 90 },
  { subject: "General", A: 65, B: 85 },
];

const ageGroupData = [
  { age: "0-18", low: 40, medium: 10, high: 2 },
  { age: "19-30", low: 120, medium: 30, high: 8 },
  { age: "31-45", low: 180, medium: 85, high: 25 },
  { age: "46-60", low: 90, medium: 140, high: 62 },
  { age: "61-75", low: 40, medium: 110, high: 95 },
  { age: "76+", low: 20, medium: 60, high: 80 },
];

export default function AdminAnalytics() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.08,
      duration: 0.55,
      ease: "power3.out"
    });
  }, { scope: container });

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Disease prediction insights and risk factor visualization</p>
      </div>

      {/* AI Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 gsap-in">
        {[
          { label: "AI Prediction Accuracy", value: "94.2%", icon: Brain, color: "stat-gradient-blue", text: "text-blue-600" },
          { label: "High Risk Identified", value: "127", icon: AlertTriangle, color: "stat-gradient-red", text: "text-red-600" },
          { label: "Avg Risk Score", value: "42.8", icon: Target, color: "stat-gradient-orange", text: "text-orange-600" },
          { label: "Prevention Rate", value: "78%", icon: TrendingUp, color: "stat-gradient-green", text: "text-green-600" },
        ].map((item) => (
          <div key={item.label} className="premium-card p-5">
            <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center text-white mb-3 shadow-md`}>
              <item.icon size={20} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{item.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors */}
        <div className="premium-card p-6 gsap-in">
          <h3 className="text-lg font-bold text-foreground mb-4">Top Risk Factors</h3>
          <div className="space-y-4">
            {riskFactorData.map((item) => (
              <div key={item.factor}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{item.factor}</span>
                  <span className="text-muted-foreground">{item.patients} patients ({item.percentage}%)</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disease Distribution Pie */}
        <div className="premium-card p-6 gsap-in">
          <h3 className="text-lg font-bold text-foreground mb-2">Disease Distribution</h3>
          <p className="text-sm text-muted-foreground mb-4">Breakdown by condition type</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {diseaseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgb(0 0 0/0.1)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Age-Group Risk Heatmap (Stacked Bar) */}
      <div className="premium-card p-6 gsap-in">
        <h3 className="text-lg font-bold text-foreground mb-1">Risk Level by Age Group</h3>
        <p className="text-sm text-muted-foreground mb-4">Patient distribution across risk categories</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageGroupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgb(0 0 0/0.1)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#f59e0b" />
              <Bar dataKey="high" name="High Risk" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Departmental Radar */}
      <div className="premium-card p-6 gsap-in">
        <h3 className="text-lg font-bold text-foreground mb-1">Department Performance Radar</h3>
        <p className="text-sm text-muted-foreground mb-4">This year vs last year by specialty</p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(214 32% 91%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }} />
              <PolarRadiusAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215 16% 47%)", fontSize: 10 }} />
              <Radar name="This Year" dataKey="A" stroke="hsl(221 83% 53%)" fill="hsl(221 83% 53%)" fillOpacity={0.3} />
              <Radar name="Last Year" dataKey="B" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36%)" fillOpacity={0.2} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgb(0 0 0/0.1)" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
