import React, { useEffect, useMemo, useState } from 'react';

const storageKeys = {
  outreachEntries: 'irl_outreach_entries',
  invoiceEntries: 'irl_invoice_entries',
  rateConEntries: 'irl_ratecon_entries',
  expenseEntries: 'irl_expense_entries',
  loadEntries: 'irl_load_entries',
};

const initialOutreach = {
  date: '',
  week: '',
  rep: '',
  companyName: '',
  phone: '',
  contactName: '',
  location: '',
  businessType: '',
  contactMethod: '',
  interestLevel: '',
  servicesNeeded: '',
  followUpDate: '',
  notes: '',
};

const initialInvoice = {
  invoiceNumber: '',
  date: '',
  dueDate: '',
  billToCompany: '',
  billToContact: '',
  billToPhone: '',
  billToEmail: '',
  pickup: '',
  delivery: '',
  freight: '',
  weight: '',
  rate: '',
  amount: '',
  terms: 'NET 15',
  paymentMethods: '',
};

const initialRateCon = {
  company: '',
  contactName: '',
  phone: '',
  email: '',
  pickupLocation: '',
  pickupDateTime: '',
  deliveryLocation: '',
  deliveryDateTime: '',
  freight: '',
  weight: '',
  pieces: '',
  agreedRate: '',
  paymentTerms: '',
  specialInstructions: '',
};

const initialExpense = {
  date: '',
  category: '',
  description: '',
  amount: '',
  paymentMethod: '',
  notes: '',
};

const initialLoad = {
  loadId: '',
  date: '',
  pickup: '',
  delivery: '',
  miles: '',
  rate: '',
  expenses: '',
  paid: '',
};

function loadSaved(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}

function TextField({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows="4" />
    </label>
  );
}

function EntryCard({ title, lines, rightText }) {
  return (
    <div className="entry-card">
      <div>
        <div className="entry-title">{title}</div>
        {lines.map((line, index) => (
          <div key={index} className="entry-line">{line}</div>
        ))}
      </div>
      {rightText ? <div className="entry-right">{rightText}</div> : null}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('outreach');
  const [outreachForm, setOutreachForm] = useState(initialOutreach);
  const [invoiceForm, setInvoiceForm] = useState(initialInvoice);
  const [rateConForm, setRateConForm] = useState(initialRateCon);
  const [expenseForm, setExpenseForm] = useState(initialExpense);
  const [loadForm, setLoadForm] = useState(initialLoad);

  const [outreachEntries, setOutreachEntries] = useState([]);
  const [invoiceEntries, setInvoiceEntries] = useState([]);
  const [rateConEntries, setRateConEntries] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [loadEntries, setLoadEntries] = useState([]);

  useEffect(() => {
    setOutreachEntries(loadSaved(storageKeys.outreachEntries, []));
    setInvoiceEntries(loadSaved(storageKeys.invoiceEntries, []));
    setRateConEntries(loadSaved(storageKeys.rateConEntries, []));
    setExpenseEntries(loadSaved(storageKeys.expenseEntries, []));
    setLoadEntries(loadSaved(storageKeys.loadEntries, []));
  }, []);

  useEffect(() => saveData(storageKeys.outreachEntries, outreachEntries), [outreachEntries]);
  useEffect(() => saveData(storageKeys.invoiceEntries, invoiceEntries), [invoiceEntries]);
  useEffect(() => saveData(storageKeys.rateConEntries, rateConEntries), [rateConEntries]);
  useEffect(() => saveData(storageKeys.expenseEntries, expenseEntries), [expenseEntries]);
  useEffect(() => saveData(storageKeys.loadEntries, loadEntries), [loadEntries]);

  const hotLeads = useMemo(
    () => outreachEntries.filter((entry) => String(entry.interestLevel).toLowerCase() === 'hot').length,
    [outreachEntries]
  );

  const followUps = useMemo(
    () => outreachEntries.filter((entry) => entry.followUpDate).length,
    [outreachEntries]
  );

  const totalExpenses = useMemo(
    () => expenseEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0).toFixed(2),
    [expenseEntries]
  );

  const totalLoadProfit = useMemo(
    () => loadEntries.reduce((sum, entry) => sum + (Number(entry.rate || 0) - Number(entry.expenses || 0)), 0).toFixed(2),
    [loadEntries]
  );

  const tabs = [
    ['outreach', 'Outreach'],
    ['invoice', 'Invoice'],
    ['ratecon', 'Rate Con'],
    ['expense', 'Expense'],
    ['load', 'Load'],
  ];

  return (
    <div className="app-shell">
      <div className="app-wrap">
        <header className="panel hero-panel">
          <div>
            <div className="eyebrow">Mobile Business Tool</div>
            <h1>Iron Republic Logistics</h1>
            <p>Track outreach, invoices, rate confirmations, expenses, and load profit from one phone-friendly web app.</p>
          </div>
          <div className="stats-grid compact-stats">
            <div className="stat-card"><span>Total Stops</span><strong>{outreachEntries.length}</strong></div>
            <div className="stat-card"><span>Hot Leads</span><strong>{hotLeads}</strong></div>
            <div className="stat-card"><span>Follow-Ups</span><strong>{followUps}</strong></div>
            <div className="stat-card"><span>Load Profit</span><strong>${totalLoadProfit}</strong></div>
          </div>
        </header>

        <nav className="panel tab-bar">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? 'tab active' : 'tab'}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === 'outreach' && (
          <div className="content-grid">
            <section className="panel">
              <h2>Field Outreach Log</h2>
              <div className="grid three">
                <Field label="Date" type="date" value={outreachForm.date} onChange={(e) => setOutreachForm({ ...outreachForm, date: e.target.value })} />
                <Field label="Week" value={outreachForm.week} onChange={(e) => setOutreachForm({ ...outreachForm, week: e.target.value })} />
                <Field label="Rep" value={outreachForm.rep} onChange={(e) => setOutreachForm({ ...outreachForm, rep: e.target.value })} />
              </div>
              <div className="grid two">
                <Field label="Company Name" value={outreachForm.companyName} onChange={(e) => setOutreachForm({ ...outreachForm, companyName: e.target.value })} />
                <Field label="Phone #" value={outreachForm.phone} onChange={(e) => setOutreachForm({ ...outreachForm, phone: e.target.value })} />
                <Field label="Contact Name" value={outreachForm.contactName} onChange={(e) => setOutreachForm({ ...outreachForm, contactName: e.target.value })} />
                <Field label="Location" value={outreachForm.location} onChange={(e) => setOutreachForm({ ...outreachForm, location: e.target.value })} />
                <Field label="Business Type" value={outreachForm.businessType} onChange={(e) => setOutreachForm({ ...outreachForm, businessType: e.target.value })} />
                <Field label="Contact Method" value={outreachForm.contactMethod} onChange={(e) => setOutreachForm({ ...outreachForm, contactMethod: e.target.value })} />
                <Field label="Interest Level" value={outreachForm.interestLevel} onChange={(e) => setOutreachForm({ ...outreachForm, interestLevel: e.target.value })} />
                <Field label="Follow-Up Date" type="date" value={outreachForm.followUpDate} onChange={(e) => setOutreachForm({ ...outreachForm, followUpDate: e.target.value })} />
              </div>
              <TextField label="Services Needed" value={outreachForm.servicesNeeded} onChange={(e) => setOutreachForm({ ...outreachForm, servicesNeeded: e.target.value })} />
              <TextField label="Notes" value={outreachForm.notes} onChange={(e) => setOutreachForm({ ...outreachForm, notes: e.target.value })} />
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    if (!outreachForm.companyName.trim()) return;
                    setOutreachEntries([{ ...outreachForm }, ...outreachEntries]);
                    setOutreachForm(initialOutreach);
                  }}
                >
                  Save Entry
                </button>
                <button className="secondary" onClick={() => setOutreachForm(initialOutreach)}>Clear</button>
              </div>
            </section>

            <section className="panel">
              <h2>Recent Outreach</h2>
              <div className="entry-list">
                {outreachEntries.length === 0 ? (
                  <div className="empty-state">No outreach entries yet.</div>
                ) : (
                  outreachEntries.map((entry, index) => (
                    <EntryCard
                      key={index}
                      title={entry.companyName}
                      lines={[
                        `${entry.contactName || 'No contact'} • ${entry.phone || 'No phone'}`,
                        entry.location || 'No location',
                        `${entry.interestLevel || 'No interest level'}${entry.followUpDate ? ` • Follow up ${entry.followUpDate}` : ''}`,
                      ]}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {tab === 'invoice' && (
          <div className="content-grid single-left">
            <section className="panel">
              <h2>Invoice Builder</h2>
              <div className="grid two">
                <Field label="Invoice #" value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} />
                <Field label="Date" type="date" value={invoiceForm.date} onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })} />
                <Field label="Due Date" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} />
                <Field label="Bill To Company" value={invoiceForm.billToCompany} onChange={(e) => setInvoiceForm({ ...invoiceForm, billToCompany: e.target.value })} />
                <Field label="Bill To Contact" value={invoiceForm.billToContact} onChange={(e) => setInvoiceForm({ ...invoiceForm, billToContact: e.target.value })} />
                <Field label="Bill To Phone" value={invoiceForm.billToPhone} onChange={(e) => setInvoiceForm({ ...invoiceForm, billToPhone: e.target.value })} />
                <Field label="Bill To Email" value={invoiceForm.billToEmail} onChange={(e) => setInvoiceForm({ ...invoiceForm, billToEmail: e.target.value })} />
                <Field label="Pickup" value={invoiceForm.pickup} onChange={(e) => setInvoiceForm({ ...invoiceForm, pickup: e.target.value })} />
                <Field label="Delivery" value={invoiceForm.delivery} onChange={(e) => setInvoiceForm({ ...invoiceForm, delivery: e.target.value })} />
                <Field label="Freight" value={invoiceForm.freight} onChange={(e) => setInvoiceForm({ ...invoiceForm, freight: e.target.value })} />
                <Field label="Weight" value={invoiceForm.weight} onChange={(e) => setInvoiceForm({ ...invoiceForm, weight: e.target.value })} />
                <Field label="Rate" value={invoiceForm.rate} onChange={(e) => setInvoiceForm({ ...invoiceForm, rate: e.target.value })} />
                <Field label="Amount" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
                <Field label="Terms" value={invoiceForm.terms} onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })} />
                <Field label="Payment Methods" value={invoiceForm.paymentMethods} onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethods: e.target.value })} />
              </div>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    if (!invoiceForm.invoiceNumber.trim()) return;
                    setInvoiceEntries([{ ...invoiceForm }, ...invoiceEntries]);
                    setInvoiceForm(initialInvoice);
                  }}
                >
                  Save Invoice
                </button>
                <button className="secondary" onClick={() => setInvoiceForm(initialInvoice)}>Clear</button>
              </div>
            </section>

            <section className="panel">
              <h2>Saved Invoices</h2>
              <div className="entry-list">
                {invoiceEntries.length === 0 ? (
                  <div className="empty-state">No invoices saved yet.</div>
                ) : (
                  invoiceEntries.map((entry, index) => (
                    <EntryCard
                      key={index}
                      title={`Invoice ${entry.invoiceNumber}`}
                      lines={[
                        entry.billToCompany || 'No customer company',
                        `${entry.pickup || 'No pickup'} → ${entry.delivery || 'No delivery'}`,
                        `Amount: ${entry.amount || '$0'} • Terms: ${entry.terms || 'No terms'}`,
                      ]}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {tab === 'ratecon' && (
          <div className="content-grid single-left">
            <section className="panel">
              <h2>Rate Confirmation</h2>
              <div className="grid two">
                <Field label="Company" value={rateConForm.company} onChange={(e) => setRateConForm({ ...rateConForm, company: e.target.value })} />
                <Field label="Contact Name" value={rateConForm.contactName} onChange={(e) => setRateConForm({ ...rateConForm, contactName: e.target.value })} />
                <Field label="Phone" value={rateConForm.phone} onChange={(e) => setRateConForm({ ...rateConForm, phone: e.target.value })} />
                <Field label="Email" value={rateConForm.email} onChange={(e) => setRateConForm({ ...rateConForm, email: e.target.value })} />
                <Field label="Pickup Location" value={rateConForm.pickupLocation} onChange={(e) => setRateConForm({ ...rateConForm, pickupLocation: e.target.value })} />
                <Field label="Pickup Date/Time" value={rateConForm.pickupDateTime} onChange={(e) => setRateConForm({ ...rateConForm, pickupDateTime: e.target.value })} />
                <Field label="Delivery Location" value={rateConForm.deliveryLocation} onChange={(e) => setRateConForm({ ...rateConForm, deliveryLocation: e.target.value })} />
                <Field label="Delivery Date/Time" value={rateConForm.deliveryDateTime} onChange={(e) => setRateConForm({ ...rateConForm, deliveryDateTime: e.target.value })} />
                <Field label="Freight" value={rateConForm.freight} onChange={(e) => setRateConForm({ ...rateConForm, freight: e.target.value })} />
                <Field label="Weight" value={rateConForm.weight} onChange={(e) => setRateConForm({ ...rateConForm, weight: e.target.value })} />
                <Field label="Pieces" value={rateConForm.pieces} onChange={(e) => setRateConForm({ ...rateConForm, pieces: e.target.value })} />
                <Field label="Agreed Rate" value={rateConForm.agreedRate} onChange={(e) => setRateConForm({ ...rateConForm, agreedRate: e.target.value })} />
                <Field label="Payment Terms" value={rateConForm.paymentTerms} onChange={(e) => setRateConForm({ ...rateConForm, paymentTerms: e.target.value })} />
              </div>
              <TextField label="Special Instructions" value={rateConForm.specialInstructions} onChange={(e) => setRateConForm({ ...rateConForm, specialInstructions: e.target.value })} />
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    if (!rateConForm.company.trim()) return;
                    setRateConEntries([{ ...rateConForm }, ...rateConEntries]);
                    setRateConForm(initialRateCon);
                  }}
                >
                  Save Rate Con
                </button>
                <button className="secondary" onClick={() => setRateConForm(initialRateCon)}>Clear</button>
              </div>
            </section>

            <section className="panel">
              <h2>Saved Rate Cons</h2>
              <div className="entry-list">
                {rateConEntries.length === 0 ? (
                  <div className="empty-state">No rate confirmations saved yet.</div>
                ) : (
                  rateConEntries.map((entry, index) => (
                    <EntryCard
                      key={index}
                      title={entry.company}
                      lines={[
                        `${entry.pickupLocation || 'No pickup'} → ${entry.deliveryLocation || 'No delivery'}`,
                        `Freight: ${entry.freight || 'No freight'} • Weight: ${entry.weight || 'N/A'}`,
                        `Rate: ${entry.agreedRate || '$0'} • Terms: ${entry.paymentTerms || 'No terms'}`,
                      ]}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {tab === 'expense' && (
          <div className="content-grid">
            <section className="panel">
              <h2>Expense Log</h2>
              <div className="grid two">
                <Field label="Date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                <Field label="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} />
                <Field label="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                <Field label="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                <Field label="Payment Method" value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })} />
                <Field label="Notes" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
              </div>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    if (!expenseForm.category.trim()) return;
                    setExpenseEntries([{ ...expenseForm }, ...expenseEntries]);
                    setExpenseForm(initialExpense);
                  }}
                >
                  Save Expense
                </button>
                <button className="secondary" onClick={() => setExpenseForm(initialExpense)}>Clear</button>
              </div>
            </section>

            <section className="panel">
              <h2>Recent Expenses</h2>
              <div className="stats-grid two-across">
                <div className="stat-card"><span>Total Expenses</span><strong>${totalExpenses}</strong></div>
                <div className="stat-card"><span>Entries</span><strong>{expenseEntries.length}</strong></div>
              </div>
              <div className="entry-list">
                {expenseEntries.length === 0 ? (
                  <div className="empty-state">No expenses yet.</div>
                ) : (
                  expenseEntries.map((entry, index) => (
                    <EntryCard
                      key={index}
                      title={entry.category}
                      lines={[
                        entry.description || 'No description',
                        `${entry.date || 'No date'} • ${entry.paymentMethod || 'No payment method'}`,
                      ]}
                      rightText={`$${entry.amount || '0'}`}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {tab === 'load' && (
          <div className="content-grid">
            <section className="panel">
              <h2>Load Tracker</h2>
              <div className="grid two">
                <Field label="Load ID" value={loadForm.loadId} onChange={(e) => setLoadForm({ ...loadForm, loadId: e.target.value })} />
                <Field label="Date" type="date" value={loadForm.date} onChange={(e) => setLoadForm({ ...loadForm, date: e.target.value })} />
                <Field label="Pickup" value={loadForm.pickup} onChange={(e) => setLoadForm({ ...loadForm, pickup: e.target.value })} />
                <Field label="Delivery" value={loadForm.delivery} onChange={(e) => setLoadForm({ ...loadForm, delivery: e.target.value })} />
                <Field label="Miles" value={loadForm.miles} onChange={(e) => setLoadForm({ ...loadForm, miles: e.target.value })} />
                <Field label="Rate" value={loadForm.rate} onChange={(e) => setLoadForm({ ...loadForm, rate: e.target.value })} />
                <Field label="Expenses" value={loadForm.expenses} onChange={(e) => setLoadForm({ ...loadForm, expenses: e.target.value })} />
                <Field label="Paid (Y/N)" value={loadForm.paid} onChange={(e) => setLoadForm({ ...loadForm, paid: e.target.value })} />
              </div>
              <div className="profit-box">
                <span>Estimated Profit</span>
                <strong>${(Number(loadForm.rate || 0) - Number(loadForm.expenses || 0)).toFixed(2)}</strong>
              </div>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    if (!loadForm.loadId.trim()) return;
                    setLoadEntries([{ ...loadForm }, ...loadEntries]);
                    setLoadForm(initialLoad);
                  }}
                >
                  Save Load
                </button>
                <button className="secondary" onClick={() => setLoadForm(initialLoad)}>Clear</button>
              </div>
            </section>

            <section className="panel">
              <h2>Recent Loads</h2>
              <div className="entry-list">
                {loadEntries.length === 0 ? (
                  <div className="empty-state">No loads yet.</div>
                ) : (
                  loadEntries.map((entry, index) => (
                    <EntryCard
                      key={index}
                      title={entry.loadId}
                      lines={[
                        `${entry.pickup || 'No pickup'} → ${entry.delivery || 'No delivery'}`,
                        `Miles: ${entry.miles || '0'} • Paid: ${entry.paid || 'N'}`,
                        `Profit: $${(Number(entry.rate || 0) - Number(entry.expenses || 0)).toFixed(2)}`,
                      ]}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
