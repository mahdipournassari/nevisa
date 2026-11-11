# Mobile payment return

The billing checkout endpoint accepts `mobile: true`. Mobile payments use `/api/billing/verify?source=mobile` as the Zarinpal callback. After successful verification and subscription activation, the callback redirects to `nevissaa://payment?payment=success&ref=...`; cancellation/failure states use the same route with the corresponding `payment` value. Normal web checkout behavior remains unchanged.
