document.addEventListener('DOMContentLoaded', () => {
    const reportsContainer = document.getElementById('reports-container');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const historyKey = 'lotteryDrawHistory';

    function loadCustomerReportsData() {
        const customerReports = [];
        const customerKeys = Object.keys(localStorage).filter(key => key.startsWith('customerReports_'));
        
        console.log('Found customer report keys:', customerKeys);
        
        customerKeys.forEach(key => {
            try {
                const rawData = localStorage.getItem(key);
                console.log('Raw data for', key, ':', rawData?.substring(0, 100) + '...');
                
                const data = JSON.parse(rawData);
                
                // Validate data is an array
                if (!Array.isArray(data)) {
                    console.warn('Customer data is not an array for key:', key, data);
                    return;
                }
                
                const parts = key.split('_');
                if (parts.length >= 3) {
                    const date = parts[1];
                    const time = parts.slice(2).join('_');
                    
                    // Convert customer data to history format
                    // Use a consistent ID based on the key to prevent changes on refresh
                    const customerEntry = {
                        id: key.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0),
                        date: date,
                        time: time,
                        prizes: {},
                        source: 'customer',
                        originalKey: key
                    };
                    
                    // Group all winning numbers by customer
                    const allWinningNumbers = new Set();
                    const customerNames = new Set();
                    
                    data.forEach(customer => {
                        if (customer && typeof customer === 'object') {
                            customerNames.add(customer.name || 'Unknown');
                            
                            if (customer.winningTickets && Array.isArray(customer.winningTickets) && customer.winningTickets.length > 0) {
                                customer.winningTickets.forEach(wt => {
                                    if (wt && wt.ticket) {
                                        allWinningNumbers.add(`${wt.ticket} (${customer.name || 'Unknown'})`);
                                    }
                                });
                            }
                        }
                    });
                    
                    // Always add the entry, even if no winning numbers, to show customer participation
                    if (customerNames.size > 0) {
                        if (allWinningNumbers.size > 0) {
                            customerEntry.prizes['Customer Winning Numbers'] = Array.from(allWinningNumbers);
                        } else {
                            customerEntry.prizes['Customers Recorded'] = Array.from(customerNames);
                        }
                        customerReports.push(customerEntry);
                        console.log('Added customer entry:', customerEntry);
                    }
                }
            } catch (e) {
                console.error('Error parsing customer report:', key, e);
            }
        });
        
        console.log('Total customer reports loaded:', customerReports.length);
        return customerReports;
    }

    function loadAndRenderReports() {
        try {
            reportsContainer.innerHTML = '';
            let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            // Load customer reports data using helper function
            const customerReports = loadCustomerReportsData();
            
            // Debug logging
            console.log('OCR History:', history.length, 'items');
            console.log('Customer Reports:', customerReports.length, 'items');
            
            // Combine OCR history and customer reports
            history = [...history, ...customerReports];

            if (history.length === 0) {
                reportsContainer.innerHTML = `
                    <div class="no-reports">
                        <p>No reports found.</p>
                        <p class="sub-text">Please save some results from the OCR app or customer data first.</p>
                        <p class="debug-info">Checked localStorage keys: ${Object.keys(localStorage).filter(k => k.startsWith('customer') || k === 'lotteryDrawHistory').join(', ') || 'None found'}</p>
                    </div>
                `;
                deleteAllBtn.style.display = 'none';
                return;
            }
            deleteAllBtn.style.display = 'block';
        } catch (error) {
            console.error('Error in loadAndRenderReports:', error);
            reportsContainer.innerHTML = `
                <div class="no-reports">
                    <p>Error loading reports: ${error.message}</p>
                </div>
            `;
            return;
        }

        const drawsByDate = history.reduce((acc, draw) => {
            const date = draw.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(draw);
            return acc;
        }, {});

        const sortedDates = Object.keys(drawsByDate).sort().reverse();

        for (const date of sortedDates) {
            const dateCard = document.createElement('div');
            dateCard.className = 'date-card';
            
            let drawsHtml = drawsByDate[date].map(draw => {
                const sourceLabel = draw.source === 'customer' ? ' (Customer Data)' : ' (OCR Data)';
                return `
                    <div class="draw-time-entry">
                        <span>${draw.time}${sourceLabel}</span>
                        <button class="view-results-btn" data-draw-id="${draw.id}">View Results</button>
                    </div>
                `;
            }).join('');

            dateCard.innerHTML = `
                <h2>${date}</h2>
                <div class="draw-time-container">
                    ${drawsHtml}
                </div>
            `;
            reportsContainer.appendChild(dateCard);
        }
    }

    function openResultsPopup(draw) {
        const sourceLabel = draw.source === 'customer' ? 'Customer Data' : 'OCR Data';
        const prizeEntries = Object.entries(draw.prizes).map(([category, numbers]) => {
            return `
                <div class="prize-category">
                    <h3>${category}</h3>
                    <p>${numbers.join(', ')}</p>
                </div>
            `;
        }).join('');

        const popupContent = `
            <html>
                <head>
                    <title>${sourceLabel} - Results for ${draw.date} at ${draw.time}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        h2 { text-align: center; margin-bottom: 10px; }
                        .source-info { text-align: center; margin-bottom: 20px; font-style: italic; color: #666; }
                        .prize-category { margin-bottom: 15px; }
                        .prize-category h3 { margin: 0 0 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        .prize-category p { margin: 0; word-wrap: break-word; }
                        .customer-data { background-color: #f0f8ff; }
                        .ocr-data { background-color: #f8f8f8; }
                    </style>
                </head>
                <body class="${draw.source === 'customer' ? 'customer-data' : 'ocr-data'}">
                    <h2>Results for ${draw.date} at ${draw.time}</h2>
                    <div class="source-info">Source: ${sourceLabel}</div>
                    ${prizeEntries}
                </body>
            </html>
        `;
        const popup = window.open('', '_blank', 'width=800,height=600');
        popup.document.write(popupContent);
        popup.document.close();
    }

    function deleteAllData() {
        if (confirm('ARE YOU SURE you want to delete ALL saved draw history? This action cannot be undone.')) {
            localStorage.removeItem(historyKey);
            loadAndRenderReports();
        }
    }

    deleteAllBtn.addEventListener('click', deleteAllData);

    reportsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-results-btn')) {
            const drawId = parseInt(e.target.dataset.drawId, 10);
            
            // Search in both OCR history and customer reports
            let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            // Load customer reports data using helper function
            const customerReports = loadCustomerReportsData();
            
            // Combine both sources
            history = [...history, ...customerReports];
            const draw = history.find(d => d.id === drawId);
            
            if (draw) {
                openResultsPopup(draw);
            } else {
                alert('Could not find the selected draw. The data may have been recently cleared.');
            }
        }
    });

    function calculateAndRenderOverallSummary() {
        // Load both OCR history and customer reports for summary
        let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const customerReports = loadCustomerReportsData();
        const combinedHistory = [...history, ...customerReports];
        
        if (combinedHistory.length === 0) {
            document.getElementById('overall-summary-container').innerHTML = `
                <p><strong>No data available for summary</strong></p>
            `;
            return;
        }

        const totalDraws = combinedHistory.length;
        const ocrDraws = history.length;
        const customerDraws = customerReports.length;
        
        let allNumbers = [];
        let timeCounts = {};

        combinedHistory.forEach(draw => {
            // Count draw times
            timeCounts[draw.time] = (timeCounts[draw.time] || 0) + 1;
            
            // Collect all numbers
            Object.values(draw.prizes).forEach(numberArray => {
                allNumbers.push(...numberArray);
            });
        });

        const totalWinningNumbers = new Set(allNumbers).size;

        const mostCommonTime = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        const summaryHTML = `
            <p><strong>Total Reports Saved:</strong> ${totalDraws}</p>
            <p><strong>OCR Reports:</strong> ${ocrDraws}</p>
            <p><strong>Customer Reports:</strong> ${customerDraws}</p>
            <p><strong>Total Unique Winning Numbers:</strong> ${totalWinningNumbers}</p>
            <p><strong>Most Frequent Draw Time:</strong> ${mostCommonTime}</p>
        `;

        document.getElementById('overall-summary-container').innerHTML = summaryHTML;
    }

    // Initial load
    loadAndRenderReports();
    calculateAndRenderOverallSummary();
});