const IMAGE_COUNT = 6
const IMAGE_VERSION = '20260126'
const container = document.querySelector('.mapbox__stage')
const slidesContainer = document.querySelector('.map-slides')

const getImagePath = idx => `https://via.placeholder.com/1200x800/${(idx + 1) * 2}${(idx + 1) * 2}${(idx + 1) * 2}/111?text=Image+${idx + 1}`

const slides = []

for (let i = 0; i < IMAGE_COUNT; i += 1) {
  const slide = document.createElement('div')
  slide.className = 'map-slide'
  slide.dataset.label = `Image ${i + 1}`
  slide.style.backgroundImage = `url(${getImagePath(i)})`
  slidesContainer.appendChild(slide)
  slides.push(slide)
}

let previousProgress = 0
setActiveSlide(0, 0)

function dramaticEasing(t) {
  const finalImageProgress = 0.4
  if (t < 0.6) {
    return (t / 0.6) * 0.1
  }
  if (t < 0.8) {
    return 0.1 + ((t - 0.6) / 0.2) * (finalImageProgress - 0.1)
  }
  return finalImageProgress
}

function setActiveSlide(index, blend) {
  slides.forEach((slide, idx) => {
    slide.style.opacity = 0
    slide.style.zIndex = 0
  })
  const clampedIndex = Math.max(0, Math.min(IMAGE_COUNT - 1, Math.floor(index)))
  const nextIndex = clampedIndex < IMAGE_COUNT - 1 ? clampedIndex + 1 : clampedIndex
  slides[clampedIndex].style.opacity = 1
  slides[clampedIndex].style.zIndex = 1
  if (nextIndex !== clampedIndex) {
    slides[nextIndex].style.opacity = blend
    slides[nextIndex].style.zIndex = 2
  }
}

function updateScroll() {
  if (!container) return
  const rect = container.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const sectionTop = rect.top
  const sectionBottom = rect.bottom
  let progress = 0

  if (sectionBottom < 0) {
    progress = 1
  } else if (sectionTop >= windowHeight) {
    progress = 0
  } else {
    const animationEndTop = 0
    const extendedStartTop = windowHeight
    const extendedRange = extendedStartTop - animationEndTop
    let rawProgress = 0
    if (sectionTop >= extendedStartTop) {
      rawProgress = 0
    } else if (sectionTop <= animationEndTop) {
      rawProgress = 1
    } else {
      rawProgress = (extendedStartTop - sectionTop) / extendedRange
      rawProgress = Math.max(0, Math.min(1, rawProgress))
    }
    const calculated = dramaticEasing(rawProgress)
    const isScrollingDown = calculated > previousProgress
    const finalImageProgress = 0.4
    if (isScrollingDown && calculated >= finalImageProgress) {
      progress = finalImageProgress
    } else if (!isScrollingDown && previousProgress >= finalImageProgress) {
      progress = Math.min(calculated, previousProgress)
    } else {
      progress = calculated
    }
    previousProgress = progress
  }

  let imageIndexFloat
  const finalImageProgress = 0.4
  if (progress >= finalImageProgress) {
    imageIndexFloat = IMAGE_COUNT - 1
  } else {
    imageIndexFloat = (progress / finalImageProgress) * (IMAGE_COUNT - 1)
  }
  setActiveSlide(imageIndexFloat, imageIndexFloat - Math.floor(imageIndexFloat))
}

window.addEventListener('scroll', updateScroll, { passive: true })
window.addEventListener('resize', updateScroll)
updateScroll()
