import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Pill, ShoppingCart, ClipboardList, LogOut, Plus, Search, Trash2, Pencil, X, Menu, AlertTriangle, Package, DollarSign, TrendingUp } from 'lucide-react';
import api from './api';

const money = (n) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(Number(n || 0));
const dateText = (d) => d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString() : '—';
const todayText = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const isExpired = (expiryDate) => Boolean(expiryDate && expiryDate.slice(0, 10) < todayText());

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem('pharmacy_token', data.token);
      localStorage.setItem('pharmacy_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) { setError(err.response?.data?.message || 'Could not connect to the server.'); }
    finally { setBusy(false); }
  };
  return <div className="auth-wrap"><div className="auth-card">
    <div className="brand-mark large"><Activity size={27}/></div><p className="eyebrow">PHARMACY OPERATIONS</p>
    <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
    <p className="muted">Manage stock, sales, and daily pharmacy activity.</p>
    {error && <div className="alert error">{error}</div>}
    <form onSubmit={submit} className="stack">
      {mode === 'register' && <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
      <label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
      <label>Password<input required minLength="8" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>
      <button className="btn primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <p className="switch-auth">{mode === 'login' ? 'New to PharmaCare?' : 'Already have an account?'} <button className="link-button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
  </div></div>;
}

function Shell({ user, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/medicines', label: 'Medicine inventory', icon: Pill },
    { to: '/sales/new', label: 'New sale', icon: ShoppingCart },
    { to: '/sales', label: 'Sales history', icon: ClipboardList }
  ];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?'open':''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><strong>PharmaCare</strong><small>Management Suite</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{links.map(({to,label,icon:Icon,end})=><NavLink key={to} end={end} to={to} onClick={()=>setMobileOpen(false)} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="profile"><div className="avatar">{user?.name?.slice(0,1)?.toUpperCase()||'U'}</div><div className="profile-text"><strong>{user?.name||'User'}</strong><small>Pharmacy staff</small></div><button className="icon-button" title="Sign out" onClick={onLogout}><LogOut size={17}/></button></div></div>
    </aside>
    {mobileOpen && <button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Close menu"/>}
    <main className="main-area"><header className="topbar"><button className="icon-button mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}><Menu/></button><div><span className="topbar-kicker">PHARMACY MANAGEMENT</span><strong>Operations overview</strong></div><div className="topbar-right"><span className="status-dot"/> System workspace <span className="date-chip">{new Date().toLocaleDateString()}</span></div></header><div className="page-content">{children}</div><footer>PharmaCare <span>•</span> Educational project starter</footer></main>
  </div>;
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</div>;
}
function StatCard({ title, value, note, icon: Icon, tone='teal' }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={21}/></div><div className="stat-title">{title}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}
function Dashboard() {
  const [data,setData] = useState(null); const [error,setError] = useState('');
  useEffect(()=>{api.get('/dashboard').then(r=>setData(r.data)).catch(e=>setError(e.response?.data?.message||'Could not load dashboard.'));},[]);
  return <><PageHeading eyebrow="OVERVIEW" title="Good day 👋" subtitle="Here is what is happening in your pharmacy today."/>
    {error && <div className="alert error">{error}</div>}
    <div className="stats-grid">
      <StatCard title="Medicine products" value={data?.medicineCount ?? '—'} note="Unique inventory items" icon={Package}/>
      <StatCard title="Low-stock items" value={data?.lowStockCount ?? '—'} note="At or below reorder level" icon={AlertTriangle} tone="amber"/>
      <StatCard title="Inventory value" value={data?money(data.inventoryValue):'—'} note="Based on purchase price" icon={DollarSign} tone="blue"/>
      <StatCard title="Sales today" value={data?money(data.todaySalesTotal):'—'} note="Gross sales recorded today" icon={TrendingUp} tone="purple"/>
    </div>
    <div className="content-grid"><section className="panel"><div className="panel-heading"><div><h2>Recent sales</h2><p className="muted">Latest transactions recorded</p></div><NavLink className="text-link" to="/sales">View all →</NavLink></div>
      {!data?.recentSales?.length ? <div className="empty-state"><div className="empty-icon"><ShoppingCart/></div><strong>No sales yet</strong><p>When you record a sale, it will appear here.</p><NavLink to="/sales/new" className="btn primary">Record first sale</NavLink></div> : <div className="table-wrap"><table><thead><tr><th>Sale ID</th><th>Date</th><th>Items</th><th className="right">Total</th></tr></thead><tbody>{data.recentSales.map(s=><tr key={s._id}><td className="mono">#{s._id.slice(-6).toUpperCase()}</td><td>{dateText(s.createdAt)}</td><td>{s.items.reduce((n,i)=>n+i.quantity,0)} units</td><td className="right strong">{money(s.total)}</td></tr>)}</tbody></table></div>}
    </section><section className="panel tips-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p className="muted">Common tasks</p></div></div><NavLink to="/medicines" className="quick-action"><span className="quick-icon teal"><Pill/></span><span><strong>Manage inventory</strong><small>Add or update medicine details</small></span><span className="arrow">→</span></NavLink><NavLink to="/sales/new" className="quick-action"><span className="quick-icon blue"><ShoppingCart/></span><span><strong>Record a sale</strong><small>Update stock after checkout</small></span><span className="arrow">→</span></NavLink><div className="notice"><AlertTriangle size={18}/><p><strong>Stock reminder</strong><br/>Review low-stock items regularly and check expiry dates.</p></div></section></div>
  </>;
}

const emptyMedicine = {name:'',genericName:'',category:'General',batchNumber:'',supplier:'',expiryDate:'',quantity:'',reorderLevel:10,purchasePrice:'',sellingPrice:''};
function Medicines() {
  const [items,setItems] = useState([]); const [search,setSearch] = useState(''); const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState(null); const [form,setForm] = useState(emptyMedicine); const [error,setError] = useState(''); const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const load = async()=>{setLoading(true);try{const {data}=await api.get('/medicines',{params:{search}});setItems(data);setError('');}catch(e){setError(e.response?.data?.message||'Unable to load medicines.');}finally{setLoading(false);}};
  useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t);},[search]);
  const openAdd=()=>{setEditing(null);setForm(emptyMedicine);setError('');setModal(true);};
  const openEdit=(m)=>{setEditing(m._id);setForm({...m,expiryDate:m.expiryDate?.slice(0,10),quantity:String(m.quantity),purchasePrice:String(m.purchasePrice),sellingPrice:String(m.sellingPrice)});setError('');setModal(true);};
  const save=async(e)=>{e.preventDefault();setBusy(true);setError('');try{const payload={...form,quantity:Number(form.quantity),reorderLevel:Number(form.reorderLevel),purchasePrice:Number(form.purchasePrice),sellingPrice:Number(form.sellingPrice)};if(editing)await api.put(`/medicines/${editing}`,payload);else await api.post('/medicines',payload);setModal(false);await load();}catch(err){setError(err.response?.data?.message||'Could not save medicine.');}finally{setBusy(false);}};
  const remove=async(m)=>{if(!confirm(`Delete ${m.name}?`))return;try{await api.delete(`/medicines/${m._id}`);await load();}catch(e){setError(e.response?.data?.message||'Could not delete medicine.');}};
  return <><PageHeading eyebrow="INVENTORY" title="Medicine inventory" subtitle="Track medicine details, stock levels, and expiry dates." action={<button className="btn primary" onClick={openAdd}><Plus size={17}/> Add medicine</button>}/>
    {error && !modal && <div className="alert error">{error}</div>}
    <section className="panel"><div className="inventory-toolbar"><div className="searchbox"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by medicine, generic name, batch…"/></div><span className="count-label">{items.length} products</span></div>
      <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Category</th><th>Batch no.</th><th>Expiry</th><th>Stock</th><th>Sell price</th><th>Actions</th></tr></thead><tbody>
      {items.map(m=>{const expired=isExpired(m.expiryDate);return <tr key={m._id}><td><div className="medicine-cell"><span className="medicine-icon"><Pill size={17}/></span><span><strong>{m.name}</strong><small>{m.genericName||'Generic name not set'}</small></span></div></td><td>{m.category}</td><td className="mono">{m.batchNumber||'—'}</td><td><span className={expired?'danger-text':''}>{dateText(m.expiryDate)}</span>{expired&&<small className="expiry-warning">Expired — not for sale</small>}</td><td><span className={`stock-badge ${m.quantity<=m.reorderLevel?'low':''}`}>{m.quantity} units</span></td><td className="strong">{money(m.sellingPrice)}</td><td><div className="row-actions"><button className="icon-button" title={`Edit ${m.name}`} aria-label={`Edit ${m.name}`} onClick={()=>openEdit(m)}><Pencil size={16}/></button><button className="icon-button danger-hover" title={`Delete ${m.name}`} aria-label={`Delete ${m.name}`} onClick={()=>remove(m)}><Trash2 size={16}/></button></div></td></tr>})}
      {loading&&<tr><td colSpan="7"><div className="table-empty">Loading inventory…</div></td></tr>}
      {!loading&&!items.length&&<tr><td colSpan="7"><div className="table-empty">{search?'No medicines match your search.':'No medicines yet. Add your first product to get started.'}</div></td></tr>}
      </tbody></table></div>
    </section>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="modal"><div className="modal-heading"><div><p className="eyebrow">{editing?'UPDATE ITEM':'NEW PRODUCT'}</p><h2>{editing?'Edit medicine':'Add medicine'}</h2></div><button className="icon-button" onClick={()=>setModal(false)}><X/></button></div>
      {error&&<div className="alert error">{error}</div>}<form onSubmit={save} className="form-grid">
        <label>Medicine name *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Generic name<input value={form.genericName} onChange={e=>setForm({...form,genericName:e.target.value})}/></label>
        <label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Batch number<input value={form.batchNumber} onChange={e=>setForm({...form,batchNumber:e.target.value})}/></label>
        <label>Supplier<input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></label><label>Expiry date *<input type="date" required value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})}/></label>
        <label>Quantity in stock *<input type="number" min="0" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label><label>Reorder level<input type="number" min="0" value={form.reorderLevel} onChange={e=>setForm({...form,reorderLevel:e.target.value})}/></label>
        <label>Purchase price (LKR) *<input type="number" min="0" step="0.01" required value={form.purchasePrice} onChange={e=>setForm({...form,purchasePrice:e.target.value})}/></label><label>Selling price (LKR) *<input type="number" min="0" step="0.01" required value={form.sellingPrice} onChange={e=>setForm({...form,sellingPrice:e.target.value})}/></label>
        <div className="form-actions"><button type="button" className="btn secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn primary" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Add medicine'}</button></div>
      </form></div></div>}
  </>;
}

function NewSale() {
  const [medicines,setMedicines] = useState([]); const [selected,setSelected] = useState(''); const [qty,setQty] = useState(1);
  const [cart,setCart] = useState([]); const [error,setError] = useState(''); const [success,setSuccess] = useState(''); const [busy,setBusy] = useState(false);
  useEffect(()=>{api.get('/medicines').then(r=>setMedicines(r.data)).catch(()=>setError('Unable to load inventory.'));},[]);
  const add=()=>{setError('');const m=medicines.find(x=>x._id===selected);if(!m)return setError('Choose a medicine first.');if(!Number.isInteger(Number(qty))||Number(qty)<1)return setError('Enter a valid quantity.');const existing=cart.find(x=>x._id===m._id);const nextQty=Number(qty)+(existing?.quantity||0);if(nextQty>m.quantity)return setError(`Only ${m.quantity} units of ${m.name} are available.`);setCart(existing?cart.map(x=>x._id===m._id?{...x,quantity:nextQty}:x):[...cart,{...m,quantity:Number(qty)}]);setQty(1);setSelected('');};
  const total=cart.reduce((sum,m)=>sum+m.quantity*m.sellingPrice,0);
  const availableMedicines=medicines.filter(m=>m.quantity>0&&!isExpired(m.expiryDate));
  const checkout=async()=>{setBusy(true);setError('');setSuccess('');try{const {data}=await api.post('/sales',{items:cart.map(m=>({medicineId:m._id,quantity:m.quantity}))});setSuccess(`Sale #${data._id.slice(-6).toUpperCase()} recorded successfully.`);setCart([]);const res=await api.get('/medicines');setMedicines(res.data);}catch(e){setError(e.response?.data?.message||'Could not complete sale.');}finally{setBusy(false);}};
  return <><PageHeading eyebrow="POINT OF SALE" title="New sale" subtitle="Select items and quantities to record a transaction."/>
    {error&&<div className="alert error">{error}</div>}{success&&<div className="alert success">{success}</div>}
    <div className="sale-layout"><section className="panel"><div className="panel-heading"><div><h2>Add items</h2><p className="muted">Choose from available inventory</p></div></div><div className="add-to-cart"><label className="grow">Medicine<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">{availableMedicines.length?'Select medicine…':'No unexpired stock available'}</option>{availableMedicines.map(m=><option key={m._id} value={m._id}>{m.name} — {m.quantity} in stock</option>)}</select></label><label className="qty-label">Qty<input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}/></label><button className="btn primary add-btn" onClick={add}><Plus size={17}/> Add</button></div>
      <div className="table-wrap"><table><thead><tr><th>Item</th><th>Unit price</th><th>Quantity</th><th className="right">Subtotal</th><th></th></tr></thead><tbody>{cart.map(m=><tr key={m._id}><td><strong>{m.name}</strong></td><td>{money(m.sellingPrice)}</td><td>{m.quantity}</td><td className="right strong">{money(m.sellingPrice*m.quantity)}</td><td><button className="icon-button danger-hover" onClick={()=>setCart(cart.filter(x=>x._id!==m._id))}><Trash2 size={16}/></button></td></tr>)}{!cart.length&&<tr><td colSpan="5"><div className="table-empty">Your sale is empty. Add an item above.</div></td></tr>}</tbody></table></div>
    </section><aside className="panel checkout-panel"><div className="panel-heading"><div><h2>Order summary</h2><p className="muted">Review before checkout</p></div></div><div className="summary-row"><span>Items</span><strong>{cart.reduce((n,m)=>n+m.quantity,0)} units</strong></div><div className="summary-row"><span>Subtotal</span><strong>{money(total)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><button className="btn primary full checkout-btn" disabled={!cart.length||busy} onClick={checkout}><ShoppingCart size={18}/>{busy?'Processing…':'Complete sale'}</button><p className="fine-print">Stock is reduced automatically when the sale is saved.</p></aside></div>
  </>;
}

function SalesHistory() {
  const [sales,setSales] = useState([]); const [error,setError] = useState('');
  useEffect(()=>{api.get('/sales').then(r=>setSales(r.data)).catch(e=>setError(e.response?.data?.message||'Unable to load sales.'));},[]);
  const total = useMemo(()=>sales.reduce((n,s)=>n+s.total,0),[sales]);
  return <><PageHeading eyebrow="TRANSACTIONS" title="Sales history" subtitle="Review previously recorded pharmacy sales." action={<NavLink className="btn primary" to="/sales/new"><Plus size={17}/> New sale</NavLink>}/>
    {error&&<div className="alert error">{error}</div>}<div className="history-summary"><div><span>Total transactions</span><strong>{sales.length}</strong></div><div><span>Sales value (loaded history)</span><strong>{money(total)}</strong></div></div>
    <section className="panel"><div className="panel-heading"><div><h2>All transactions</h2><p className="muted">Most recent first · up to 200 records</p></div></div><div className="table-wrap"><table><thead><tr><th>Sale reference</th><th>Date & time</th><th>Items</th><th>Units</th><th className="right">Total</th></tr></thead><tbody>{sales.map(s=><tr key={s._id}><td className="mono">#{s._id.slice(-6).toUpperCase()}</td><td>{new Date(s.createdAt).toLocaleString()}</td><td>{s.items.map(i=>i.medicineName).join(', ')}</td><td>{s.items.reduce((n,i)=>n+i.quantity,0)}</td><td className="right strong">{money(s.total)}</td></tr>)}{!sales.length&&<tr><td colSpan="5"><div className="table-empty">No transactions recorded yet.</div></td></tr>}</tbody></table></div></section>
  </>;
}

export default function App() {
  const [user,setUser] = useState(()=>{if(!localStorage.getItem('pharmacy_token'))return null;try{return JSON.parse(localStorage.getItem('pharmacy_user')||'null')}catch{return null}});
  const navigate=useNavigate();
  const logout=()=>{localStorage.removeItem('pharmacy_token');localStorage.removeItem('pharmacy_user');setUser(null);navigate('/');};
  useEffect(()=>{
    const handleUnauthorized=()=>{setUser(null);navigate('/',{replace:true});};
    window.addEventListener('pharmacy:unauthorized',handleUnauthorized);
    return()=>window.removeEventListener('pharmacy:unauthorized',handleUnauthorized);
  },[navigate]);
  if(!user) return <AuthPage onLogin={u=>{setUser(u);navigate('/');}}/>;
  return <Shell user={user} onLogout={logout}><Routes><Route path="/" element={<Dashboard/>}/><Route path="/medicines" element={<Medicines/>}/><Route path="/sales/new" element={<NewSale/>}/><Route path="/sales" element={<SalesHistory/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Shell>;
}
