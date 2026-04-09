import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ChevronRight, 
  Dumbbell, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Phone, 
  Send,
  Loader2,
  BookOpen,
  Award,
  ShieldCheck,
  PlayCircle,
  ExternalLink,
  X,
  MapPin,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react';

// Placeholder URLs for team members and logo
const drNikhilImg = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop";
const anandImg = "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop";
const sameerImg = "https://images.unsplash.com/photo-1559839734-2b71f1536783?q=80&w=400&auto=format&fit=crop";
const logoImg = "https://picsum.photos/seed/athlex/200/200";

const TEAM_MEMBERS = [
  {
    name: "Dr. Akshay",
    role: "Founder",
    bio: "With a background in Sports Physiotherapy (MPT) and Strength & Conditioning, Dr. Akshay brings a scientific and application-driven approach to fitness education. The focus extends beyond exercise prescription to integrating evidence-based practice and performance principles, ensuring the development of skilled, competent, and industry-ready professionals.",
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=400&auto=format&fit=crop"
  },
  {
    name: "Dr. Nikhil Desale",
    role: "Founder",
    bio: "With a background in Sports Physiotherapy (MPT) and certification as an ACE Certified Personal Trainer, Dr. Nikhil brings a strong foundation of clinical knowledge and practical training expertise. You’re not just learning exercises; you’re developing the clinical reasoning and application that make you truly effective and indispensable as a fitness professional.",
    image: drNikhilImg
  },
  {
    name: "Mr. Anand Soni",
    role: "Strength & Conditioning Coach",
    bio: "Anand Soni is a Strength & Conditioning Coach at ITM Badminton Academy, Raipur. He holds a degree in Sports and Exercise Science from Somaiya Sports Academy, Mumbai, and is a certified Strength & Conditioning Coach through NSCA India. With a specialization in Olympic weightlifting, his approach combines scientific training principles with practical coaching experience.",
    image: anandImg
  },
  {
    name: "Mr. Sameer Patil",
    role: "Fitness and Lifestyle Coach",
    bio: "A passionate fitness and lifestyle coach dedicated to helping individuals transform their bodies and quality of life. Certified personal trainer from Gold’s Gym Institute and diploma holder in Ayurvedic diet and nutrition. Currently pursuing ACE-CPT. Over 3 years of experience, guiding 100+ clients in sustainable fat loss and muscle gain.",
    image: sameerImg
  }
];

const SUCCESS_STORIES = [
  {
    title: "Transformation Journey: From Beginner to Pro",
    student: "Akanksha Sabharwal",
    thumbnail: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=800&auto=format&fit=crop",
    videoUrl: "https://drive.google.com/file/d/1WMZ2fbmsvIOId2-cDJxZ_f-USOJoFnGr/preview"
  },
  {
    title: "Making Impact in the Fitness Industry",
    student: "Farman",
    thumbnail: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=800&auto=format&fit=crop",
    videoUrl: "https://drive.google.com/file/d/1ZiUKvzghGSNdTJEeH-JrLLspmtwVVoKu/preview"
  },
  {
    title: "Building a Successful Personal Training Career",
    student: "Snehal Naryankar",
    thumbnail: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop",
    videoUrl: "https://drive.google.com/file/d/1ZfgqnJMAYEq7_WUfFpu3vtkkeVPjlPov/preview"
  },
  {
    title: "Mastering Human Performance",
    student: "Sanil",
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop",
    videoUrl: "https://drive.google.com/file/d/1ZTqfp8UU3axf8W7GV6ej7Hi4BywPLX_x/preview"
  }
];

const COURSES = [
  "ACE-CPT Course",
  "Kettlebell Training Specialist",
  "Olympic Weight Lifting Specialist",
  "Weight Management Course",
  "Plyometric Training Course",
  "Functional Training Course",
  "Chronic Medical Condition Course",
  "Army Foundation Course",
  "Police Bharti Preparation Course",
  "Basic Nutrition Course",
  "Advanced Sports Nutrition Course",
  "Sports Specific Training for Cricket",
  "Sports Specific Training for Football",
  "Sports Specific Training for Basketball",
  "Suspension Training Course",
  "Animal Flow Training Course",
  "Prehab and Rehab Training Course",
  "Nutrition for Weight Management",
  "Blood Reports Understanding Course"
];

export default function LandingPage() {
  const [email, setEmail] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [selectedCourse, setSelectedCourse] = React.useState(COURSES[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [activeVideo, setActiveVideo] = React.useState<string | null>(null);
  const [stories, setStories] = React.useState<any[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, 'successStories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStories(fetchedStories.length > 0 ? fetchedStories : SUCCESS_STORIES);
    });
    return () => unsubscribe();
  }, []);

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        studentEmail: email,
        studentMobile: mobile,
        courseName: selectedCourse,
        status: 'new',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      setEmail('');
      setMobile('');
    } catch (err) {
      console.error("Inquiry Error:", err);
      alert("Failed to send inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 -z-10">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 rounded-l-[10rem] transform translate-x-1/4"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full text-blue-600 font-bold text-xs uppercase tracking-widest mb-6">
              <Award className="h-4 w-4" />
              <span>Welcome to Athlex Academy</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8">
              Master the Science of <span className="text-blue-600">Human Performance.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium mb-10 leading-relaxed max-w-lg">
              Empowering fitness professionals with evidence-based education, clinical reasoning, and industry-leading certifications.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                to="/auth"
                className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center group"
              >
                Start Learning Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#courses"
                className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center"
              >
                Explore Courses
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop" 
                alt="Athlex Academy Training" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2rem] shadow-xl z-20 hidden md:block border border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="bg-green-50 p-3 rounded-xl">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">100%</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Evidence Based</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-4">Aspiring Trainers</h4>
              <p className="text-slate-500 font-medium leading-relaxed">
                Start your journey with ACE-CPT certification and build a rock-solid foundation in exercise science.
              </p>
            </div>
            <div className="p-10 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
              <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                <Dumbbell className="h-7 w-7" />
              </div>
              <h4 className="text-xl font-black mb-4">Experienced Coaches</h4>
              <p className="text-slate-400 font-medium leading-relaxed">
                Level up with specialized courses in Olympic Lifting, Kettlebell, and Advanced Sports Nutrition.
              </p>
            </div>
            <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-4">Sports Scientists</h4>
              <p className="text-slate-500 font-medium leading-relaxed">
                Bridge the gap between academic theory and real-world clinical application in human performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Athlex Section */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">The Athlex Edge</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">Why Choose <span className="text-blue-600">Athlex Academy?</span></h3>
              <div className="space-y-6">
                {[
                  { title: "Clinical Reasoning", desc: "We don't just teach exercises; we teach you the 'why' behind every movement." },
                  { title: "Industry Recognition", desc: "Our certifications are recognized globally, opening doors to top fitness hubs." },
                  { title: "Expert Mentorship", desc: "Learn directly from Sports Physiotherapists and International S&C Coaches." },
                  { title: "Practical Application", desc: "Hands-on training that prepares you for real-world client scenarios." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="mt-1 bg-blue-600 rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-500 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="rounded-[3rem] overflow-hidden shadow-2xl rotate-3">
                <img 
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop" 
                  alt="Coaching Session" 
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -top-10 -right-10 bg-red-600 text-white p-8 rounded-[2rem] shadow-2xl -rotate-6 hidden md:block">
                <div className="text-3xl font-black">1000+</div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-80">Students Trained</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Expert Mentors</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Meet Our Team</h3>
            <p className="mt-6 text-slate-500 font-medium max-w-2xl mx-auto">
              Our team members bring a decade plus of experience in their respective specialities and expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {TEAM_MEMBERS.map((member, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-32 h-32 rounded-[2rem] overflow-hidden flex-shrink-0 shadow-lg">
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 mb-1">{member.name}</h4>
                    <div className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-6">{member.role}</div>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-600/5 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Real Results</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight">Success Stories</h3>
            <p className="mt-6 text-slate-400 font-medium max-w-2xl mx-auto">
              Hear from our students who have transformed their careers and lives through Athlex Academy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.map((story, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => story.videoUrl && setActiveVideo(story.videoUrl)}
                className={`group relative bg-slate-800 rounded-[2.5rem] overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all ${story.videoUrl ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" referrerPolicy="no-referrer" />
                  {story.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-600/40 group-hover:scale-110 transition-transform">
                        <PlayCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{story.title}</h4>
                  <div className="flex items-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                    <Users className="h-4 w-4 mr-2 text-blue-500" />
                    {story.student}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <a 
              href="#courses" 
              className="inline-flex items-center px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 group"
            >
              You can be the one on our Hall of Fame
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Courses & Inquiry Section */}
      <section id="courses" className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[10rem]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[10rem]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Course Catalog</h2>
              <h3 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Explore Our Specialized Training Programs</h3>
              <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                Athlex Academy offers a wide range of courses designed to elevate your career in the fitness industry. From foundational certifications to advanced sports nutrition.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COURSES.slice(0, 8).map((course, i) => (
                  <div key={i} className="flex items-center space-x-3 text-slate-300 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span>{course}</span>
                  </div>
                ))}
                <div className="flex items-center space-x-3 text-blue-400 font-bold italic">
                  <span>And many more...</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 md:p-12 text-slate-900 shadow-2xl">
              <div className="mb-8">
                <h4 className="text-2xl font-black mb-2">Course Inquiry</h4>
                <p className="text-slate-500 font-medium">Select a course and we'll get back to you with details.</p>
              </div>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="h-10 w-10 text-green-600" />
                  </div>
                  <h5 className="text-2xl font-bold text-slate-900 mb-2">Inquiry Sent!</h5>
                  <p className="text-slate-500 mb-8">Thank you for your interest. Our team will contact you shortly.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInquiry} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Course</label>
                    <select 
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-bold text-slate-700"
                    >
                      {COURSES.map((course, i) => (
                        <option key={i} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input 
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Your Mobile Number"
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        Send Inquiry
                        <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
              <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Get In Touch</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">Have Questions? <span className="text-blue-600">Contact Us.</span></h3>
              <p className="text-slate-500 text-lg mb-12 leading-relaxed">
                Whether you're an aspiring trainer or an experienced coach, we're here to help you choose the right path for your career.
              </p>

              <div className="space-y-8">
                <div className="flex items-center space-x-6">
                  <div className="bg-blue-50 p-4 rounded-2xl">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email Us</div>
                    <div className="text-lg font-bold text-slate-900">info@athlexacademy.com</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="bg-blue-50 p-4 rounded-2xl">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Call Us</div>
                    <div className="text-lg font-bold text-slate-900">+91 98765 43210</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="bg-blue-50 p-4 rounded-2xl">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Visit Us</div>
                    <div className="text-lg font-bold text-slate-900">Mumbai, Maharashtra, India</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl h-[400px] bg-slate-50 relative">
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <div className="font-bold uppercase tracking-widest text-xs">Interactive Map Placeholder</div>
                </div>
              </div>
              {/* You can embed a real Google Map iframe here */}
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            <iframe 
              src={activeVideo} 
              className="w-full h-full"
              allow="autoplay"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <img 
              src={logoImg} 
              alt="Athlex Academy Logo" 
              className="h-16 w-auto"
            />
          </div>
          <p className="text-slate-500 font-medium mb-8">
            © {new Date().getFullYear()} Athlex Academy. All rights reserved.
          </p>
          <div className="flex justify-center space-x-8">
            <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors flex items-center space-x-2 group">
              <Instagram className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-widest">Instagram</span>
            </a>
            <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors flex items-center space-x-2 group">
              <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-widest">LinkedIn</span>
            </a>
            <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors flex items-center space-x-2 group">
              <Youtube className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-widest">YouTube</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
