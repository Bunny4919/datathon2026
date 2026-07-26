import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Landmark, ArrowRight, ShieldAlert, CheckCircle, Search, Loader2 } from 'lucide-react';

interface Transaction {
  id: number;
  amount: number;
  account_number: string;
  date: string;
  fir_id: number | null;
}

const FinancialPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [firId, setFirId] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/graph/flagged-transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const linkTransaction = async () => {
    if (!selectedTx || !firId) return;
    setLinking(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post(`/graph/link-transaction?transaction_id=${selectedTx.id}&fir_id=${firId}`);
      setSuccessMsg(`Transaction successfully linked to FIR #${firId}`);
      setFirId('');
      setSelectedTx(null);
      fetchTransactions();
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.detail || 'Error linking transaction to FIR.');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
        <span className="text-sm font-semibold">Loading flagged transactions ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Intelligence Ledger</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Suspicious/flagged bank transactions requiring investigation and linking to FIR records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flagged Transactions list */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xl shadow-purple-900/5 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <ShieldAlert size={18} className="text-[#7C3AED]" />
            <h3 className="text-sm font-bold text-slate-900">Flagged Account Ledger</h3>
          </div>
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold">
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Linked Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {transactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => {
                      setSelectedTx(tx);
                      setSuccessMsg('');
                      setErrorMsg('');
                    }}
                    className={`cursor-pointer transition-colors ${
                      selectedTx?.id === tx.id
                        ? 'bg-purple-50 text-slate-900 border-l-4 border-[#7C3AED]'
                        : 'hover:bg-purple-50/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#7C3AED]">#{tx.id}</td>
                    <td className="py-3 px-4 font-mono">{tx.account_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{tx.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-400">{tx.date}</td>
                    <td className="py-3 px-4">
                      {tx.fir_id ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          FIR #{tx.fir_id}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                          Unlinked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Action panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xl shadow-purple-900/5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
              <Landmark size={18} className="text-[#7C3AED]" />
              <h3 className="text-sm font-bold text-slate-900">Investigative Handoff</h3>
            </div>

            {selectedTx ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction Ref:</span>
                    <span className="text-slate-900 font-bold">#{selectedTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account:</span>
                    <span className="text-slate-900 font-mono font-bold">{selectedTx.account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Flagged:</span>
                    <span className="text-[#7C3AED] font-extrabold">₹{selectedTx.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-600 font-bold block">Associate with FIR Case ID</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      placeholder="FIR Case ID (e.g. 1)"
                      value={firId}
                      onChange={e => setFirId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-[#7C3AED] focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={linkTransaction}
                  disabled={linking || !firId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                >
                  {linking ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Link Transaction
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                Select a transaction from the list on the left to link it to an active FIR investigation case.
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-start gap-2.5 mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialPage;
