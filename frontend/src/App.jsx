import { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Plus, Trash2, EyeOff, Eye, X, Upload, ImageOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { login, fetchItems, fetchCategories, uploadItems, setStock, deleteItem, imageUrl } from './api';

const ink = '#1c2b2e';
const bg = '#f6f2ea';
const gold = '#a9824f';
const line = '#ddd2bc';
const maroon = '#6b1f2a';
const cream = '#fffdf8';

const SIZES = [
  { code: 'M', label: 'M', measure: '38' },
  { code: 'L', label: 'L', measure: '40' },
  { code: 'XL', label: 'XL', measure: '42' },
  { code: 'XXL', label: 'XXL', measure: '44' },
  { code: 'XXXL', label: 'XXXL', measure: '46' },
  { code: '4XL', label: '4XL', measure: '48' },
  { code: '5XL', label: '5XL', measure: '50' },
];

const DEFAULT_CATEGORIES = ['Cotton', 'Coat Set', 'Muslin'];

const serif = 'Georgia, "Times New Roman", serif';
const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function App() {
  const [view, setView] = useState('home');
  const [token, setToken] = useState(
    () => localStorage.getItem('neerali_owner_token') || sessionStorage.getItem('neerali_owner_token') || ''
  );
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('M');
  const [activeCategory, setActiveCategory] = useState('Cotton');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSize, setUploadSize] = useState('M');
  const [uploadCategory, setUploadCategory] = useState('Cotton');
  const [uploadIsLehenga, setUploadIsLehenga] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState('');

  const isOwner = Boolean(token);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const loadCategories = useCallback(async () => {
    if (activeTab === 'LEHENGA') return;
    try {
      const cats = await fetchCategories(activeTab);
      setCategories(cats);
      if (!cats.includes(activeCategory)) setActiveCategory(cats[0]);
    } catch (e) {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, [activeTab]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadItems = useCallback(async () => {
    setLoaded(false);
    try {
      const params =
        activeTab === 'LEHENGA' ? { category: 'Lehenga' } : { size: activeTab, category: activeCategory };
      const data = await fetchItems(token, params);
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
    setLoaded(true);
  }, [token, activeTab, activeCategory]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleLogin = async () => {
    try {
      const t = await login(pwInput, rememberMe);
      if (rememberMe) {
        localStorage.setItem('neerali_owner_token', t);
      } else {
        sessionStorage.setItem('neerali_owner_token', t);
      }
      setToken(t);
      setShowLogin(false);
      setPwInput('');
      setRememberMe(false);
      setLoginError('');
    } catch (e) {
      setLoginError('That password is not correct.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('neerali_owner_token');
    sessionStorage.removeItem('neerali_owner_token');
    setToken('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadFiles(files);
    setUploadPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const submitUpload = async () => {
    if (!uploadFiles.length) {
      setError('Choose at least one photo before adding it to the collection.');
      return;
    }
    const category = uploadIsLehenga ? 'Lehenga' : uploadCategory.trim();
    if (!category) {
      setError('Give this category a name.');
      return;
    }
    setSaving(true);
    setUploadProgress({ done: 0, total: uploadFiles.length });
    try {
      await uploadItems(
        token,
        { size: uploadIsLehenga ? null : uploadSize, category, files: uploadFiles },
        (done, total) => setUploadProgress({ done, total })
      );
      setShowUpload(false);
      setUploadFiles([]);
      setUploadPreviews([]);
      await loadCategories();
      await loadItems();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
    setUploadProgress(null);
  };

  const toggleStock = async (id, current) => {
    try {
      await setStock(token, id, !current);
      await loadItems();
    } catch (e) {
      setError(e.message);
    }
  };

  const removeItem = async (id) => {
    try {
      await deleteItem(token, id);
      await loadItems();
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  if (lightboxItem) {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes');
  } else {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }
  return () => {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  };
}, [lightboxItem]);

  const tabButtonStyle = (selected, bgColor, textColor) => ({
    padding: '10px 18px',
    fontSize: '14px',
    fontFamily: sans,
    border: '1px solid ' + (selected ? bgColor : line),
    backgroundColor: selected ? bgColor : 'transparent',
    color: selected ? textColor : ink,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  if (view === 'home') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bg, color: ink, fontFamily: sans, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 8vw, 56px)', margin: 0 }}>Neerali Creations</h1>
          <div className="flex items-center gap-3" style={{ marginTop: '18px' }}>
            <div style={{ width: '36px', height: '1px', backgroundColor: gold }} />
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '16px', color: gold, margin: 0 }}>
              handpicked, one piece at a time
            </p>
            <div style={{ width: '36px', height: '1px', backgroundColor: gold }} />
          </div>
          <p style={{ maxWidth: '460px', fontSize: '14px', color: '#5c5348', lineHeight: 1.7, marginTop: '24px' }}>
            Cotton, coat sets, muslin and lehengas — sized M through 5XL. Every
            piece here is real stock, updated as it moves.
          </p>
          <button
            onClick={() => setView('gallery')}
            style={{
              marginTop: '32px',
              backgroundColor: ink,
              color: cream,
              border: 'none',
              padding: '14px 30px',
              fontSize: '14px',
              letterSpacing: '0.03em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            View the collection <ArrowRight size={16} />
          </button>
        </div>
        <button
          onClick={() => setShowLogin(true)}
          title="Owner login"
          style={{ position: 'fixed', top: '20px', right: '20px', background: 'none', border: 'none', color: ink, cursor: 'pointer', padding: '6px' }}
        >
          <Lock size={16} />
        </button>
        {showLogin && (
          <LoginModal
            pwInput={pwInput}
            setPwInput={setPwInput}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            loginError={loginError}
            onClose={() => {
              setShowLogin(false);
              setLoginError('');
              setPwInput('');
            }}
            onSubmit={handleLogin}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: ink, fontFamily: sans }}>
      <header style={{ borderBottom: '1px solid ' + line, position: 'sticky', top: 0, zIndex: 20, backgroundColor: bg }}>
        <div className="container flex items-center justify-between flex-wrap gap-3" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
          <button
            onClick={() => setView('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, color: ink }}
          >
            <ArrowLeft size={16} />
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontFamily: serif, fontSize: '22px', margin: 0 }}>Neerali Creations</h1>
            </div>
          </button>
          {isOwner ? (
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '12px', color: gold, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Unlock size={13} /> Owner mode
              </span>
              <button
                onClick={handleLogout}
                style={{ fontSize: '12px', border: '1px solid ' + line, padding: '6px 12px', backgroundColor: 'transparent', color: ink, cursor: 'pointer' }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              title="Owner login"
              style={{ background: 'none', border: 'none', color: ink, cursor: 'pointer', padding: '4px' }}
            >
              <Lock size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="container" style={{ paddingTop: '28px' }}>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s.code} onClick={() => setActiveTab(s.code)} style={tabButtonStyle(activeTab === s.code, ink, cream)}>
              {s.label} <span style={{ opacity: 0.65 }}>({s.measure})</span>
            </button>
          ))}
          <button onClick={() => setActiveTab('LEHENGA')} style={tabButtonStyle(activeTab === 'LEHENGA', maroon, cream)}>
            Lehenga — all sizes
          </button>
        </div>

        {activeTab !== 'LEHENGA' && (
          <div className="flex flex-wrap gap-2" style={{ marginTop: '18px' }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  fontFamily: serif,
                  fontStyle: 'italic',
                  border: 'none',
                  borderBottom: activeCategory === c ? '2px solid ' + gold : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeCategory === c ? ink : '#7a7168',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div style={{ height: '1px', backgroundColor: line, marginTop: '16px' }} />
      </div>

      <main className="container" style={{ paddingTop: '36px', paddingBottom: '40px' }}>
        {error && (
          <div
            style={{
              marginBottom: '20px',
              fontSize: '13px',
              color: maroon,
              backgroundColor: cream,
              border: '1px solid ' + maroon,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: maroon, cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {!loaded ? (
          <p style={{ fontSize: '14px', color: '#7a7168' }}>Loading the collection…</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0', color: '#7a7168' }}>
            <ImageOff style={{ margin: '0 auto 12px' }} size={26} />
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '15px' }}>
              {isOwner ? 'Nothing added to this section yet.' : 'Nothing here right now — check back soon.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm-grid-cols-3 md-grid-cols-4 gap-5">
            {items.map((it) => (
              <div key={it.id} style={{ position: 'relative', border: '1px solid ' + line, backgroundColor: cream, opacity: it.in_stock ? 1 : 0.55 }}>
                <img
                  src={imageUrl(it.id)}
                  alt="Dress from the collection"
                  onClick={() => { setLightboxItem(it); setZoomed(false); }}
                  style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', display: 'block' }}
                />
                {!it.in_stock && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: ink,
                      color: cream,
                      fontFamily: serif,
                      fontStyle: 'italic',
                      fontSize: '11px',
                      padding: '3px 10px',
                    }}
                  >
                    Sold out
                  </div>
                )}
                {isOwner && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', backgroundColor: 'rgba(28,43,46,0.82)' }}>
                    <button
                      onClick={() => toggleStock(it.id, it.in_stock)}
                      style={{
                        flex: 1,
                        color: cream,
                        fontSize: '11px',
                        padding: '9px 4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      {it.in_stock ? (
                        <>
                          <EyeOff size={12} /> Mark sold out
                        </>
                      ) : (
                        <>
                          <Eye size={12} /> Mark in stock
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => removeItem(it.id)}
                      style={{
                        flex: 1,
                        color: cream,
                        fontSize: '11px',
                        padding: '9px 4px',
                        background: 'none',
                        border: 'none',
                        borderLeft: '1px solid rgba(255,255,255,0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <button
            onClick={() => {
              setUploadIsLehenga(activeTab === 'LEHENGA');
              setUploadSize(activeTab === 'LEHENGA' ? 'M' : activeTab);
              setUploadCategory(activeTab === 'LEHENGA' ? 'Cotton' : activeCategory);
              setShowUpload(true);
            }}
            style={{
              position: 'fixed',
              bottom: '28px',
              right: '28px',
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: ink,
              color: cream,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          >
            <Plus size={22} />
          </button>
        )}
      </main>

      {showLogin && (
        <LoginModal
          pwInput={pwInput}
          setPwInput={setPwInput}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
          loginError={loginError}
          onClose={() => {
            setShowLogin(false);
            setLoginError('');
            setPwInput('');
          }}
          onSubmit={handleLogin}
        />
      )}

      {showUpload && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28,43,46,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            padding: '16px',
          }}
        >
          <div style={{ backgroundColor: bg, padding: '28px', width: '100%', maxWidth: '400px', border: '1px solid ' + line, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontFamily: serif, fontSize: '20px', margin: 0 }}>Add photos</h2>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setUploadPreviews([]);
                  setUploadFiles([]);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: ink }}
              >
                <X size={18} />
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '14px' }}>
              <input type="checkbox" checked={uploadIsLehenga} onChange={(e) => setUploadIsLehenga(e.target.checked)} />
              This is a lehenga (shown in the common section, no size needed)
            </label>

            {!uploadIsLehenga && (
              <>
                <label style={{ fontSize: '12px', color: '#7a7168', display: 'block', marginBottom: '4px' }}>Size</label>
                <select
                  value={uploadSize}
                  onChange={(e) => setUploadSize(e.target.value)}
                  style={{ width: '100%', border: '1px solid ' + line, padding: '10px 12px', marginBottom: '14px', backgroundColor: cream, fontSize: '14px' }}
                >
                  {SIZES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label} ({s.measure})
                    </option>
                  ))}
                </select>
                <label style={{ fontSize: '12px', color: '#7a7168', display: 'block', marginBottom: '4px' }}>Category</label>
                <input
                  list="category-options"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  placeholder="Cotton, Coat Set, Muslin, or a new one"
                  style={{ width: '100%', border: '1px solid ' + line, padding: '10px 12px', marginBottom: '14px', backgroundColor: cream, fontSize: '14px' }}
                />
                <datalist id="category-options">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            )}

            <label style={{ fontSize: '12px', color: '#7a7168', display: 'block', marginBottom: '4px' }}>
              Photos (you can pick more than one)
            </label>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ width: '100%', fontSize: '13px', marginBottom: '14px' }} />
            {uploadPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2" style={{ marginBottom: '14px' }}>
                {uploadPreviews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Preview"
                    style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', border: '1px solid ' + line }}
                  />
                ))}
              </div>
            )}

            <button
              disabled={saving}
              onClick={submitUpload}
              style={{
                width: '100%',
                backgroundColor: ink,
                color: cream,
                padding: '10px',
                border: 'none',
                fontSize: '14px',
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Upload size={14} />
              {saving
                ? `Saving ${uploadProgress ? uploadProgress.done : 0} of ${uploadProgress ? uploadProgress.total : uploadFiles.length}…`
                : `Add ${uploadFiles.length > 1 ? uploadFiles.length + ' photos' : 'to collection'}`}
            </button>
          </div>
        </div>
      )}
      {lightboxItem && (
  <div
    onClick={() => setLightboxItem(null)}
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 40,
      overflow: 'auto',
    }}
  >
    <button
      onClick={() => setLightboxItem(null)}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        background: 'none',
        border: 'none',
        color: cream,
        cursor: 'pointer',
        zIndex: 41,
      }}
    >
      <X size={26} />
    </button>
    <img
      src={imageUrl(lightboxItem.id)}
      alt="Dress enlarged"
      onClick={(e) => {
        e.stopPropagation();
        setZoomed((z) => !z);
      }}
      style={{
        maxWidth: zoomed ? 'none' : '92vw',
        maxHeight: zoomed ? 'none' : '92vh',
        width: zoomed ? '180%' : 'auto',
        objectFit: 'contain',
        cursor: zoomed ? 'zoom-out' : 'zoom-in',
        margin: 'auto',
        display: 'block',
      }}
    />
  </div>
)}
    </div>
  );
}

function LoginModal({ pwInput, setPwInput, rememberMe, setRememberMe, loginError, onClose, onSubmit }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28,43,46,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
        padding: '16px',
      }}
    >
      <div style={{ backgroundColor: bg, padding: '28px', width: '100%', maxWidth: '360px', border: '1px solid ' + line }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: serif, fontSize: '20px', margin: 0 }}>Owner login</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ink }}>
            <X size={18} />
          </button>
        </div>
        <input
          type="password"
          value={pwInput}
          onChange={(e) => setPwInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Password"
          style={{ width: '100%', border: '1px solid ' + line, padding: '10px 12px', marginBottom: '12px', backgroundColor: cream, fontSize: '14px' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '12px', color: '#5c5348' }}>
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          Keep me signed in on this device
        </label>
        {loginError && <p style={{ fontSize: '12px', color: maroon, marginBottom: '10px' }}>{loginError}</p>}
        <button
          onClick={onSubmit}
          style={{ width: '100%', backgroundColor: ink, color: cream, padding: '10px', border: 'none', fontSize: '14px', cursor: 'pointer' }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
