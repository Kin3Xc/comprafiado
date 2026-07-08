/** Datos que la API devuelve para abrir el checkout de ePayco. */
export interface EpaycoCheckoutData {
  key: string;
  test: boolean;
  name: string;
  description: string;
  invoice: string;
  currency: string;
  amount: string;
  tax_base: string;
  tax: string;
  country: string;
  lang: string;
  external: string;
  response: string;
  confirmation: string;
  methodconfirmation: string;
}

declare global {
  interface Window {
    ePayco?: {
      checkout: {
        configure: (opts: { key: string; test: boolean }) => { open: (data: object) => void };
      };
    };
  }
}

const SCRIPT_URL = 'https://checkout.epayco.co/checkout.js';

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ePayco) return resolve();
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el checkout de ePayco'));
    document.body.appendChild(script);
  });
}

/** Carga el script de ePayco bajo demanda y abre el checkout. */
export async function openEpaycoCheckout(data: EpaycoCheckoutData): Promise<void> {
  await loadScript();
  const handler = window.ePayco!.checkout.configure({ key: data.key, test: data.test });
  handler.open(data);
}
