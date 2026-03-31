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

          <div className="relative mx-auto flex min-h-[36rem] max-w-[38rem] flex-col justify-center">
            <div className="absolute inset-6 rounded-[3.25rem] border border-white/10 bg-white/5" />
            <div className="absolute inset-12 rounded-[2.75rem] border border-white/10 bg-white/5" />

            <div className="relative z-10 space-y-8 px-10">
              <div className="max-w-md space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-100/80">
                  Intelligent Care Platform
                </p>
                <h2 className="text-4xl font-display font-bold leading-tight text-white">
                  Smarter patient insights for every clinical decision.
                </h2>
                <p className="text-base leading-7 text-blue-100/85">
                  Predictive healthcare workflows for patients and doctors in one secure system.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Side - Role Selection */}
      <div className="relative flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <img 
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
            alt="Auth Background" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 w-full max-w-xl">
          <div className="animate-in mb-8 rounded-[1.75rem] border border-border/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
                <HeartPulse size={26} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">MedixAI</h1>
                <p className="text-sm text-muted-foreground">Healthcare intelligence platform</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Secure role-based access for patients and medical professionals.
            </p>
          </div>

          <div className="text-center mb-10 sm:mb-12 animate-in">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Welcome to MedixAI</h2>
            <p className="text-lg text-muted-foreground">Select your portal access level to continue</p>
          </div>

          <div className="space-y-4">
            <RoleCard 
              to="/patient/auth" 
              icon={User} 
              title="Patient Portal" 
              color="text-blue-600"
              bg="bg-blue-100"
            />
            <RoleCard 
              to="/doctor/auth" 
              icon={Stethoscope} 
              title="Medical Professional" 
              color="text-emerald-600"
              bg="bg-emerald-100"
            />
            <RoleCard 
              to="/admin/auth" 
              icon={Shield} 
              title="Administrator" 
              color="text-indigo-600"
              bg="bg-indigo-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ to, icon: Icon, title, color, bg }: any) {
  return (
    <Link href={to} className="animate-in block group">
      <div className="premium-card flex flex-col items-start gap-4 bg-white/80 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:gap-6 sm:p-7">
        <div className={`w-16 h-16 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={30} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-xl group-hover:text-primary transition-colors">{title}</h3>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-white sm:self-center">
          <ArrowRight size={22} />
        </div>
      </div>
    </Link>
  );
}
