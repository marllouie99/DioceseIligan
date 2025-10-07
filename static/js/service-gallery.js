// Service Image Gallery functionality
let currentServiceImages = [];
let currentImageIndex = 0;

async function openServiceGallery(serviceId) {
    try {
        // Fetch service images
        const response = await fetch(`/app/api/service/${serviceId}/images/`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.images && data.images.length > 0) {
            currentServiceImages = data.images;
            currentImageIndex = 0;
            
            // Update modal content
            document.getElementById('galleryServiceName').textContent = `${data.service_name} Photos`;
            document.getElementById('totalImages').textContent = data.images.length;
            
            // Load images
            loadGalleryImage(0);
            loadThumbnails();
            
            // Show modal
            document.getElementById('serviceGalleryModal').style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Initialize Feather icons if available
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        } else {
            // Show a simple alert if no images
            console.log('API Response:', data);
            alert('No additional images available for this service.');
        }
    } catch (error) {
        console.error('Error loading service gallery:', error);
        console.error('Service ID:', serviceId);
        alert(`Error loading images: ${error.message}. Please try again.`);
    }
}

function closeServiceGallery() {
    document.getElementById('serviceGalleryModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentServiceImages = [];
    currentImageIndex = 0;
}

function loadGalleryImage(index) {
    if (index >= 0 && index < currentServiceImages.length) {
        currentImageIndex = index;
        const image = currentServiceImages[index];
        
        document.getElementById('galleryMainImage').src = image.url;
        document.getElementById('currentImageIndex').textContent = index + 1;
        
        // Update active thumbnail
        updateActiveThumbnail(index);
        
        // Update navigation button states
        updateNavigationButtons();
    }
}

function loadThumbnails() {
    const container = document.getElementById('galleryThumbnails');
    container.innerHTML = '';
    
    currentServiceImages.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.onclick = () => loadGalleryImage(index);
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = `Photo ${index + 1}`;
        img.loading = 'lazy';
        
        thumbnail.appendChild(img);
        container.appendChild(thumbnail);
    });
}

function updateActiveThumbnail(activeIndex) {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === activeIndex);
    });
}

function updateNavigationButtons() {
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    
    prevBtn.style.display = currentImageIndex > 0 ? 'flex' : 'none';
    nextBtn.style.display = currentImageIndex < currentServiceImages.length - 1 ? 'flex' : 'none';
}

function previousImage() {
    if (currentImageIndex > 0) {
        loadGalleryImage(currentImageIndex - 1);
    }
}

function nextImage() {
    if (currentImageIndex < currentServiceImages.length - 1) {
        loadGalleryImage(currentImageIndex + 1);
    }
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('serviceGalleryModal');
    if (modal.style.display === 'block') {
        switch(e.key) {
            case 'Escape':
                closeServiceGallery();
                break;
            case 'ArrowLeft':
                previousImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
        }
    }
});

// Close modal when clicking outside
document.getElementById('serviceGalleryModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeServiceGallery();
    }
});
