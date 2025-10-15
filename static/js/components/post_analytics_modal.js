/**
 * Post Analytics Modal
 * Handles displaying detailed analytics for church posts
 */

let currentPostId = null;
let viewsInteractionsChart = null;
let engagementBreakdownChart = null;

/**
 * Open the post analytics modal and load data
 */
function viewPost(postId) {
    currentPostId = postId;
    const modal = document.getElementById('postAnalyticsModal');
    
    if (!modal) {
        console.error('Post analytics modal not found');
        return;
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Load analytics data
    loadPostAnalytics(postId);
}

/**
 * Close the post analytics modal
 */
function closePostAnalyticsModal() {
    const modal = document.getElementById('postAnalyticsModal');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Destroy charts to prevent memory leaks
    if (viewsInteractionsChart) {
        viewsInteractionsChart.destroy();
        viewsInteractionsChart = null;
    }
    
    if (engagementBreakdownChart) {
        engagementBreakdownChart.destroy();
        engagementBreakdownChart = null;
    }
    
    currentPostId = null;
}

/**
 * Load post analytics data from the server
 */
async function loadPostAnalytics(postId) {
    try {
        const response = await fetch(`/app/posts/${postId}/analytics/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            populateAnalyticsModal(data.analytics);
        } else {
            showError(data.message || 'Failed to load analytics');
            closePostAnalyticsModal();
        }
    } catch (error) {
        console.error('Error loading post analytics:', error);
        showError('An error occurred while loading analytics');
        closePostAnalyticsModal();
    }
}

/**
 * Populate the modal with analytics data
 */
function populateAnalyticsModal(analytics) {
    // Update header information
    document.getElementById('analyticsPostType').textContent = analytics.post_type;
    document.getElementById('analyticsPostType').className = `post-type-badge post-type-${analytics.post_type_value}`;
    document.getElementById('analyticsPostDate').textContent = analytics.created_at;
    document.getElementById('analyticsPostStatus').textContent = analytics.status;
    document.getElementById('analyticsPostStatus').className = `status-badge status-${analytics.status}`;
    
    // Update post content
    document.getElementById('analyticsPostContent').textContent = analytics.content;
    
    // Update stats cards
    document.getElementById('analyticsViews').textContent = formatNumber(analytics.stats.views);
    document.getElementById('analyticsLikes').textContent = formatNumber(analytics.stats.likes);
    document.getElementById('analyticsComments').textContent = formatNumber(analytics.stats.comments);
    document.getElementById('analyticsBookmarks').textContent = formatNumber(analytics.stats.bookmarks);
    document.getElementById('analyticsEngagement').textContent = analytics.stats.engagement_rate + '%';
    
    // Update likes percentage
    const likesPercent = analytics.stats.views > 0 
        ? ((analytics.stats.likes / analytics.stats.views) * 100).toFixed(1) 
        : 0;
    document.getElementById('analyticsLikesPercent').textContent = `${likesPercent}% of views`;
    
    // Update charts
    renderViewsInteractionsChart(analytics.views_over_time, analytics.interactions_over_time);
    renderEngagementBreakdownChart(analytics.engagement_breakdown);
    
    // Update audience demographics
    updateAudienceDemographics(analytics.audience_demographics);
    
    // Update top comments
    updateTopComments(analytics.top_comments);
    
    // Update performance insights
    updatePerformanceInsights(analytics.performance_insights);
    
    // Update meta info
    document.getElementById('analyticsPostId').textContent = analytics.post_id;
    document.getElementById('analyticsPostUpdated').textContent = analytics.updated_at;
    
    // Setup action buttons
    setupActionButtons(analytics.post_id);
}

/**
 * Render the Views & Interactions Over Time chart
 */
function renderViewsInteractionsChart(viewsData, interactionsData) {
    const ctx = document.getElementById('viewsInteractionsChart');
    
    if (!ctx) return;
    
    // Destroy existing chart
    if (viewsInteractionsChart) {
        viewsInteractionsChart.destroy();
    }
    
    const labels = viewsData.map(item => item.hour);
    const viewsCounts = viewsData.map(item => item.count);
    const interactionsCounts = interactionsData.map(item => item.count);
    
    viewsInteractionsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Views',
                    data: viewsCounts,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Interactions',
                    data: interactionsCounts,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12
                    },
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render the Engagement Breakdown chart
 */
function renderEngagementBreakdownChart(breakdownData) {
    const ctx = document.getElementById('engagementBreakdownChart');
    
    if (!ctx) return;
    
    // Destroy existing chart
    if (engagementBreakdownChart) {
        engagementBreakdownChart.destroy();
    }
    
    const data = [
        breakdownData.likes,
        breakdownData.comments,
        breakdownData.bookmarks,
        breakdownData.shares
    ];
    
    engagementBreakdownChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Likes', 'Comments', 'Bookmarks', 'Shares'],
            datasets: [{
                label: 'Interactions',
                data: data,
                backgroundColor: [
                    '#ec4899',
                    '#8b5cf6',
                    '#f59e0b',
                    '#06b6d4'
                ],
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12
                    },
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update audience demographics section
 */
function updateAudienceDemographics(demographics) {
    // Active Followers
    document.getElementById('activeFollowersCount').textContent = 
        `${formatNumber(demographics.active_followers.count)} (${demographics.active_followers.percentage}%)`;
    document.getElementById('activeFollowersProgress').style.width = 
        `${demographics.active_followers.percentage}%`;
    
    // New Followers
    document.getElementById('newFollowersCount').textContent = 
        `${formatNumber(demographics.new_followers.count)} (${demographics.new_followers.percentage}%)`;
    document.getElementById('newFollowersProgress').style.width = 
        `${demographics.new_followers.percentage}%`;
    
    // Non-Followers
    document.getElementById('nonFollowersCount').textContent = 
        `${formatNumber(demographics.non_followers.count)} (${demographics.non_followers.percentage}%)`;
    document.getElementById('nonFollowersProgress').style.width = 
        `${demographics.non_followers.percentage}%`;
}

/**
 * Update top comments section
 */
function updateTopComments(comments) {
    const tbody = document.getElementById('topCommentsBody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (comments.length === 0) {
        tbody.innerHTML = `
            <tr class="no-comments">
                <td colspan="4">No comments yet</td>
            </tr>
        `;
        return;
    }
    
    comments.forEach(comment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="comment-user">
                    <div class="user-avatar">${comment.user.initials}</div>
                    <span>${comment.user.name}</span>
                </div>
            </td>
            <td>${escapeHtml(comment.content)}</td>
            <td>
                <div class="comment-likes">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    ${comment.likes}
                </div>
            </td>
            <td>${comment.time_ago}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Update performance insights section
 */
function updatePerformanceInsights(insights) {
    document.getElementById('performanceMessage').textContent = 
        insights.above_average.message;
    document.getElementById('peakEngagementMessage').textContent = 
        insights.peak_engagement.message;
}

/**
 * Setup action buttons (Edit and Delete)
 */
function setupActionButtons(postId) {
    const editBtn = document.getElementById('analyticsEditBtn');
    const deleteBtn = document.getElementById('analyticsDeleteBtn');
    
    if (editBtn) {
        editBtn.onclick = () => {
            closePostAnalyticsModal();
            editPost(postId);
        };
    }
    
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            closePostAnalyticsModal();
            deletePost(postId);
        };
    }
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show error message
 */
function showError(message) {
    // You can implement your own error notification system here
    alert(message);
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('postAnalyticsModal');
    if (modal && e.target === modal.querySelector('.modal-overlay')) {
        closePostAnalyticsModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('postAnalyticsModal');
        if (modal && modal.style.display === 'flex') {
            closePostAnalyticsModal();
        }
    }
});
