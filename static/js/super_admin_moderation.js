document.addEventListener('DOMContentLoaded', function() {
  // Moderation Activity Chart
  const activityCtx = document.getElementById('moderationActivityChart');
  if (activityCtx) {
    new Chart(activityCtx, {
      type: 'bar',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Dismissed',
            data: [2, 4, 2, 4],
            backgroundColor: 'rgba(107, 114, 128, 0.85)',
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'New Reports',
            data: [12, 15, 9, 18],
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Resolved',
            data: [10, 11, 7, 14],
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
    new Chart(reasonsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Inappropriate Content', 'Spam', 'Misinformation', 'Suspicious Activity', 'Other'],
        datasets: [{
          data: [12, 8, 6, 4, 3],
          backgroundColor: [
            'rgba(239, 68, 68, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(251, 191, 36, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(107, 114, 128, 0.85)'
          ],
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
