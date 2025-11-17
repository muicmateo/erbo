// Tab-Switching Funktionalität
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Entferne active class von allen Buttons und Contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Füge active class zum geklickten Button hinzu
        button.classList.add('active');
        
        // Zeige den entsprechenden Content
        document.getElementById(targetTab).classList.add('active');
    });
});