import React, { useEffect, useState } from 'react';
import api from '../services/api';

const FinancialView = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [firId, setFirId] = useState('');

  useEffect(() => {
    api.get('/graph/flagged-transactions').then(res => setTransactions(res.data));
  }, []);

  const linkTransaction = async () => {
    if (!selectedTx || !firId) return;
    try {
      await api.post(`/graph/link-transaction?transaction_id=${selectedTx}&fir_id=${firId}`);
      alert("Linked successfully!");
    } catch (error) {
      alert("Error linking transaction.");
    }
  };

  return (
    <div className="p-4 bg-gray-100 h-screen">
      <h2 className="text-xl font-bold mb-4">Flagged Financial Transactions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow overflow-y-auto max-h-screen">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th>ID</th>
                <th>Amount</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b cursor-pointer hover:bg-gray-50" onClick={() => setSelectedTx(tx.id)}>
                  <td>{tx.id}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.account_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Link to FIR</h3>
          {selectedTx ? (
            <div className="space-y-4">
              <p>Linking Transaction ID: {selectedTx}</p>
              <input
                className="p-2 border rounded w-full"
                placeholder="FIR ID"
                value={firId}
                onChange={(e) => setFirId(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded w-full"
                onClick={linkTransaction}
              >
                Link to FIR
              </button>
            </div>
          ) : (
            <p className="text-gray-500">Select a transaction from the list</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialView;
