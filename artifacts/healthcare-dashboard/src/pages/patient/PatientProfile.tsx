import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Edit2,
  Heart,
  Phone,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/auth";
import {
  type PatientPortalProfile,
  usePortalData,
} from "@/lib/portal-data-context";

type EditableProfileField = Exclude<keyof PatientPortalProfile, "profileImage">;

type ProfileFieldProps = {
  editing: boolean;
  field: EditableProfileField;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  multiline?: boolean;
  onChange: (field: EditableProfileField, value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  value: string;
};

function createDraftProfile(profile: PatientPortalProfile): PatientPortalProfile {
  return {
    ...profile,
    profileImage: profile.profileImage ?? "",
  };
}

function ProfileField({
  editing,
  field,
  inputMode,
  label,
  multiline = false,
  onChange,
  type = "text",
  value,
}: ProfileFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      {editing ? (
        multiline ? (
          <textarea
            rows={3}
            value={value}
            onChange={(event) => onChange(field, event.target.value)}
            className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <input
            type={type}
            inputMode={inputMode}
            value={value}
            onChange={(event) => onChange(field, event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )
      ) : (
        <p className="rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground">
          {value || "Not provided"}
        </p>
      )}
    </div>
  );
}

export default function PatientProfile() {
  const container = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const { patientProfile, updatePatientProfile } = usePortalData();
  const [draftProfile, setDraftProfile] = useState<PatientPortalProfile>(() =>
    createDraftProfile(patientProfile),
  );

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.07,
      duration: 0.5,
      ease: "power3.out",
    });
  }, { scope: container });

  useEffect(() => {
    if (!editing) {
      setDraftProfile(createDraftProfile(patientProfile));
    }
  }, [editing, patientProfile]);

  const profileData = editing ? draftProfile : createDraftProfile(patientProfile);
  const profileSummary = [
    profileData.age ? `${profileData.age} years` : null,
    profileData.gender || null,
    profileData.bloodType || null,
  ]
    .filter(Boolean)
    .join(" | ");
  const primaryCondition =
    profileData.chronicConditions.split(",")[0]?.trim() || "General care";

  const updateDraft = (field: EditableProfileField, value: string) => {
    setDraftProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const startEditing = () => {
    setDraftProfile(createDraftProfile(patientProfile));
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraftProfile(createDraftProfile(patientProfile));
    setEditing(false);
  };

  const saveProfile = () => {
    updatePatientProfile({
      ...draftProfile,
      profileImage: draftProfile.profileImage ?? "",
    });
    setEditing(false);
    toast({
      title: "Profile updated",
      description:
        "Your patient profile changes are now synced across the patient portal and admin view.",
    });
  };

  const triggerPhotoPicker = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose an image file for the profile picture.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 1_500_000) {
      toast({
        title: "Image too large",
        description: "Please choose an image smaller than 1.5 MB.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;

      if (typeof imageData !== "string") {
        return;
      }

      setDraftProfile((current) => ({
        ...current,
        profileImage: imageData,
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeProfileImage = () => {
    setDraftProfile((current) => ({
      ...current,
      profileImage: "",
    }));
  };

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Profile Settings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your personal details, medical information, and profile photo.
          </p>
        </div>

        {editing ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cancelEditing}
              className="premium-button-outline flex items-center gap-2 text-sm font-semibold"
            >
              <X size={15} />
              Cancel
            </button>
            <button
              type="button"
              onClick={saveProfile}
              className="premium-button flex items-center gap-2 text-sm font-semibold"
            >
              <Save size={15} />
              Save Changes
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="premium-button-outline flex items-center gap-2 text-sm font-semibold"
          >
            <Edit2 size={15} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="premium-card gsap-in p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 rounded-3xl border border-border/60 shadow-lg">
                {profileData.profileImage ? (
                  <AvatarImage
                    src={profileData.profileImage}
                    alt={`${profileData.name || "Patient"} profile`}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-3xl font-bold text-white">
                  {getInitials(profileData.name || "Patient User")}
                </AvatarFallback>
              </Avatar>
              {editing ? (
                <button
                  type="button"
                  onClick={triggerPhotoPicker}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-foreground text-background shadow-md transition-transform hover:scale-105"
                  aria-label="Change profile picture"
                >
                  <Camera size={16} />
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-foreground">
                {profileData.name || "Patient User"}
              </h2>
              <p className="text-muted-foreground">
                {profileSummary || "Complete your profile to keep records accurate."}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {primaryCondition}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {profileData.bloodType || "Blood type pending"}
                </span>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Shared with admin patient records on this device
              </p>
            </div>
          </div>

          {editing ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={triggerPhotoPicker}
                className="premium-button-outline flex items-center gap-2 text-sm font-semibold"
              >
                <Camera size={15} />
                {profileData.profileImage ? "Change Photo" : "Add Profile Picture"}
              </button>
              {profileData.profileImage ? (
                <button
                  type="button"
                  onClick={removeProfileImage}
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <Trash2 size={15} />
                    Remove Photo
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="premium-card gsap-in p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <User size={17} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              Personal Information
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ProfileField
              editing={editing}
              field="name"
              label="Full Name"
              onChange={updateDraft}
              value={profileData.name ?? ""}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProfileField
                editing={editing}
                label="Age"
                field="age"
                onChange={updateDraft}
                type="number"
                inputMode="numeric"
                value={profileData.age ?? ""}
              />
              <ProfileField
                editing={editing}
                field="gender"
                label="Gender"
                onChange={updateDraft}
                value={profileData.gender ?? ""}
              />
            </div>
            <ProfileField
              editing={editing}
              label="Email Address"
              field="email"
              onChange={updateDraft}
              type="email"
              inputMode="email"
              value={profileData.email ?? ""}
            />
            <ProfileField
              editing={editing}
              label="Phone Number"
              field="phone"
              onChange={updateDraft}
              type="tel"
              inputMode="tel"
              value={profileData.phone ?? ""}
            />
            <ProfileField
              editing={editing}
              field="address"
              label="Home Address"
              multiline
              onChange={updateDraft}
              value={profileData.address ?? ""}
            />
          </div>
        </div>

        <div className="premium-card gsap-in p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <Heart size={17} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              Medical Information
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ProfileField
                editing={editing}
                field="bloodType"
                label="Blood Type"
                onChange={updateDraft}
                value={profileData.bloodType ?? ""}
              />
              <ProfileField
                editing={editing}
                field="weight"
                label="Weight"
                onChange={updateDraft}
                value={profileData.weight ?? ""}
              />
              <ProfileField
                editing={editing}
                field="height"
                label="Height"
                onChange={updateDraft}
                value={profileData.height ?? ""}
              />
            </div>
            <ProfileField
              editing={editing}
              field="allergies"
              label="Known Allergies"
              multiline
              onChange={updateDraft}
              value={profileData.allergies ?? ""}
            />
            <ProfileField
              editing={editing}
              label="Chronic Conditions"
              field="chronicConditions"
              onChange={updateDraft}
              multiline
              value={profileData.chronicConditions ?? ""}
            />
            <ProfileField
              editing={editing}
              label="Current Medications"
              field="currentMedications"
              onChange={updateDraft}
              multiline
              value={profileData.currentMedications ?? ""}
            />
          </div>
        </div>

        <div className="premium-card gsap-in p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
              <Heart size={17} className="text-green-600" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              Lifestyle Information
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ProfileField
                editing={editing}
                field="smoking"
                label="Smoking"
                onChange={updateDraft}
                value={profileData.smoking ?? ""}
              />
              <ProfileField
                editing={editing}
                field="alcohol"
                label="Alcohol"
                onChange={updateDraft}
                value={profileData.alcohol ?? ""}
              />
              <ProfileField
                editing={editing}
                field="exercise"
                label="Exercise"
                onChange={updateDraft}
                value={profileData.exercise ?? ""}
              />
            </div>
          </div>
        </div>

        <div className="premium-card gsap-in p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <Phone size={17} className="text-orange-600" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              Emergency and Insurance
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ProfileField
              editing={editing}
              field="emergencyContact"
              label="Emergency Contact"
              onChange={updateDraft}
              value={profileData.emergencyContact ?? ""}
            />
            <ProfileField
              editing={editing}
              field="emergencyPhone"
              label="Emergency Phone"
              onChange={updateDraft}
              value={profileData.emergencyPhone ?? ""}
            />
            <ProfileField
              editing={editing}
              field="insuranceProvider"
              label="Insurance Provider"
              onChange={updateDraft}
              value={profileData.insuranceProvider ?? ""}
            />
            <ProfileField
              editing={editing}
              field="insuranceId"
              label="Insurance ID"
              onChange={updateDraft}
              value={profileData.insuranceId ?? ""}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
