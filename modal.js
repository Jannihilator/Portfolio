const modals = document.querySelectorAll(".modal");
const projects = document.querySelectorAll(".project");
const overlay = document.querySelector(".overlay");
const openModalBtns = document.querySelectorAll(".btn-open");
const closeModalBtns = document.querySelectorAll(".btn-close");

// Track if modal is currently open
let isModalOpen = false;
let currentOpenModal = null;

projects.forEach((project, index) => {
    project.setAttribute("index", index);
});

// close modal function
const closeModal = function () {
    if (!isModalOpen || !currentOpenModal) return;
    
    // Only close the currently open modal
    currentOpenModal.classList.add("hidden");
    
    // Pause/reset all iframes inside this modal
    const iframes = currentOpenModal.querySelectorAll("iframe");
    iframes.forEach(iframe => {
        iframe.src = iframe.src; // reset src to stop video
    });
    
    overlay.classList.add("hidden");
    isModalOpen = false;
    currentOpenModal = null;
};

// Close modal buttons - use event delegation to prevent multiple fires
closeModalBtns.forEach(closeModalBtn => {
    closeModalBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeModal();
    });
});

// Overlay click to close
overlay.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    closeModal();
});

// close modal when the Esc key is pressed
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isModalOpen) {
        e.preventDefault();
        closeModal();
    }
});

// open modal function
const openModal = function (index) {
    if (!modals[index] || isModalOpen) return;
    currentOpenModal = modals[index];
    currentOpenModal.classList.remove("hidden");
    overlay.classList.remove("hidden");
    isModalOpen = true;
};

// open modal event
openModalBtns.forEach(openModalBtn => {
    openModalBtn.addEventListener("click", function (evt) {
        // Don't open modal if clicking on a link or icon
        const target = evt.target;
        if (target.tagName === 'A' || target.tagName === 'I' || target.closest('a')) {
            return; // Let the link handle its own navigation
        }
        
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        
        const idx = evt.currentTarget.getAttribute("index");
        if (idx != null && modals[idx]) {
            openModal(Number(idx));
        }
    });
});