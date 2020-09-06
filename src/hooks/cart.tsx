import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import api from 'src/services/api';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): Promise<void>;
  increment(id: string): Promise<void>;
  decrement(id: string): Promise<void>;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarket:cart');

      if (cart) {
        setProducts(JSON.parse(cart));
      }
    }

    loadProducts();
  }, []);

  const updateStorage = useCallback(async () => {
    await AsyncStorage.setItem('@GoMarket:cart', JSON.stringify(products));
  }, [products]);

  const addToCart = useCallback(
    async (item: Omit<Product, 'quantity'>) => {
      // TODO ADD A NEW ITEM TO THE CART
      const product = {
        ...item,
        quantity: 1,
      };
      setProducts(actualProducs => {
        const existingProduct = actualProducs.find(
          productItem => productItem.id === product.id,
        );

        if (existingProduct) {
          return actualProducs;
        }

        return [...actualProducs, product];
      });

      await updateStorage();
    },
    [updateStorage],
  );

  const increment = useCallback(
    async id => {
      setProducts(actualProducts => {
        const product = actualProducts.find(item => item.id === id);

        if (product) {
          product.quantity += 1;
        }

        return [...actualProducts];
      });
      await updateStorage();
    },
    [updateStorage],
  );

  const decrement = useCallback(
    async id => {
      setProducts(actualProducts => {
        const productIndex = actualProducts.findIndex(item => item.id === id);

        if (productIndex >= 0) {
          const product = actualProducts[productIndex];
          product.quantity = Math.max(0, product.quantity - 1);

          if (product.quantity === 0) {
            actualProducts.splice(productIndex, 1);
          }
        }

        return [...actualProducts];
      });
      await updateStorage();
    },
    [updateStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
