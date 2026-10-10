import React, { useState, useEffect } from 'react';
import { 
  Eye, Users, TrendingUp, Globe, Smartphone, Laptop, Tablet, 
  Compass, RefreshCw, Clock, ArrowUpRight, ShieldCheck, 
  Calendar, Check, AlertCircle, Trash2, ExternalLink, Sparkles
} from 'lucide-react';

export default function ViewerAnalytics({ authToken, onGoToSeoSettings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات آمار');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message || 'عدم دسترسی یا خطای شبکه');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds for live pulse
    const timer = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(timer);
  }, [authToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleCleanLogs = async () => {
    if (!window.confirm('آیا مایل به حذف داده‌های قدیمی‌تر از ۳۰ روز برای بهینه‌سازی حجم دیتابیس هستید؟')) {
      return;
    }
    setCleaning(true);
    setCleanMessage(null);
    try {
      const res = await fetch('/api/admin/analytics/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const json = await res.json();
      setCleanMessage(json.message || 'پاکسازی انجام شد.');
      fetchAnalytics();
    } catch {
      setCleanMessage('خطا در پاکسازی داده‌ها.');
    } finally {
      setCleaning(false);
      setTimeout(() => setCleanMessage(null), 4000);
    }
  };

  if (loading && !data) {
    return (
      <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin" color="hsl(var(--accent-cyan))" style={{ margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--text-secondary)' }}>در حال گردآوری و تحلیل داده‌های بازدیدکنندگان...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderColor: 'hsla(var(--accent-red), 0.3)' }}>
        <AlertCircle size={40} color="hsl(var(--accent-red))" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ marginBottom: '8px' }}>خطا در بارگذاری آمار</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error}</p>
        <button className="btn btn-primary" onClick={handleRefresh}>تلاش مجدد</button>
      </div>
    );
  }

  const { summary = {}, chartData = [], topPages = [], topReferrers = [], devices = [], browsers = [], recentVisits = [] } = data || {};

  // Find max value in chart data for relative heights
  const maxViews = Math.max(...chartData.map(d => d.views || 0), 10);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Top Banner & Live Pulse */}
      <div className="glass-card" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #06b6d4, #10b981, #f59e0b)'
        }} />

        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Eye size={24} color="hsl(var(--accent-cyan))" />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>آنالیتیکس و آمار بازدیدکنندگان فروشگاه</h2>
              
              {/* Live Active Pulse Badge */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '0.8125rem',
                fontWeight: 'bold',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.35)'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981'
                }} className="pulse" />
                {summary.liveActive || 1} کاربر آنلاین در ۱۵ دقیقه اخیر
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              تحلیل زنده ترافیک ورودی از موتور جستجوی گوگل، ترب، شبکه‌های اجتماعی و رفتار بازدیدکنندگان بدون نیاز به ابزارهای سنگین شخص ثالث.
            </p>
          </div>

          <div className="flex" style={{ gap: '10px' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-glass"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
              title="به‌روزرسانی داده‌ها"
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'در حال دریافت...' : 'به‌روزرسانی'}
            </button>

            {onGoToSeoSettings && (
              <button
                onClick={onGoToSeoSettings}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
              >
                <Compass size={16} />
                تنظیمات گوگل و سئو
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Key Performance Metric Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Total Views */}
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>کل بازدیدهای ثبت‌شده</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--accent-cyan))' }}>
              <Eye size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            {summary.totalPageviews?.toLocaleString('fa-IR') || '۰'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            کل صفحات مشاهده‌شده در سایت
          </div>
        </div>

        {/* Card 2: Today Visitors */}
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>بازدیدکنندگان یکتا امروز</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#10b981' }}>
            {summary.uniqueVisitorsToday?.toLocaleString('fa-IR') || '۰'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {summary.pageviewsToday || 0} بازدید کل ثبت‌شده امروز
          </div>
        </div>

        {/* Card 3: 7 Days Performance */}
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>بازدیدهای ۷ روز اخیر</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--accent-purple))' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 'bold' }}>
            {summary.pageviews7d?.toLocaleString('fa-IR') || '۰'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            شامل {summary.uniqueVisitors7d || 0} نفر مخاطب متمایز
          </div>
        </div>

        {/* Card 4: Google & Search Engine Referrals */}
        <div className="glass-panel" style={{ padding: '22px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>ورودی‌های گوگل (Search)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Globe size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {summary.googleReferrals?.toLocaleString('fa-IR') || '۰'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            ترافیک هدایت‌شده از نتایج ارگانیک گوگل
          </div>
        </div>

      </div>

      {/* 14-Day Visual SVG Bar Chart */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 4px 0' }}>روند ترافیک ۱۴ روز گذشته</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>مقایسه روزانه تعداد کل بازدیدها با بازدیدکنندگان یکتا</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'hsl(var(--accent-cyan))' }} />
              <span>کل بازدیدها (Pageviews)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
              <span>بازدیدکنندگان یکتا (Visitors)</span>
            </div>
          </div>
        </div>

        {/* SVG Bars Container */}
        <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '24px', borderBottom: '1px solid var(--border-glass)' }}>
          {chartData.length === 0 ? (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)', alignSelf: 'center' }}>
              داده‌ای برای نمایش نمودار وجود ندارد.
            </div>
          ) : (
            chartData.map((d, idx) => {
              const viewsHeight = Math.max((d.views / maxViews) * 160, 6);
              const visitorsHeight = Math.max((d.visitors / maxViews) * 160, 4);
              const dateLabel = d.date ? d.date.slice(5) : '';

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                  
                  {/* Pair of bars */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '80%', maxWidth: '24px' }}>
                    {/* Pageviews bar */}
                    <div 
                      style={{
                        flex: 1,
                        height: `${viewsHeight}px`,
                        background: 'linear-gradient(180deg, hsl(var(--accent-cyan)), rgba(6, 182, 212, 0.4))',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease'
                      }}
                      title={`${d.date}: ${d.views} بازدید کل`}
                    />
                    {/* Unique visitors bar */}
                    <div 
                      style={{
                        flex: 1,
                        height: `${visitorsHeight}px`,
                        background: 'linear-gradient(180deg, #10b981, rgba(16, 185, 129, 0.4))',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease'
                      }}
                      title={`${d.date}: ${d.visitors} کاربر یکتا`}
                    />
                  </div>

                  {/* Date label */}
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', marginTop: '8px', whiteSpace: 'nowrap' }} className="font-code">
                    {dateLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2-Column Grid: Top Visited Pages & Top Referrers */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>

        {/* Column 1: Top Pages */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Compass size={20} color="hsl(var(--accent-cyan))" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>پربازدیدترین صفحات و لپ‌تاپ‌ها</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topPages.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>هنوز صفحه‌ای ثبت نشده است.</div>
            ) : (
              topPages.map((p, idx) => {
                const totalFirst = topPages[0]?.count || 1;
                const percent = Math.round((p.count / totalFirst) * 100);

                return (
                  <div key={idx} style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          background: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          color: idx === 0 ? '#f59e0b' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {(idx + 1).toLocaleString('fa-IR')}
                        </span>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.title || p.path}
                        </div>
                      </div>

                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'hsl(var(--accent-cyan))' }}>
                        {p.count.toLocaleString('fa-IR')} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>بازدید</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: 'hsl(var(--accent-cyan))' }} />
                      </div>
                      <span className="font-code" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', direction: 'ltr' }}>
                        {p.path}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Top Referrers */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Globe size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>منابع ورودی ترافیک و ارجاع‌دهنده‌ها</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topReferrers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>هنوز منبع ورودی ثبت نشده است.</div>
            ) : (
              topReferrers.map((r, idx) => {
                const totalFirst = topReferrers[0]?.count || 1;
                const percent = Math.round((r.count / totalFirst) * 100);
                const isGoogle = r.domain.toLowerCase().includes('google');
                const isTorob = r.domain.toLowerCase().includes('torob') || r.domain.includes('ترب');

                return (
                  <div key={idx} style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: isGoogle ? 'rgba(245, 158, 11, 0.15)' : isTorob ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          color: isGoogle ? '#f59e0b' : isTorob ? '#ef4444' : 'var(--text-primary)'
                        }}>
                          {r.domain}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981' }}>
                        {r.count.toLocaleString('fa-IR')} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ورودی</span>
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: isGoogle ? '#f59e0b' : isTorob ? '#ef4444' : '#10b981'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Devices & Browsers 2-Card Row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Devices */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Laptop size={18} color="hsl(var(--accent-cyan))" />
            دستگاه‌های بازدیدکنندگان (Devices)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {devices.map((d, i) => {
              const label = d.type === 'desktop' ? 'دسکتاپ و لپ‌تاپ' : d.type === 'mobile' ? 'گوشی هوشمند' : 'تبلت';
              const IconComp = d.type === 'desktop' ? Laptop : d.type === 'mobile' ? Smartphone : Tablet;

              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconComp size={15} color="var(--text-secondary)" />
                      {label}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>{d.percent || 0}٪ ({d.count})</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${d.percent || 0}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Browsers */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="#10b981" />
            مرورگرها (Browsers)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {browsers.map((b, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                  <span>{b.browser}</span>
                  <span style={{ fontWeight: 'bold' }}>{b.percent || 0}٪ ({b.count})</span>
                </div>
                <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${b.percent || 0}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live Activity Feed Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="hsl(var(--accent-cyan))" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>گزارش لحظه‌ای آخرین بازدیدها (Live Activity Stream)</h3>
          </div>

          {cleanMessage && (
            <span style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 'bold' }}>
              {cleanMessage}
            </span>
          )}

          <button
            onClick={handleCleanLogs}
            disabled={cleaning}
            className="btn btn-glass"
            style={{ fontSize: '0.75rem', padding: '6px 12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            title="حذف داده‌های قدیمی‌تر از ۳۰ روز برای سبک نگه داشتن دیتابیس"
          >
            <Trash2 size={13} />
            {cleaning ? 'در حال پاکسازی...' : 'پاکسازی لاگ‌های بیش از ۳۰ روز'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '10px' }}>زمان</th>
                <th style={{ padding: '10px' }}>صفحه / محصول</th>
                <th style={{ padding: '10px' }}>منبع ارجاع (Referrer)</th>
                <th style={{ padding: '10px' }}>دستگاه</th>
                <th style={{ padding: '10px' }}>مرورگر و سیستم‌عامل</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    هنوز بازدیدی در سیستم ثبت نشده است.
                  </td>
                </tr>
              ) : (
                recentVisits.map((v, i) => (
                  <tr key={v.id || i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent' }}>
                    <td style={{ padding: '10px', whiteSpace: 'nowrap' }} className="font-code">
                      {v.createdAt ? v.createdAt.slice(11, 19) : '-'}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginRight: '6px' }}>
                        {v.createdAt ? v.createdAt.slice(5, 10) : ''}
                      </span>
                    </td>
                    <td style={{ padding: '10px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '600' }}>{v.title || v.path}</span>
                      <span className="font-code" style={{ display: 'block', fontSize: '0.72rem', color: 'hsl(var(--accent-cyan))', direction: 'ltr', textAlign: 'right' }}>
                        {v.path}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        background: (v.referrer || '').includes('Google') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: (v.referrer || '').includes('Google') ? '#f59e0b' : 'var(--text-primary)'
                      }}>
                        {v.referrer || 'مستقیم'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontSize: '0.78rem' }}>
                        {v.device === 'desktop' ? 'دسکتاپ' : v.device === 'mobile' ? 'موبایل' : 'تبلت'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                      {v.browser} / {v.os}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
