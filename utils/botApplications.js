// Bellekte bot başvurularını tutmak için Map
const applications = new Map();
let applicationCounter = 1000; // Başvuru ID'si için sayaç

module.exports = {
    // Yeni başvuru ekle
    addApplication: (applicationData) => {
        const applicationId = applicationCounter++;
        applications.set(applicationId, {
            ...applicationData,
            id: applicationId,
            createdAt: new Date(),
            status: 'pending'
        });
        return applicationId;
    },

    // Başvuru getir
    getApplication: (applicationId) => {
        return applications.get(applicationId);
    },

    // Bot ID ile başvuru var mı kontrol et
    hasApplicationForBot: (botId) => {
        return Array.from(applications.values()).some(app => app.botId === botId && app.status === 'pending');
    },

    // Başvuru sil
    deleteApplication: (applicationId) => {
        return applications.delete(applicationId);
    },

    // Başvuru durumu güncelle
    updateApplicationStatus: (applicationId, status) => {
        const application = applications.get(applicationId);
        if (application) {
            application.status = status;
            application.updatedAt = new Date();
            return true;
        }
        return false;
    },

    // Tüm bekleyen başvuruları getir
    getPendingApplications: () => {
        return Array.from(applications.values()).filter(app => app.status === 'pending');
    },

    // Başvuru sayısı
    getApplicationCount: () => {
        return applications.size;
    }
};