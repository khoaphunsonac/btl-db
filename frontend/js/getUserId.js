export default function getUserId() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        window.location.href = '/fe/pages/home/login.html';
    }

    return userId;
}