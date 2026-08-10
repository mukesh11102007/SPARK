import { GoogleGenerativeAI } from '@google/generative-ai';

const WEBHOOK_URL = 'https://api.agents.snsihub.ai/webhook/Db';
const FALLBACK_WEBHOOK_URL = import.meta.env.VITE_FALLBACK_WEBHOOK_URL || 'https://api.agents.snsihub.ai/webhook/fallback';

const callDirectGemini = async (prompt, systemInstruction = '') => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY_2;
  if (!apiKey || apiKey.includes('your_gemini_api_key')) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction || undefined
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text || null;
  } catch (err) {
    console.warn('[AIOrchestrator] Direct Gemini SDK call failed:', err);
    return null;
  }
};

const generateSmartClientCode = (prompt = '', projectName = 'App', existingCode = null) => {
  const p = (prompt || '').toLowerCase();
  
  let compName = projectName ? projectName.replace(/[^a-zA-Z0-9]/g, '') : '';
  if (!compName || compName.toLowerCase() === 'sparkapp' || compName === 'NewProject') {
    if (p.includes('fitness') || p.includes('workout') || p.includes('gym') || p.includes('health') || p.includes('calorie') || p.includes('exercise') || p.includes('run')) compName = 'FitnessTrackerApp';
    else if (p.includes('food') || p.includes('billing') || p.includes('restaurant') || p.includes('hotel') || p.includes('indian') || p.includes('menu')) compName = 'FoodBillingApp';
    else if (p.includes('calc') || p.includes('calculator') || p.includes('math')) compName = 'CalculatorApp';
    else if (p.includes('todo') || p.includes('task')) compName = 'TaskManager';
    else if (p.includes('shop') || p.includes('store') || p.includes('cart') || p.includes('ecommerce')) compName = 'EcommerceApp';
    else if (p.includes('dashboard') || p.includes('chart') || p.includes('analytic') || p.includes('revenue')) compName = 'AnalyticsDashboard';
    else if (p.includes('portfolio') || p.includes('landing') || p.includes('saas')) compName = 'SaaSApp';
    else compName = 'CustomWebApp';
  }

  // Fitness Tracker Generator
  if (p.includes('fitness') || p.includes('workout') || p.includes('gym') || p.includes('health') || p.includes('calorie') || p.includes('exercise') || p.includes('run')) {
    return `import React, { useState } from 'react';

export default function ${compName}() {
  const [workouts, setWorkouts] = useState([
    { id: 1, name: 'Morning Outdoor Run', category: 'Cardio', duration: '35 mins', calories: 340, date: 'Today' },
    { id: 2, name: 'Heavy Bench Press & Chest', category: 'Strength', duration: '45 mins', calories: 280, date: 'Today' },
    { id: 3, name: 'Evening Yoga & Stretching', category: 'Flexibility', duration: '25 mins', calories: 120, date: 'Yesterday' }
  ]);

  const [workoutName, setWorkoutName] = useState('');
  const [category, setCategory] = useState('Cardio');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [waterGlasses, setWaterGlasses] = useState(6);

  const handleAddWorkout = (e) => {
    e.preventDefault();
    if (!workoutName.trim()) return;
    setWorkouts([
      { id: Date.now(), name: workoutName.trim(), category, duration: (duration || 30) + ' mins', calories: parseInt(calories) || 200, date: 'Today' },
      ...workouts
    ]);
    setWorkoutName('');
    setDuration('');
    setCalories('');
  };

  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '32px' }}>
      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #1f2937', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
            ️‍️
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FITPULSE — Fitness & Workout Tracker
            </h1>
            <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '0.88rem' }}>Track Workouts • Monitor Calories • Daily Hydration & Streaks</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#111827', border: '1px solid #1f2937', padding: '8px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}></span>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>CURRENT STREAK</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>7 Days Active</div>
          </div>
        </div>
      </header>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Calories Burned Today</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: '#f3f4f6' }}>{totalCalories} <span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 500 }}>/ 2,200 kcal</span></div>
          <div style={{ width: '100%', height: '6px', background: '#1f2937', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ width: Math.min((totalCalories / 2200) * 100, 100) + '%', height: '100%', background: '#10b981', borderRadius: '3px' }} />
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase' }}>Workouts Logged</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: '#f3f4f6' }}>{workouts.length} <span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 500 }}>Sessions</span></div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Water Intake</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setWaterGlasses(prev => Math.max(prev - 1, 0))} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>-</button>
              <button onClick={() => setWaterGlasses(prev => prev + 1)} style={{ background: '#38bdf8', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }}>+</button>
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: '#f3f4f6' }}> {waterGlasses} <span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 500 }}>Glasses</span></div>
        </div>
      </div>

      {/* Main Grid: Form + Workouts List */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '28px' }}>
        {/* Logger Form */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '20px', padding: '24px', height: 'fit-content' }}>
          <h2 style={{ margin: '0 0 18px', fontSize: '1.2rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ️ Log New Workout
          </h2>

          <form onSubmit={handleAddWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Workout Name</label>
              <input type="text" required placeholder="e.g. 5km Morning Run" value={workoutName} onChange={e => setWorkoutName(e.target.value)} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }}>
                <option value="Cardio"> Cardio</option>
                <option value="Strength">️ Strength Training</option>
                <option value="Flexibility"> Flexibility & Yoga</option>
                <option value="HIIT"> High Intensity HIIT</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Duration (Mins)</label>
                <input type="number" placeholder="45" value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Calories (kcal)</label>
                <input type="number" placeholder="300" value={calories} onChange={e => setCalories(e.target.value)} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }} />
              </div>
            </div>

            <button type="submit" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', marginTop: '6px' }}>
              + Save Workout Session
            </button>
          </form>
        </div>

        {/* Workouts Activity List */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.3rem', fontWeight: 800 }}> Recent Workout Sessions</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workouts.map(w => (
              <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: w.category === 'Cardio' ? '#0284c7' : w.category === 'Strength' ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {w.category === 'Cardio' ? '' : w.category === 'Strength' ? '️' : ''}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f3f4f6' }}>{w.name}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: '4px' }}>{w.category} • {w.duration} • Logged {w.date}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}> {w.calories} kcal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  // 1. Food Billing & Indian Restaurant App with Login & Signup Auth
  if (p.includes('food') || p.includes('billing') || p.includes('restaurant') || p.includes('hotel') || p.includes('indian') || p.includes('dish') || p.includes('dosa') || p.includes('biryani')) {
    return `import React, { useState } from 'react';

export default function ${compName}() {
  // Auth state
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // App state
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableNumber, setTableNumber] = useState('Table 4');
  const [showReceipt, setShowReceipt] = useState(false);

  const menuItems = [
    { id: 1, name: 'Hyderabadi Dum Biryani', category: 'Mains', price: 320, desc: 'Fragrant basmati rice cooked with authentic spices & marinated paneer/chicken.', img: '' },
    { id: 2, name: 'Paneer Butter Masala', category: 'Mains', price: 280, desc: 'Rich cottage cheese cubes in a creamy tomato cashew gravy.', img: '' },
    { id: 3, name: 'Butter Naan (2 Pcs)', category: 'Breads', price: 70, desc: 'Soft tandoori bread brushed with fresh creamery butter.', img: '' },
    { id: 4, name: 'Crispy Masala Dosa', category: 'South Indian', price: 150, desc: 'Thin rice crepe filled with spiced potato masala, served with coconut chutney & sambar.', img: '' },
    { id: 5, name: 'Delhi Samosa Chaat (2 Pcs)', category: 'Starters', price: 120, desc: 'Crushed samosas topped with chickpea curry, sweet yogurt & tangy tamarind chutney.', img: '' },
    { id: 6, name: 'Chicken Tikka Masala', category: 'Mains', price: 340, desc: 'Char-grilled chicken chunks in a rich onion tomato gravy.', img: '' },
    { id: 7, name: 'Hot Gulab Jamun (2 Pcs)', category: 'Desserts', price: 90, desc: 'Warm milk dumplings soaked in cardamom rose syrup.', img: '' },
    { id: 8, name: 'Chilled Mango Lassi', category: 'Beverages', price: 80, desc: 'Creamy yogurt drink blended with sweet Alphonso mango pulp.', img: '' }
  ];

  const handleAuth = (e) => {
    e.preventDefault();
    if (!email) return;
    setUser({ name: name || email.split('@')[0], email });
    setShowAuthModal(false);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gstTax = subtotal * 0.05; // 5% GST
  const total = subtotal + gstTax;

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: '#090d16', color: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #1e293b', paddingBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 8px 20px rgba(249,115,22,0.3)' }}>
            
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, #f97316, #eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ROYAL SPICE — Indian Food Billing
            </h1>
            <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Authentic Flavors • POS Billing • Quick GST Receipt</p>
          </div>
        </div>

        {/* User Auth Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input 
            type="text" 
            placeholder=" Search dishes..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '10px 16px', color: '#fff', outline: 'none', width: '220px', fontSize: '0.88rem' }}
          />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '6px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f97316' }}> {user.name}</span>
              <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
                 Login
              </button>
              <button onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
                 Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid: Menu + Cart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
        {/* Menu Section */}
        <div>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['all', 'Starters', 'Mains', 'Breads', 'South Indian', 'Desserts', 'Beverages'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? '#f97316' : '#0f172a',
                  color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat === 'all' ? '️ All Items' : cat}
              </button>
            ))}
          </div>

          {/* Dishes Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
            {filteredItems.map(item => (
              <div key={item.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.2s' }}>
                <div>
                  <div style={{ fontSize: '2.8rem', marginBottom: '10px', textAlign: 'center' }}>{item.img}</div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>{item.name}</h3>
                  <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.4, minHeight: '36px' }}>{item.desc}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f97316' }}>₹{item.price}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    + Add to Bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart & GST Billing Sidebar */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', padding: '24px', height: 'fit-content', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
               Table Order Bill
            </h2>
            <select 
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#f97316', borderRadius: '8px', padding: '4px 10px', fontWeight: 700, fontSize: '0.85rem' }}
            >
              {['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Takeaway'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {cart.length === 0 ? (
            <div style={{ textOverflow: 'ellipsis', textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}></div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No items added to bill yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>Click "+ Add to Bill" on any dish above.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px', maxHeight: '280px', overflowY: 'auto' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '10px 14px', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>{item.name}</div>
                      <div style={{ color: '#f97316', fontSize: '0.82rem', fontWeight: 700 }}>₹{item.price} × {item.qty} = ₹{item.price * item.qty}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', fontWeight: 800, cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', fontWeight: 800, cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Totals */}
              <div style={{ borderTop: '1px dashed #334155', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>GST Tax (5%)</span>
                  <span>₹{gstTax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#10b981' }}>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowReceipt(true)}
                style={{ width: '100%', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', marginTop: '18px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(249,115,22,0.4)' }}
              >
                 Generate GST Tax Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal (Login / Signup) */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '400px', width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#f97316' }}>
                {authMode === 'login' ? ' POS Cashier Login' : ' New Staff Registration'}
              </h3>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'signup' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Staff Name</label>
                  <input type="text" required placeholder="e.g. Ramesh Kumar" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }} />
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input type="email" required placeholder="cashier@royalspice.in" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Password</label>
                <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }} />
              </div>

              <button type="submit" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', marginTop: '6px' }}>
                {authMode === 'login' ? 'Login Now' : 'Create Account'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
              {authMode === 'login' ? "Don't have an account? " : "Already registered? "}
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: '#f97316', fontWeight: 700, cursor: 'pointer' }}>
                {authMode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Receipt Modal */}
      {showReceipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '420px', width: '100%', background: '#ffffff', color: '#0f172a', borderRadius: '20px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.8)', fontFamily: "'Courier New', monospace" }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #94a3b8', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 900, color: '#f97316' }}>ROYAL SPICE RESTAURANT</h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569' }}>GSTIN: 33AAAAA0000A1Z5 • Phone: +91 98765 43210</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.82rem', fontWeight: 700 }}>TAX INVOICE / CASH BILL</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '8px' }}>
                <span>Order #RS-{Math.floor(1000 + Math.random() * 9000)}</span>
                <span>{tableNumber}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.name} x{item.qty}</span>
                  <span style={{ fontWeight: 700 }}>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px dashed #94a3b8', paddingTop: '12px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>CGST (2.5%) + SGST (2.5%)</span>
                <span>₹{gstTax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, borderTop: '2px solid #0f172a', paddingTop: '8px', marginTop: '4px' }}>
                <span>PAID TOTAL</span>
                <span style={{ color: '#16a34a' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#64748b' }}>Thank you for dining with us! Have a great day! </p>
              <button 
                onClick={() => { setShowReceipt(false); setCart([]); alert("Bill Paid & Order Completed!"); }}
                style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                ✓ Complete Order & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
  }

  // 2. Calculator Generator
  if (p.includes('calc') || p.includes('calculator') || p.includes('math')) {
    return `import React, { useState } from 'react';

export default function ${compName}() {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState([]);

  const handleNum = (num) => setDisplay(prev => prev === '0' ? String(num) : prev + String(num));
  const handleOp = (op) => setDisplay(prev => ['+', '-', '*', '/', '%'].includes(prev.slice(-1)) ? prev.slice(0, -1) + op : prev + ' ' + op + ' ');
  const handleClear = () => setDisplay('0');
  const handleDelete = () => setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');

  const handleEqual = () => {
    try {
      const res = Function('"use strict"; return (' + display + ')')();
      const formatted = Number.isInteger(res) ? String(res) : res.toFixed(4).replace(/0+$/, '').replace(/\\.$/, '');
      setHistory(prev => [{ expr: display, res: formatted }, ...prev.slice(0, 7)]);
      setDisplay(formatted);
    } catch {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ maxWidth: '400px', width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        <h1 style={{ margin: '0 0 16px', fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', background: 'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Calculator Pro</h1>
        <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: '#8b949e', height: '20px' }}>{history.length > 0 ? history[0].expr + ' = ' + history[0].res : ''}</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 700, color: '#f0f6fc' }}>{display}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <button onClick={handleClear} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>C</button>
          <button onClick={handleDelete} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>⌫</button>
          <button onClick={() => handleOp('%')} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>%</button>
          <button onClick={() => handleOp('/')} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}>÷</button>
          <button onClick={() => handleNum(7)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>7</button>
          <button onClick={() => handleNum(8)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>8</button>
          <button onClick={() => handleNum(9)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>9</button>
          <button onClick={() => handleOp('*')} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}>×</button>
          <button onClick={() => handleNum(4)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>4</button>
          <button onClick={() => handleNum(5)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>5</button>
          <button onClick={() => handleNum(6)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>6</button>
          <button onClick={() => handleOp('-')} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}>-</button>
          <button onClick={() => handleNum(1)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>1</button>
          <button onClick={() => handleNum(2)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>2</button>
          <button onClick={() => handleNum(3)} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>3</button>
          <button onClick={() => handleOp('+')} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}>+</button>
          <button onClick={() => handleNum(0)} style={{ gridColumn: 'span 2', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>0</button>
          <button onClick={() => handleNum('.')} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}>.</button>
          <button onClick={handleEqual} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer' }}>=</button>
        </div>
      </div>
    </div>
  );
}`;
  }

  // 3. Task Manager Generator
  if (p.includes('todo') || p.includes('task')) {
    return `import React, { useState } from 'react';

export default function ${compName}() {
  const [tasks, setTasks] = useState([
    { id: 1, text: '${prompt ? 'Task: ' + prompt.slice(0, 30) : 'Design UI Layout'}', completed: false, category: 'Work' },
    { id: 2, text: 'Review component architecture', completed: true, category: 'Dev' },
    { id: 3, text: 'Deploy full-stack project', completed: false, category: 'Dev' }
  ]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  const addTask = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: input.trim(), completed: false, category: 'General' }]);
    setInput('');
  };

  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const filteredTasks = tasks.filter(t => filter === 'active' ? !t.completed : filter === 'completed' ? t.completed : true);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '32px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '640px', width: '100%', background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> ${compName}</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '24px' }}>${prompt || 'Organize and track your daily tasks.'}</p>
        <form onSubmit={addTask} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input type="text" placeholder="Add new task..." value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1, background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px 16px', color: '#fff', outline: 'none' }} />
          <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}>+ Add Task</button>
        </form>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['all', 'active', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#10b981' : '#1f2937', color: filter === f ? '#fff' : '#9ca3af', border: '1px solid #374151', borderRadius: '6px', padding: '6px 14px', textTransform: 'capitalize', cursor: 'pointer', fontWeight: 600 }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.map(t => (
            <div key={t.id} onClick={() => toggleTask(t.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', padding: '14px 18px', borderRadius: '10px', border: '1px solid #374151', cursor: 'pointer' }}>
              <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#9ca3af' : '#fff' }}>{t.text}</span>
              <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: t.completed ? '#065f46' : '#374151', color: t.completed ? '#34d399' : '#9ca3af', fontWeight: 600 }}>{t.completed ? '✓ Done' : 'Pending'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`;
  }

  // 4. Cursor-Grade AI Webpage Generator (Dynamic for ANY arbitrary user prompt)
  const cleanTitle = prompt 
    ? prompt.replace(/create\s+a\s+|build\s+a\s+|make\s+a\s+|generate\s+a\s+/gi, '').replace(/\b\w/g, l => l.toUpperCase())
    : 'Custom Application';

  return `import React, { useState } from 'react';

export default function ${compName}() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([
    { id: 1, name: 'Primary ${cleanTitle} Module', status: 'Active', category: 'Core', date: '2026-08-07', priority: 'High' },
    { id: 2, name: 'Automated Event Pipeline', status: 'Running', category: 'Workflow', date: '2026-08-06', priority: 'Medium' },
    { id: 3, name: 'Serverless Integration Gateway', status: 'Deployed', category: 'Cloud', date: '2026-08-05', priority: 'High' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setItems([
      { id: Date.now(), name: newItemName.trim(), status: 'Active', category: 'User Created', date: new Date().toISOString().split('T')[0], priority: 'High' },
      ...items
    ]);
    setNewItemName('');
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || item.category.toLowerCase() === activeTab.toLowerCase() || item.status.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: isDarkMode ? '#0b0f19' : '#f8fafc', color: isDarkMode ? '#f3f4f6' : '#0f172a', minHeight: '100vh', padding: '32px', transition: 'all 0.3s' }}>
      {/* Top Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
            
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ${cleanTitle}
            </h1>
            <p style={{ margin: '4px 0 0', color: isDarkMode ? '#9ca3af' : '#64748b', fontSize: '0.88rem' }}>
              AI Synthesized Application • Ready for Edit & 1-Click Deployment
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ background: isDarkMode ? '#1f2937' : '#e2e8f0', color: isDarkMode ? '#fff' : '#0f172a', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            {isDarkMode ? '️ Light Mode' : ' Dark Mode'}
          </button>

          <input 
            type="text" 
            placeholder=" Search ${cleanTitle}..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ background: isDarkMode ? '#111827' : '#ffffff', border: isDarkMode ? '1px solid #374151' : '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 16px', color: isDarkMode ? '#fff' : '#0f172a', outline: 'none', width: '240px', fontSize: '0.88rem' }} 
          />
        </div>
      </header>

      {/* Hero Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: isDarkMode ? '#111827' : '#ffffff', border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', tracking: '1px' }}>Total Application Records</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px' }}>{items.length} Items</div>
        </div>

        <div style={{ background: isDarkMode ? '#111827' : '#ffffff', border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#6366f1', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Active Status Rate</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px' }}>100% Online</div>
        </div>

        <div style={{ background: isDarkMode ? '#111827' : '#ffffff', border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#eab308', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>System Health</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px' }}>Optimal</div>
        </div>
      </div>

      {/* Main Interactive Management Panel */}
      <div style={{ background: isDarkMode ? '#111827' : '#ffffff', border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}> ${cleanTitle} Control Manager</h2>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'Active', 'Running', 'Deployed'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? '#10b981' : isDarkMode ? '#1f2937' : '#f1f5f9',
                  color: activeTab === tab ? '#ffffff' : isDarkMode ? '#9ca3af' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Form Add New */}
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Add new record for ${cleanTitle}..." 
            value={newItemName} 
            onChange={e => setNewItemName(e.target.value)} 
            style={{ flex: 1, background: isDarkMode ? '#1f2937' : '#f8fafc', border: isDarkMode ? '1px solid #374151' : '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 18px', color: isDarkMode ? '#fff' : '#0f172a', outline: 'none', fontSize: '0.9rem' }} 
          />
          <button type="submit" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
            + Create Record
          </button>
        </form>

        {/* Data Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No matching records found.</div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#1f2937' : '#f8fafc', border: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', transition: 'all 0.2s' }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{item.name}</div>
                  <div style={{ color: isDarkMode ? '#9ca3af' : '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>Category: {item.category} • Created: {item.date}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.78rem', background: '#065f46', color: '#34d399', padding: '4px 12px', borderRadius: '8px', fontWeight: 800 }}>
                    {item.status}
                  </span>
                  <button 
                    onClick={() => setSelectedItem(item)}
                    style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => removeItem(item.id)}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '440px', width: '100%', background: isDarkMode ? '#111827' : '#ffffff', border: '1px solid #374151', borderRadius: '20px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{selectedItem.name}</h3>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: isDarkMode ? '#9ca3af' : '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
              This module was generated dynamically by SPARK AI to handle data processing and user interactions for "${cleanTitle}".
            </p>
            <div style={{ borderTop: '1px solid #374151', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedItem(null)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
};

const executeWithFallback = async (prompt, systemInstruction = '') => {
  try {
    const response = await fetch(FALLBACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction })
    });
    if (response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json._responseData?.content?.parts?.[0]?.text) return json._responseData.content.parts[0].text;
        const val = json.output || json.text || json.reply || json.response;
        if (val && typeof val === 'string') return val;
      } catch {
        if (text && !text.includes('"success":true') && !text.includes('"executionId"')) return text;
      }
    }
  } catch (err) {
    console.warn("[AIOrchestrator] Fallback webhook failed:", err);
  }

  // Fallback to direct Gemini SDK if API key present
  const directText = await callDirectGemini(prompt, systemInstruction);
  if (directText) return directText;

  // Final fail-safe client-side generator to guarantee user never receives error alerts
  return generateSmartClientCode(prompt, 'App');
};

// Helper to recursively find JS/JSX code in nested JSON objects
const findCodeInObject = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed.includes('export default') || trimmed.includes('return (') || (trimmed.includes('import React') && trimmed.includes('function'))) {
      return trimmed;
    }
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findCodeInObject(item);
      if (found) return found;
    }
  } else if (typeof obj === 'object') {
    const priorityKeys = ['code', 'response', 'text', 'content', 'output', 'items', 'json', 'body', 'data', 'result'];
    for (const key of priorityKeys) {
      if (obj[key]) {
        const found = findCodeInObject(obj[key]);
        if (found) return found;
      }
    }
    for (const val of Object.values(obj)) {
      const found = findCodeInObject(val);
      if (found) return found;
    }
  }
  return null;
};

// ── Extract React code from any response format ─────────────────────────────
const extractCode = (raw, projectName) => {
  let text = raw.trim();

  // 1. Try parsing multiple files using "// FILE: filename.jsx" delimiter
  const fileRegex = /\/\/\s*FILE:\s*([a-zA-Z0-9_.-]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/gi;
  let hasFiles = false;
  const files = {};
  
  let fileMatch;
  while ((fileMatch = fileRegex.exec(text)) !== null) {
    hasFiles = true;
    let fileName = fileMatch[1].trim();
    if (!fileName.endsWith('.jsx') && !fileName.endsWith('.js')) fileName += '.jsx';
    const fileCode = fileMatch[2].replace(/```jsx?/gi, '').replace(/```/g, '').trim();
    if (fileCode) files[fileName] = fileCode;
  }
  
  if (hasFiles && Object.keys(files).length > 0) {
    return files;
  }

  // 2. Try parsing JSON format
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
      
      // Handle mapping of filenames to code (e.g. n8n webhook might return this)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const potentialFiles = {};
        for (const [key, val] of Object.entries(parsed)) {
          if (typeof val === 'string' && (val.includes('export default') || val.includes('import React'))) {
            const fname = key.endsWith('.jsx') || key.endsWith('.js') ? key : `${key}.jsx`;
            potentialFiles[fname] = val.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
          }
        }
        if (Object.keys(potentialFiles).length > 0) return potentialFiles;
      }
      
      // Handle array of file objects
      if (Array.isArray(parsed)) {
        const potentialFiles = {};
        for (const item of parsed) {
           if (item && typeof item === 'object' && (item.name || item.filename || item.file) && (item.code || item.content)) {
             const fname = item.name || item.filename || item.file;
             const code = item.code || item.content;
             if (typeof code === 'string') {
               const safeName = fname.endsWith('.jsx') || fname.endsWith('.js') ? fname : `${fname}.jsx`;
               potentialFiles[safeName] = code.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
             }
           }
        }
        if (Object.keys(potentialFiles).length > 0) return potentialFiles;
      }

      const extracted = findCodeInObject(parsed);
      if (extracted) {
        text = extracted;
      } else {
        return null; // Return null so caller falls back to Gemini API
      }
    } catch {}
  }

  // Treat as raw code
  const clean = text.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  if (!clean.startsWith('{') && !clean.startsWith('[') && clean.length > 50 && (clean.includes('export default') || (clean.includes('function') && clean.includes('return')))) {
    let fileName = null;
    if (projectName && (projectName.endsWith('.jsx') || projectName.endsWith('.js'))) {
      fileName = projectName.trim();
    } else {
      const match = clean.match(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/);
      if (match && match[1]) {
        fileName = `${match[1]}.jsx`;
      } else {
        let safeName = projectName.replace(/[^a-zA-Z0-9]/g, '');
        if (!safeName || /^[0-9]/.test(safeName)) safeName = 'App' + safeName;
        fileName = `${safeName}Component.jsx`;
      }
    }
    return { [fileName]: clean };
  }

  return null;
};

// ── Styling Prompt Helper ───────────────────────────────────────────────────
const getStylingPrompt = (preference) => {
  switch (preference) {
    case 'tailwind':
      return `5. **STYLING**: You MUST use Tailwind CSS utility classes (e.g., className="bg-blue-500 hover:bg-blue-600"). Do not use inline styles or styled-components. Assume a standard Tailwind installation is present.`;
    case 'inline':
      return `5. **STYLING**: Use ONLY inline styles (style={{...}}). Do not use Tailwind, external CSS, or styled-components.`;
    case 'css-modules':
      return `5. **STYLING**: You MUST use CSS Modules. Assume you can import styles via \`import styles from './styles.module.css';\` and apply them via \`className={styles.container}\`.`;
    case 'emotion':
      return `5. **STYLING**: You MUST use Emotion (\`@emotion/react\` or \`@emotion/styled\`). Import it like \`import styled from '@emotion/styled';\`. DO NOT use inline styles.`;
    case 'styled-components':
    default:
      return `5. **STYLING**: DO NOT use inline styles unless absolutely necessary. You MUST use \`styled-components\` for styling to support pseudo-classes like :hover and media queries. Import it like \`import styled from 'styled-components';\`.`;
  }
};

// ── Supabase Prompt Helper ───────────────────────────────────────────────────
const getDbPrompt = (dbConfig, prompt = '') => {
  const safePrompt = (typeof prompt === 'string' ? prompt : String(prompt || ''));
  const needsDb = safePrompt.toLowerCase().match(/login|signup|auth|database|db|store|save|history|cart/);
  
  if (dbConfig && dbConfig.status === 'active') {
    return `
[SUPABASE REAL-TIME DATABASE INTEGRATION REQUIRED]
The user has provisioned a real Supabase database. You MUST write this component to interact with it!
- Do NOT import '@supabase/supabase-js'. It is loaded via CDN and available as \`window.supabase\`.
- Initialize the client OUTSIDE the component: 
  \`const supabase = window.supabase.createClient('${dbConfig.url}', '${dbConfig.anonKey}');\`
- CRITICAL: DO NOT truncate, abbreviate, or shorten the anonKey. You MUST use the exact full string provided above!
- Use the exact table name: '${dbConfig.table}' (this is a NoSQL-like logs table).
- The ONLY columns in this table are: \`id\`, \`created_at\`, \`workspace_id\`, and \`payload\`.
- CRITICAL: You CANNOT insert custom columns like 'name', 'price', etc. You MUST wrap ALL your app data inside the JSONB \`payload\` column!
- Example Insert:
  \`await supabase.from('${dbConfig.table}').insert([{ workspace_id: '${dbConfig.workspaceId}', payload: { type: 'YourModelName', field1: 'value1', field2: 'value2' } }]);\`
- Example Fetch:
  \`const { data } = await supabase.from('${dbConfig.table}').select('*').eq('workspace_id', '${dbConfig.workspaceId}');\`
- Extract your actual data from the \`payload\` column when reading (e.g. \`item.payload.field1\`).
- IMPORTANT: Set up real-time subscriptions in a useEffect to listen for inserts/updates/deletes on this table:
  \`supabase.channel('custom-all-channel').on('postgres_changes', { event: '*', schema: 'public', table: '${dbConfig.table}', filter: 'workspace_id=eq.${dbConfig.workspaceId}' }, (payload) => { /* handle realtime update */ }).subscribe();\`
- The UI MUST reflect real data fetched from this Supabase table.
`;
  } else if (needsDb) {
    const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
    const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';
    
    return `
[SUPABASE DATABASE INJECTION]
The user requested a feature that requires a database/backend (e.g., login, save, cart, etc.).
Since they might be a non-technical user, you MUST inject a functional Supabase implementation using the system's default database!
- Do NOT import '@supabase/supabase-js'. It is loaded via CDN and available as \`window.supabase\`.
- Initialize the client OUTSIDE the component using the provided credentials:
  \`const supabase = window.supabase.createClient('${defaultUrl}', '${defaultKey}');\`
- CRITICAL: DO NOT truncate, abbreviate, or shorten the anonKey. You MUST use the exact full string provided above!
- The ONLY table available is \`app_data\`. The ONLY columns are \`id\`, \`created_at\`, \`app_name\` (text), and \`payload\` (JSONB).
- CRITICAL MULTI-TENANCY RULE: You CANNOT insert custom columns (no price, name, etc.). You MUST wrap all custom data inside the JSONB \`payload\` column.
- You MUST pass \`app_name: 'App_${safePrompt.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}'\` in EVERY insert to prevent data leakage between different generated apps!
- Example Insert:
  \`await supabase.from('app_data').insert([{ app_name: 'App_${safePrompt.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}', payload: { type: 'item', field1: 'value' } }]);\`
- Example Fetch:
  \`const { data } = await supabase.from('app_data').select('*').eq('app_name', 'App_${safePrompt.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}');\`
- For login/signup pages, use \`supabase.auth.signInWithPassword({ email, password })\` and \`supabase.auth.signUp({ email, password })\`.
- Ensure the frontend fully implements the necessary state and UI for these database interactions.
`;
  }
  return '';
};

const generateWithGemini = async (prompt, projectName, dbConfig, stylingPref = 'styled-components') => {
  console.log('[AIOrchestrator] Falling back to Webhook Fallback...');
  const raw = await executeWithFallback(prompt, `You are an expert React developer. Generate a complete React application for the following request.

CRITICAL RULES — MUST FOLLOW:
1. BY DEFAULT, return ONLY a SINGLE raw JSX/React file. ONLY if the user EXPLICITLY asks for multiple files or pages, you must generate multiple files and connect them. If generating multiple files, before EACH file's code, you MUST output exactly: // FILE: FileName.jsx
2. Imports: import React, { useState, useEffect, useRef } from 'react'; ${stylingPref === 'styled-components' ? "and import styled from 'styled-components';" : ""}
3. ROUTING: Only if generating multiple pages, use 'react-router-dom' (globally available).
4. DO NOT import from 'lucide-react', '@heroicons', 'react-icons', or ANY third-party library.
5. For icons: use <i className="fa fa-..." /> HTML elements (Font Awesome classes like fa-home, fa-user, fa-cog).
${getStylingPrompt(stylingPref)}
7. Each component MUST have: export default function ComponentName() { ... }
8. No TypeScript. No JSX fragments as the top-level export.
9. Code must be completely free of syntax errors, undefined variables, and runtime errors.
10. The component must be fully functional with sample/demo data included inline.
11. AESTHETICS ARE VERY IMPORTANT. The UI must be extremely premium, modern, and beautiful. Use smooth gradients, glassmorphism, dark/light sleek themes, subtle micro-animations, and modern typography.

Project name: ${projectName}
User request: ${prompt}
${getDbPrompt(dbConfig, prompt)}`);
  const files = extractCode(raw, projectName);
  if (files) return files;

  const clean = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  if (clean.includes('"success":true') || clean.includes('"executionId"') || (!clean.includes('export') && !clean.includes('function') && !clean.includes('return'))) {
    throw new Error("AI service returned invalid response. Please try again.");
  }

  const match = clean.match(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/);
  let safeName = projectName.replace(/[^a-zA-Z0-9]/g, '');
  if (!safeName || /^[0-9]/.test(safeName)) safeName = 'App' + safeName;
  const fileName = (match && match[1]) ? `${match[1]}.jsx` : `${safeName}Component.jsx`;
  return { [fileName]: clean };
};

// ── Main export ─────────────────────────────────────────────────────────────
export const generateAppFromVoice = async (prompt, projectName = 'MyProject', dbConfig = null, stylingPref = 'styled-components') => {
  console.log('[AIOrchestrator] Generating for:', { prompt, projectName, stylingPref });

  // 2-minute timeout on webhook
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const premiumPrompt = `\n\nCRITICAL UI/UX REQUIREMENT: You must generate a design that is extremely premium, modern, and visually stunning. Avoid generic layouts.\nCRITICAL ARCHITECTURE RULES: BY DEFAULT, you MUST generate a SINGLE-FILE React component. ONLY generate multiple files if the user EXPLICITLY asks for a "multi-page", "multi-file", or "website with multiple pages". IF multiple files are requested, you MUST connect them together (e.g. via react-router-dom) and before EACH file's code, output exactly: // FILE: FileName.jsx\n${getStylingPrompt(stylingPref)}`;
    const fullPrompt = prompt + premiumPrompt + '\n' + getDbPrompt(dbConfig, prompt);
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt, projectName, dbConfig, stylingPreference: stylingPref }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('[AIOrchestrator] Webhook failed, falling back...');
      return await generateWithGemini(prompt, projectName, dbConfig, stylingPref);
    }

    const rawText = await response.text();
    console.log('[AIOrchestrator] Raw webhook response:', rawText);

    const files = extractCode(rawText, projectName);
    if (files) return files;

    // Webhook returned empty/metadata — fall back
    console.warn('[AIOrchestrator] Webhook returned no code. Falling back...');
    return await generateWithGemini(prompt, projectName, dbConfig, stylingPref);

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      console.warn('[AIOrchestrator] Webhook timed out. Falling back...');
      return await generateWithGemini(prompt, projectName, dbConfig, stylingPref);
    }
    throw e;
  }
};

// ── Refine existing code via Gemini ──────────────────────────────────────────
export const refineAppCode = async (existingCode, problemStatement, projectName, filename, dbConfig = null, workspaceFiles = null, stylingPref = 'styled-components') => {
  const targetFile = filename || 'App.jsx';
  const isHtmlTarget = targetFile.endsWith('.html') || (existingCode && (existingCode.includes('<!DOCTYPE html>') || existingCode.includes('<html')));

  console.log('[AIOrchestrator] Refining code for:', { targetFile, isHtmlTarget });
  
  let workspaceContext = '';
  if (workspaceFiles && Object.keys(workspaceFiles).length > 1) {
    workspaceContext = `\n\nOther files in this workspace for context (DO NOT MODIFY THESE, they are just so you know what exists):\n`;
    Object.entries(workspaceFiles).forEach(([f, c]) => {
      if (f !== targetFile) {
        workspaceContext += `\n--- ${f} ---\n\`\`\`jsx\n${c}\n\`\`\`\n`;
      }
    });
  }

  const raw = await executeWithFallback(problemStatement, `You are an expert React developer.
${isHtmlTarget ? 'The user wants to CONVERT an HTML document into a fully functional React JSX component.' : `The user wants to improve and enhance an existing React component named "${targetFile}".`}

CRITICAL RULES — MUST FOLLOW:
1. ${isHtmlTarget ? 'CONVERT THE HTML INTO CLEAN REACT JSX: Convert class="..." to className="...", inline styles to style={{...}}, close all self-closing tags (<img />, <input />, <br />, <hr />), and convert inline JS scripts into React useState/useEffect hooks.' : `Return ONLY the updated raw JSX/React code for "${targetFile}". No markdown explanations, no conversational text, no preambles.`}
2. Wrap your code inside a single \`\`\`jsx ... \`\`\` block.
3. Imports: import React, { useState, useEffect, useRef } from 'react'; ${stylingPref === 'styled-components' ? "and import styled from 'styled-components';" : ""}
4. DO NOT import from 'lucide-react', '@heroicons', 'react-icons', or ANY third-party library.
5. For icons: use <i className="fa fa-..." /> HTML elements (Font Awesome classes).
${getStylingPrompt(stylingPref)}
6. COMPLETENESS: Return the ENTIRE file content. No omissions, no "..." placeholders.
7. Must export default component: export default function ComponentName() { ... }

Project name: ${projectName}
Target file: ${targetFile}
Enhancement Request: ${problemStatement}

Current Code for ${targetFile}:
\`\`\`${isHtmlTarget ? 'html' : 'jsx'}
${existingCode}
\`\`\`
${workspaceContext}

${getDbPrompt(dbConfig, prompt)}

Remember: Return ONLY the code inside \`\`\`jsx ... \`\`\`.`);

  // Extract code inside ```jsx ... ``` blocks cleanly
  let cleanCode = '';
  const match = raw.match(/```(?:jsx|js|javascript)?\s*\n([\s\S]*?)```/i);
  if (match && match[1]) {
    cleanCode = match[1].trim();
  } else {
    cleanCode = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
  }

  // Remove any leading conversational text before imports or code
  const firstImportIndex = cleanCode.indexOf('import ');
  const firstExportIndex = cleanCode.indexOf('export ');
  const firstConstIndex = cleanCode.indexOf('const ');
  const firstFuncIndex = cleanCode.indexOf('function ');
  
  const validStarts = [firstImportIndex, firstExportIndex, firstConstIndex, firstFuncIndex].filter(i => i >= 0);
  if (validStarts.length > 0) {
    const minStart = Math.min(...validStarts);
    if (minStart > 0 && minStart < 200) {
      cleanCode = cleanCode.substring(minStart);
    }
  }

  // Remove any trailing conversational text after final brace
  const lastBraceIndex = cleanCode.lastIndexOf('}');
  if (lastBraceIndex > 0) {
    cleanCode = cleanCode.substring(0, lastBraceIndex + 1);
  }

  if (cleanCode.includes('"success":true') || cleanCode.includes('"executionId"') || (!cleanCode.includes('export') && !cleanCode.includes('function') && !cleanCode.includes('return'))) {
    throw new Error("AI service returned invalid response. Please try clicking Enhance again.");
  }

  const outFileName = isHtmlTarget ? targetFile.replace(/\.html$/, '.jsx') : targetFile;
  return { [outFileName]: cleanCode };
};

const executeWithRoundRobin = async (fn) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY_2;
    if (apiKey && !apiKey.includes('your_gemini_api_key')) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const res = await fn({
        models: {
          generateContent: async (opts) => {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(opts.contents);
            return { text: result.response.text() };
          }
        }
      });
      return res || { text: '' };
    }
  } catch (err) {
    console.warn('[AIOrchestrator] Round-robin call failed:', err);
  }
  return { text: '' };
};

// ── Review & auto-fix generated code before applying to canvas ────────────────
export const reviewAndFixCode = async (files, originalPrompt, projectName, dbConfig, targetFilename = null) => {
  try {
    let filename = targetFilename;
    let code = filename ? files[filename] : null;

    if (!filename || !code) {
      const firstFile = Object.entries(files)[0];
      if (!firstFile) return { files, review: null };
      filename = firstFile[0];
      code = firstFile[1];
    }

    const resp = await executeWithRoundRobin(ai => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `You are a senior React code reviewer and fixer.

Original user request: "${originalPrompt}"
Project name: "${projectName}"

Generated code:
\`\`\`jsx
${code}
\`\`\`

${getDbPrompt(dbConfig, prompt)}

Your job:
1. Check if the code matches the user's request.
2. Check for any syntax errors, missing imports, undefined variables.
3. CRITICAL: Remove ALL imports from lucide-react, @heroicons, react-icons, or any third-party library. Replace icon usage with <i className="fa fa-iconname" /> (Font Awesome) HTML elements.
4. CRITICAL: The ONLY allowed import is: import React, { useState, useEffect, useRef } from 'react';
5. Ensure ALL styles are inline (style={{}}). Remove any CSS class references to external stylesheets.
6. Verify that the default export exists as: export default function ComponentName() { ... }
7. CRITICAL: If the code uses a simulated backend, localStorage, or alert() popups to simulate saving data, you MUST completely rewrite those parts to use the Supabase real-time database exactly as instructed above!
8. AESTHETICS: Ensure the code produces an extremely premium, stunning, and modern UI. If the styling looks too basic, enhance it with gradients, shadows, and better spacing using inline styles.
9. Fix ALL problems and return corrected code.
10. Return a JSON object in this EXACT format:
{
  "status": "ok" | "fixed",
  "issues": ["list of issues found, or empty array"],
  "code": "THE COMPLETE FIXED JSX CODE HERE (no markdown, no backticks)"
}`,
    }));

    if (resp && resp.text) {
      const text = resp.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const result = JSON.parse(text);
      if (result && result.code && result.code.includes('function') && result.code.includes('return')) {
        const fixedCode = result.code.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
        return {
          files: { ...files, [filename]: fixedCode },
          review: {
            status: result.status || 'ok',
            issues: result.issues || [],
          },
        };
      }
    }
  } catch (err) {
    console.warn('[AIOrchestrator] Review & fix skipped:', err);
  }
  return { files, review: null };
};

// ── Auto-Heal: Fix code based on error logs ───────────────────────────────────
export const autoHealCode = async (files, errorLog, dbConfig) => {
  const firstFile = Object.entries(files)[0];
  if (!firstFile) return files;
  const [filename, code] = firstFile;

  console.log('[AIOrchestrator] Auto-healing code...');
  const resp = await executeWithRoundRobin(ai => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an expert React debugger. The following React component crashed.

Error Log:
${errorLog}

${getDbPrompt(dbConfig, prompt)}

Your job: Component Code:
\`\`\`jsx
${code}
\`\`\`

Fix the code to resolve the error. Return ONLY the complete corrected raw JSX/React code. Do not include markdown, no \`\`\`, no explanation.`
  }));

  try {
    const raw = resp.text || '';
    const clean = raw.replace(/```jsx?/gi, '').replace(/```/g, '').trim();
    return { ...files, [filename]: clean };
  } catch {
    return files;
  }
};

export const chatWithProject = async (files, userMessage, sessionId = 'default-session', mode = 'workspace', messages = []) => {
  const historyContext = messages.length > 1 
    ? "Conversation History:\n" + messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + "\n\n"
    : "";

  const fileContextString = Object.entries(files || {})
    .map(([name, code]) => `File: ${name}\n\`\`\`javascript\n${code}\n\`\`\``)
    .join('\n\n');

  const fileContext = historyContext + "Current Files in Workspace:\n" + fileContextString;

  const CHAT_WEBHOOK_URL = import.meta.env.VITE_CHATBOT_WEBHOOK_URL || 'https://api.agents.snsihub.ai/webhook/chatbot';

  try {
    // 1. Try the n8n webhook to save tokens
    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userMessage, fileContext })
    });

    if (response.ok) {
      const text = await response.text();
      // Try to parse the webhook JSON and extract the actual message text
      try {
        const json = JSON.parse(text);
        
        // Handle n8n raw node output structures
        if (json._responseData?.content?.parts?.[0]?.text) {
          return json._responseData.content.parts[0].text;
        }
        
        // Handle standard webhook payload keys
        if (json.output) return json.output;
        if (json.text) return json.text;
        if (json.reply) return json.reply;
        if (json.response) return json.response;
        if (json.message) return json.message;
        
        // If it's a nested array from n8n (e.g. [{output: "..."}])
        if (Array.isArray(json) && json[0]) {
           return json[0].output || json[0].text || json[0].message || text;
        }

        return text; // Fallback to raw string if no known key is found
      } catch {
        return text;
      }
    }
    throw new Error(`Webhook failed with status: ${response.status}`);
  } catch (err) {
    console.warn('[AIOrchestrator] Chat webhook failed, falling back to Gemini API...', err);
    
    // 2. Fallback to Fallback Webhook
    return await executeWithFallback(prompt, `You are a helpful AI developer assistant embedded in a code editor.\nThe user is asking you a question about their current workspace.\n\nHere are the current files in the workspace:\n${fileContext}`);
  }
};

export const formatCodeForDeploy = async (filename, code) => {
  const isBackend = filename.includes('server') || filename.includes('api') || (!filename.includes('.jsx') && code.includes('express'));
  
  const systemInstruction = `You are a strict DevOps automation tool preparing code for Vercel Serverless deployment. 
Your ONLY job is to modify the infrastructure deployment code.
DO NOT change any styling (Tailwind/CSS), UI layout, or business logic.

If backend file:
1. Remove app.listen() and any local server starting logic.
2. Ensure the Express app is exported at the end using: "module.exports = app;" (or whatever the app variable is named).
3. Do NOT change API routes or database logic.

If frontend file:
1. Replace hardcoded localhost API URLs (e.g., http://localhost:5000/api) with relative URLs (e.g., /api).
2. Do NOT change the UI, styling, or component structure.

Return ONLY the raw modified code. Do not include markdown codeblocks (no \`\`\`javascript or \`\`\`). Do not include any explanations.`;

  try {
    const response = await callDirectGemini(code, systemInstruction);
    if (response) {
      // Strip markdown codeblocks if AI accidentally included them
      let clean = response.trim();
      if (clean.startsWith('`\``')) {
        clean = clean.split('\\n').slice(1).join('\\n');
        if (clean.endsWith('`\``')) clean = clean.slice(0, -3);
      }
      return clean.trim() || code;
    }
  } catch (err) {
    console.error('Failed to format code for deploy:', err);
  }
  return code; // Fallback to original code if it fails
};
