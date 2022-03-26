import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";

import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const saveDataLocalStorage = (cart: Product[]) => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  };

  // useEffect(() => {
  //   console.log("useEffect");
  //   saveDataLocalStorage(cart);
  // }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get("/products/" + productId);

      if (cart.length === 0) {
        setCart([{ ...data, amount: 1 }]);
      } else {
        const productExists = cart.find(
          (product: Product) => product.id === productId
        );

        if (productExists) {
          updateProductAmount({
            productId: productExists.id,
            amount: productExists.amount + 1,
          });
        } else {
          if (data) {
            setCart([...cart, { ...data, amount: 1 }]);
          }
        }
      }
      saveDataLocalStorage(cart);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get<Stock>(`/stock/${productId}`);
      if (response.data.amount >= amount && amount > 0) {
        setCart(
          cart.map((product) =>
            product.id === productId
              ? { ...product, amount: product.amount + 1 }
              : product
          )
        );
      } else {
        toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
