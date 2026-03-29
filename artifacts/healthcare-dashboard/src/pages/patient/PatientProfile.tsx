import React, { useRef, useState } from "react";
import { User, Heart, Phone, Mail, MapPin, Edit2, Save } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function PatientProfile() {
  const container = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Martinez",
    age: "58",
    gender: "Male",
    email: "john.m@email.com",
    phone: "+1-555-1001",
    address: "123 Oak Street, Springfield, IL 62701",
    bloodType: "A+",
    weight: "82 kg",
    height: "175 cm",
    allergies: "Penicillin, Sulfa drugs",
    emergencyContact: "Maria Martinez",
    emergencyPhone: "+1-555-9001",
    smoking: "Former",
    alcohol: "Occasional",
    exercise: "Light (1-2x/week)",
    chronicConditions: "Coronary Artery Disease, Hypertension",
    currentMedications: "Atorvastatin 40mg, Aspirin 81mg, Metoprolol 25mg",
    familyHistory: "Father - Heart disease; Mother - Type 2 Diabetes",
    insuranceProvider: "BlueCross BlueShield",
    insuranceId: "BCB-448291-A",
  });

  useGSAP(() => {
    gsap.from(".gsap-in", { y: 25, opacity: 0, stagger: 0.07, duration: 0.5, ease: "power3.out" });
  }, { scope: container });

  const update = (key: keyof typeof profile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const Field = ({ label, value, field }: { label: string; value: string; field: keyof typeof profile }) => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{label}</label>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={e => update(field, e.target.value)}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <p className="text-sm font-medium text-foreground bg-muted/30 rounded-xl px-3 py-2.5 border border-border/40">{value}</p>
      )}
    </div>
  );

  return (
    <div ref={container} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 gsap-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your personal and medical information</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-2 text-sm font-semibold ${editing ? "premium-button" : "premium-button-outline"}`}
        >
          {editing ? <><Save size={15} /> Save Changes</> : <><Edit2 size={15} /> Edit Profile</>}
        </button>
      </div>

      {/* Avatar & quick info */}
      <div className="premium-card p-6 gsap-in">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            J
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-muted-foreground">{profile.age} years • {profile.gender} • {profile.bloodType}</p>
            <div className="flex gap-3 mt-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">{profile.chronicConditions.split(",")[0].trim()}</span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{profile.bloodType}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="premium-card p-6 gsap-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <User size={17} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-foreground">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Full Name" value={profile.name} field="name" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Age" value={profile.age} field="age" />
              <Field label="Gender" value={profile.gender} field="gender" />
            </div>
            <Field label="Email Address" value={profile.email} field="email" />
            <Field label="Phone Number" value={profile.phone} field="phone" />
            <Field label="Home Address" value={profile.address} field="address" />
          </div>
        </div>

        {/* Medical Info */}
        <div className="premium-card p-6 gsap-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Heart size={17} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-foreground">Medical Information</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Blood Type" value={profile.bloodType} field="bloodType" />
              <Field label="Weight" value={profile.weight} field="weight" />
              <Field label="Height" value={profile.height} field="height" />
            </div>
            <Field label="Known Allergies" value={profile.allergies} field="allergies" />
            <Field label="Chronic Conditions" value={profile.chronicConditions} field="chronicConditions" />
            <Field label="Current Medications" value={profile.currentMedications} field="currentMedications" />
            <Field label="Family Medical History" value={profile.familyHistory} field="familyHistory" />
          </div>
        </div>

        {/* Lifestyle */}
        <div className="premium-card p-6 gsap-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <Heart size={17} className="text-green-600" />
            </div>
            <h2 className="text-base font-bold text-foreground">Lifestyle Information</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Smoking" value={profile.smoking} field="smoking" />
              <Field label="Alcohol" value={profile.alcohol} field="alcohol" />
              <Field label="Exercise" value={profile.exercise} field="exercise" />
            </div>
          </div>
        </div>

        {/* Emergency & Insurance */}
        <div className="premium-card p-6 gsap-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <Phone size={17} className="text-orange-600" />
            </div>
            <h2 className="text-base font-bold text-foreground">Emergency & Insurance</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Emergency Contact" value={profile.emergencyContact} field="emergencyContact" />
            <Field label="Emergency Phone" value={profile.emergencyPhone} field="emergencyPhone" />
            <Field label="Insurance Provider" value={profile.insuranceProvider} field="insuranceProvider" />
            <Field label="Insurance ID" value={profile.insuranceId} field="insuranceId" />
          </div>
        </div>
      </div>
    </div>
  );
}
