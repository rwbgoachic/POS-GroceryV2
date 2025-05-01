import { useState } from 'react';
import { posDB } from '@/lib/storage';
import { applyTax } from '@/lib/tax';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function Cashier() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [state] = useState('CA'); // Default state, could be made configurable

  const addItem = async (item: CartItem) => {
    await posDB.upsert('cart', item);
    setCart(prev => [...prev, item]);
  };

  const updateQuantity = async (itemId: string, delta: number) => {
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);

    setCart(updatedCart);
    await posDB.upsert('cart', updatedCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = applyTax(subtotal, state);
  const total = subtotal + tax;

  return (
    <div className="pos-screen p-4">
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
      </div>
    </div>
  );
}