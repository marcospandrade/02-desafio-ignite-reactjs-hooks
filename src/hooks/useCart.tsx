import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
        const storagedCart = localStorage.getItem('@RocketShoes:cart');

        if (storagedCart) {
            return JSON.parse(storagedCart);
        }

        return [];
    });

    const addProduct = async (productId: number) => {
        try {
            const { data } = await api.get('/products/' + productId);
            cart.map(product => {
                if (product.id === productId) {
                    updateProductAmount({
                        productId,
                        amount: product.amount + 1
                    });
                    return product;
                } else {
                    setCart([...cart, { ...data, amount: 1 }]);
                    return cart;
                }
            });
        } catch {
            toast.error('Erro na adição do produto');
        }
        console.log(cart);
    };

    const removeProduct = (productId: number) => {
        try {
            // TODO
        } catch {
            toast.error('Erro na remoção do produto');
        }
    };

    const updateProductAmount = async ({
        productId,
        amount
    }: UpdateProductAmount) => {
        try {
            const response = await api.get<UpdateProductAmount>(
                `/stock/${productId}`
            );
            if (response.data.amount >= amount) {
                toast.success('Produto atualizado com sucesso!');
            } else {
                toast.error('Quantidade solicitada fora de estoque');
            }
        } catch {
            toast.error('Erro na alteração de quantidade do produto');
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
