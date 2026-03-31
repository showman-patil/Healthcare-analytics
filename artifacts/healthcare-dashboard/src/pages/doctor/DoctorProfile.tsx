import React, { useEffect, useRef, useState } from "react";
import { Camera, Edit2, Save, Stethoscope, Trash2, X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import {
  getInitials,
  getStoredAccounts,
  type DoctorProfile as DoctorProfileDetails,
  updateManagedAccount,
} from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

type DoctorProfileFormState = {
  fullName: string;
  email: string;
  specialty: string;
  phoneNumber: string;
  hospitalAffiliation: string;
  medicalLicenseNumber: string;
  yearsOfExperience: string;
  highestQualification: string;
  profileImage: string;
};

function createFormState(
  fullName: string,
  email: string,
  doctorProfile?: DoctorProfileDetails,
): DoctorProfileFormState {
  return {
    fullName,
    email,
    specialty: doctorProfile?.specialty ?? "",
    phoneNumber: doctorProfile?.phoneNumber ?? "",
    hospitalAffiliation: doctorProfile?.hospitalAffiliation ?? "",
    medicalLicenseNumber: doctorProfile?.medicalLicenseNumber ?? "",
    yearsOfExperience: String(doctorProfile?.yearsOfExperience ?? ""),
    highestQualification: doctorProfile?.highestQualification ?? "",
    profileImage: doctorProfile?.profileImage ?? "",
  };
}

function InfoField({
  editing,
  label,
  onChange,
  value,
}: {
  editing: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      {editing ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <p className="rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground">
          {value || "Not provided"}
        </p>
      )}
    </div>
  );
}

export default function DoctorProfile() {
  const container = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session } = useAuth();
  const [editing, setEditing] = useState(false);
  const currentAccount =
    getStoredAccounts().find(
      (account) => account.role === "doctor" && account.email === (session?.email ?? ""),
    ) ?? null;
  const [formState, setFormState] = useState<DoctorProfileFormState>(() =>
    createFormState(
      currentAccount?.fullName ?? session?.fullName ?? "Doctor User",
      currentAccount?.email ?? session?.email ?? "",
      currentAccount?.doctorProfile,
    ),
  );

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 24,
      opacity: 0,
      stagger: 0.06,
      duration: 0.5,
      ease: "power3.out",
    });
  }, { scope: container });

  useEffect(() => {
    const nextState = createFormState(
      currentAccount?.fullName ?? session?.fullName ?? "Doctor User",
      currentAccount?.email ?? session?.email ?? "",
      currentAccount?.doctorProfile,
    );

    if (!editing) {
      setFormState(nextState);
    }
  }, [currentAccount, editing, session?.email, session?.fullName]);

  const updateField = (field: keyof DoctorProfileFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const startEditing = () => {
    setFormState(
      createFormState(
        currentAccount?.fullName ?? session?.fullName ?? "Doctor User",
        currentAccount?.email ?? session?.email ?? "",
        currentAccount?.doctorProfile,
      ),
    );
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
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
        description: "Please choose an image file for your profile picture.",
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

      setFormState((current) => ({
        ...current,
        profileImage: imageData,
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeProfileImage = () => {
    setFormState((current) => ({
      ...current,
      profileImage: "",
    }));
  };

  const saveProfile = () => {
    if (!currentAccount) {
      toast({
        title: "Doctor account not found",
        description: "We could not find your doctor account to save these changes.",
        variant: "destructive",
      });
      return;
    }

    const result = updateManagedAccount({
      role: "doctor",
      previousEmail: currentAccount.email,
      email: formState.email.trim() || currentAccount.email,
      fullName: formState.fullName.trim() || currentAccount.fullName,
      doctorApprovalStatus: currentAccount.doctorApprovalStatus ?? "approved",
      doctorProfile: {
        specialty: formState.specialty.trim(),
        medicalLicenseNumber: formState.medicalLicenseNumber.trim(),
        yearsOfExperience: Number.parseInt(formState.yearsOfExperience, 10) || 0,
        hospitalAffiliation: formState.hospitalAffiliation.trim(),
        phoneNumber: formState.phoneNumber.trim(),
        highestQualification: formState.highestQualification.trim(),
        profileImage: formState.profileImage,
      },
    });

    if (!result.ok) {
      toast({
        title: "Save failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setEditing(false);
    toast({
      title: "Profile updated",
      description: "Your doctor profile and avatar are now connected across the doctor workspace.",
    });
  };

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Doctor Profile
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your professional details and your own profile picture.
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
                {formState.profileImage ? (
                  <AvatarImage
                    src={formState.profileImage}
                    alt={`${formState.fullName || "Doctor"} profile`}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="rounded-3xl bg-gradient-to-br from-primary to-emerald-600 text-3xl font-bold text-white">
                  {getInitials(formState.fullName || "Doctor User")}
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
                {formState.fullName || "Doctor User"}
              </h2>
              <p className="text-muted-foreground">
                {formState.specialty || "Specialty pending"}
              </p>
              <p className="mt-2 text-sm text-foreground/80">
                {formState.hospitalAffiliation || "Hospital affiliation not added yet"}
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
                {formState.profileImage ? "Change Photo" : "Add Profile Picture"}
              </button>
              {formState.profileImage ? (
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

      <div className="premium-card gsap-in p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Stethoscope size={17} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            Professional Information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InfoField
            editing={editing}
            label="Full Name"
            value={formState.fullName}
            onChange={(value) => updateField("fullName", value)}
          />
          <InfoField
            editing={editing}
            label="Email Address"
            value={formState.email}
            onChange={(value) => updateField("email", value)}
          />
          <InfoField
            editing={editing}
            label="Specialty"
            value={formState.specialty}
            onChange={(value) => updateField("specialty", value)}
          />
          <InfoField
            editing={editing}
            label="Phone Number"
            value={formState.phoneNumber}
            onChange={(value) => updateField("phoneNumber", value)}
          />
          <InfoField
            editing={editing}
            label="Hospital Affiliation"
            value={formState.hospitalAffiliation}
            onChange={(value) => updateField("hospitalAffiliation", value)}
          />
          <InfoField
            editing={editing}
            label="Highest Qualification"
            value={formState.highestQualification}
            onChange={(value) => updateField("highestQualification", value)}
          />
          <InfoField
            editing={editing}
            label="Medical License Number"
            value={formState.medicalLicenseNumber}
            onChange={(value) => updateField("medicalLicenseNumber", value)}
          />
          <InfoField
            editing={editing}
            label="Years of Experience"
            value={formState.yearsOfExperience}
            onChange={(value) => updateField("yearsOfExperience", value)}
          />
        </div>
      </div>
    </div>
  );
}
