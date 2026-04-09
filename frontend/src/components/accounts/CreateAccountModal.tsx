import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { Account } from '../../types';
import { api, ApiError } from '../../api/client';

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (account: Account) => void;
}

/** Modal form for creating a new HSA account. */
export default function CreateAccountModal({ open, onClose, onCreated }: CreateAccountModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setName('');
    setEmail('');
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const account = await api.accounts.create({ owner_name: name, owner_email: email });
      onCreated(account);
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New HSA Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Create Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
