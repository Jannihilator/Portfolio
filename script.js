const body = document.body
const btnToggle = document.getElementById('theme-toggle') // Attach event to button, not icon
const iconTheme = document.getElementById('btn-theme')

const getBodyTheme = localStorage.getItem('portfolio-theme') || 'dark'
const getBtnTheme = localStorage.getItem('portfolio-btn-theme') || 'fa-sun'

body.classList.add(getBodyTheme)
iconTheme.classList.add(getBtnTheme)

const isDark = () => body.classList.contains('dark')

const setTheme = (bodyClass, iconClass) => {
  body.classList.remove('dark', 'light')
  body.classList.add(bodyClass)

  iconTheme.classList.remove('fa-sun', 'fa-moon')
  iconTheme.classList.add(iconClass)

  localStorage.setItem('portfolio-theme', bodyClass)
  localStorage.setItem('portfolio-btn-theme', iconClass)
}

const toggleTheme = () => {
  isDark() ? setTheme('light', 'fa-moon') : setTheme('dark', 'fa-sun')
}

btnToggle.addEventListener('click', toggleTheme) // Attach event to button

const displayList = () => {
	const navUl = document.querySelector('.nav__list')

	if (btnHamburger.classList.contains('fa-bars')) {
		btnHamburger.classList.remove('fa-bars')
		btnHamburger.classList.add('fa-times')
		navUl.classList.add('display-nav-list')
	} else {
		btnHamburger.classList.remove('fa-times')
		btnHamburger.classList.add('fa-bars')
		navUl.classList.remove('display-nav-list')
	}
}

btnHamburger.addEventListener('click', displayList)

const scrollUp = () => {
	const btnScrollTop = document.querySelector('.scroll-top')

	if (
		body.scrollTop > 500 ||
		document.documentElement.scrollTop > 500
	) {
		btnScrollTop.style.display = 'block'
	} else {
		btnScrollTop.style.display = 'none'
	}
}

document.addEventListener('scroll', scrollUp)
