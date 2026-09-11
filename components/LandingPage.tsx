import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import AuthForm from './AuthForm';
import { BrainCircuit, Zap, BarChart, Eye, CheckCircle, ArrowRight, Star, Rocket, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  // onLogin prop removed as Supabase handles auth state globally
}

const features = [
  {
    icon: BrainCircuit,
    title: "Comprehensive Strategy",
    description: "Go from idea to a full business plan, including financials, marketing, and legal insights.",
    color: "from-purple-500 to-blue-500"
  },
  {
    icon: BarChart,
    title: "Live Market Analysis",
    description: "Get up-to-the-minute data on market trends and competitor landscapes, powered by Google Search.",
    color: "from-green-500 to-teal-500"
  },
  {
    icon: Zap,
    title: "Instant Brainstorming",
    description: "Quickly validate ideas, generate names, and get key strategies in seconds.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Eye,
    title: "Visual Brand Analysis",
    description: "Upload a logo or design to get instant feedback and actionable branding suggestions.",
    color: "from-pink-500 to-red-500"
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Founder, TechFlow",
    content: "StratIQ helped me secure $500K in funding. The market analysis was incredibly accurate.",
    avatar: "👩‍💼"
  },
  {
    name: "Marcus Rodriguez",
    role: "Startup Advisor",
    content: "I've seen many tools, but none as comprehensive and easy to use as StratIQ.",
    avatar: "👨‍💼"
  },
  {
    name: "Priya Patel",
    role: "Product Manager",
    content: "From idea to business plan in 2 hours. Absolutely mind-blowing!",
    avatar: "👩‍🎓"
  }
];

const LandingPage: React.FC<LandingPageProps> = () => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      if (featuresRef.current) {
        const rect = featuresRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
          featuresRef.current.classList.add('animate-in');
        }
      }
      if (testimonialsRef.current) {
        const rect = testimonialsRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
          testimonialsRef.current.classList.add('animate-in');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
  };

  const closeAuthModal = () => {
    setAuthMode(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {/* Animated Background Elements */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{
          background: `
            radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(120, 119, 198, 0.15), transparent 80%),
            radial-gradient(400px at ${mousePosition.x * 0.8}px ${mousePosition.y * 0.8}px, rgba(120, 119, 198, 0.1), transparent 60%),
            radial-gradient(300px at ${mousePosition.x * 1.2}px ${mousePosition.y * 1.2}px, rgba(99, 102, 241, 0.1), transparent 50%)
          `
        }}
      />
      
      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400 rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <Header />
      
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="text-center py-16 md:py-28 px-4 relative overflow-hidden">
          <div className={`container mx-auto max-w-6xl transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-2 mb-6 animate-pulse">
              <Rocket className="h-4 w-4 text-indigo-400" />
              <span className="text-sm text-gray-300">Trusted by 10,000+ entrepreneurs</span>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Build Your Business
              <span className="block bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Blueprint with AI
              </span>
            </h1>
            
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed">
              StratIQ is your AI co-founder, transforming your startup idea into an investor-ready plan with a single click.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => openAuthModal('signup')}
                className="group px-8 py-4 font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => openAuthModal('login')}
                className="px-8 py-4 font-bold text-gray-200 bg-gray-700/50 border border-gray-600 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-600/50 transition-all duration-300 hover:border-gray-500"
              >
                Log In
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { number: "2M+", label: "Strategies Generated" },
                { number: "95%", label: "Success Rate" },
                { number: "24/7", label: "AI Support" }
              ].map((stat, index) => (
                <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 200}ms` }}>
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.number}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-20 bg-gray-800/30 border-y border-gray-700/50 relative">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                Your All-in-One
                <span className="block bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Strategy Toolkit
                </span>
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-gray-400 text-lg">
                From market research to your final pitch deck, StratIQ covers every angle.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 hover:border-indigo-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10 relative overflow-hidden"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-3">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <div className="flex items-center gap-1 text-indigo-400 text-sm">
                        <span>Learn more</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section ref={testimonialsRef} className="py-20 relative">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                Loved by
                <span className="block bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  Entrepreneurs
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 hover:border-green-500/30 transition-all duration-500 hover:scale-105 group"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-300 italic mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing/CTA Section */}
        <section className="py-20 text-center relative">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full -translate-x-12 translate-y-12" />
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                  Ready to Build the Future?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of entrepreneurs who transformed their ideas into successful businesses with StratIQ.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
                
                <button
                  onClick={() => openAuthModal('signup')}
                  className="group px-12 py-4 font-bold text-lg text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 inline-flex items-center gap-3 animate-pulse-slow"
                >
                  <Rocket className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Start Your Strategy Now</span>
                </button>
                
                <p className="text-gray-400 text-sm mt-4">
                  Get started in 30 seconds
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-8 text-gray-500 text-sm border-t border-gray-800/50 relative z-10">
        <div className="container mx-auto px-4">
          <p>Powered by StratIQ Intelligence Engine • Built with ❤️ for entrepreneurs</p>
        </div>
      </footer>

      {authMode && (
        <AuthForm 
          mode={authMode} 
          onClose={closeAuthModal} 
        />
      )}
    </div>
  );
};

export default LandingPage;