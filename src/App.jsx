import React, { useEffect, useMemo, useState } from 'react';
import Tesseract from 'tesseract.js';

const STORAGE_KEY = 'irl-upgraded-app-v1';

const defaultState = {
  leads: [],
  loads: [],
  expenses: [],
  invoices: [],
  docs: [],
  settings: {
    repName: '',
    defaultTaxRate: 25,
  },
};

const emptyLead = {
  id: '',
  date: today(),
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  businessType: '',
  contactMethod: 'Walk-in',
  interestLevel: 'Warm',
  status: 'New',
  servicesNeeded: '',
  followUpDate: '',
  notes: '',
  rawScanText: '',
  attachmentName: '',
  attachmentDataUrl: '',
};

const emptyLoad = {
  id: '',
  date: today(),
  customer: '',
  pickup: '',
  delivery: '',
  miles: '',
  rate: '',
  expenses: '',
  taxRate: 25,
  paidStatus: 'Unpaid',
  notes: '',
  attachmentName: '',
  attachmentDataUrl: '',
};

const emptyExpense = {
  id: '',
  date: today(),
  category: 'Fuel',
  description: '',
  amount: '',
  paymentMethod: 'Card',
  notes: '',
};

const emptyQuote = {
  miles: '',
  offeredRate: '',
  estimatedExpenses: '',
};

const tabs = ['Dashboard', 'Leads', 'Loads', 'Finance', 'Documents', 'Quote Tool'];
const leadStatuses = ['New', 'Contacted', 'Waiting', 'Quoted', 'Won', 'Lost'];
const interestLevels = ['Hot', 'Warm', 'Cold'];
const businessTypes = ['Warehouse', 'Machine Shop', 'Construction', 'Office', 'Retail', 'Other'];
const paidStatuses = ['Unpaid', 'Partially Paid', 'Paid'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currency(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function interestClass(level) {
  if (level === 'Hot') return 'pill hot';
  if (level === 'Warm') return 'pill warm';
  return 'pill cold';
}

function statusClass(status) {
  return `status status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function Card({ title, right, children }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseBusinessCard(text) {
  const clean = text.replace(/\r/g, '');
  const lines = clean
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const email = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone =
    clean.match(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/)?.[0] || '';
  const website =
    clean.match(/(?:https?:\/\/)?(?:www\.)?[A-Z0-9.-]+\.[A-Z]{2,}(?:\/\S*)?/i)?.[0] || '';

  let companyName = '';
  let contactName = '';
  const addressLine = lines.find((line) => /\d+/.test(line) && /(st|street|rd|road|ave|avenue|blvd|drive|dr|lane|ln|way|tx|suite|ste)/i.test(line)) || '';

  const nameCandidates = lines.filter(
    (line) =>
      !line.includes('@') &&
      !/\d{3}/.test(line) &&
      !/(www\.|http|street|road|ave|blvd|suite|ste|tx)/i.test(line) &&
      /^[A-Za-z .,&'-]+$/.test(line)
  );

  if (nameCandidates.length > 0) {
    contactName = nameCandidates[0] || '';
    companyName = nameCandidates[1] || nameCandidates[0] || '';
  }

  if (nameCandidates.length > 1 && /llc|inc|logistics|transport|services|company|co\.?/i.test(nameCandidates[0])) {
    companyName = nameCandidates[0];
    contactName = nameCandidates[1] || '';
  }

  if (!companyName) {
    companyName = lines.find((line) => /llc|inc|logistics|transport|services|company|co\.?/i.test(line)) || lines[0] || '';
  }

  if (!contactName) {
    contactName = lines.find((line) => /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line)) || '';
  }

  return {
    companyName,
    contactName,
    phone,
    email,
    website,
    address: addressLine,
    rawScanText: clean,
  };
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState('Dashboard');
  const [leadForm, setLeadForm] = useState({ ...emptyLead, taxRate: state.settings.defaultTaxRate });
  const [loadForm, setLoadForm] = useState({ ...emptyLoad, taxRate: state.settings.defaultTaxRate });
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [quoteForm, setQuoteForm] = useState(emptyQuote);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadFilterStatus, setLeadFilterStatus] = useState('All');
  const [leadFilterInterest, setLeadFilterInterest] = useState('All');
  const [loadFilterPaid, setLoadFilterPaid] = useState('All');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');

  useEffect(() => {
    saveState(state);
  }, [state]);

  const dashboard = useMemo(() => {
    const hotLeads = state.leads.filter((lead) => lead.interestLevel === 'Hot').length;
    const dueToday = state.leads.filter((lead) => lead.followUpDate && lead.followUpDate <= today() && !['Won', 'Lost'].includes(lead.status)).length;
    const unpaidLoads = state.loads.filter((load) => load.paidStatus !== 'Paid').length;
    const totalRevenue = state.loads.reduce((sum, load) => sum + toNumber(load.rate), 0);
    const totalExpenses = state.loads.reduce((sum, load) => sum + toNumber(load.expenses), 0) + state.expenses.reduce((sum, e) => sum + toNumber(e.amount), 0);
    const totalProfit = state.loads.reduce((sum, load) => sum + calcLoad(load).profit, 0);
    const totalTax = state.loads.reduce((sum, load) => sum + calcLoad(load).taxSetAside, 0);
    return { hotLeads, dueToday, unpaidLoads, totalRevenue, totalExpenses, totalProfit, totalTax };
  }, [state]);

  const leadDuplicates = useMemo(() => {
    const map = new Map();
    state.leads.forEach((lead) => {
      const key = `${lead.companyName.toLowerCase()}|${lead.phone}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [state.leads]);

  const filteredLeads = useMemo(() => {
    return state.leads.filter((lead) => {
      const matchesSearch = !leadSearch || [lead.companyName, lead.contactName, lead.phone, lead.email, lead.address].join(' ').toLowerCase().includes(leadSearch.toLowerCase());
      const matchesStatus = leadFilterStatus === 'All' || lead.status === leadFilterStatus;
      const matchesInterest = leadFilterInterest === 'All' || lead.interestLevel === leadFilterInterest;
      return matchesSearch && matchesStatus && matchesInterest;
    });
  }, [state.leads, leadSearch, leadFilterStatus, leadFilterInterest]);

  const filteredLoads = useMemo(() => {
    return state.loads.filter((load) => loadFilterPaid === 'All' || load.paidStatus === loadFilterPaid);
  }, [state.loads, loadFilterPaid]);

  async function handleLeadAttachment(file) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setLeadForm((prev) => ({ ...prev, attachmentName: file.name, attachmentDataUrl: dataUrl }));
  }

  async function handleLoadAttachment(file) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setLoadForm((prev) => ({ ...prev, attachmentName: file.name, attachmentDataUrl: dataUrl }));
  }

  async function scanBusinessCard(file) {
    if (!file) return;
    await handleLeadAttachment(file);
    setOcrBusy(true);
    setOcrProgress('Reading card...');
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status) setOcrProgress(`${m.status}${m.progress ? ` ${Math.round(m.progress * 100)}%` : ''}`);
        },
      });
      const parsed = parseBusinessCard(data.text || '');
      setLeadForm((prev) => ({
        ...prev,
        ...parsed,
        date: prev.date || today(),
      }));
      setOcrProgress('Scan complete. Review the fields before saving.');
    } catch (error) {
      setOcrProgress('Scan failed. Try a clearer photo with better lighting.');
    } finally {
      setOcrBusy(false);
    }
  }

  function saveLead() {
    const duplicateKey = `${leadForm.companyName.toLowerCase()}|${leadForm.phone}`;
    const isDuplicate = leadDuplicates.get(duplicateKey) > 0;
    const lead = { ...leadForm, id: makeId('lead') };
    setState((prev) => ({
      ...prev,
      leads: [lead, ...prev.leads],
      docs: lead.attachmentDataUrl
        ? [{ id: makeId('doc'), kind: 'Lead Attachment', name: lead.attachmentName || 'Lead image', date: lead.date, relatedTo: lead.companyName, dataUrl: lead.attachmentDataUrl }, ...prev.docs]
        : prev.docs,
    }));
    setLeadForm(emptyLead);
    setOcrProgress(isDuplicate ? 'Saved, but this looks like a duplicate lead.' : 'Lead saved.');
  }

  function saveLoad() {
    const load = { ...loadForm, id: makeId('load') };
    setState((prev) => ({
      ...prev,
      loads: [load, ...prev.loads],
      docs: load.attachmentDataUrl
        ? [{ id: makeId('doc'), kind: 'Load Attachment', name: load.attachmentName || 'Load image', date: load.date, relatedTo: load.customer || load.id, dataUrl: load.attachmentDataUrl }, ...prev.docs]
        : prev.docs,
    }));
    setLoadForm({ ...emptyLoad, taxRate: prevTaxRate(state) });
  }

  function prevTaxRate(currentState) {
    return currentState.settings.defaultTaxRate || 25;
  }

  function saveExpense() {
    const expense = { ...expenseForm, id: makeId('expense') };
    setState((prev) => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    setExpenseForm(emptyExpense);
  }

  function updateLead(id, patch) {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
    }));
  }

  function calcLoad(load) {
    const rate = toNumber(load.rate);
    const expenses = toNumber(load.expenses);
    const profit = Math.max(rate - expenses, 0);
    const taxRate = toNumber(load.taxRate) / 100;
    const taxSetAside = profit * taxRate;
    const takeHome = profit - taxSetAside;
    return { rate, expenses, profit, taxRate, taxSetAside, takeHome };
  }

  const quoteStats = useMemo(() => {
    const miles = toNumber(quoteForm.miles);
    const offeredRate = toNumber(quoteForm.offeredRate);
    const estimatedExpenses = toNumber(quoteForm.estimatedExpenses);
    const rpm = miles > 0 ? offeredRate / miles : 0;
    const estProfit = offeredRate - estimatedExpenses;
    let decision = 'PASS';
    if (rpm >= 2 && estProfit > 0) decision = 'TAKE';
    if (rpm >= 2.5 && estProfit > 150) decision = 'STRONG TAKE';
    return { miles, offeredRate, estimatedExpenses, rpm, estProfit, decision };
  }, [quoteForm]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Iron Republic Logistics</h1>
          <p>Lead tracking, loads, taxes, follow-ups, scanner, and paperwork in one field system.</p>
        </div>
        <div className="settings-box">
          <Field label="Default Tax %">
            <input
              type="number"
              value={state.settings.defaultTaxRate}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, defaultTaxRate: Number(e.target.value || 25) },
                }))
              }
            />
          </Field>
        </div>
      </header>

      <nav className="tabbar">
        {tabs.map((name) => (
          <button key={name} className={tab === name ? 'tab active' : 'tab'} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </nav>

      {tab === 'Dashboard' && (
        <div className="grid two-col">
          <div className="stats-grid">
            <Stat title="Total Leads" value={state.leads.length} />
            <Stat title="Hot Leads" value={dashboard.hotLeads} />
            <Stat title="Follow-Ups Due" value={dashboard.dueToday} alert={dashboard.dueToday > 0} />
            <Stat title="Unpaid Loads" value={dashboard.unpaidLoads} alert={dashboard.unpaidLoads > 0} />
            <Stat title="Total Profit" value={currency(dashboard.totalProfit)} />
            <Stat title="Taxes to Set Aside" value={currency(dashboard.totalTax)} />
          </div>
          <Card title="Follow-Ups Due Today">
            <div className="list-stack">
              {state.leads.filter((lead) => lead.followUpDate && lead.followUpDate <= today() && !['Won', 'Lost'].includes(lead.status)).length === 0 ? (
                <Empty text="No follow-ups due right now." />
              ) : (
                state.leads
                  .filter((lead) => lead.followUpDate && lead.followUpDate <= today() && !['Won', 'Lost'].includes(lead.status))
                  .map((lead) => (
                    <div key={lead.id} className="list-item">
                      <div>
                        <strong>{lead.companyName || 'Unnamed lead'}</strong>
                        <p>{lead.contactName} • {lead.phone}</p>
                        <p>{lead.followUpDate}</p>
                      </div>
                      <div className="stack-right">
                        <span className={interestClass(lead.interestLevel)}>{lead.interestLevel}</span>
                        <button className="small-btn" onClick={() => updateLead(lead.id, { status: 'Contacted', followUpDate: '' })}>Mark contacted</button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
          <Card title="Recent Leads">
            <div className="list-stack">
              {state.leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="list-item compact">
                  <div>
                    <strong>{lead.companyName}</strong>
                    <p>{lead.contactName} • {lead.phone}</p>
                  </div>
                  <div className="stack-right">
                    <span className={statusClass(lead.status)}>{lead.status}</span>
                    <span className={interestClass(lead.interestLevel)}>{lead.interestLevel}</span>
                  </div>
                </div>
              ))}
              {state.leads.length === 0 && <Empty text="No leads yet." />}
            </div>
          </Card>
          <Card title="Recent Loads">
            <div className="list-stack">
              {state.loads.slice(0, 5).map((load) => {
                const c = calcLoad(load);
                return (
                  <div key={load.id} className="list-item compact">
                    <div>
                      <strong>{load.customer || 'Unnamed customer'}</strong>
                      <p>{load.pickup} → {load.delivery}</p>
                    </div>
                    <div className="stack-right align-right">
                      <strong>{currency(c.profit)}</strong>
                      <span className={statusClass(load.paidStatus)}>{load.paidStatus}</span>
                    </div>
                  </div>
                );
              })}
              {state.loads.length === 0 && <Empty text="No loads logged yet." />}
            </div>
          </Card>
        </div>
      )}

      {tab === 'Leads' && (
        <div className="grid two-col">
          <Card title="Lead Capture" right={ocrBusy ? <span className="muted">{ocrProgress}</span> : <span className="muted">Scan → review → save</span>}>
            <div className="form-grid">
              <Field label="Scan Business Card">
                <input type="file" accept="image/*" capture="environment" onChange={(e) => scanBusinessCard(e.target.files?.[0])} />
              </Field>
              <Field label="Attach Image">
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleLeadAttachment(e.target.files?.[0])} />
              </Field>
              <Field label="Date"><input type="date" value={leadForm.date} onChange={(e) => setLeadForm({ ...leadForm, date: e.target.value })} /></Field>
              <Field label="Business Type">
                <select value={leadForm.businessType} onChange={(e) => setLeadForm({ ...leadForm, businessType: e.target.value })}>
                  <option value="">Select</option>
                  {businessTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="Company Name"><input value={leadForm.companyName} onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })} /></Field>
              <Field label="Contact Name"><input value={leadForm.contactName} onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })} /></Field>
              <Field label="Phone"><input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} /></Field>
              <Field label="Email"><input value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} /></Field>
              <Field label="Website"><input value={leadForm.website} onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })} /></Field>
              <Field label="Address"><input value={leadForm.address} onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })} /></Field>
              <Field label="Contact Method">
                <select value={leadForm.contactMethod} onChange={(e) => setLeadForm({ ...leadForm, contactMethod: e.target.value })}>
                  <option>Walk-in</option>
                  <option>Cold Call</option>
                  <option>Referral</option>
                  <option>Repeat Visit</option>
                </select>
              </Field>
              <Field label="Follow-Up Date"><input type="date" value={leadForm.followUpDate} onChange={(e) => setLeadForm({ ...leadForm, followUpDate: e.target.value })} /></Field>
            </div>

            <div className="segmented-row">
              <span className="seg-label">Interest</span>
              {interestLevels.map((level) => (
                <button key={level} className={leadForm.interestLevel === level ? `${interestClass(level)} active-btn` : interestClass(level)} onClick={() => setLeadForm({ ...leadForm, interestLevel: level })}>
                  {level}
                </button>
              ))}
            </div>
            <div className="segmented-row">
              <span className="seg-label">Status</span>
              {leadStatuses.map((status) => (
                <button key={status} className={leadForm.status === status ? `${statusClass(status)} active-btn` : statusClass(status)} onClick={() => setLeadForm({ ...leadForm, status })}>
                  {status}
                </button>
              ))}
            </div>

            <Field label="Services Needed"><textarea value={leadForm.servicesNeeded} onChange={(e) => setLeadForm({ ...leadForm, servicesNeeded: e.target.value })} /></Field>
            <Field label="Notes"><textarea value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} /></Field>
            <Field label="Raw Scan Text"><textarea value={leadForm.rawScanText} onChange={(e) => setLeadForm({ ...leadForm, rawScanText: e.target.value })} /></Field>

            <div className="action-row">
              <button className="primary-btn" onClick={saveLead}>Save Lead</button>
              <button className="secondary-btn" onClick={() => { setLeadForm(emptyLead); setOcrProgress(''); }}>Clear</button>
              {ocrProgress ? <span className="muted strong">{ocrProgress}</span> : null}
            </div>
          </Card>

          <Card title="Lead List" right={<div className="filter-row compact"><input placeholder="Search leads" value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} /><select value={leadFilterStatus} onChange={(e) => setLeadFilterStatus(e.target.value)}><option>All</option>{leadStatuses.map((s) => <option key={s}>{s}</option>)}</select><select value={leadFilterInterest} onChange={(e) => setLeadFilterInterest(e.target.value)}><option>All</option>{interestLevels.map((s) => <option key={s}>{s}</option>)}</select></div>}>
            <div className="list-stack">
              {filteredLeads.length === 0 ? <Empty text="No matching leads." /> : filteredLeads.map((lead) => {
                const key = `${lead.companyName.toLowerCase()}|${lead.phone}`;
                const duplicate = leadDuplicates.get(key) > 1;
                return (
                  <div key={lead.id} className="list-item wide">
                    <div>
                      <div className="title-row">
                        <strong>{lead.companyName || 'Unnamed lead'}</strong>
                        {duplicate ? <span className="warn-badge">Possible duplicate</span> : null}
                      </div>
                      <p>{lead.contactName} • {lead.phone} • {lead.email}</p>
                      <p>{lead.address}</p>
                      <p>{lead.notes}</p>
                    </div>
                    <div className="stack-right">
                      <span className={interestClass(lead.interestLevel)}>{lead.interestLevel}</span>
                      <span className={statusClass(lead.status)}>{lead.status}</span>
                      {lead.followUpDate ? <span className={lead.followUpDate <= today() ? 'warn-badge' : 'muted'}>Follow up {lead.followUpDate}</span> : null}
                      <div className="mini-actions">
                        <button className="small-btn" onClick={() => updateLead(lead.id, { status: 'Quoted' })}>Quoted</button>
                        <button className="small-btn" onClick={() => updateLead(lead.id, { status: 'Won' })}>Won</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'Loads' && (
        <div className="grid two-col">
          <Card title="Load Tracker">
            <div className="form-grid">
              <Field label="Date"><input type="date" value={loadForm.date} onChange={(e) => setLoadForm({ ...loadForm, date: e.target.value })} /></Field>
              <Field label="Customer"><input value={loadForm.customer} onChange={(e) => setLoadForm({ ...loadForm, customer: e.target.value })} /></Field>
              <Field label="Pickup"><input value={loadForm.pickup} onChange={(e) => setLoadForm({ ...loadForm, pickup: e.target.value })} /></Field>
              <Field label="Delivery"><input value={loadForm.delivery} onChange={(e) => setLoadForm({ ...loadForm, delivery: e.target.value })} /></Field>
              <Field label="Miles"><input type="number" value={loadForm.miles} onChange={(e) => setLoadForm({ ...loadForm, miles: e.target.value })} /></Field>
              <Field label="Rate"><input type="number" value={loadForm.rate} onChange={(e) => setLoadForm({ ...loadForm, rate: e.target.value })} /></Field>
              <Field label="Expenses"><input type="number" value={loadForm.expenses} onChange={(e) => setLoadForm({ ...loadForm, expenses: e.target.value })} /></Field>
              <Field label="Tax %"><input type="number" value={loadForm.taxRate} onChange={(e) => setLoadForm({ ...loadForm, taxRate: e.target.value })} /></Field>
              <Field label="Paid Status">
                <select value={loadForm.paidStatus} onChange={(e) => setLoadForm({ ...loadForm, paidStatus: e.target.value })}>
                  {paidStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </Field>
              <Field label="Attach POD / BOL / Image"><input type="file" accept="image/*,.pdf" onChange={(e) => handleLoadAttachment(e.target.files?.[0])} /></Field>
            </div>
            <Field label="Notes"><textarea value={loadForm.notes} onChange={(e) => setLoadForm({ ...loadForm, notes: e.target.value })} /></Field>

            <div className="summary-strip">
              {(() => {
                const c = calcLoad(loadForm);
                return (
                  <>
                    <SummaryChip label="Profit" value={currency(c.profit)} />
                    <SummaryChip label="Tax Set Aside" value={currency(c.taxSetAside)} />
                    <SummaryChip label="Take Home" value={currency(c.takeHome)} />
                  </>
                );
              })()}
            </div>

            <div className="action-row">
              <button className="primary-btn" onClick={saveLoad}>Save Load</button>
              <button className="secondary-btn" onClick={() => setLoadForm({ ...emptyLoad, taxRate: state.settings.defaultTaxRate })}>Clear</button>
            </div>
          </Card>

          <Card title="Saved Loads" right={<div className="filter-row compact"><select value={loadFilterPaid} onChange={(e) => setLoadFilterPaid(e.target.value)}><option>All</option>{paidStatuses.map((s) => <option key={s}>{s}</option>)}</select></div>}>
            <div className="list-stack">
              {filteredLoads.length === 0 ? <Empty text="No loads yet." /> : filteredLoads.map((load) => {
                const c = calcLoad(load);
                return (
                  <div key={load.id} className="list-item wide">
                    <div>
                      <strong>{load.customer || 'Unnamed customer'}</strong>
                      <p>{load.pickup} → {load.delivery}</p>
                      <p>{load.date} • {load.miles} miles</p>
                    </div>
                    <div className="stack-right align-right">
                      <strong>{currency(c.profit)}</strong>
                      <span>{currency(c.taxSetAside)} tax</span>
                      <span className={statusClass(load.paidStatus)}>{load.paidStatus}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'Finance' && (
        <div className="grid two-col">
          <Card title="Expense Log">
            <div className="form-grid">
              <Field label="Date"><input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} /></Field>
              <Field label="Category"><select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}><option>Fuel</option><option>Maintenance</option><option>Tolls</option><option>Insurance</option><option>Supplies</option><option>Misc</option></select></Field>
              <Field label="Description"><input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} /></Field>
              <Field label="Amount"><input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></Field>
              <Field label="Payment Method"><select value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}><option>Card</option><option>Cash</option><option>ACH</option><option>Check</option></select></Field>
            </div>
            <Field label="Notes"><textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} /></Field>
            <div className="action-row">
              <button className="primary-btn" onClick={saveExpense}>Save Expense</button>
              <button className="secondary-btn" onClick={() => setExpenseForm(emptyExpense)}>Clear</button>
            </div>
          </Card>

          <Card title="Finance Snapshot">
            <div className="stats-grid small-gap">
              <Stat title="Revenue Logged" value={currency(dashboard.totalRevenue)} />
              <Stat title="Expenses Logged" value={currency(dashboard.totalExpenses)} />
              <Stat title="Profit Logged" value={currency(dashboard.totalProfit)} />
              <Stat title="Taxes to Save" value={currency(dashboard.totalTax)} alert={dashboard.totalTax > 0} />
            </div>
            <div className="list-stack top-gap">
              {state.expenses.length === 0 ? <Empty text="No expenses yet." /> : state.expenses.map((expense) => (
                <div key={expense.id} className="list-item compact">
                  <div>
                    <strong>{expense.category}</strong>
                    <p>{expense.description}</p>
                  </div>
                  <div className="stack-right align-right">
                    <strong>{currency(expense.amount)}</strong>
                    <span>{expense.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'Documents' && (
        <Card title="Stored Documents and Images">
          <div className="list-stack">
            {state.docs.length === 0 ? <Empty text="No stored documents yet." /> : state.docs.map((doc) => (
              <div key={doc.id} className="doc-item">
                <div>
                  <strong>{doc.name}</strong>
                  <p>{doc.kind} • {doc.relatedTo}</p>
                  <p>{doc.date}</p>
                </div>
                {doc.dataUrl?.startsWith('data:image') ? <img src={doc.dataUrl} alt={doc.name} className="doc-thumb" /> : <a href={doc.dataUrl} target="_blank" rel="noreferrer" className="small-btn">Open</a>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Quote Tool' && (
        <div className="grid two-col">
          <Card title="Quick Quote Calculator">
            <div className="form-grid">
              <Field label="Miles"><input type="number" value={quoteForm.miles} onChange={(e) => setQuoteForm({ ...quoteForm, miles: e.target.value })} /></Field>
              <Field label="Offered Rate"><input type="number" value={quoteForm.offeredRate} onChange={(e) => setQuoteForm({ ...quoteForm, offeredRate: e.target.value })} /></Field>
              <Field label="Estimated Expenses"><input type="number" value={quoteForm.estimatedExpenses} onChange={(e) => setQuoteForm({ ...quoteForm, estimatedExpenses: e.target.value })} /></Field>
            </div>
          </Card>
          <Card title="Decision Snapshot">
            <div className="summary-strip vertical">
              <SummaryChip label="Rate Per Mile" value={`$${quoteStats.rpm.toFixed(2)}`} />
              <SummaryChip label="Estimated Profit" value={currency(quoteStats.estProfit)} />
              <SummaryChip label="Decision" value={quoteStats.decision} strong={quoteStats.decision !== 'PASS'} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ title, value, alert = false }) {
  return (
    <div className={alert ? 'stat alert' : 'stat'}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryChip({ label, value, strong = false }) {
  return (
    <div className={strong ? 'chip strong' : 'chip'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}
