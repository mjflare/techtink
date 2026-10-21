import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Play, Sparkles, Heart, Zap, Rocket, 
  CheckCircle, Coffee, Smile, ShieldCheck, ThumbsUp, ChevronDown
} from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  // Interactive Mood State for the Motion Graphic
  // 'flow' (deep focus & speed), 'joy' (happiness & success), 'relax' (comfort & peace of mind)
  const [mood, setMood] = useState('joy');

  // Interactive floating reactions on click
  const [reactions, setReactions] = useState([]);
  const reactionIdRef = useRef(0);

  // Mouse Parallax for subtle 3D depth
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: -y * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Click on graphic creates an interactive burst of delight!
  const handleGraphicClick = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const clickX = rect ? e.clientX - rect.left : 250;
    const clickY = rect ? e.clientY - rect.top : 200;

    const emojis = ['⚡', '❤️', '🚀', '✨', '☕', '💎'];
    const labels = ['عالی!', 'پر سرعت', 'بی‌نقص', 'بدون داغی', 'لذت کاربری'];
    const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const chosenLabel = labels[Math.floor(Math.random() * labels.length)];

    const id = reactionIdRef.current++;
    setReactions(prev => [
      ...prev.slice(-6),
      { id, x: clickX, y: clickY, emoji: chosenEmoji, label: chosenLabel }
    ]);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 1800);
  };

  // Dynamic theme colors based on chosen mood
  const moodThemes = {
    joy: {
      screenGlow: 'hsla(var(--accent-cyan), 0.35)',
      ambientLight: '#38bdf8',
      accentColor: 'hsl(var(--accent-cyan))',
      badgeText: 'حس خوب سرعت و آرامش',
      statusText: 'خلق ایده‌های جدید بدون کوچک‌ترین افت سرعت',
      sparkColor: '#38bdf8'
    },
    flow: {
      screenGlow: 'hsla(var(--accent-purple), 0.4)',
      ambientLight: '#a855f7',
      accentColor: 'hsl(var(--accent-purple))',
      badgeText: 'تمرکز عمیق و کارایی حداکثری',
      statusText: 'اجرای همزمان نرم‌افزارهای سنگین بدون داغ شدن',
      sparkColor: '#c084fc'
    },
    relax: {
      screenGlow: 'rgba(245, 158, 11, 0.35)',
      ambientLight: '#f59e0b',
      accentColor: '#f59e0b',
      badgeText: 'آسودگی خاطر و پایداری مداوم',
      statusText: 'باتری بادوام برای ساعت‌ها کار بی‌دغدغه در کافه یا محل کار',
      sparkColor: '#fbbf24'
    }
  };

  const currentTheme = moodThemes[mood];

  return (
    <div 
      className="container" 
      style={{ 
        minHeight: 'calc(100svh - 90px)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        paddingTop: '20px', 
        paddingBottom: '24px', 
        overflowX: 'clip' 
      }}
    >
      
      {/* 2-Column Responsive Layout: Text on Left, Motion Graphic on Right */}
      <div className="tt-hero-container">
        
        {/* Left Column: Emotionally resonant, friendly copy */}
        <div className="animate-fade-in" style={{ zIndex: 10 }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="badge badge-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '5px 12px' }}>
              <Smile size={14} style={{ color: currentTheme.accentColor }} />
              {currentTheme.badgeText}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', marginBottom: '16px', lineHeight: 1.25, fontWeight: 800, letterSpacing: '-0.4px', wordBreak: 'break-word' }}>
            لذت کار با لپ‌تاپی که <span className="gradient-text">همیشه همراهتونه</span>
          </h1>

          <p style={{ fontSize: 'clamp(0.92rem, 1.8vw, 1.05rem)', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '520px', lineHeight: 1.75 }}>
            خداحافظی با داغ شدن، صدای آزاردهنده فن و کندی سرعت. با لپ‌تاپ‌های تست‌شده و گارانتی طلایی تک‌تینک، در نهایت آرامش و اعتماد به نفس روی اهداف و کارهایتان تمرکز کنید.
          </p>
          
          {/* Action Buttons */}
          <div className="flex" style={{ gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <button 
              className="btn btn-primary" 
              onClick={onExploreClick} 
              style={{ padding: '12px 22px', fontSize: '0.9rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}
            >
              مشاهده و انتخاب لپ‌تاپ <ArrowLeft size={16} />
            </button>
            <button 
              className="btn btn-glass" 
              style={{ padding: '12px 20px', fontSize: '0.9rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}
              onClick={onSecondaryClick}
            >
              <Play size={14} style={{ marginLeft: '2px' }} />
              تجربه مشتریان تک‌تینک
            </button>
          </div>

          {/* Emotional Trust Metrics */}
          <div className="tt-hero-trust-bar">
            <div className="tt-trust-item">
              <div className="tt-trust-num gradient-text font-tech">۹۹.۴٪</div>
              <div className="tt-trust-label">رضایت کامل خریداران</div>
            </div>
            <div className="tt-trust-divider" />
            <div className="tt-trust-item">
              <div className="tt-trust-num font-tech" style={{ color: 'hsl(var(--accent-cyan))' }}>۷ روز</div>
              <div className="tt-trust-label">مهلت تست بی‌قید و شرط</div>
            </div>
            <div className="tt-trust-divider" />
            <div className="tt-trust-item">
              <div className="tt-trust-num font-tech" style={{ color: 'hsl(var(--accent-green))' }}>۲۴ ماه</div>
              <div className="tt-trust-label">ضمانت تعویض قطعات</div>
            </div>
          </div>

          {/* Social Proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', fontSize: '0.78rem', color: 'hsl(var(--accent-green))', fontWeight: 700 }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <span>بیش از ۱,۴۵۰ کاربر راضی در اصفهان و سراسر ایران</span>
          </div>

        </div>

        {/* Right Column: The Interactive Motion Graphic */}
        <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
          
          {/* Interactive Mood Selector Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginLeft: '4px', fontWeight: 600 }}>
              حالت تعاملی:
            </span>
            {[
              { id: 'joy', label: 'شادی و رضایت', icon: Heart },
              { id: 'flow', label: 'تمرکز و سرعت', icon: Zap },
              { id: 'relax', label: 'آرامش و اطمینان', icon: Coffee }
            ].map(m => {
              const IconComp = m.icon;
              const isActive = mood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? currentTheme.accentColor : 'rgba(0, 0, 0, 0.04)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                >
                  <IconComp size={13} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Motion Graphic Canvas Card with 3D Tilt */}
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleGraphicClick}
            className="glass-card tt-motion-stage"
            style={{
              padding: '16px',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
              transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.06)'
            }}
            title="روی انیمیشن کلیک کنید تا حس رضایت ارسال شود!"
          >
            {/* Ambient Background Glow behind Laptop */}
            <div 
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '75%',
                height: '75%',
                background: `radial-gradient(circle, ${currentTheme.screenGlow} 0%, transparent 70%)`,
                filter: 'blur(50px)',
                pointerEvents: 'none',
                transition: 'background 0.5s ease'
              }} 
            />

            {/* Tap Hint Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              pointerEvents: 'none'
            }}>
              <Sparkles size={11} color={currentTheme.accentColor} />
              <span>کلیک کنید برای واکنش تعاملی</span>
            </div>

            {/* Click Reaction Bursts (Floating upward like delight bubbles) */}
            {reactions.map(r => (
              <div 
                key={r.id} 
                className="tt-burst-reaction"
                style={{
                  position: 'absolute',
                  left: `${r.x}px`,
                  top: `${r.y}px`,
                  zIndex: 20,
                  pointerEvents: 'none'
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--glass-card-bg)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                  border: `1px solid ${currentTheme.accentColor}`,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                </div>
              </div>
            ))}

            {/* THE MOTION GRAPHIC SVG SCENE */}
            <svg 
              viewBox="0 0 540 400" 
              className="tt-motion-svg"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                {/* Gradients for Character & Laptop */}
                <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <linearGradient id="hoodieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--accent-cyan))" />
                  <stop offset="100%" stopColor="hsl(var(--accent-purple))" />
                </linearGradient>

                <linearGradient id="laptopLid" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                <linearGradient id="screenDisplay" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>

                <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
                  <stop offset="50%" stopColor="rgba(0,0,0,0.02)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
                </linearGradient>

                <linearGradient id="lightBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={currentTheme.ambientLight} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={currentTheme.ambientLight} stopOpacity="0" />
                </linearGradient>

                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. ROOM / DESK BACKGROUND */}
              {/* Modern Minimalist Desk Line */}
              <path d="M 40 330 Q 270 330 500 330" stroke="var(--border-glass)" strokeWidth="3" strokeLinecap="round" />
              <rect x="50" y="331" width="440" height="8" rx="4" fill="url(#deskGrad)" />

              {/* Ambient Screen Light Cone on Character */}
              <polygon points="310,240 180,180 180,260 260,285" fill="url(#lightBeam)" style={{ transition: 'all 0.4s ease' }} />

              {/* 2. DESK ACCESSORIES (Coffee mug with steam & desk plant) */}
              
              {/* Steaming Coffee Mug on Left */}
              <g className="tt-coffee-group" transform="translate(90, 275)">
                {/* Mug Body */}
                <rect x="0" y="20" width="30" height="34" rx="6" fill="#f8fafc" stroke="var(--border-glass)" strokeWidth="1.5" />
                {/* Mug Handle */}
                <path d="M 0 26 C -10 26, -10 44, 0 44" fill="none" stroke="var(--border-glass)" strokeWidth="2" />
                {/* Cute Heart on Mug */}
                <circle cx="15" cy="37" r="5" fill={currentTheme.accentColor} opacity="0.8" />
                {/* Animated Rising Steam Curves */}
                <path className="tt-steam-1" d="M 10 14 Q 8 6 12 0" fill="none" stroke={currentTheme.accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <path className="tt-steam-2" d="M 16 16 Q 20 8 16 2" fill="none" stroke={currentTheme.accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <path className="tt-steam-3" d="M 22 14 Q 24 6 20 0" fill="none" stroke={currentTheme.accentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              </g>

              {/* Modern Plant Succulent on Right */}
              <g transform="translate(435, 275)">
                {/* Pot */}
                <polygon points="5,30 25,30 22,54 8,54" fill="#e2e8f0" stroke="var(--border-glass)" strokeWidth="1.5" />
                {/* Leaves Gently Swaying */}
                <path className="tt-plant-leaf-1" d="M 15 30 Q 5 15 10 10 Q 18 20 15 30" fill="#10b981" />
                <path className="tt-plant-leaf-2" d="M 15 30 Q 25 15 20 8 Q 14 18 15 30" fill="#059669" />
                <path className="tt-plant-leaf-3" d="M 15 30 Q 15 8 18 4 Q 17 18 15 30" fill="#34d399" />
              </g>

              {/* 3. THE CONFIDENT & HAPPY CHARACTER */}
              <g className="tt-character-group">
                
                {/* Character Torso / Stylish Hoodie */}
                <path 
                  className="tt-torso"
                  d="M 150 330 C 145 270, 160 215, 195 200 C 220 190, 255 195, 265 240 C 270 260, 270 330, 270 330 Z" 
                  fill="url(#hoodieGradient)" 
                />

                {/* Head, Face & Hair (Bobbing with gentle breathing & confidence) */}
                <g className="tt-head-group">
                  {/* Neck */}
                  <rect x="200" y="170" width="16" height="22" rx="4" fill="#fed7aa" />
                  
                  {/* Head / Face */}
                  <ellipse cx="208" cy="150" rx="22" ry="26" fill="#fed7aa" />

                  {/* Confident, Happy Smile */}
                  <path d="M 215 156 Q 224 165 228 156" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" />

                  {/* Cheerful Cheek Blush */}
                  <circle cx="218" cy="156" r="4" fill="#f43f5e" opacity="0.35" />

                  {/* Confident Expressive Eye (Focused on screen & smiling) */}
                  <path className="tt-eye" d="M 216 144 Q 222 140 226 144" fill="none" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" />

                  {/* Stylish Modern Hair */}
                  <path d="M 188 150 C 185 125, 205 120, 226 126 C 235 130, 236 142, 230 148 C 225 138, 218 135, 200 136 Z" fill="#0f172a" />
                  {/* Hair bun / swirl */}
                  <circle cx="192" cy="132" r="10" fill="#0f172a" />

                  {/* Modern Minimalist Headphones / Audio */}
                  <path d="M 195 140 C 195 120, 222 120, 222 136" fill="none" stroke={currentTheme.accentColor} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                  <ellipse cx="196" cy="148" rx="4" ry="7" fill={currentTheme.accentColor} />
                </g>

                {/* Left Arm & Confident Hand on Keyboard */}
                <path 
                  className="tt-arm"
                  d="M 185 230 Q 220 255 260 270 Q 285 278 305 282" 
                  fill="none" 
                  stroke="url(#hoodieGradient)" 
                  strokeWidth="20" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                
                {/* Hand & Fingers actively typing with joy */}
                <g className="tt-typing-hand" transform="translate(300, 276)">
                  <ellipse cx="6" cy="4" rx="7" ry="5" fill="#fed7aa" />
                  <path d="M 6 5 Q 12 3 16 6" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 4 8 Q 10 7 14 10" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
                </g>

              </g>

              {/* 4. THE HIGH-PERFORMANCE LAPTOP */}
              <g className="tt-laptop-group" transform="translate(260, 190)">
                
                {/* Laptop Base on Desk */}
                <polygon points="0,95 130,95 145,108 -15,108" fill="url(#laptopLid)" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                
                {/* Laptop Trackpad */}
                <rect x="50" y="99" width="32" height="7" rx="1.5" fill="#cbd5e1" />

                {/* Backlit Keyboard with subtle pulsing keys */}
                <polygon points="12,96 118,96 112,102 18,102" fill="#1e293b" opacity="0.9" />
                <path d="M 22 98 L 108 98 M 20 100 L 110 100" stroke={currentTheme.accentColor} strokeWidth="1" opacity="0.6" strokeDasharray="3 2" />

                {/* Laptop Screen Bezel (Tilted open towards user) */}
                <polygon points="50,10 145,10 130,95 35,95" fill="#0f172a" rx="4" />
                
                {/* Laptop Screen Display (Glowing active desktop) */}
                <polygon points="54,14 141,14 127,91 40,91" fill="url(#screenDisplay)" />

                {/* Active Screen UI Lines / Code / Graphic Bars */}
                <g opacity="0.85">
                  {/* Top Window Bar with dots */}
                  <circle cx="58" cy="20" r="1.5" fill="#f43f5e" />
                  <circle cx="63" cy="20" r="1.5" fill="#f59e0b" />
                  <circle cx="68" cy="20" r="1.5" fill="#10b981" />
                  
                  {/* Animated Flowing Code / UI Lines */}
                  <line className="tt-code-line-1" x1="58" y1="28" x2="110" y2="28" stroke={currentTheme.accentColor} strokeWidth="2.5" strokeLinecap="round" />
                  <line className="tt-code-line-2" x1="60" y1="36" x2="95" y2="36" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  <line className="tt-code-line-3" x1="60" y1="44" x2="120" y2="44" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                  <line className="tt-code-line-4" x1="55" y1="52" x2="85" y2="52" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                  <line className="tt-code-line-5" x1="55" y1="60" x2="105" y2="60" stroke={currentTheme.accentColor} strokeWidth="2" strokeLinecap="round" />

                  {/* Mini High-Speed Benchmark Wave Graph */}
                  <path 
                    className="tt-wave-graph"
                    d="M 50 78 Q 65 68 80 74 T 110 66 T 125 72" 
                    fill="none" 
                    stroke={currentTheme.accentColor} 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                </g>

                {/* TechTink Logo Glow on Laptop Screen */}
                <circle cx="95" cy="50" r="14" fill={currentTheme.accentColor} opacity="0.12" filter="url(#glowFilter)" />
              </g>

              {/* 5. FLOATING INSPIRATION & HAPPINESS PARTICLES */}
              {/* Rocket icon floating up from laptop */}
              <g className="tt-float-item-1" transform="translate(370, 110)">
                <circle cx="16" cy="16" r="18" fill="var(--glass-card-bg)" stroke="var(--border-glass)" strokeWidth="1.5" />
                <path d="M 12 22 L 14 18 L 18 14 C 20 12, 22 13, 23 15 L 20 18 L 16 20 Z" fill={currentTheme.accentColor} />
                <path d="M 10 24 Q 13 22 12 20" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Lightning spark of instant compilation */}
              <g className="tt-float-item-2" transform="translate(240, 70)">
                <circle cx="14" cy="14" r="14" fill="var(--glass-card-bg)" stroke="var(--border-glass)" strokeWidth="1.5" />
                <path d="M 15 6 L 10 14 L 14 14 L 12 22 L 19 13 L 15 13 Z" fill="#fbbf24" />
              </g>

              {/* Heart of satisfaction & delight */}
              <g className="tt-float-item-3" transform="translate(140, 95)">
                <circle cx="14" cy="14" r="15" fill="var(--glass-card-bg)" stroke="var(--border-glass)" strokeWidth="1.5" />
                <path d="M 14 19 C 14 19 8 15 8 11.5 C 8 9.5 9.5 8 11.5 8 C 12.8 8 13.6 8.7 14 9.3 C 14.4 8.7 15.2 8 16.5 8 C 18.5 8 20 9.5 20 11.5 C 20 15 14 19 14 19 Z" fill="#f43f5e" />
              </g>

              {/* Sparkling diamond badge */}
              <g className="tt-float-item-4" transform="translate(425, 185)">
                <circle cx="14" cy="14" r="14" fill="var(--glass-card-bg)" stroke="var(--border-glass)" strokeWidth="1.5" />
                <polygon points="14,6 21,14 14,22 7,14" fill="hsl(var(--accent-cyan))" />
              </g>

            </svg>

            {/* Bottom Status Ticker */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.03)',
              border: '1px solid var(--border-glass)',
              marginTop: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentTheme.accentColor, boxShadow: `0 0 8px ${currentTheme.accentColor}`, flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTheme.statusText}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: currentTheme.accentColor, fontWeight: 700, flexShrink: 0, marginRight: '8px' }}>
                تضمین کیفیت ۱۰۰٪
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* 3. SCROLL DOWN TO ENTER SHOPPING CENTER (Lando Norris Welcome Interaction) */}
      <div 
        className="tt-scroll-enter-bar"
        onClick={() => {
          const el = document.getElementById('shopping-center') || document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginTop: '36px',
          paddingTop: '16px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span>ورود به فروشگاه و مشاهده مدل‌ها</span>
          <span className="font-tech" style={{ fontSize: '0.72rem', color: currentTheme.accentColor, opacity: 0.9 }}>[ SCROLL DOWN ]</span>
        </span>

        {/* Animated Mouse Wheel & Bouncing Arrow */}
        <div style={{
          width: '20px',
          height: '32px',
          borderRadius: '12px',
          border: '2px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '6px'
        }}>
          <div className="tt-scroll-dot" style={{ width: '4px', height: '6px', borderRadius: '4px', background: currentTheme.accentColor }} />
        </div>
        <ChevronDown size={18} className="tt-bouncing-arrow" style={{ color: currentTheme.accentColor }} />
      </div>

      {/* Motion Graphics Keyframe Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes mouseScrollDot {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(10px); opacity: 0; }
        }

        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }

        .tt-scroll-dot {
          animation: mouseScrollDot 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        .tt-bouncing-arrow {
          animation: bounceArrow 1.6s ease-in-out infinite;
        }

        .tt-hero-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: center;
          width: 100%;
        }

        .tt-hero-trust-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid var(--border-glass);
          width: fit-content;
          max-width: 100%;
        }

        .tt-trust-item {
          text-align: center;
        }

        .tt-trust-num {
          font-size: clamp(1.1rem, 2.5vw, 1.4rem);
          font-weight: 800;
          line-height: 1.2;
        }

        .tt-trust-label {
          font-size: 0.74rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .tt-trust-divider {
          width: 1px;
          height: 28px;
          background: var(--border-glass);
        }

        /* Character & Object Animations */
        @keyframes headBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(1deg); }
        }

        @keyframes handType {
          0%, 100% { transform: translate(300px, 276px) translateY(0px); }
          25% { transform: translate(300px, 276px) translateY(-2px); }
          75% { transform: translate(300px, 276px) translateY(1px); }
        }

        @keyframes steamFloat {
          0% { transform: translateY(0px) scale(0.9); opacity: 0.2; }
          50% { transform: translateY(-6px) scale(1.1); opacity: 0.7; }
          100% { transform: translateY(-12px) scale(0.8); opacity: 0; }
        }

        @keyframes plantBreeze {
          0%, 100% { transform: rotate(0deg); transform-origin: 15px 30px; }
          50% { transform: rotate(4deg); transform-origin: 15px 30px; }
        }

        @keyframes floatIcon1 {
          0%, 100% { transform: translate(370px, 110px) translateY(0px); }
          50% { transform: translate(370px, 110px) translateY(-10px); }
        }

        @keyframes floatIcon2 {
          0%, 100% { transform: translate(240px, 70px) translateY(0px) rotate(0deg); }
          50% { transform: translate(240px, 70px) translateY(-8px) rotate(-6deg); }
        }

        @keyframes floatIcon3 {
          0%, 100% { transform: translate(140px, 95px) translateY(0px) scale(1); }
          50% { transform: translate(140px, 95px) translateY(-7px) scale(1.08); }
        }

        @keyframes floatIcon4 {
          0%, 100% { transform: translate(425px, 185px) translateY(0px) rotate(0deg); }
          50% { transform: translate(425px, 185px) translateY(-9px) rotate(8deg); }
        }

        @keyframes codeStream {
          0%, 100% { stroke-dashoffset: 0; opacity: 0.9; }
          50% { stroke-dashoffset: 8; opacity: 0.6; }
        }

        @keyframes burstFly {
          0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
          20% { transform: translate(-50%, -70%) scale(1.1); opacity: 1; }
          80% { transform: translate(-50%, -120%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -150%) scale(0.9); opacity: 0; }
        }

        .tt-head-group {
          animation: headBob 3.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .tt-typing-hand {
          animation: handType 0.7s ease-in-out infinite;
        }

        .tt-steam-1 {
          animation: steamFloat 2.2s ease-out infinite;
        }
        .tt-steam-2 {
          animation: steamFloat 2.2s ease-out infinite 0.7s;
        }
        .tt-steam-3 {
          animation: steamFloat 2.2s ease-out infinite 1.4s;
        }

        .tt-plant-leaf-1 {
          animation: plantBreeze 4s ease-in-out infinite;
        }
        .tt-plant-leaf-2 {
          animation: plantBreeze 4.5s ease-in-out infinite 0.5s;
        }

        .tt-float-item-1 {
          animation: floatIcon1 3.8s ease-in-out infinite;
        }
        .tt-float-item-2 {
          animation: floatIcon2 4.2s ease-in-out infinite 0.4s;
        }
        .tt-float-item-3 {
          animation: floatIcon3 3.4s ease-in-out infinite 0.8s;
        }
        .tt-float-item-4 {
          animation: floatIcon4 4s ease-in-out infinite 1.2s;
        }

        .tt-burst-reaction {
          animation: burstFly 1.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        @media (min-width: 960px) {
          .tt-hero-container {
            grid-template-columns: 1.15fr 0.85fr;
            gap: 40px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tt-head-group, .tt-typing-hand, .tt-steam-1, .tt-steam-2, .tt-steam-3,
          .tt-float-item-1, .tt-float-item-2, .tt-float-item-3, .tt-float-item-4 {
            animation: none !important;
          }
        }
      `}} />
    </div>
  );
}
