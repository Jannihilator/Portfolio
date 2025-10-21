// config (tweak if needed)
const scrollScale = window.innerHeight * 0.08;
// Compute offset dynamically from the video container
const videoContainer = document.querySelector('#reel');
let offset = 0;
const offsetMargin = scrollScale*7.5;


// Wait for layout to be ready
function updateOffset() {
  const rect = videoContainer.getBoundingClientRect();
  offset = rect.bottom - offsetMargin; // absolute scroll position where the video ends
}

// Run once and also when window resizes
updateOffset();
window.addEventListener('resize', updateOffset);

// grab word elements (auto-collects any #word1, #word2, ...)
const words = Array.from(document.querySelectorAll('[id^="word"]'));

// visible state per word (false = hidden, true = shown)
const visible = new Array(words.length).fill(false);

let lastScroll = window.scrollY || 0;

// helper functions to show / hide a word's boxes
function showWord(i) {
  const boxes = Array.from(words[i].children);
  boxes.forEach((box, index) => {
    box.style.animationDelay = `${index * 0.2}s`;
    box.classList.add('animate');
    box.classList.remove('hide');
  });
  visible[i] = true;
}

function hideWord(i) {
  const boxes = Array.from(words[i].children);
  boxes.forEach((box, index) => {
    box.style.animationDelay = `${1.2 - index * 0.2}s`;
    box.classList.remove('animate');
    box.classList.add('hide');
  });
  visible[i] = false;
}

// initialize based on current scroll position so page load / refresh works
(function initFromScroll() {
  const scrolled = window.scrollY;
  for (let i = 0; i < words.length; i++) {
    const threshold = offset + scrollScale * i; // reveal when scrolled >= threshold
    if (scrolled >= threshold) {
      showWord(i);
    } else {
      // leave hidden on init (so initial upward hides work correctly)
      hideWord(i);
    }
  }
})();

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const goingDown = scrolled > lastScroll;
  lastScroll = scrolled;

  for (let i = 0; i < words.length; i++) {
    const threshold = offset + scrollScale * i;

    if (goingDown) {
      // Reveal when crossing threshold while scrolling down.
      if (scrolled >= threshold && !visible[i]) {
        showWord(i);
      }
      // NOTE: do NOT hide when continuing to scroll down (persist)
    } else {
      // Scrolling up: hide if we've gone back above (less than) the threshold
      if (scrolled < threshold && visible[i]) {
        // hide all words from highest index down to i (so hiding is "stacked" reverse)
        // This keeps the disappearing order correct if user scrolls up quickly.
        for (let j = words.length - 1; j >= i; j--) {
          if (visible[j]) hideWord(j);
        }
        break; // we already hid everything >= i, no need to continue loop
      }
    }
  }
});
