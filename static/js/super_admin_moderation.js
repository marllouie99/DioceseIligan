document.addEventListener('DOMContentLoaded', function() {
  // Handle delete comment button
  document.addEventListener('click', function(e) {
    const deleteBtn = e.target.closest('.btn-delete-comment');
    if (deleteBtn) {
      const commentId = deleteBtn.dataset.commentId;
      const reportId = deleteBtn.dataset.reportId;
      
      if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
        deleteComment(commentId, deleteBtn);
      }
    }
    
    // Handle dismiss report button
    const dismissBtn = e.target.closest('.btn-dismiss-report');
    if (dismissBtn) {
      const reportId = dismissBtn.dataset.reportId;
      const reportType = dismissBtn.dataset.type;
      
      if (confirm('Are you sure you want to dismiss this report?')) {
        dismissReport(reportId, reportType, dismissBtn);
      }
    }
  });
  
  // Delete comment function
  async function deleteComment(commentId, button) {
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span>Deleting...</span>';
    
    try {
      const response = await fetch(`/app/comments/${commentId}/delete/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the row from table
        const row = button.closest('tr');
        if (row) {
          row.style.opacity = '0';
          setTimeout(() => row.remove(), 300);
        }
        showNotification('Comment deleted successfully', 'success');
      } else {
        alert(data.message || 'Failed to delete comment');
        button.disabled = false;
        button.innerHTML = originalHtml;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while deleting the comment');
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }
  
  // Dismiss report function
  async function dismissReport(reportId, reportType, button) {
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span>Dismissing...</span>';
    
    try {
      const response = await fetch(`/app/comment-reports/${reportId}/dismiss/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update status badge
        const row = button.closest('tr');
        if (row) {
          const statusBadge = row.querySelector('.status-badge');
          if (statusBadge) {
            statusBadge.className = 'status-badge status-dismissed';
            statusBadge.textContent = 'Dismissed';
          }
          // Disable action buttons
          row.querySelectorAll('.btn-action').forEach(btn => btn.disabled = true);
        }
        showNotification('Report dismissed successfully', 'success');
      } else {
        alert(data.message || 'Failed to dismiss report');
        button.disabled = false;
        button.innerHTML = originalHtml;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while dismissing the report');
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }
  
  // Get CSRF token
  function getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Moderation Activity Chart
  const activityCtx = document.getElementById('moderationActivityChart');
  if (activityCtx) {
    // Get data from template
    const weeklyActivityData = JSON.parse(document.getElementById('weeklyActivityData')?.textContent || '[]');
    
    // Extract data for each dataset
    const dismissedData = weeklyActivityData.map(week => week.dismissed);
    const newReportsData = weeklyActivityData.map(week => week.new);
    const resolvedData = weeklyActivityData.map(week => week.resolved);
    
    new Chart(activityCtx, {
      type: 'bar',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Dismissed',
            data: dismissedData,
            backgroundColor: 'rgba(107, 114, 128, 0.85)',
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'New Reports',
            data: newReportsData,
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Resolved',
            data: resolvedData,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  // Report Reasons Chart
  const reasonsCtx = document.getElementById('reportReasonsChart');
  if (reasonsCtx) {
    // Get data from template
    const reportReasonsData = JSON.parse(document.getElementById('reportReasonsData')?.textContent || '{"labels":[],"data":[]}');
    
    // Define colors for each reason type
    const colorMap = {
      'Inappropriate Content': 'rgba(239, 68, 68, 0.85)',
      'Spam': 'rgba(245, 158, 11, 0.85)',
      'Misinformation': 'rgba(251, 191, 36, 0.85)',
      'Harassment': 'rgba(239, 68, 68, 0.85)',
      'Violence': 'rgba(220, 38, 38, 0.85)',
      'Suspicious Activity': 'rgba(139, 92, 246, 0.85)',
      'Other': 'rgba(107, 114, 128, 0.85)'
    };
    
    // Generate colors based on labels
    const colors = reportReasonsData.labels.map(label => 
      colorMap[label] || 'rgba(107, 114, 128, 0.85)'
    );
    
    new Chart(reasonsCtx, {
      type: 'doughnut',
      data: {
        labels: reportReasonsData.labels,
        datasets: [{
          data: reportReasonsData.data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        }
      }
    });
  }

  // Search functionality for reports
  const reportSearch = document.getElementById('reportSearch');
  if (reportSearch) {
    reportSearch.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const tableRows = document.querySelectorAll('#reportsTable tbody tr');
      
      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // Search functionality for verifications
  const verificationSearch = document.getElementById('verificationSearch');
  if (verificationSearch) {
    verificationSearch.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const tableRows = document.querySelectorAll('#verificationsTable tbody tr');
      
      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }
});
