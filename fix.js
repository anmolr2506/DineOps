const fs = require('fs');
const code = import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getConfig = () => ({
    headers: {
        Authorization: \\\Bearer \\\\
    }
});

export const getKitchenOrders = async (sessionId) => {
    const response = await axios.get(\\\\/kitchen/orders?session_id=\\\\, getConfig());
    return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
    const response = await axios.put(\\\\/kitchen/order/\/status\\\, { status }, getConfig());
    return response.data;
};

export const updateItemPrepared = async (itemId, is_prepared) => {
    const response = await axios.put(\\\\/kitchen/order-item/\/prepared\\\, { is_prepared }, getConfig());
    return response.data;
};;
fs.writeFileSync('client/src/services/kitchen.service.js', code);
console.log('done');
