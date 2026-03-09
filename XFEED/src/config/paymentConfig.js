import RazorpayCheckout from 'react-native-razorpay';

export const initiatePayment = (amount, onSuccess, onFailure) => {
  const options = {
    description: 'Premium Subscription',
    currency: 'INR',
    key: 'rzp_test_xxxx', // ← your key
    amount: amount * 100, // in paise
    name: 'TheAmrey',
    prefill: { /* user data */ },
    theme: { color: '#yourcolor' },
  };

  RazorpayCheckout.open(options)
    .then((data) => {
      // If payment is successful, call success handler
      onSuccess(data);
    })
    .catch((error) => {
      // If payment fails, call failure handler
      onFailure(error);
    });
};
