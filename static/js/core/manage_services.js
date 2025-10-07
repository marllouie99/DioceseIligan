document.addEventListener('DOMContentLoaded', function() {
  // Add confirmation for delete actions
  const deleteButtons = document.querySelectorAll('.btn-danger');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
        e.preventDefault();
      }
    });
  });

  // Auto-submit search form on filter change
  const filterSelects = document.querySelectorAll('.filter-select');
  filterSelects.forEach(select => {
    select.addEventListener('change', function() {
      const form = document.getElementById('search-form');
      if (form) form.submit();
    });
  });
});

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

function openImageGallery(serviceId) {
  const base = window.djangoUrls.manageServiceImages;
  window.location.href = base.replace('/0/', `/${serviceId}/`);
}

function openPhotoGallery(serviceId) {
  const base = window.djangoUrls.serviceGallery;
  window.location.href = base.replace('/0/', `/${serviceId}/`);
}



