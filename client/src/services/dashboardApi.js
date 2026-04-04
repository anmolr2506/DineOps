import axios from 'axios';

const baseUrl = 'http://localhost:5000/api/dashboard';

const withSession = (sessionId) => ({
    params: sessionId ? { session_id: sessionId } : undefined,
});

export const dashboardApi = {
    getKpis(sessionId) {
        return axios.get(`${baseUrl}/kpis`, withSession(sessionId));
    },
    getRevenueTrend(sessionId) {
        return axios.get(`${baseUrl}/revenue-trend`, withSession(sessionId));
    },
    getDailySales(sessionId) {
        return axios.get(`${baseUrl}/daily-sales`, withSession(sessionId));
    },
    getTopProducts(sessionId) {
        return axios.get(`${baseUrl}/top-products`, withSession(sessionId));
    },
    getCategoryPerformance(sessionId) {
        return axios.get(`${baseUrl}/category-performance`, withSession(sessionId));
    },
    getRecentOrders(sessionId) {
        return axios.get(`${baseUrl}/recent-orders`, withSession(sessionId));
    },
    getLiveActivity(sessionId) {
        return axios.get(`${baseUrl}/live-activity`, withSession(sessionId));
    },
    getOngoingPreparation(sessionId) {
        return axios.get(`${baseUrl}/preparation`, withSession(sessionId));
    },
    updatePreparationStatus(orderId, status) {
        return axios.patch(`${baseUrl}/preparation/${orderId}/status`, { status });
    },
};
