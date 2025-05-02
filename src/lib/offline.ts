import { posDB } from './storage';
import { v4 as uuidv4 } from 'uuid';

interface Transaction {
  id: string;
  subtotal: number;
  tax: number;
  total: number;
  state: string;
  user_id: string;
  created_at: string;
}

const queue: Transaction[] = JSON.parse(localStorage.getItem('pos-queue') || '[]');

export const processOfflineQueue = async () => {
  if (queue.length === 0) return;

  const processedIds: string[] = [];

  for (const transaction of queue) {
    try {
      await posDB.saveTransaction(transaction);
      processedIds.push(transaction.id);
    } catch (error) {
      console.error('Failed to process transaction:', error);
      break;
    }
  }

  // Remove processed transactions from queue
  const remainingTransactions = queue.filter(t => !processedIds.includes(t.id));
  localStorage.setItem('pos-queue', JSON.stringify(remainingTransactions));
};

export const saveTransaction = async (data: Omit<Transaction, 'id' | 'created_at'>) => {
  const transaction: Transaction = {
    ...data,
    id: uuidv4(),
    created_at: new Date().toISOString(),
  };

  if (navigator.onLine) {
    try {
      await posDB.saveTransaction(transaction);
      return { success: true, offline: false };
    } catch (error) {
      console.error('Failed to save transaction:', error);
      queue.push(transaction);
      localStorage.setItem('pos-queue', JSON.stringify(queue));
      return { success: true, offline: true };
    }
  }

  queue.push(transaction);
  localStorage.setItem('pos-queue', JSON.stringify(queue));
  return { success: true, offline: true };
};

// Auto-process queue when coming back online
window.addEventListener('online', processOfflineQueue);