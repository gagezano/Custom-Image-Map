// Campus Amenities Data
const campusAmenities = [
  {
    id: 'conference-center',
    title: 'CONFERENCE CENTER',
    description: 'Conference rooms and meeting spaces',
    image: 'images/amenities/conference-center.jpg',
    icon: 'images/icons/conference-center.svg',
  },
  {
    id: 'outdoor-patio',
    title: 'OUTDOOR PATIO',
    description: 'Modern outdoor seating and gathering spaces',
    image: 'images/amenities/outdoor-patio.jpg',
    icon: 'images/icons/outdoor-patio.svg',
  },
  {
    id: 'pedestrian-promenade',
    title: 'PEDESTRIAN PROMENADE',
    description: 'Landscaped walkways connecting buildings',
    image: 'images/amenities/pedestrian-promenade.jpg',
    icon: 'images/icons/pedestrian-promenade.svg',
  },
  {
    id: 'event-lawn-food-truck',
    title: 'EVENT LAWN/FOOD TRUCK AREA',
    description: 'Green spaces designed for refueling and relaxation',
    image: 'images/amenities/event-lawn-food-truck.png',
    icon: 'images/icons/event-lawn-food-truck.svg',
  },
  {
    id: 'fitness-center',
    title: 'FITNESS CENTER',
    description: 'State-of-the-art gym and wellness facilities',
    image: 'images/amenities/fitness-center.jpg',
    icon: 'images/icons/fitness-center.svg',
  },
  {
    id: 'amenity-deck',
    title: 'AMENITY DECK',
    description: 'Shaded outdoor space for working, refueling, or collaborating',
    image: 'images/amenities/amenity-deck.jpg',
    icon: 'images/icons/amenity-deck.svg',
  },
  {
    id: 'terraced-seating',
    title: 'TERRACED SEATING',
    description: 'Multi-level outdoor seating for gatherings',
    image: 'images/amenities/terraced-seating.jpg',
    icon: 'images/icons/terraced-seating.svg',
  },
  {
    id: 'coffee-cart-outdoor',
    title: 'COFFEE CART & OUTDOOR SEATING',
    description: 'Casual dining and coffee options',
    image: 'images/amenities/coffee-cart-outdoor.jpg',
    icon: 'images/icons/coffee-cart-outdoor.svg',
  },
]

// Map positions for amenities - pixel positions at 1028px viewport width
const REFERENCE_VIEWPORT_WIDTH = 1028
const amenityPixelPositions = {
  'conference-center': [241.191, 144.86],
  'pedestrian-promenade': [273.407, 282.45],
  'terraced-seating': [379.481, 259.04],
  'fitness-center': [428.231, 215.15],
  'event-lawn-food-truck': [437.656, 283.74],
  'outdoor-patio': [548.081, 328.85],
  'coffee-cart-outdoor': [457.981, 329.04],
  'amenity-deck': [500.481, 274.96],
}

// State
let isMobile = window.innerWidth < 768
let imageLoaded = false
let imageDimensions = null
let scale = 1
let zoom = isMobile ? 1 : 0
let panOffset = { x: 0, y: 0 }
let isDragging = false
let dragStart = { x: 0, y: 0 }
let lastTouchDistance = null
let isCentering = false
let touchStartPos = null
let hoveredAmenityId = null
let centerOnAmenityId = null

const mapContainer = document.getElementById('campus-map')
if (!mapContainer) throw new Error('Custom Image Mapbox: #campus-map not found')
const mapImageWrapper = document.createElement('div')
mapImageWrapper.className = 'map-image-wrapper'
mapContainer.appendChild(mapImageWrapper)
// Layer above map so markers always receive clicks (pointer-events: none on layer, auto on markers)
const markerLayer = document.createElement('div')
markerLayer.className = 'map-marker-layer'
markerLayer.setAttribute('aria-hidden', 'true')
mapContainer.appendChild(markerLayer)

const mapImage = document.createElement('img')
mapImage.src = 'images/campus/campus-map.png'
mapImage.alt = 'Campus map'
mapImage.style.display = 'block'
mapImage.onload = () => {
  imageDimensions = { width: mapImage.naturalWidth, height: mapImage.naturalHeight }
  imageLoaded = true
  updateScale()
  renderAmenityMarkers()
}
mapImage.onerror = () => {
  console.error('Failed to load campus map image')
  imageLoaded = false
}
mapImageWrapper.appendChild(mapImage)

// Zoom Controls
const zoomControls = document.createElement('div')
zoomControls.className = 'zoom-controls'
const zoomInBtn = document.createElement('button')
zoomInBtn.className = 'zoom-button'
zoomInBtn.setAttribute('aria-label', 'Zoom in')
zoomInBtn.innerHTML = '<img src="images/icons/pluis.svg" alt="" />'
zoomInBtn.onclick = handleZoomIn
const zoomOutBtn = document.createElement('button')
zoomOutBtn.className = 'zoom-button'
zoomOutBtn.setAttribute('aria-label', 'Zoom out')
zoomOutBtn.innerHTML = '<img src="images/icons/minus.svg" alt="" />'
zoomOutBtn.onclick = handleZoomOut
zoomControls.appendChild(zoomInBtn)
zoomControls.appendChild(zoomOutBtn)
mapContainer.appendChild(zoomControls)

// Update scale
function updateScale() {
  if (!mapContainer || !imageDimensions || !imageLoaded) return
  const containerRect = mapContainer.getBoundingClientRect()
  const containerWidth = containerRect.width - 40
  const containerHeight = containerRect.height - 40
  const scaleX = containerWidth / imageDimensions.width
  const scaleY = containerHeight / imageDimensions.height
  const paddingMultiplier = isMobile ? 1.3 : 0.95
  const fitScale = Math.min(scaleX, scaleY) * paddingMultiplier
  const finalScale = fitScale * Math.pow(2, zoom)
  scale = finalScale
  mapImage.style.width = `${imageDimensions.width * scale}px`
  mapImage.style.height = `${imageDimensions.height * scale}px`
  renderAmenityMarkers()
}

function handleZoomIn() {
  const maxZoom = isMobile ? 1 : 3
  if (zoom < maxZoom) {
    zoom = Math.min(zoom + 1, maxZoom)
    updateScale()
    updateZoomButtons()
  }
}

function handleZoomOut() {
  zoom = Math.max(zoom - 1, -3)
  updateScale()
  updateZoomButtons()
}

function updateZoomButtons() {
  const maxZoom = isMobile ? 1 : 3
  zoomInBtn.disabled = isMobile && zoom >= maxZoom
  if (isMobile && zoom >= maxZoom) {
    zoomInBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
    zoomInBtn.style.opacity = '0.5'
  } else {
    zoomInBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
    zoomInBtn.style.opacity = '1'
  }
}

// Pan/Drag
function handleMouseDown(e) {
  isDragging = true
  dragStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }
  mapImageWrapper.classList.add('dragging')
}

function handleMouseMove(e) {
  if (!isDragging) return
  panOffset = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
  updateMapTransform()
}

function handleMouseUp() {
  isDragging = false
  mapImageWrapper.classList.remove('dragging')
}

// Touch events
function getTouchDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX
  const dy = touch2.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function handleTouchStart(e) {
  if (e.touches.length === 1 && e.touches[0]) {
    isDragging = true
    dragStart = { x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y }
    touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  } else if (e.touches.length === 2 && e.touches[0] && e.touches[1]) {
    isDragging = false
    lastTouchDistance = getTouchDistance(e.touches[0], e.touches[1])
  }
}

function handleTouchMove(e) {
  if (e.touches.length === 1 && isDragging && e.touches[0]) {
    e.preventDefault()
    panOffset = { x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y }
    updateMapTransform()
  } else if (e.touches.length === 2 && lastTouchDistance !== null && e.touches[0] && e.touches[1]) {
    e.preventDefault()
    const currentDistance = getTouchDistance(e.touches[0], e.touches[1])
    const scaleChange = currentDistance / lastTouchDistance
    const newZoom = zoom + Math.log2(scaleChange)
    const maxZoom = isMobile ? 1 : 3
    zoom = Math.max(-3, Math.min(maxZoom, newZoom))
    lastTouchDistance = currentDistance
    updateScale()
    updateZoomButtons()
  }
}

function handleTouchEnd() {
  isDragging = false
  lastTouchDistance = null
  touchStartPos = null
}

mapImageWrapper.addEventListener('mousedown', handleMouseDown)
mapImageWrapper.addEventListener('mousemove', handleMouseMove)
mapImageWrapper.addEventListener('mouseup', handleMouseUp)
mapImageWrapper.addEventListener('mouseleave', handleMouseUp)
mapImageWrapper.addEventListener('touchstart', handleTouchStart, { passive: false })
mapImageWrapper.addEventListener('touchmove', handleTouchMove, { passive: false })
mapImageWrapper.addEventListener('touchend', handleTouchEnd)

function updateMapTransform() {
  mapImageWrapper.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px)`
  mapImageWrapper.style.transition = isDragging ? 'none' : (isCentering ? 'transform 0.6s ease-out' : 'transform 0.1s')
  renderAmenityMarkers()
}

// Center map on amenity
function centerMapOnAmenity(amenity) {
  if (!mapContainer || !imageDimensions || !imageLoaded) return
  const containerRect = mapContainer.getBoundingClientRect()
  const containerWidth = containerRect.width - 40
  const containerHeight = containerRect.height - 40
  const scaleX = containerWidth / imageDimensions.width
  const scaleY = containerHeight / imageDimensions.height
  const paddingMultiplier = isMobile ? 1.3 : 0.95
  const fitScale = Math.min(scaleX, scaleY) * paddingMultiplier
  const currentZoom = zoom < 1 ? 1 : zoom
  const currentScale = fitScale * Math.pow(2, currentZoom)
  
  const pixelPos = amenityPixelPositions[amenity.id]
  if (!pixelPos) return
  
  const [refPixelLeft, refPixelTop] = pixelPos
  const minPixelX = 241.191
  const maxPixelX = 573.081
  const minPixelY = 144.86
  const maxPixelY = 303.85
  const normalizedX = (refPixelLeft - minPixelX) / (maxPixelX - minPixelX)
  const normalizedY = (refPixelTop - minPixelY) / (maxPixelY - minPixelY)
  const minPercentX = 12
  const maxPercentX = 68
  const minPercentY = 28
  const maxPercentY = 58
  const xPercent = minPercentX + normalizedX * (maxPercentX - minPercentX)
  const yPercent = minPercentY + normalizedY * (maxPercentY - minPercentY)
  
  const amenityImageX = xPercent / 100
  const amenityImageY = yPercent / 100
  const imageScaledWidth = imageDimensions.width * currentScale
  const imageScaledHeight = imageDimensions.height * currentScale
  const centerX = containerRect.width / 2
  const centerY = containerRect.height / 2
  
  const targetX = centerX - (centerX + (amenityImageX - 0.5) * imageScaledWidth)
  const targetY = centerY - (centerY + (amenityImageY - 0.5) * imageScaledHeight)
  
  isCentering = true
  panOffset = { x: targetX, y: targetY }
  updateMapTransform()
  setTimeout(() => { isCentering = false }, 600)
}

// Render amenity markers
function renderAmenityMarkers() {
  const existingMarkers = markerLayer.querySelectorAll('.amenity-marker')
  existingMarkers.forEach(m => m.remove())
  
  if (!imageLoaded || !imageDimensions || scale <= 0) return
  if (isMobile && zoom < 0) return
  
  const containerRect = mapContainer.getBoundingClientRect()
  const imageScaledWidth = imageDimensions.width * scale
  const imageScaledHeight = imageDimensions.height * scale
  const centerX = containerRect.width / 2
  const centerY = containerRect.height / 2
  
  campusAmenities.forEach(amenity => {
    const pixelPos = amenityPixelPositions[amenity.id]
    if (!pixelPos) return
    
    const [refPixelLeft, refPixelTop] = pixelPos
    const minPixelX = 241.191
    const maxPixelX = 573.081
    const minPixelY = 144.86
    const maxPixelY = 303.85
    const normalizedX = (refPixelLeft - minPixelX) / (maxPixelX - minPixelX)
    const normalizedY = (refPixelTop - minPixelY) / (maxPixelY - minPixelY)
    const minPercentX = 12
    const maxPercentX = 68
    const minPercentY = 28
    const maxPercentY = 58
    const xPercent = minPercentX + normalizedX * (maxPercentX - minPercentX)
    const yPercent = minPercentY + normalizedY * (maxPercentY - minPercentY)
    
    const markerX = centerX + (xPercent / 100 - 0.5) * imageScaledWidth + panOffset.x
    const markerY = centerY + (yPercent / 100 - 0.5) * imageScaledHeight + panOffset.y
    
    const marker = document.createElement('div')
    marker.className = 'amenity-marker'
    marker.setAttribute('data-amenity-id', amenity.id)
    if (hoveredAmenityId === amenity.id) marker.classList.add('hovered')
    marker.style.left = `${markerX}px`
    marker.style.top = `${markerY}px`
    marker.style.zIndex = hoveredAmenityId === amenity.id ? '99999' : '40'
    
    const bubble = document.createElement('div')
    bubble.className = 'amenity-bubble'
    if (hoveredAmenityId === amenity.id) bubble.classList.add('hovered')
    
    const icon = document.createElement('img')
    icon.src = amenity.icon
    icon.alt = amenity.title
    bubble.appendChild(icon)
    
    const tooltip = document.createElement('div')
    tooltip.className = 'amenity-tooltip'
    if (hoveredAmenityId === amenity.id) tooltip.classList.add('visible')
    tooltip.textContent = amenity.title
    bubble.appendChild(tooltip)
    
    marker.appendChild(bubble)
    
    marker.addEventListener('mouseenter', () => {
      if (!isMobile) {
        hoveredAmenityId = amenity.id
        renderAmenityMarkers()
        renderAmenitiesGrid()
      }
    })
    
    marker.addEventListener('mouseleave', () => {
      if (!isMobile) {
        hoveredAmenityId = null
        renderAmenityMarkers()
        renderAmenitiesGrid()
      }
    })
    
    marker.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      handleAmenityClick(amenity.id, true)
    })
    
    marker.addEventListener('touchstart', (e) => {
      e.stopPropagation()
      if (e.touches.length === 1 && e.touches[0]) {
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }, { passive: true })
    
    marker.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1 && touchStartPos && e.changedTouches[0]) {
        const touchEnd = e.changedTouches[0]
        const dx = Math.abs(touchEnd.clientX - touchStartPos.x)
        const dy = Math.abs(touchEnd.clientY - touchStartPos.y)
        if (dx < 10 && dy < 10) {
          e.preventDefault()
          e.stopPropagation()
          handleAmenityClick(amenity.id, true)
        }
      }
      touchStartPos = null
    }, { passive: false })
    
    markerLayer.appendChild(marker)
  })
}

// Scroll to element: set hash so browser scrolls to #id (most reliable).
function scrollToId(id) {
  var el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: id === 'map-container' ? 'start' : 'center' })
  window.location.hash = id
}

// Handle amenity click
function handleAmenityClick(amenityId, fromMap = false) {
  if (fromMap) {
    // If clicked from map: scroll down to the list item (same as Arc).
    hoveredAmenityId = amenityId
    renderAmenityMarkers()
    renderAmenitiesGrid()

    setTimeout(function () {
      scrollToId('amenity-' + amenityId)
    }, 50)

    setTimeout(() => {
      hoveredAmenityId = null
      renderAmenityMarkers()
      renderAmenitiesGrid()
    }, isMobile ? 6000 : 2000)
  } else {
    // If clicked from list: scroll up to the map (same as Arc).
    var mapRef = document.getElementById('map-container')
    if (mapRef) {
      scrollToId('map-container')
      
      // Highlight the corresponding amenity marker on the map
      // On mobile, keep it hovered longer so the label is visible
      hoveredAmenityId = amenityId
      renderAmenityMarkers()
      renderAmenitiesGrid()
      
      // On mobile, center the map on the clicked amenity
      if (isMobile) {
        centerOnAmenityId = amenityId
        const amenity = campusAmenities.find(a => a.id === amenityId)
        if (amenity) {
          // Set zoom to 1 (maximum on mobile) if not already, then center after zoom updates
          if (zoom < 1) {
            zoom = 1
            updateScale()
            updateZoomButtons()
            // Wait for zoom to update before centering
            setTimeout(() => {
              centerMapOnAmenity(amenity)
              setTimeout(() => { centerOnAmenityId = null }, 1000)
            }, 150)
          } else {
            setTimeout(() => {
              centerMapOnAmenity(amenity)
              setTimeout(() => { centerOnAmenityId = null }, 1000)
            }, 300)
          }
        }
        // On mobile, keep the bubble in hover state longer (6 seconds) so label stays visible
        setTimeout(() => {
          hoveredAmenityId = null
          renderAmenityMarkers()
          renderAmenitiesGrid()
        }, 6000)
      } else {
        // Desktop: clear highlight after shorter delay
        setTimeout(() => {
          hoveredAmenityId = null
          renderAmenityMarkers()
          renderAmenitiesGrid()
        }, 2000)
      }
    }
  }
}

function handleAmenityHover(amenityId) {
  if (isMobile) return
  hoveredAmenityId = amenityId
  renderAmenityMarkers()
  renderAmenitiesGrid()
}

// Render amenities grid
function renderAmenitiesGrid() {
  const grid = document.getElementById('amenities-grid')
  if (!grid) return
  
  grid.innerHTML = ''
  
  campusAmenities.forEach((amenity, index) => {
    const card = document.createElement('div')
    card.id = `amenity-${amenity.id}`
    card.className = 'amenity-card'
    
    const hoverBg = document.createElement('div')
    hoverBg.className = 'amenity-hover-bg'
    card.appendChild(hoverBg)
    
    const content = document.createElement('div')
    content.className = 'amenity-content'
    
    const header = document.createElement('div')
    header.className = 'amenity-header'
    
    const iconCircle = document.createElement('div')
    iconCircle.className = 'amenity-icon-circle'
    const iconImg = document.createElement('img')
    iconImg.src = amenity.icon
    iconImg.alt = ''
    iconImg.onerror = () => { iconImg.style.display = 'none' }
    iconCircle.appendChild(iconImg)
    header.appendChild(iconCircle)
    
    const title = document.createElement('h3')
    title.className = 'amenity-title'
    title.textContent = amenity.title
    header.appendChild(title)
    
    content.appendChild(header)
    
    const imageContainer = document.createElement('div')
    imageContainer.className = 'amenity-image-container'
    const img = document.createElement('img')
    img.src = amenity.image
    img.alt = amenity.title
    imageContainer.appendChild(img)
    content.appendChild(imageContainer)
    
    const description = document.createElement('p')
    description.className = 'amenity-description'
    description.textContent = amenity.description
    content.appendChild(description)
    
    card.appendChild(content)
    
    if (!isMobile) {
      card.addEventListener('mouseenter', () => handleAmenityHover(amenity.id))
      card.addEventListener('mouseleave', () => handleAmenityHover(null))
    }
    card.addEventListener('click', function (e) {
      e.preventDefault()
      handleAmenityClick(amenity.id, false)
    })
    card.style.cursor = 'pointer'
    grid.appendChild(card)
  })
}

// Resize handler
window.addEventListener('resize', () => {
  const wasMobile = isMobile
  isMobile = window.innerWidth < 768
  if (wasMobile !== isMobile) {
    zoom = isMobile ? 1 : 0
    updateScale()
    updateZoomButtons()
  } else {
    updateScale()
  }
})

// Delegated click handlers (survive re-renders). Use capture on map so marker click is handled before map pan.
function setupDelegatedClickHandlers() {
  const mapEl = document.getElementById('campus-map')
  if (mapEl) {
    mapEl.addEventListener('click', (e) => {
      const marker = e.target.closest('.amenity-marker')
      if (!marker) return
      const id = marker.getAttribute('data-amenity-id')
      if (id) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        handleAmenityClick(id, true)
      }
    }, true)
  }
  const gridEl = document.getElementById('amenities-grid')
  if (gridEl) {
    gridEl.addEventListener('click', (e) => {
      const card = e.target.closest('.amenity-card')
      if (!card || !card.id || !card.id.startsWith('amenity-')) return
      const id = card.id.replace('amenity-', '')
      if (!id) return
      e.preventDefault()
      e.stopPropagation()
      handleAmenityClick(id, false)
    }, true)
  }
}

// Initialize when DOM is ready
function init() {
  setupDelegatedClickHandlers()
  updateScale()
  updateZoomButtons()
  renderAmenitiesGrid()
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}