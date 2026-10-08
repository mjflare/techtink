import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, X, Mail } from 'lucide-react';

export default function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [activeArticle, setActiveArticle] = useState(null);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetch('/api/blog').then(res => res.json()).then(setPosts);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (subscribeEmail) {
      setSubscribed(true);
      setSubscribeEmail('');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '16px' }}>وبلاگ <span className="gradient-text">تکنولوژی</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>بینش‌ها، راهنماها، و بررسی‌های عمیق مهندسی از تیم تک‌تینک.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '40px' }} id="blog-layout">
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            #blog-layout { grid-template-columns: 2fr 1fr !important; }
          }
        `}} />
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {posts.map((post, idx) => (
            <div key={post.id} className="glass-card animate-fade-in" style={{ overflow: 'hidden', cursor: 'pointer', animationDelay: (idx * 0.1) + 's' }} onClick={() => setActiveArticle(post)}>
              <div style={{ position: 'relative', height: '300px' }}>
                <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                  <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: 'white' }}>{post.category}</span>
                </div>
              </div>
              <div style={{ padding: '32px' }}>
                <div className="flex font-code" style={{ gap: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px', direction: 'rtl' }}>
                  <div className="flex" style={{ alignItems: 'center', gap: '6px' }}><Calendar size={16} /> <span style={{ fontFamily: 'var(--font-sans)' }}>{post.date}</span></div>
                  <div className="flex" style={{ alignItems: 'center', gap: '6px' }}><Clock size={16} /> <span style={{ fontFamily: 'var(--font-sans)' }}>{post.readTime}</span></div>
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>{post.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '24px', lineHeight: '1.6' }}>{post.excerpt}</p>
                
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                    <img src={post.authorAvatar} alt={post.author} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{post.author}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{post.authorRole}</div>
                    </div>
                  </div>
                  <button className="btn btn-glass" style={{ padding: '8px 16px' }}>ادامه مطلب <ChevronLeft size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div>
          <div className="glass-panel" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={24} color="hsl(var(--accent-purple))" />
              عضویت در خبرنامه
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>
              جدیدترین اخبار تکنولوژی و کدهای تخفیف اختصاصی را در ایمیل خود دریافت کنید.
            </p>
            
            {subscribed ? (
              <div style={{ padding: '16px', background: 'hsla(var(--accent-green), 0.1)', borderRadius: '8px', color: 'hsl(var(--accent-green))', textAlign: 'center', fontWeight: 'bold' }}>
                از عضویت شما سپاسگزاریم!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex" style={{ flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="email" placeholder="آدرس ایمیل" required 
                  value={subscribeEmail} onChange={e => setSubscribeEmail(e.target.value)} 
                />
                <button type="submit" className="btn btn-primary">ثبت‌نام</button>
              </form>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '32px 0' }} />

            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>دسته‌بندی‌ها</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)' }}>
              {['راهنمای خرید', 'اخبار سخت‌افزار', 'بررسی‌ها', 'بنچمارک‌ها', 'نگهداری و تعمیرات'].map(cat => (
                <li key={cat} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='hsl(var(--accent-cyan))'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>
                  {cat}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <dialog open className="glass-panel" style={{ 
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', zIndex: 1100,
          display: 'flex', flexDirection: 'column', padding: 0, direction: 'rtl'
        }}>
          <div style={{ position: 'relative', height: '400px' }}>
            <img src={activeArticle.image} alt={activeArticle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, hsl(var(--bg-panel)))' }}></div>
            <button className="btn btn-glass" style={{ position: 'absolute', top: '24px', left: '24px', padding: '12px', borderRadius: '50%', zIndex: 10, background: 'rgba(255,255,255,0.5)', color: 'black' }} onClick={() => setActiveArticle(null)}>
              <X size={24} />
            </button>
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px' }}>
              <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: 'white', marginBottom: '16px' }}>{activeArticle.category}</span>
              <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 4px 20px rgba(255,255,255,0.8)' }}>{activeArticle.title}</h1>
            </div>
          </div>

          <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="flex" style={{ gap: '24px', alignItems: 'center', marginBottom: '40px', paddingBottom: '40px', borderBottom: '1px solid var(--border-glass)' }}>
              <img src={activeArticle.authorAvatar} alt={activeArticle.author} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{activeArticle.author}</div>
                <div className="font-code" style={{ color: 'var(--text-secondary)' }}><span style={{ fontFamily: 'var(--font-sans)' }}>{activeArticle.authorRole}</span> • <span style={{ fontFamily: 'var(--font-sans)' }}>{activeArticle.date}</span> • <span style={{ fontFamily: 'var(--font-sans)' }}>{activeArticle.readTime}</span></div>
              </div>
            </div>

            <div className="article-content" dangerouslySetInnerHTML={{
              __html: activeArticle.content
                .replace(/^# (.*$)/gim, '<h1 style="font-size: 2.5rem; margin: 40px 0 24px; color: var(--text-primary);">$1</h1>')
                .replace(/^## (.*$)/gim, '<h2 style="font-size: 2rem; margin: 32px 0 16px; color: hsl(var(--accent-cyan));">$1</h2>')
                .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.5rem; margin: 24px 0 16px; color: var(--text-primary);">$1</h3>')
                .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: var(--text-primary);">$1</strong>')
                .replace(/\*(.*?)\*/gim, '<em style="color: var(--text-secondary);">$1</em>')
                .replace(/> (.*$)/gim, '<blockquote style="border-right: 4px solid hsl(var(--accent-purple)); padding-right: 16px; margin: 24px 0; color: var(--text-secondary); font-style: italic; background: rgba(0,0,0,0.03); padding: 16px;">$1</blockquote>')
                .replace(/\n- (.*)/gim, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/gims, '<ul style="padding-right: 24px; margin-bottom: 24px; color: var(--text-secondary); line-height: 1.8;">$1</ul>')
                .replace(/\n\n/g, '<p style="margin-bottom: 24px; color: var(--text-secondary); line-height: 1.8; font-size: 1.125rem;"></p>')
            }} />
          </div>
        </dialog>
      )}
    </div>
  );
}
