import PaymentPage from '@/pages/authentication/PaymentPage'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Payment Getway — I Was Killed for This Information",
  description: "Complete your payment securely using our trusted payment gateway. Fast, encrypted, and reliable transactions for a smooth checkout experience.",
};

const PayPalPaymentPage = () => {
  return (
    <div>
      <PaymentPage />;
    </div>
  )
}

export default PayPalPaymentPage
