import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';
import { Plan } from '../types/api';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { formatDisplayCurrency } from '../utils/currency';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('nodejs');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const { currency } = useCurrency();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiService.getPlans();
        setPlans(response.plans);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        // Fallback to static pricing if API fails
        setPlans(fallbackPricing);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // Fallback pricing data in case API fails
  const fallbackPricing = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49000,
      features: ['512MB RAM', '1 vCPU', '10GB Storage', '1 App', 'SSL Gratis'],
      limits: {
        apps: 1,
        storage: 10,
        ram: 512,
        cpu: 1
      },
      description: 'For individuals getting started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 149000,
      features: ['2GB RAM', '2 vCPU', '50GB Storage', '5 Apps', 'Database Managed', 'Priority Support'],
      limits: {
        apps: 5,
        storage: 50,
        ram: 2048,
        cpu: 2
      },
      description: 'For professionals and small teams',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'business',
      name: 'Business',
      price: 399000,
      features: ['8GB RAM', '4 vCPU', '200GB Storage', 'Unlimited Apps', 'Database Cluster', 'Dedicated Support'],
      limits: {
        apps: 9999, // unlimited
        storage: 200,
        ram: 8192,
        cpu: 4
      },
      description: 'For growing businesses',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const features = [
    {
      title: 'Deploy Instan',
      desc: 'Deploy aplikasi dalam hitungan detik dari Git repository',
      icon: '⚡'
    },
    {
      title: 'Manajemen Deployment',
      desc: 'Restart, stop, dan cek status deployment secara real-time',
      icon: '🔄'
    },
    {
      title: 'Billing Otomatis',
      desc: 'Sistem pembayaran terintegrasi dengan berbagai metode',
      icon: '💳'
    },
    {
      title: 'Log Deployment',
      desc: 'Lihat log aplikasi secara real-time',
      icon: '📝'
    },
    {
      title: 'Kontrol Akses',
      desc: 'Atur izin akses untuk tim Anda',
      icon: '🔒'
    },
    {
      title: 'Dashboard Admin',
      desc: 'Kelola pengguna, deployment, dan transaksi',
      icon: '📊'
    }
  ];

  const stacks = [
    { name: 'Node.js', id: 'nodejs' },
    { name: 'Python', id: 'python' },
    { name: 'PHP', id: 'php' },
    { name: 'Ruby', id: 'ruby' },
    { name: 'Go', id: 'go' },
    { name: 'Java', id: 'java' }
  ];

  const handleGetStarted = () => {
    navigate('/auth'); // atau ke halaman login/registrasi
  };

  const handlePlanSelect = (planId: string) => {
    // Navigate to auth page so user can register/login and then select the plan
    navigate('/auth');
    // Store the selected plan ID in localStorage for after login
    localStorage.setItem('selectedPlanId', planId);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white dark:bg-slate-800 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                D
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                Deploykit
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition">
                Fitur
              </a>
              <a href="#pricing" className="text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition">
                Harga
              </a>
              <a href="#docs" className="text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition">
                Dokumentasi
              </a>
            </div>
            <div className="flex space-x-4">
              <button 
                className="text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium"
                onClick={() => navigate('/auth')}
              >
                Masuk
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium"
              >
                Mulai Gratis
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                ☁️ Platform PaaS Made in Indonesia
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6">
              Deploy Aplikasi<br/>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                Tanpa Ribet
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Platform hosting modern untuk developer Indonesia. Deploy, scale, dan monitor aplikasi Anda dengan mudah.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition shadow-xl"
              >
                Coba Gratis 14 Hari
              </button>
              <button className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-slate-300 dark:border-slate-600 hover:border-purple-500 dark:hover:border-purple-400 transition">
                Lihat Demo
              </button>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">Tidak perlu kartu kredit • Setup dalam 5 menit</p>
          </div>

          {/* Code Preview */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden animate-bounce">
              <div className="bg-slate-800 px-4 py-3 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-400 text-sm ml-4">terminal</span>
              </div>
              <div className="p-6 font-mono text-sm">
                <div className="text-green-400">$ git push deploykit main</div>
                <div className="text-slate-400 mt-2">Deploying to Deploykit...</div>
                <div className="text-blue-400 mt-1">Building application...</div>
                <div className="text-yellow-400 mt-1">Running tests... ✓</div>
                <div className="text-green-400 mt-1">Deployed successfully! 🚀</div>
                <div className="text-purple-400 mt-1">https://myapp.deploykit.id</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Stacks */}
      <section className="py-12 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Support Semua Stack Favorit Anda</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {stacks.map(stack => (
              <button
                key={stack.id}
                onClick={() => setActiveTab(stack.id)}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  activeTab === stack.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {stack.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Fitur yang Membuat <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">Developer Senang</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">Semua yang Anda butuhkan untuk deploy dan scale aplikasi</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Harga <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">Transparan</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">Pilih paket yang sesuai dengan kebutuhan Anda</p>
          </div>
          {isLoadingPlans ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, idx) => {
                const isPopular = plan.name.toLowerCase() === 'pro';
                return (
                  <div 
                    key={plan.id} 
                    className={`bg-white dark:bg-slate-700 rounded-xl shadow-lg p-8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      isPopular ? 'ring-4 ring-purple-500 dark:ring-purple-400 relative' : 'border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Paling Populer
                        </span>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                        {formatDisplayCurrency(plan.price, currency)}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">/bulan</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center text-slate-700 dark:text-slate-300">
                          <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                          : 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500'
                      }`}
                    >
                      Pilih Paket
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Siap untuk Deploy Aplikasi Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabung dengan ribuan developer yang sudah mempercayai Deploykit
          </p>
          <button 
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-xl flex items-center justify-center mx-auto"
          >
            Mulai Gratis Sekarang
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  D
                </div>
                <span className="text-xl font-bold text-white">Deploykit</span>
              </div>
              <p className="text-sm">Platform hosting modern untuk developer Indonesia</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Fitur</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Harga</a></li>
                <li><a href="#" className="hover:text-white transition">Dokumentasi</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Karir</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
                <li><a href="#" className="hover:text-white transition">Kontak</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© 2025 PT. Solusi Konsep Teknologi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;