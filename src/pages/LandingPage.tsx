import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, BookOpen, Users, Video, ArrowRight, CheckCircle2, Stethoscope, Globe, Award, Clock, Zap, Target, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  console.log("LandingPage rendering...");
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Fitness Training" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-red-500 uppercase bg-red-500/10 rounded-full border border-red-500/20">
              ACE-CPT Certification Prep
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
              Master Your <span className="text-blue-500">Fitness</span> Career
            </h1>
            <p className="text-xl text-slate-300 mb-4 leading-relaxed max-w-lg">
              Bridging the Gap Between Clinical Science and Elite Coaching.
            </p>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
              Athlex Academy provides the ultimate transformative journey to turn fitness enthusiasts into elite, science-backed professionals.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/auth"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/20 flex items-center justify-center group"
              >
                Start Learning Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center"
              >
                Explore Features
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mentor Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop" 
                    alt="Dr. Nikhil Desale" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 hidden md:block">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 p-3 rounded-xl text-white">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">1,000+</div>
                      <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Success Stories</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="lg:w-1/2 space-y-8">
              <div>
                <h2 className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">Your Mentor</h2>
                <h3 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">Dr. Nikhil Desale</h3>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  With a background in physiotherapy and years of international coaching experience, Dr. Nikhil brings a level of depth most courses lack. You aren't just learning exercises; you're learning the clinical reasoning that makes you irreplaceable to your clients.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: <Stethoscope className="h-6 w-6" />,
                    title: "Sports Physiotherapist",
                    desc: "Medical professional with deep understanding of anatomy and biomechanics."
                  },
                  {
                    icon: <Globe className="h-6 w-6" />,
                    title: "International Coach",
                    desc: "Years of coaching experience across global fitness markets."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex space-x-4">
                    <div className="flex-shrink-0 bg-blue-50 p-3 rounded-xl text-blue-600 h-fit">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-200">
                <p className="text-slate-600 font-medium italic">
                  "Bridging the gap between clinical science and elite coaching."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-4">The Program</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-6">170-Hour Integrated Curriculum</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A comprehensive deep-dive into all 16 chapters of the ACE-CPT manual. We don't just teach you how; we teach you why.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { phase: "01", title: "Foundations Phase", chapters: "Ch. 1-4", desc: "Master scope of practice, ACE IFT® Model, and behavior change." },
              { phase: "02", title: "Assessment Phase", chapters: "Ch. 5-7", desc: "Health screening, nutrition fundamentals, and functional assessments." },
              { phase: "03", title: "Programming Phase", chapters: "Ch. 8-11", desc: "Cardiorespiratory and muscular training foundations." },
              { phase: "04", title: "Specialties Phase", chapters: "Ch. 12-14", desc: "Special populations, diabetes, hypertension, and injury prevention." },
              { phase: "05", title: "Business Phase", chapters: "Ch. 15-16", desc: "Business of personal training, legal responsibilities, and professional growth." },
              { phase: "06", title: "Market Success", chapters: "Bonus", desc: "Client acquisition, assessment mastery, and global career path guidance." }
            ].map((item, idx) => (
              <div key={idx} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all">
                <div className="text-blue-600 font-black text-4xl mb-4 opacity-20">{item.phase}</div>
                <h4 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">{item.chapters}</div>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="features" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Why Choose Dr. Nikhil's Program?</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              The edge you've been looking for—learning from a medical professional who has walked the walk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                icon: <Stethoscope className="h-8 w-8 text-blue-500" />,
                title: "Clinical Perspective",
                description: "Learn anatomy and biomechanics from a Sports Physiotherapist's lens."
              },
              {
                icon: <Users className="h-8 w-8 text-red-500" />,
                title: "Proven Success Network",
                description: "Join a thriving community of 1,000+ alumni working in India and abroad."
              },
              {
                icon: <Shield className="h-8 w-8 text-green-500" />,
                title: "One-Go Guarantee",
                description: "Curriculum optimized for 100% exam readiness on your first attempt."
              },
              {
                icon: <Clock className="h-8 w-8 text-yellow-500" />,
                title: "170 Intensive Hours",
                description: "We don't rush. Every concept is hard-wired into your coaching DNA."
              },
              {
                icon: <Globe className="h-8 w-8 text-purple-500" />,
                title: "International Standards",
                description: "Training designed to make you employable in the global fitness market."
              },
              {
                icon: <Zap className="h-8 w-8 text-orange-500" />,
                title: "Injury Prevention Mastery",
                description: "Learn how to keep clients safe—the number one trait of a high-paid pro."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Success Stories</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Hear from our students who passed their ACE-CPT exam with flying colors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Rajat Sharma",
                role: "Certified Personal Trainer",
                content: "The signature quizzes from Athlex Academy were a game-changer. They felt exactly like the real ACE-CPT exam questions!",
                avatar: "https://picsum.photos/seed/rajat/100/100"
              },
              {
                name: "Chandrashekhar Patil",
                role: "Fitness Coach",
                content: "I struggled with biomechanics until I joined the live classes. The mentors here really care about your success.",
                avatar: "https://picsum.photos/seed/shekhar/100/100"
              },
              {
                name: "Mrunal Kulkarni",
                role: "ACE-CPT Student",
                content: "The structured approach and the signature quizzes helped me focus on my weak areas. Highly recommended!",
                avatar: "https://picsum.photos/seed/mrunal/100/100"
              },
              {
                name: "Trupti Deshmukh",
                role: "Health & Wellness Coach",
                content: "Athlex Academy's custom study material is top-notch. I passed my exam on the first attempt with a great score!",
                avatar: "https://picsum.photos/seed/trupti/100/100"
              },
              {
                name: "Adil Khan",
                role: "Fitness Professional",
                content: "The mentorship and the community support are unmatched. It's the best investment for any aspiring trainer.",
                avatar: "https://picsum.photos/seed/adil/100/100"
              }
            ].map((testimonial, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-600 italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
            </div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Stay Ahead of the Game</h2>
              <p className="text-xl text-white/80 mb-10">
                Subscribe to our monthly newsletter for exclusive study tips, fitness trends, and academy updates.
              </p>
              <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-grow px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 transition-all font-medium"
                  required
                />
                <button 
                  type="submit"
                  className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all shadow-xl"
                >
                  Subscribe Now
                </button>
              </form>
              <p className="text-white/50 text-sm mt-6">Join 1,000+ subscribers. No spam, ever.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Investment in Your Future</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Invest in the best training available and watch it multiply throughout your career.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">Standard Course Fee</h4>
                <div className="text-4xl font-black text-slate-400 mb-6">₹70,000</div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Comprehensive all-inclusive training covering all 16 chapters of the ACE-CPT manual.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-bl-2xl">
                Limited Time Offer
              </div>
              <div>
                <h4 className="text-xl font-bold mb-4">Academy Special</h4>
                <div className="flex items-baseline space-x-3 mb-6">
                  <div className="text-5xl font-black text-blue-500">₹55,000</div>
                  <div className="text-slate-500 line-through text-lg font-bold">₹70k</div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Save ₹15,000 on the complete program. Includes lifetime access and mentorship.
                </p>
              </div>
              <Link
                to="/auth"
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
              >
                Claim This Offer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
