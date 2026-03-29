import React from "react";
import { Bed, Users as UsersIcon, Stethoscope, Battery, Plus } from "lucide-react";

export default function AdminResources() {
  // Using pure static data as no API endpoint exists for this specific view
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Hospital Resources</h1>
        <p className="text-muted-foreground mt-1">Real-time tracking of beds, staff, and medical equipment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ResourceMetric title="Total Beds Available" value="142" total="500" icon={Bed} color="blue" />
        <ResourceMetric title="On-Duty Staff" value="86" total="120" icon={UsersIcon} color="emerald" />
        <ResourceMetric title="Active Surgeries" value="8" total="12" icon={Stethoscope} color="orange" />
        <ResourceMetric title="Ventilators Available" value="15" total="45" icon={Battery} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Status */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Ward Occupancy</h3>
            <button className="text-sm text-primary font-medium hover:underline">Manage Beds</button>
          </div>
          
          <div className="space-y-5">
            <WardProgress name="General Ward A" occupied={85} capacity={100} />
            <WardProgress name="General Ward B" occupied={40} capacity={100} />
            <WardProgress name="ICU" occupied={45} capacity={50} isCritical />
            <WardProgress name="Maternity" occupied={20} capacity={30} />
            <WardProgress name="Pediatrics" occupied={35} capacity={40} />
          </div>
        </div>

        {/* Equipment Status */}
        <div className="premium-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Critical Equipment</h3>
            <button className="p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
              <Plus size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            <EquipmentCard name="MRI Scanners" available={2} total={3} status="warning" />
            <EquipmentCard name="CT Scanners" available={1} total={2} status="warning" />
            <EquipmentCard name="X-Ray Machines" available={4} total={5} status="good" />
            <EquipmentCard name="Defibrillators" available={12} total={20} status="good" />
            <EquipmentCard name="Ultrasound" available={6} total={6} status="good" />
            <EquipmentCard name="ECG Monitors" available={2} total={15} status="critical" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceMetric({ title, value, total, icon: Icon, color }: any) {
  const percentage = Math.round((parseInt(value) / parseInt(total)) * 100);
  const colorMap: any = {
    blue: "bg-blue-500 text-blue-500",
    emerald: "bg-emerald-500 text-emerald-500",
    orange: "bg-orange-500 text-orange-500",
    red: "bg-red-500 text-red-500",
  };

  return (
    <div className="premium-card p-6 relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 ${colorMap[color].split(' ')[0]} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="text-muted-foreground font-medium text-sm">{title}</div>
        <Icon className={colorMap[color].split(' ')[1]} size={20} />
      </div>
      <div className="flex items-baseline gap-2 relative z-10">
        <h4 className="text-3xl font-display font-bold text-foreground">{value}</h4>
        <span className="text-sm text-muted-foreground">/ {total}</span>
      </div>
      <div className="w-full h-1.5 bg-muted mt-4 rounded-full overflow-hidden relative z-10">
        <div className={`h-full ${colorMap[color].split(' ')[0]} rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function WardProgress({ name, occupied, capacity, isCritical = false }: any) {
  const percentage = Math.round((occupied / capacity) * 100);
  const colorClass = percentage > 85 ? "bg-red-500" : percentage > 70 ? "bg-orange-500" : "bg-emerald-500";
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-semibold text-foreground flex items-center gap-2">
          {name}
          {isCritical && percentage > 80 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
        </span>
        <span className="text-muted-foreground font-medium">{occupied} / {capacity} Beds</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function EquipmentCard({ name, available, total, status }: any) {
  const bgClass = status === 'critical' ? 'bg-red-50 border-red-100' : status === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100';
  const textClass = status === 'critical' ? 'text-red-700' : status === 'warning' ? 'text-orange-700' : 'text-emerald-700';

  return (
    <div className={`p-4 rounded-xl border ${bgClass} flex flex-col justify-center`}>
      <h4 className={`text-sm font-bold ${textClass} mb-1`}>{name}</h4>
      <div className="text-2xl font-display font-bold text-foreground">
        {available} <span className="text-sm text-muted-foreground font-medium">/ {total}</span>
      </div>
    </div>
  );
}
