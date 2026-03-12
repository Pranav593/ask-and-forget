import React, { useState, useCallback } from 'react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    setBgOffset({ x, y });
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const endpoint = isSignup ? '/auth/signup' : '/auth/login';
    const res = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.detail || 'Login failed');
      return;
    }

    localStorage.setItem('idToken', data.tokenId);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify({ email }));
    onLoginSuccess();

  } catch (err) {
    alert('Could not reach the server. Is the backend running?');
  } finally {
    setLoading(false);
  }
};

  const doodleSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <!-- Coffee cup -->
    <g transform="translate(60,50) rotate(-10)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.6">
      <path d="M 0 8 L 0 28 Q 0 35 7 35 L 23 35 Q 30 35 30 28 L 30 8 Z" stroke-linecap="round"/>
      <path d="M 30 14 Q 40 14 40 22 Q 40 30 30 30"/>
      <path d="M 8 0 Q 10 -5 12 0" stroke-width="1"/>
      <path d="M 16 -2 Q 18 -7 20 -2" stroke-width="1"/>
    </g>

    <!-- Shopping bag -->
    <g transform="translate(520,80)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <rect x="0" y="10" width="30" height="30" rx="3"/>
      <path d="M 8 10 L 8 5 Q 8 0 15 0 Q 22 0 22 5 L 22 10"/>
    </g>

    <!-- Key -->
    <g transform="translate(150,520) rotate(30)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <circle cx="10" cy="10" r="8"/>
      <line x1="18" y1="10" x2="38" y2="10"/>
      <line x1="34" y1="10" x2="34" y2="16"/>
      <line x1="38" y1="10" x2="38" y2="14"/>
    </g>

    <!-- Light bulb -->
    <g transform="translate(400,450)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.55">
      <path d="M 15 0 Q 0 0 0 15 Q 0 24 8 28 L 8 34 L 22 34 L 22 28 Q 30 24 30 15 Q 30 0 15 0 Z"/>
      <line x1="10" y1="37" x2="20" y2="37"/>
    </g>

    <!-- Clock -->
    <g transform="translate(680,300)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <circle cx="18" cy="18" r="18"/>
      <line x1="18" y1="18" x2="18" y2="8"/>
      <line x1="18" y1="18" x2="26" y2="18"/>
      <circle cx="18" cy="18" r="1.5" fill="#6aabeb"/>
    </g>

    <!-- Envelope / mail -->
    <g transform="translate(300,70) rotate(5)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <rect x="0" y="0" width="35" height="25" rx="3"/>
      <path d="M 0 0 L 17.5 14 L 35 0"/>
    </g>

    <!-- Milk carton -->
    <g transform="translate(50,350)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <rect x="0" y="10" width="22" height="30" rx="2"/>
      <path d="M 0 10 L 11 0 L 22 10"/>
      <line x1="6" y1="20" x2="16" y2="20"/>
    </g>

    <!-- Grocery cart -->
    <g transform="translate(600,500) rotate(-5)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.55">
      <path d="M 0 0 L 5 0 L 12 22 L 32 22 L 36 8 L 10 8"/>
      <circle cx="15" cy="28" r="3"/>
      <circle cx="29" cy="28" r="3"/>
    </g>

    <!-- Phone -->
    <g transform="translate(700,80)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.45">
      <rect x="0" y="0" width="20" height="35" rx="4"/>
      <line x1="7" y1="30" x2="13" y2="30"/>
    </g>

    <!-- Book -->
    <g transform="translate(250,400) rotate(-15)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <path d="M 2 0 L 2 30 Q 15 26 28 30 L 28 0 Q 15 4 2 0 Z"/>
      <line x1="15" y1="2" x2="15" y2="28"/>
    </g>

    <!-- Pill / medicine -->
    <g transform="translate(480,200) rotate(40)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <rect x="0" y="0" width="12" height="28" rx="6"/>
      <line x1="0" y1="14" x2="12" y2="14"/>
    </g>

    <!-- Umbrella -->
    <g transform="translate(100,180)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <path d="M 15 5 Q 0 5 0 18 L 15 18 L 30 18 Q 30 5 15 5 Z"/>
      <line x1="15" y1="18" x2="15" y2="35"/>
      <path d="M 15 35 Q 15 40 10 38"/>
    </g>

    <!-- Scissors -->
    <g transform="translate(550,380) rotate(20)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.45">
      <circle cx="5" cy="25" r="5"/>
      <circle cx="20" cy="25" r="5"/>
      <line x1="8" y1="21" x2="20" y2="5"/>
      <line x1="17" y1="21" x2="5" y2="5"/>
    </g>

    <!-- Hanger -->
    <g transform="translate(350,280)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <path d="M 15 0 Q 15 5 15 8"/>
      <path d="M 15 8 L 0 25 L 30 25 Z"/>
      <circle cx="15" cy="0" r="3"/>
    </g>

    <!-- Toothbrush -->
    <g transform="translate(680,550) rotate(-25)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.45">
      <rect x="0" y="3" width="8" height="14" rx="3"/>
      <rect x="2" y="17" width="4" height="25" rx="1"/>
    </g>

    <!-- Watering can -->
    <g transform="translate(180,650) rotate(10)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <ellipse cx="15" cy="18" rx="15" ry="12"/>
      <line x1="30" y1="12" x2="40" y2="5"/>
      <path d="M 10 6 Q 10 0 15 0 Q 20 0 20 6"/>
    </g>

    <!-- Pencil -->
    <g transform="translate(320,180) rotate(-30)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <rect x="0" y="0" width="8" height="32" rx="1"/>
      <path d="M 0 32 L 4 40 L 8 32"/>
      <line x1="0" y1="4" x2="8" y2="4"/>
    </g>

    <!-- Alarm bell -->
    <g transform="translate(200,300)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <path d="M 5 20 Q 5 5 15 5 Q 25 5 25 20 L 5 20"/>
      <line x1="15" y1="0" x2="15" y2="5"/>
      <line x1="3" y1="20" x2="27" y2="20"/>
      <circle cx="15" cy="24" r="2.5"/>
    </g>

    <!-- Sunglasses -->
    <g transform="translate(580,200) rotate(5)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.45">
      <circle cx="8" cy="8" r="8"/>
      <circle cx="30" cy="8" r="8"/>
      <line x1="16" y1="8" x2="22" y2="8"/>
      <line x1="0" y1="4" x2="-6" y2="2"/>
    </g>

    <!-- Laundry basket -->
    <g transform="translate(450,340) rotate(5)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <path d="M 0 8 L 5 30 L 30 30 L 35 8 Z"/>
      <line x1="0" y1="8" x2="35" y2="8"/>
      <line x1="12" y1="12" x2="14" y2="26"/>
      <line x1="23" y1="12" x2="21" y2="26"/>
    </g>

    <!-- Water drop -->
    <g transform="translate(720,450)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <path d="M 10 0 Q 0 15 10 25 Q 20 15 10 0 Z"/>
    </g>

    <!-- Fork -->
    <g transform="translate(50,600) rotate(15)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.45">
      <line x1="5" y1="0" x2="5" y2="12"/>
      <line x1="10" y1="0" x2="10" y2="12"/>
      <line x1="15" y1="0" x2="15" y2="12"/>
      <path d="M 3 12 Q 3 18 10 18 Q 17 18 17 12"/>
      <line x1="10" y1="18" x2="10" y2="35"/>
    </g>

    <!-- Plant pot -->
    <g transform="translate(380,600)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <path d="M 3 12 L 7 30 L 25 30 L 29 12 Z"/>
      <line x1="0" y1="12" x2="32" y2="12"/>
      <path d="M 16 12 L 16 4 Q 16 0 20 0"/>
      <path d="M 16 8 Q 10 4 8 0"/>
    </g>

    <!-- Small dots scattered -->
    <circle cx="200" cy="250" r="2.5" fill="#6aabeb" opacity="0.3"/>
    <circle cx="450" cy="130" r="2" fill="#7db8f0" opacity="0.3"/>
    <circle cx="630" cy="420" r="2.5" fill="#6aabeb" opacity="0.3"/>
    <circle cx="100" cy="600" r="2" fill="#7db8f0" opacity="0.35"/>
    <circle cx="500" cy="600" r="2" fill="#6aabeb" opacity="0.3"/>
    <circle cx="750" cy="200" r="2" fill="#7db8f0" opacity="0.3"/>
    <circle cx="300" cy="550" r="2" fill="#6aabeb" opacity="0.3"/>
    <circle cx="650" cy="650" r="2.5" fill="#7db8f0" opacity="0.3"/>

    <!-- Spoon -->
    <g transform="translate(280,240) rotate(25)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <ellipse cx="8" cy="8" rx="8" ry="10"/>
      <line x1="8" y1="18" x2="8" y2="40"/>
    </g>

    <!-- Glasses -->
    <g transform="translate(620,140) rotate(-8)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.45">
      <circle cx="10" cy="10" r="10"/>
      <circle cx="35" cy="10" r="10"/>
      <line x1="20" y1="10" x2="25" y2="10"/>
      <line x1="0" y1="6" x2="-8" y2="4"/>
    </g>

    <!-- Candle -->
    <g transform="translate(730,540)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <rect x="3" y="10" width="14" height="25" rx="2"/>
      <line x1="10" y1="10" x2="10" y2="5"/>
      <path d="M 10 5 Q 7 0 10 -3 Q 13 0 10 5" fill="#6aabeb" opacity="0.3"/>
    </g>

    <!-- Sock -->
    <g transform="translate(50,480) rotate(10)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.45">
      <path d="M 0 0 L 0 22 Q 0 32 10 32 L 18 32 Q 22 32 22 28 L 22 20 L 14 20 L 14 0 Z"/>
      <line x1="0" y1="8" x2="14" y2="8"/>
    </g>

    <!-- Battery -->
    <g transform="translate(500,500) rotate(-15)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.5">
      <rect x="0" y="4" width="28" height="16" rx="2"/>
      <rect x="28" y="8" width="4" height="8" rx="1"/>
      <line x1="8" y1="10" x2="8" y2="16"/>
      <line x1="5" y1="13" x2="11" y2="13"/>
    </g>

    <!-- Camera -->
    <g transform="translate(160,400) rotate(-5)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.5">
      <rect x="0" y="8" width="35" height="22" rx="3"/>
      <circle cx="17" cy="19" r="7"/>
      <rect x="12" y="3" width="12" height="6" rx="1"/>
    </g>
  </svg>`)}`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        backgroundImage: `url("${doodleSvg}"), linear-gradient(to bottom right, #dbeafe, #bfdbfe)`,
        backgroundSize: '800px 800px, cover',
        backgroundPosition: `${bgOffset.x}px ${bgOffset.y}px, center`,
        transition: 'background-position 0.3s ease-out',
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-7xl font-extrabold mb-3 transition-transform duration-300 ease-out hover:scale-110 cursor-default inline-block title-hover">
            <span className="text-gray-800 title-shine">Ask</span>
            <span className="text-blue-400 mx-1 title-shine-blue">&</span>
            <span className="text-blue-500 title-forget">Forget</span>
          </h1>
          <div className="w-12 h-1 bg-blue-400 rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm tracking-wide uppercase cursor-default slogan-shine">Set it. Forget it. We remember.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isSignup ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400 text-sm">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-500 hover:underline font-medium"
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
