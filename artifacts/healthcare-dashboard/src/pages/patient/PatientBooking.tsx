import React, { useRef, useState } from "react";
import { Calendar, Clock, Search, Star, CheckCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useListDoctors, useCreateAppointment } from "@workspace/api-client-react";
import { MOCK_DOCTORS } from "@/lib/mock-data";

const TIME_SLOTS = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"];

export default function PatientBooking() {
  const container = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [type, setType] = useState("Consultation");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState(false);

  const { data: doctors = MOCK_DOCTORS } = useListDoctors();
  const { mutate: createAppointment, isPending } = useCreateAppointment();

  useGSAP(() => {
    gsap.from(".gsap-in", { y: 25, opacity: 0, stagger: 0.07, duration: 0.5, ease: "power3.out" });
  }, { scope: container });

  const specialties = ["all", ...Array.from(new Set(doctors.map(d => d.specialty)))];
  const filtered = doctors.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchSpec = specialty === "all" || d.specialty === specialty;
    return matchSearch && matchSpec;
  });

  const handleBook = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    createAppointment({
      patientId: 1,
      doctorId: selectedDoctor.id,
      date: selectedDate,
      time: selectedTime,
      type,
      notes,
    }, {
      onSuccess: () => {
        setBooked(true);
        setTimeout(() => {
          gsap.from(".success-anim", { scale: 0.8, opacity: 0, duration: 0.4, ease: "back.out" });
        }, 50);
      },
    });
  };

  if (booked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="success-anim premium-card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Appointment Booked!</h2>
          <p className="text-muted-foreground mb-6">
            Your appointment with <strong>{selectedDoctor?.name}</strong> on <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong> has been confirmed.
          </p>
          <button onClick={() => { setBooked(false); setSelectedDoctor(null); setSelectedDate(""); setSelectedTime(""); }} className="premium-button">
            Book Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">Book Appointment</h1>
        <p className="text-muted-foreground mt-1">Choose a doctor and schedule your visit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Selection */}
        <div className="lg:col-span-2 space-y-4 gsap-in">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 flex-1">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {specialties.map(s => (
                <option key={s} value={s}>{s === "all" ? "All Specialties" : s}</option>
              ))}
            </select>
          </div>

          {/* Doctor Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoctor(doc)}
                className={`premium-card p-5 text-left transition-all hover:shadow-md ${
                  selectedDoctor?.id === doc.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
                    {doc.name.split(" ").pop()?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                  </div>
                  {selectedDoctor?.id === doc.id && (
                    <CheckCircle size={18} className="text-primary ml-auto" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Star size={11} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-foreground">{doc.rating ?? "4.8"}</span>
                  </span>
                  <span className="text-muted-foreground">{doc.patients ?? 0} patients</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${
                    doc.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}>{doc.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="premium-card p-6 gsap-in self-start">
          <h2 className="text-lg font-bold text-foreground mb-4">
            {selectedDoctor ? `Book with ${selectedDoctor.name}` : "Select a Doctor"}
          </h2>

          {!selectedDoctor ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Choose a doctor from the list to proceed</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Time Slot</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIME_SLOTS.slice(0, 6).map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`text-xs py-2 px-2 rounded-lg border font-medium transition-all ${
                        selectedTime === slot ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Appointment Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Consultation</option>
                  <option>Follow-up</option>
                  <option>Emergency</option>
                  <option>Checkup</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20"
                />
              </div>
              <button
                onClick={handleBook}
                disabled={!selectedDate || !selectedTime || isPending}
                className="w-full premium-button text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Calendar size={15} />
                {isPending ? "Booking..." : "Confirm Appointment"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
