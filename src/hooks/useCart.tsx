import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState
} from 'react';
import { toast } from 'react-toastify';

import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
    children: ReactNode;
}

export interface UpdateProductAmount {
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

    const onSaveDataOnLocalStorage = useCallback((cart: Product[]) => {
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        setCart(cart);
    }, []);

    const addProduct = async (productId: number) => {
        try {
            const response = await api.get('/products/' + productId);
            let newCart: Product[] = [];
            if (!response) {
                return;
            }
            if (cart.length === 0 && response.status === 200) {
                newCart = [{ ...response.data, amount: 1 }];
            } else {
                const productExists = cart.find(
                    (product: Product) => product.id === productId
                );

                if (productExists) {
                    updateProductAmount({
                        productId: productExists.id,
                        amount: productExists.amount + 1
                    });
                    return;
                } else {
                    if (response.data) {
                        newCart = [...cart, { ...response.data, amount: 1 }];
                    }
                }
            }
            onSaveDataOnLocalStorage(newCart);
        } catch {
            toast.error('Erro na adição do produto');
        }
    };

    const removeProduct = (productId: number) => {
        try {
            // const updatedCart = [...cart];
            // const productIndex = updatedCart.findIndex(
            //     product => product.id === productId
            // );
            // if (productIndex >= 0) {
            //     updatedCart.splice(productIndex, 1);
            //     onSaveDataOnLocalStorage(updatedCart);
            // } else {
            //     throw Error();
            // }
            const filteredCart = cart.filter(
                product => product.id !== productId
            );
            if (filteredCart.length === cart.length) {
                throw Error();
            } else {
                onSaveDataOnLocalStorage(filteredCart);
            }
        } catch {
            toast.error('Erro na remoção do produto');
        }
    };

    const updateProductAmount = async ({
        productId,
        amount
    }: UpdateProductAmount) => {
        try {
            const response = await api.get<Stock>(`/stock/${productId}`);
            let newCart: Product[] = [];
            if (response.data.amount >= amount && amount > 0) {
                newCart = cart.map(product =>
                    product.id === productId
                        ? { ...product, amount: product.amount + 1 }
                        : product
                );
                onSaveDataOnLocalStorage(newCart);
            } else {
                toast.error('Quantidade solicitada fora de estoque');
            }
        } catch {
            toast.error('Erro na alteração de quantidade do produto');
        }
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addProduct,
                removeProduct,
                updateProductAmount
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextData {
    const context = useContext(CartContext);

    return context;
}
