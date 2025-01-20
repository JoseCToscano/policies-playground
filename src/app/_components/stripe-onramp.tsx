import React, { ReactNode } from 'react';

// ReactContext to simplify access of StripeOnramp object
const CryptoElementsContext = React.createContext<{ onramp: any | null }>({ onramp: null });

export const CryptoElements = ({
    stripeOnramp,
    children,
}: {
    stripeOnramp: any;
    children: ReactNode;
}) => {
    const [ctx, setContext] = React.useState(() => ({ onramp: null }));

    React.useEffect(() => {
        let isMounted = true;

        Promise.resolve(stripeOnramp).then((onramp) => {
            if (onramp && isMounted) {
                setContext((ctx) => (ctx.onramp ? ctx : { onramp }));
            }
        });

        return () => {
            isMounted = false;
        };
    }, [stripeOnramp]);

    return (
        <CryptoElementsContext.Provider value={ctx}>
            {children}
        </CryptoElementsContext.Provider>
    );
};

// React hook to get StripeOnramp from context
export const useStripeOnramp = () => {
    const context = React.useContext(CryptoElementsContext);
    return context?.onramp;
};

// React element to render Onramp UI
export const OnrampElement = ({
    clientSecret,
    appearance,
    ...props
}: {
    clientSecret: string;
    appearance: any;
    props?: any;
}) => {
    const stripeOnramp = useStripeOnramp();
    const onrampElementRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const containerRef = onrampElementRef.current;
        if (containerRef && stripeOnramp) {
            containerRef.innerHTML = '';
            stripeOnramp.createSession({
                clientSecret,
                appearance,
            }).mount(containerRef);
        }
    }, [clientSecret, stripeOnramp, appearance]);

    return <div {...props} ref={onrampElementRef} />;
};