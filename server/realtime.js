let ioInstance = null;

const setIo = (io) => {
    ioInstance = io;
};

const getIo = () => ioInstance;

const emitToSession = (sessionId, eventName, payload = {}) => {
    if (!ioInstance || !sessionId) {
        return;
    }

    ioInstance.to(`session:${sessionId}`).emit(eventName, {
        sessionId,
        ...payload,
    });
};

module.exports = {
    setIo,
    getIo,
    emitToSession,
};