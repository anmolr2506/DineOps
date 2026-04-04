import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    }
});

export const fetchKitchenOrders = async (sessionId) => {
    const response = await axios.get(`${API_URL}/kitchen/orders`, {
        ...authHeaders(),
        params: { session_id: sessionId }
    });
    return response.data?.orders || [];
};

export const setKitchenOrderStatus = async (orderId, status) => {
    const response = await axios.put(
        `${API_URL}/kitchen/order/${orderId}/status`,
        { status },
        authHeaders()
    );
    return response.data?.order;
};

export const setKitchenOrderItemPrepared = async (orderItemId, isPrepared) => {
    const response = await axios.put(
        `${API_URL}/kitchen/order-item/${orderItemId}/prepared`,
        { is_prepared: isPrepared },
        authHeaders()
    );
    return response.data?.item;
};
