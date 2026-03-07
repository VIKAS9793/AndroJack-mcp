// Fetch NPM Data for AndroJack-mcp
const PACKAGE_NAME = 'androjack-mcp';
const API_URL = `https://api.npmjs.org/downloads/range/last-month/${PACKAGE_NAME}`;

async function fetchMetrics() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Extract the last 7 days of data for the big counter
        const downloadsArray = data.downloads;
        const last7Days = downloadsArray.slice(-7);
        const weeklyTotal = last7Days.reduce((sum, dayData) => sum + dayData.downloads, 0);

        // Update the DOM counter with an animation
        const counterElement = document.getElementById('weekly-downloads');
        animateValue(counterElement, 0, weeklyTotal, 2000); // 2 second animation

        // Prepare data for the Chart (last 30 days)
        const labels = downloadsArray.map(d => {
            const date = new Date(d.day);
            return `${date.getMonth() + 1}/${date.getDate()}`; // Format MM/DD
        });
        const downloadCounts = downloadsArray.map(d => d.downloads);

        renderChart(labels, downloadCounts);

    } catch (error) {
        console.error("Failed to fetch NPM metrics:", error);
        document.getElementById('weekly-downloads').innerText = "Unavailable";
    }
}

// Animation function for YouTube subscriber-style countdown
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easeOutQuart for a smooth, slowing down effect
        const easeOut = 1 - Math.pow(1 - progress, 4);
        obj.innerHTML = Math.floor(easeOut * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end.toLocaleString();
        }
    };
    window.requestAnimationFrame(step);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    // Create a gradient for the chart line fill
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(127, 82, 255, 0.5)'); // MCP Purple
    gradient.addColorStop(1, 'rgba(127, 82, 255, 0.0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily NPM Downloads',
                data: data,
                borderColor: '#7F52FF',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#3DDC84', // Android Green dots
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#3DDC84',
                fill: true,
                tension: 0.4 // Bouncy, smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#3DDC84',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#94a3b8', maxTicksLimit: 7 }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#94a3b8', stepSize: 50 },
                    beginAtZero: true
                }
            },
            animation: {
                y: {
                    duration: 2000,
                    easing: 'easeOutElastic' // Bouncy chart render!
                }
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchMetrics);
