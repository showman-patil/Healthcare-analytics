import React, { useRef } from "react";
import { Link } from "wouter";
import { Shield, Stethoscope, User, HeartPulse, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Home() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".animate-in", {
      y: 30,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: "power3.out"
    });
  }, { scope: container });

  return (
    <div ref={container} className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Side - Hero Branding */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative p-12 flex-col justify-between overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-medical.png`} 
            alt="Medical Hero" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-blue-900/90 z-0"></div>
        
        <div className="relative z-10 animate-in">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white text-primary flex items-center justify-center shadow-xl">
              <HeartPulse size={30} />
            </div>
            <h1 className="font-display font-bold text-3xl tracking-tight">MedixAI</h1>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
            Next-Gen <br />Healthcare <br />Intelligence.
          </h2>
          <p className="text-blue-100 text-lg lg:text-xl max-w-md leading-relaxed">
            Predictive analytics, seamless patient management, and AI-driven diagnostics for modern medical facilities.
          </p>
        </div>

        <div className="relative z-10 animate-in">
          <div className="flex items-center gap-4 text-sm font-medium text-blue-200">
            <span>Enterprise Grade</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>HIPAA Compliant</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>AI Powered</span>
          </div>
        </div>
      </div>

      {/* Right Side - Role Selection */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <img 
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
            alt="Auth Background" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-10 animate-in">
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">Welcome to MedixAI</h2>
            <p className="text-muted-foreground">Select your portal access level to continue</p>
          </div>

          <div className="space-y-4">
            <RoleCard 
              to="/admin/dashboard" 
              icon={Shield} 
              title="Administrator" 
              description="Manage facility resources, user access, and view hospital-wide analytics."
              color="text-indigo-600"
              bg="bg-indigo-100"
            />
            <RoleCard 
              to="/doctor/dashboard" 
              icon={Stethoscope} 
              title="Medical Professional" 
              description="Access patient records, schedules, and use AI disease prediction tools."
              color="text-emerald-600"
              bg="bg-emerald-100"
            />
            <RoleCard 
              to="/patient/dashboard" 
              icon={User} 
              title="Patient Portal" 
              description="View your health records, book appointments, and check symptoms."
              color="text-blue-600"
              bg="bg-blue-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ to, icon: Icon, title, description, color, bg }: any) {
  return (
    <Link href={to} className="animate-in block group">
      <div className="premium-card p-6 flex items-center gap-5 bg-white/80 backdrop-blur-md">
        <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={28} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">{description}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
          <ArrowRight size={20} />
        </div>
      </div>
    </Link>
  );
}
