const pdfService = require('../services/pdf.service');

const streamPdf = ({ res, fileName, buffer }) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(buffer);
};

const generateReceipt = async (req, res) => {
    try {
        const orderId = req.params.order_id;
        const { fileName, buffer } = await pdfService.generateReceiptPdf({ orderId });
        return streamPdf({ res, fileName, buffer });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to generate receipt PDF.' });
    }
};

const generateSessionReport = async (req, res) => {
    try {
        const sessionId = req.params.session_id;
        const { fileName, buffer } = await pdfService.generateSessionReportPdf({ sessionId });
        return streamPdf({ res, fileName, buffer });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to generate session report PDF.' });
    }
};

module.exports = {
    generateReceipt,
    generateSessionReport
};
