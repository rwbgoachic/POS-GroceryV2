import { useState, useEffect } from 'react';
import { posDB, supabase } from '@/lib/storage';
import { applyTax } from '@/lib/tax';
import { saveTransaction } from '@/lib/offline';
import { ShoppingCart, Plus, Minus, Trash2, Wifi, WifiOff } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const sampleProducts = [
  { id: '1', name: 'Coffee', price: 3.99 },
  { id: '2', name: 'Sandwich', price: 8.99 },
  { id: '3', name: 'Salad', price: 7.99 },
  { id: '4', name: 'Cookie', price: 1.99 },
];

export default function Cashier() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [state] = useState('CA');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const { data: { user } } = supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const addToCart = (product: typeof sampleProducts[0]) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);

    setCart(updatedCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = applyTax(subtotal, state);
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!userId) {
      setStatus('Please log in to complete the transaction');
      return;
    }

    try {
      setLoading(true);
      const result = await saveTransaction({
        subtotal,
        tax,
        total,
        state,
        user_id: userId
      });

      setCart([]);
      setStatus(result.offline 
        ? 'Transaction saved offline. Will sync when online.' 
        : 'Transaction completed successfully!');
    } catch (error) {
      console.error('Error saving transaction:', error);
      setStatus('Failed to process transaction');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="pos-screen p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">POS System</h2>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <span className={isOnline ? "text-green-500" : "text-red-500"}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {status && (
        <div className={`mb-4 p-3 rounded ${
          status.includes('success') || status.includes('offline')
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="products-section">
          <h2 className="text-xl font-bold mb-4">Products</h2>
          <div className="grid grid-cols-2 gap-2">
            {sampleProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-3 border rounded-lg text-left hover:bg-gray-50"
              >
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-600">${product.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="cart-section">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6" />
            <h2 className="text-xl font-bold">Cart</h2>
          </div>

          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateQuantity(item.id, -item.quantity)}
                    className="p-1 rounded hover:bg-gray-100 text-red-500 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({state}):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={cart.length === 0 || !userId || loading}
            >
              {loading ? 'Processing...' : 'Complete Transaction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}