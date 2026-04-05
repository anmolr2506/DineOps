import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const authHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    }
});

export const fetchCustomerContext = async ({ sessionId, tableId, token }) => {
    const response = await axios.get(`${API_BASE}/customer/context`, {
        params: {
            session_id: sessionId,
            table_id: tableId,
            token
        }
    });

    return response.data;
};

export const createCustomerOrder = async ({ sessionId, tableId, token, customerName, items }) => {
    const response = await axios.post(`${API_BASE}/customer/order`, {
        session_id: sessionId,
        table_id: tableId,
        token,
        customer_name: customerName,
        items
    });

    return response.data.order;
};

export const completeCustomerPayment = async ({ orderId, sessionId, tableId, token, method = 'upi', transactionRef = '' }) => {
    const response = await axios.post(`${API_BASE}/customer/order/${orderId}/pay`, {
        session_id: sessionId,
        table_id: tableId,
        token,
        method,
        transaction_ref: transactionRef || `CUST-${Date.now()}`
    });

    return response.data;
};

export const createCustomerRazorpayOrder = async ({ orderId, sessionId, tableId, token }) => {
    const response = await axios.post(`${API_BASE}/customer/order/${orderId}/razorpay-order`, {
        session_id: sessionId,
        table_id: tableId,
        token
    });

    return response.data;
};

export const verifyCustomerRazorpayPayment = async ({ orderId, sessionId, tableId, token, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const response = await axios.post(`${API_BASE}/customer/order/${orderId}/razorpay-verify`, {
        session_id: sessionId,
        table_id: tableId,
        token,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
    });

    return response.data;
};

export const fetchCustomerOrderStatus = async ({ orderId, sessionId, tableId, token }) => {
    const response = await axios.get(`${API_BASE}/customer/order/${orderId}/status`, {
        params: {
            session_id: sessionId,
            table_id: tableId,
            token
        }
    });

    return response.data;
};

export const generateSessionQrs = async ({ sessionId, refresh = true }) => {
    const response = await axios.get(`${API_BASE}/customer/qr/session/${sessionId}`, {
        ...authHeaders(),
        params: {
            refresh: refresh ? 1 : 0
        }
    });

    return response.data;
};
