const modals = document.querySelectorAll(".modal");
const projects = document.querySelectorAll(".project");
const overlay = document.querySelector(".overlay");
const openModalBtns = document.querySelectorAll(".btn-open");
const closeModalBtns = document.querySelectorAll(".btn-close");
projects.forEach((project, index) =>{
    project.setAttribute("index", index);
})
// close modal function
const closeModal = function () {
  modals.forEach(modal => {
    modal.classList.add("hidden");

    // Pause/reset all iframes inside this modal
    const iframes = modal.querySelectorAll("iframe");
    iframes.forEach(iframe => {
      iframe.src = iframe.src; // reset src to stop video
    });
  });

  overlay.classList.add("hidden");
};

// close the modal when the close button and overlay is clicked
closeModalBtns.forEach(closeModalBtn => {
    closeModalBtn.addEventListener("click", closeModal);
});
overlay.addEventListener("click", closeModal);

// close modal when the Esc key is pressed
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeModal();
    }
});

// open modal function
const openModal = function (index) {
    modals[index].classList.remove("hidden");
    overlay.classList.remove("hidden");
};
// open modal event
openModalBtns.forEach(openModalBtn => {
    openModalBtn.addEventListener("click", function(evt){
        openModal(evt.target.getAttribute("index"))
    })
});
