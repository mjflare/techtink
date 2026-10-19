import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Cpu, HardDrive, Server, Database, RefreshCw, Zap,
  CheckCircle2, AlertTriangle, AlertOctagon, Clock, Terminal,
  ShieldCheck, Wifi, Radio, Layers, Trash2, Play, Pause, Search,
  ArrowUpRight, Copy, Check, Info, Box
} from 'lucide-react';

export default function ResourceMonitor({ authHeaders }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Custom Port Prober State
  const [probeInputPort, setProbeInputPort] = useState('');
  const [probingPort, setProbingPort] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  const formatPercent = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    const num = Number(val);
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
  };

  // Garbage Collection State
  const [triggeringGc, setTriggeringGc] = useState(false);

  // Copy feedback
  const [copiedSpecs, setCopiedSpecs] = useState(false);

  // Polling ref
  const timerRef = useRef(null);

  const fetchMetrics = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch('/api/admin/system/metrics', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        const err = await res.json();
        if (!isBackground) {
          setActionMessage({ type: 'error', text: err.error || 'خطا در بارگذاری مشخصات سیستم' });
        }
      }
    } catch (e) {
      if (!isBackground) {
        setActionMessage({ type: 'error', text: 'خطا در برقراری ارتباط با سرور: ' + e.message });
      }
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Real-time polling every 3 seconds when autoRefresh is active
  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      fetchMetrics(true);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh]);

  // Handle Port Probing
  const handleProbePort = async (e) => {
    e.preventDefault();
    const portNum = parseInt(probeInputPort, 10);
    if (!portNum || portNum < 1 || portNum > 65535) {
      setActionMessage({ type: 'error', text: 'لطفاً شماره پورت معتبر بین ۱ تا ۶۵۵۳۵ وارد نمایید.' });
      return;
    }

    setProbingPort(true);
    setProbeResult(null);

    try {
      const res = await fetch('/api/admin/system/probe-port', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ port: portNum })
      });

      const data = await res.json();
      if (res.ok) {
        setProbeResult(data);
      } else {
        setActionMessage({ type: 'error', text: data.error || 'خطا در ارزیابی وضعیت پورت' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'خطا در ارتباط با سرور: ' + err.message });
    } finally {
      setProbingPort(false);
    }
  };

  // Trigger Garbage Collection
  const handleTriggerGc = async () => {
    setTriggeringGc(true);
    try {
      const res = await fetch('/api/admin/system/gc', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message || 'زباله‌روب با موفقیت اجرا شد.' });
        fetchMetrics(true);
      } else {
        setActionMessage({ type: 'error', text: data.error || 'خطا در اجرای آزادسازی حافظه' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'خطا در ارتباط: ' + err.message });
    } finally {
      setTriggeringGc(false);
    }
  };

  // Copy Specs Summary
  const handleCopySpecs = () => {
    if (!metrics) return;
    const text = `=== TechTink VPS Health Report ===
Timestamp: ${new Date().toISOString()}
Hostname: ${metrics.os?.hostname}
Platform: ${metrics.os?.platform} (${metrics.os?.release}) - Arch: ${metrics.os?.arch}
Runtime: ${metrics.process?.runtime} (PID: ${metrics.process?.pid})
System Uptime: ${metrics.os?.uptimeFormatted}
CPU Usage: ${metrics.cpu?.usagePercent}% (${metrics.cpu?.cores} Cores - ${metrics.cpu?.model})
Load Average: ${metrics.cpu?.loadAvg?.join(', ')}
RAM Usage: ${metrics.memory?.usagePercent}% (${metrics.memory?.usedFormatted} / ${metrics.memory?.totalFormatted})
App RSS: ${metrics.memory?.processRssFormatted}
Disk Usage: ${metrics.disk?.usagePercent}% (${metrics.disk?.usedFormatted} / ${metrics.disk?.totalFormatted})
Database Size: ${metrics.database?.totalFormatted} (Latency: ${metrics.database?.latencyMs}ms)
Services:
${metrics.services?.map(s => ` - [${s.status.toUpperCase()}] ${s.name} (Port ${s.port || 'N/A'})`).join('\n')}
===================================`;

    navigator.clipboard.writeText(text);
    setCopiedSpecs(true);
    setTimeout(() => setCopiedSpecs(false), 2500);
  };

  // Overall Health Status Calculation
  const getOverallHealth = () => {
    if (!metrics) return { status: 'unknown', text: 'نامشخص', color: '#94a3b8' };
    const cpu = metrics.cpu?.usagePercent || 0;
    const ram = metrics.memory?.usagePercent || 0;
    const disk = metrics.disk?.usagePercent || 0;

    if (cpu > 90 || ram > 92 || disk > 95) {
      return { status: 'critical', text: 'بحرانی (بار بسیار بالا)', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)' };
    }
    if (cpu > 75 || ram > 85 || disk > 85) {
      return { status: 'warning', text: 'هشدار (مصرف بالا)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
    }
    return { status: 'healthy', text: 'وضعیت نرمال و پایدار ✓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
  };

  const overall = getOverallHealth();

  // Helper for progress bar color
  const getProgressColor = (percent) => {
    if (percent >= 85) return '#f43f5e';
    if (percent >= 70) return '#f59e0b';
    return '#10b981';
  };

  // Sparkline generator for SVG
  const renderSparkline = (dataPoints, color = 'hsl(var(--accent-cyan))') => {
    if (!dataPoints || dataPoints.length < 2) return null;
    const height = 48;
    const width = 240;
    const maxVal = 100;
    const minVal = 0;

    const points = dataPoints.map((pt, idx) => {
      const x = (idx / (dataPoints.length - 1)) * width;
      const y = height - ((pt / maxVal) * height);
      return `${x},${Math.max(4, Math.min(height - 4, y))}`;
    });

    const pathData = `M ${points.join(' L ')}`;
    const areaData = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill={`url(#grad-${color})`} />
        <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  if (loading && !metrics) {
    return (
      <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '16px' }}>
        <RefreshCw size={36} className="animate-spin" color="hsl(var(--accent-cyan))" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          در حال ارتباط با سرور و سنجش شاخص‌های سخت‌افزاری...
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          در حال بررسی وضعیت پردازنده، حافظه RAM، فضای ذخیره‌سازی و پورت‌های سرور
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. Top Header Card: Title, Health Status Pill & Live Controls */}
      <div className="glass-card" style={{ padding: '22px 26px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 18px hsla(var(--accent-cyan), 0.35)'
            }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                  داشبورد پایش سلامت و منابع سرور <span className="gradient-text">VPS Health</span>
                </h2>
                <div style={{
                  padding: '3px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: overall.color,
                  background: overall.bg,
                  border: `1px solid ${overall.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: overall.color, boxShadow: `0 0 8px ${overall.color}` }} />
                  <span>{overall.text}</span>
                </div>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                نظارت بی‌درنگ بر مصرف CPU، حافظه RAM، فضای دیسک، پایگاه داده و سلامت سرویس‌های همزمان روی سرور
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Auto-Refresh Toggle Pill */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="btn btn-glass"
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderColor: autoRefresh ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-glass)',
                background: autoRefresh ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: autoRefresh ? '#10b981' : 'var(--text-secondary)'
              }}
            >
              {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
              <span>{autoRefresh ? 'بروزرسانی زنده (۳s)' : 'بروزرسانی زنده متوقف است'}</span>
              {autoRefresh && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => fetchMetrics(false)}
              className="btn btn-glass"
              disabled={refreshing}
              style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.825rem' }}
              title="بارگذاری مجدد اطلاعات"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>تازه سازی</span>
            </button>

            {/* Run Garbage Collection */}
            <button
              type="button"
              onClick={handleTriggerGc}
              className="btn btn-glass"
              disabled={triggeringGc}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                color: 'hsl(var(--accent-cyan))',
                borderColor: 'rgba(14, 165, 233, 0.4)'
              }}
              title="آزادسازی حافظه رم مصرفی با اجرای Garbage Collector موتور Bun"
            >
              <Zap size={14} className={triggeringGc ? 'animate-spin' : ''} />
              <span>{triggeringGc ? 'در حال پاکسازی...' : 'آزادسازی رم (Bun GC)'}</span>
            </button>

            {/* Copy Specs Report */}
            <button
              type="button"
              onClick={handleCopySpecs}
              className="btn btn-glass"
              style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.825rem' }}
              title="کپی گزارش متنی وضعیت سرور"
            >
              {copiedSpecs ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedSpecs ? 'کپی شد!' : 'کپی گزارش'}</span>
            </button>

          </div>
        </div>

        {/* Action toast message */}
        {actionMessage && (
          <div style={{
            marginTop: '16px',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            color: actionMessage.type === 'success' ? '#10b981' : '#f43f5e',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 2. Primary 4 Hardware Metric Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: CPU Utilization */}
        <div className="glass-card" style={{ padding: '20px 22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Cpu size={18} color="hsl(var(--accent-cyan))" />
              <span>مصرف پردازنده (CPU)</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              {metrics?.cpu?.cores || 1} هسته
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="font-code" style={{ fontSize: '2.1rem', fontWeight: 900, color: getProgressColor(metrics?.cpu?.usagePercent || 0), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {formatPercent(metrics?.cpu?.usagePercent)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'left', direction: 'ltr' }}>
              Load: {metrics?.cpu?.loadAvg?.map(v => Number(v || 0).toFixed(2)).join(', ')}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, metrics?.cpu?.usagePercent || 0))}%`,
              height: '100%',
              borderRadius: '6px',
              background: getProgressColor(metrics?.cpu?.usagePercent || 0),
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
              {metrics?.cpu?.model || 'پردازنده سرور'}
            </span>
            <span>میانگین ۱ دقیقه: {Number(metrics?.cpu?.loadAvg?.[0] || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: RAM Memory Utilization */}
        <div className="glass-card" style={{ padding: '20px 22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Layers size={18} color="hsl(var(--accent-purple))" />
              <span>حافظه اصلی (RAM)</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              کل: {metrics?.memory?.totalFormatted}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="font-code" style={{ fontSize: '2.1rem', fontWeight: 900, color: getProgressColor(metrics?.memory?.usagePercent || 0), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {formatPercent(metrics?.memory?.usagePercent)}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', direction: 'ltr' }}>
              {metrics?.memory?.usedFormatted} / {metrics?.memory?.totalFormatted}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, metrics?.memory?.usagePercent || 0))}%`,
              height: '100%',
              borderRadius: '6px',
              background: getProgressColor(metrics?.memory?.usagePercent || 0),
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>فضای آزاد: {metrics?.memory?.freeFormatted}</span>
            <span>مصرف فرآیند برنامه: {metrics?.memory?.processRssFormatted}</span>
          </div>
        </div>

        {/* Card 3: Disk Storage */}
        <div className="glass-card" style={{ padding: '20px 22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <HardDrive size={18} color="#10b981" />
              <span>فضای ذخیره‌سازی دیسک (/)</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              کل: {metrics?.disk?.totalFormatted}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="font-code" style={{ fontSize: '2.1rem', fontWeight: 900, color: getProgressColor(metrics?.disk?.usagePercent || 0), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {formatPercent(metrics?.disk?.usagePercent)}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', direction: 'ltr' }}>
              {metrics?.disk?.usedFormatted} / {metrics?.disk?.totalFormatted}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, metrics?.disk?.usagePercent || 0)}%`,
              height: '100%',
              borderRadius: '6px',
              background: getProgressColor(metrics?.disk?.usagePercent || 0),
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>فضای خالی دیسک: {metrics?.disk?.freeFormatted}</span>
            <span>پارتیشن اصلی روت (Root)</span>
          </div>
        </div>

        {/* Card 4: Database & System Uptime */}
        <div className="glass-card" style={{ padding: '20px 22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Database size={18} color="hsl(var(--accent-cyan))" />
              <span>دیتابیس SQLite و پایداری</span>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              background: metrics?.database?.isOperational ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
              color: metrics?.database?.isOperational ? '#10b981' : '#f43f5e'
            }}>
              {metrics?.database?.isOperational ? 'عملیاتی' : 'خطا'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="font-code gradient-text" style={{ fontSize: '1.85rem', fontWeight: 900 }}>
              {metrics?.database?.totalFormatted}
            </div>
            <div style={{ fontSize: '0.775rem', color: '#10b981', fontWeight: 700 }}>
              تأخیر: {metrics?.database?.latencyMs}ms
            </div>
          </div>

          {/* Quick info row */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border-glass)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.775rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>آپ‌تایم سیستم:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{metrics?.os?.uptimeFormatted}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>حجم لاگ WAL: {metrics?.database?.walFormatted || '0 B'}</span>
            <span>آپ‌تایم برنامه: {metrics?.process?.uptimeFormatted}</span>
          </div>
        </div>

      </div>

      {/* 3. Live Resource History Graphs (Sparklines / Trends) */}
      <div className="glass-card" style={{ padding: '22px 26px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="hsl(var(--accent-cyan))" />
              <span>نمودار نوسانات مصرف زنده (Real-Time Trend - آخرین ۹۰ ثانیه)</span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              رصد تغییرات بار پردازشی و اشغال حافظه در هر ۳ ثانیه به صورت خودکار
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: 'hsl(var(--accent-cyan))' }} />
              <span style={{ color: 'var(--text-secondary)' }}>پردازنده CPU ({formatPercent(metrics?.cpu?.usagePercent)}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: 'hsl(var(--accent-purple))' }} />
              <span style={{ color: 'var(--text-secondary)' }}>حافظه RAM ({formatPercent(metrics?.memory?.usagePercent)}%)</span>
            </div>
          </div>
        </div>

        {/* 2 Side-by-Side Sparklines */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* CPU Chart */}
          <div style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'hsl(var(--accent-cyan))', fontWeight: 700 }}>نوسانات بار CPU</span>
              <span className="font-code" style={{ color: 'var(--text-muted)' }}>Peak: {Math.max(...(metrics?.history?.map(h => h.cpu) || [0]))}%</span>
            </div>
            <div style={{ height: '52px', position: 'relative' }}>
              {renderSparkline(metrics?.history?.map(h => h.cpu) || [0, 0], 'hsl(var(--accent-cyan))')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>۹۰ ثانیه قبل</span>
              <span>هم‌اکنون</span>
            </div>
          </div>

          {/* RAM Chart */}
          <div style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'hsl(var(--accent-purple))', fontWeight: 700 }}>نوسانات حافظه RAM</span>
              <span className="font-code" style={{ color: 'var(--text-muted)' }}>Peak: {Math.max(...(metrics?.history?.map(h => h.ram) || [0]))}%</span>
            </div>
            <div style={{ height: '52px', position: 'relative' }}>
              {renderSparkline(metrics?.history?.map(h => h.ram) || [0, 0], 'hsl(var(--accent-purple))')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>۹۰ ثانیه قبل</span>
              <span>هم‌اکنون</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Multi-Services Health & Ports Grid */}
      <div className="glass-card" style={{ padding: '22px 26px', borderRadius: '16px' }}>
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="hsl(var(--accent-cyan))" />
            <span>سلامت سرویس‌های مستقر روی این سرور (VPS Multi-Services Status)</span>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            بررسی فعال بودن پورت‌ها و سرویس‌های مختلفی که همزمان روی این سرور در حال اجرا هستند
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px' }}>
          {metrics?.services?.map(service => {
            const isOnline = service.status === 'online';
            const isWaiting = service.status === 'waiting';

            return (
              <div
                key={service.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : isWaiting ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '14px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isOnline ? 'rgba(16, 185, 129, 0.15)' : isWaiting ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: isOnline ? '#10b981' : isWaiting ? '#f59e0b' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {service.category === 'Database' ? <Database size={18} /> :
                       service.category === 'Mail Service' ? <Radio size={18} /> :
                       <Server size={18} />}
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {service.name}
                      </h4>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        دسته‌بندی: {service.category} {service.port ? `| پورت ${service.port}` : ''}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: isOnline ? 'rgba(16, 185, 129, 0.18)' : isWaiting ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                    color: isOnline ? '#10b981' : isWaiting ? '#f59e0b' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isOnline ? '#10b981' : isWaiting ? '#f59e0b' : '#64748b'
                    }} />
                    <span>{isOnline ? 'فعال و آنلاین' : isWaiting ? 'در انتظار' : 'غیرفعال / فایروال'}</span>
                  </span>
                </div>

                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {service.desc}
                </div>

                {service.latencyMs !== null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span>زمان پاسخ محلی (Ping):</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{service.latencyMs} میلی‌ثانیه</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Custom Port Prober & Diagnostics Tool */}
      <div className="glass-card" style={{ padding: '22px 26px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} color="hsl(var(--accent-purple))" />
              <span>ارزیابی و تست پورت‌های دلخواه (Custom Port Health Probe)</span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              اگر سرویس‌های دیگری (مانند دیتابیس‌های جانبی، ردیس، کانتینرهای داکر یا میکروسرویس) روی سرور دارید، شماره پورت آن را وارد کنید تا وضعیت پاسخگویی آن سنجیده شود.
            </p>
          </div>
        </div>

        <form onSubmit={handleProbePort} style={{ display: 'flex', gap: '10px', maxWidth: '520px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <input
              type="number"
              placeholder="مثال: 8080 یا 5432 یا 6379..."
              value={probeInputPort}
              onChange={(e) => setProbeInputPort(e.target.value)}
              min="1"
              max="65535"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={probingPort || !probeInputPort}
            className="btn btn-primary"
            style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700 }}
          >
            {probingPort ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
            <span>{probingPort ? 'در حال تست...' : 'بررسی پورت'}</span>
          </button>
        </form>

        {/* Probe Result Box */}
        {probeResult && (
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: probeResult.open ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${probeResult.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {probeResult.open ? (
                <CheckCircle2 size={24} color="#10b981" />
              ) : (
                <AlertOctagon size={24} color="#f43f5e" />
              )}
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: probeResult.open ? '#10b981' : '#f43f5e' }}>
                  {probeResult.open
                    ? `پورت ${probeResult.port} باز، فعال و در حال شنود است ✓`
                    : `پورت ${probeResult.port} پاسخ نداد یا بسته‌ است`}
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  {probeResult.open
                    ? `اتصال محلی TCP موفق بود. زمان پاسخگویی: ${probeResult.latencyMs} میلی‌ثانیه.`
                    : `علت: ${probeResult.error === 'ECONNREFUSED' ? 'هیچ سرویسی روی این پورت شنود نمی‌کند (Connection Refused)' : probeResult.error}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setProbeResult(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 6. System Specifications & Process Environment Details */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Box A: OS & VPS Platform */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'hsl(var(--accent-cyan))' }}>
            <Terminal size={18} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              مشخصات سیستم‌عامل سرور ابری (Host OS)
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-muted)' }}>نام سرور (Hostname):</span>
              <span className="font-code" style={{ color: 'var(--text-primary)' }}>{metrics?.os?.hostname}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-muted)' }}>سیستم‌عامل و پلتفرم:</span>
              <span style={{ color: 'var(--text-primary)' }}>{metrics?.os?.platform} ({metrics?.os?.arch})</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-muted)' }}>نسخه هسته کرنل (Kernel):</span>
              <span className="font-code" style={{ color: 'var(--text-secondary)' }}>{metrics?.os?.release}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-muted)' }}>آپ‌تایم سیستم (Uptime):</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{metrics?.os?.uptimeFormatted}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>تعداد هسته‌های CPU:</span>
              <span style={{ color: 'var(--text-primary)' }}>{metrics?.cpu?.cores} Cores</span>
            </div>
          </div>
        </div>

        {/* Box B: Runtime & Process Info */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'hsl(var(--accent-purple))' }}>
            <Box size={18} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              مشخصات محیط اجرای برنامه (TechTink Runtime)
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-muted)' }}>موتور اجرایی سرور:</span>
              <span style={{ color: 'hsl(var(--accent-cyan))', fontWeight: 800 }}>{metrics?.process?.runtime}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-muted)' }}>شناسه پردازش (PID):</span>
              <span className="font-code" style={{ color: 'var(--text-primary)' }}>{metrics?.process?.pid}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-muted)' }}>حافظه مقیم در رم (RSS):</span>
              <span className="font-code" style={{ color: 'var(--text-primary)' }}>{metrics?.memory?.processRssFormatted}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-muted)' }}>حافظه هیپ فعال (Heap Used):</span>
              <span className="font-code" style={{ color: 'var(--text-secondary)' }}>{metrics?.memory?.processHeapFormatted}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>محیط برنامه (Environment):</span>
              <span style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{metrics?.process?.nodeEnv}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
