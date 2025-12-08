document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const PWT_AMOUNTS = {
        '1st Prize': 25000,
        '2nd Prize': 20000,
        '3rd Prize': 2000,
        '4th Prize': 700,
        '5th Prize': 300
    };
    const VC_AMOUNTS = {
        '1st Prize': 2000,
        '2nd Prize': 2000,
        '3rd Prize': 200,
        '4th Prize': 150,
        '5th Prize': 70
    };
    const SVC_AMOUNTS = {
        '1st Prize': 400,
        '2nd Prize': 400,
        '3rd Prize': 40,
        '4th Prize': 20,
        '5th Prize': 10
    };

    // --- DOM Elements ---
    const customerTableBody = document.getElementById('customer-table-body');
    const entryDate = document.getElementById('entry-date');
    const drawTimeSelect = document.getElementById('draw-time-select');
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const soldNumbersModal = document.getElementById('sold-numbers-modal');
    const unsoldNumbersModal = document.getElementById('unsold-numbers-modal');
    const prizeResultModal = document.getElementById('prize-result-modal');
    const winningNumbersModal = document.getElementById('winning-numbers-modal');
    const prizeCategoryModal = document.getElementById('prize-category-modal');
    const customerNameInput = document.getElementById('customer-name-input');
    const soldNumbersChipContainer = document.getElementById('sold-numbers-chip-container');
    const unsoldNumbersChipContainer = document.getElementById('unsold-numbers-chip-container');
    const editCustomerModal = document.getElementById('edit-customer-modal');
    const editCustomerNameInput = document.getElementById('edit-customer-name-input');
    const editSemTypeSelect = document.getElementById('edit-sem-type-select');
    const editPurchaseInput = document.getElementById('edit-purchase-input');
    const editUnsoldInput = document.getElementById('edit-unsold-input');
    const updateCustomerBtn = document.getElementById('update-customer-btn');
    const copyAllSoldBtn = document.getElementById('copy-all-sold-btn');
    const prizeResultTitle = document.getElementById('prize-result-title');
    const prizeResultTableBody = document.getElementById('prize-result-table-body');
    const winningNumbersChipContainer = document.getElementById('winning-numbers-chip-container');
    const prizeCategoryModalText = document.getElementById('prize-category-modal-text');
    const viewResultBtn = document.getElementById('view-result-btn');
    const submitAllDataBtn = document.getElementById('submit-all-data-btn');
    const reportCardsContainer = document.getElementById('report-cards-container');
    const reportDetailModal = document.getElementById('report-detail-modal');
    const reportDateDisplay = document.getElementById('report-date-display');
    const customerListContainer = document.getElementById('customer-list-container');
    const downloadReportBtn = document.getElementById('download-report-btn');
    const clearReportsBtn = document.getElementById('clear-reports-btn');
    const searchUnsoldBtn = document.getElementById('search-unsold-btn');
    const searchUnsoldModal = document.getElementById('search-unsold-modal');
    const searchCustomerNameInput = document.getElementById('search-customer-name-input');
    const searchUnsoldNumbersInput = document.getElementById('search-unsold-numbers-input');
    const submitSearchUnsoldBtn = document.getElementById('submit-search-unsold-btn');
    const searchUnsoldResultsContainer = document.getElementById('search-unsold-results-container');

    // --- State Management ---
    let tableData = [];
    let currentCustomer = null;
    let currentDrawTime = null;
    let currentEntryDate = null;

    // --- Utility Functions ---
    const showModal = (modal) => modal.style.display = 'flex';
    const hideModal = (modal) => modal.style.display = 'none';
    const setCurrentDate = () => { entryDate.value = new Date().toISOString().slice(0, 10); };

    function getCategoryClass(category) {
        if (!category) return '';
        if (category.includes('1st')) return 'prize-cat-1';
        if (category.includes('2nd')) return 'prize-cat-2';
        if (category.includes('3rd')) return 'prize-cat-3';
        if (category.includes('4th')) return 'prize-cat-4';
        if (category.includes('5th')) return 'prize-cat-5';
        return '';
    }

    function parseAlphanumericTicket(ticketString) {
        const match = ticketString.match(/^(.*?)(\d+)(\D*)$/);
        if (match) return { prefix: match[1], numericPart: parseInt(match[2], 10), padding: match[2].length, suffix: match[3] };
        const numeric = parseInt(ticketString, 10);
        return { prefix: '', numericPart: isNaN(numeric) ? 0 : numeric, padding: ticketString.length, suffix: '' };
    }

    function formatAlphanumericTicket(prefix, num, padding, suffix) {
        return prefix + String(num).padStart(padding, '0') + suffix;
    }
    
    function getNumericDisplay(ticketStringOrRange) {
        if (!ticketStringOrRange) return '';
        const rangeMatch = ticketStringOrRange.match(/^(.*?)(\d+)(\D*)-(.*?)(\d+)(\D*)$/);
        if (rangeMatch) return `${String(rangeMatch[2]).padStart(rangeMatch[5].length, '0')}-${rangeMatch[5]}`;
        const singleMatch = ticketStringOrRange.match(/\d+/);
        if (singleMatch) return singleMatch[0];
        return ticketStringOrRange;
    }

    function formatSoldNumbersForPopup(soldNumbers) {
        if (!soldNumbers || soldNumbers.length === 0) return '';
        
        const NUMBERS_PER_LINE = 7;
        let lines = [];
        for (let i = 0; i < soldNumbers.length; i += NUMBERS_PER_LINE) {
            lines.push(
                soldNumbers.slice(i, i + NUMBERS_PER_LINE).map(getNumericDisplay).join(', ')
            );
        }
        return lines.join(',<br>');
    }

    function formatWinningTicketsForPopup(winningTickets) {
        if (!winningTickets || winningTickets.length === 0) return '';
        return winningTickets.map(wt => `${wt.ticket} (${wt.category})`).join('<br>');
    }

    function calculateReportSummary(fullReportData) {
        const summary = {
            totalPWT: 0,
            totalVC: 0,
            totalSVC: 0,
            totalSoldCount: 0,
            totalPurchaseCount: 0,
        };

        if (!fullReportData) return summary;

        const parseAmount = (str) => parseInt(str.split(' ')[0].replace(/,/g, ''), 10) || 0;

        fullReportData.forEach(row => {
            summary.totalSoldCount += (row.soldNumbers || []).length;
            summary.totalPurchaseCount += (row.purchaseCount || 0);

            (row.pwtBreakdown || []).forEach(item => summary.totalPWT += parseAmount(item));
            (row.vcBreakdown || []).forEach(item => summary.totalVC += parseAmount(item));
            (row.svcBreakdown || []).forEach(item => summary.totalSVC += parseAmount(item));
        });

        return summary;
    }

    function compressNumberList(numbersAsStrings) {
        if (!numbersAsStrings || numbersAsStrings.length === 0) return [];
        const parsedNumbers = numbersAsStrings.map(s => parseAlphanumericTicket(s)).sort((a, b) => a.numericPart - b.numericPart);
        if (parsedNumbers.length === 0) return [];
        const { prefix, padding, suffix } = parsedNumbers[0];
        const ranges = [];
        let startNum = parsedNumbers[0].numericPart;
        let endNum = parsedNumbers[0].numericPart;
        for (let i = 1; i < parsedNumbers.length; i++) {
            if (parsedNumbers[i].numericPart === endNum + 1) {
                endNum = parsedNumbers[i].numericPart;
            } else {
                const startStr = formatAlphanumericTicket(prefix, startNum, padding, suffix);
                const endStr = formatAlphanumericTicket(prefix, endNum, padding, suffix);
                ranges.push(startNum === endNum ? startStr : `${startStr}-${endStr}`);
                startNum = parsedNumbers[i].numericPart;
                endNum = parsedNumbers[i].numericPart;
            }
        }
        const startStr = formatAlphanumericTicket(prefix, startNum, padding, suffix);
        const endStr = formatAlphanumericTicket(prefix, endNum, padding, suffix);
        ranges.push(startNum === endNum ? startStr : `${startStr}-${endStr}`);
        return ranges;
    }

    function getOcrResultKey() {
        const date = entryDate.value;
        const drawTimeMap = { 'Morning': '1PM', 'Noon': '6PM', 'Evening': '8PM' };
        const ocrDrawTime = drawTimeMap[drawTimeSelect.value];
        if (!date || !ocrDrawTime) return null;
        return `lotteryResult_${date}_${ocrDrawTime}`;
    }

    function getReportKey(date, drawTime) {
        return `customerReports_${date}_${drawTime}`;
    }

    function getDailyCustomersKey(date) {
        return `dailyCustomers_${date}`;
    }

    function parseReportKey(key) {
        const parts = key.split('_');
        if (parts.length === 3) {
            return { date: parts[1], drawTime: parts[2] };
        }
        return { date: undefined, drawTime: undefined };
    }

    function parsePrizeAmount(amountString) {
    if (!amountString) return 0;

    let multiplier = 1;
    let numericString = amountString;

    if (amountString.toLowerCase().includes('crore')) {
        multiplier = 10000000;
        numericString = amountString.replace(/crore/gi, '');
    } else if (amountString.toLowerCase().includes('lakh')) {
        multiplier = 100000;
        numericString = amountString.replace(/lakh/gi, '');
    }

    const cleanedString = numericString.replace(/[^\d.]/g, '');
    const number = parseFloat(cleanedString);

    if (isNaN(number)) return 0;

    return Math.round(number * multiplier);
}

    function getWinningPrizesMap() {
        const key = getOcrResultKey();
        if (!key) return null;
        const ocrResult = localStorage.getItem(key);
        if (!ocrResult) return null;
        const parsedResult = JSON.parse(ocrResult);
        const prizesMap = new Map();
        if (parsedResult && parsedResult.results) {
            parsedResult.results.forEach(prize => {
                const amount = PWT_AMOUNTS[prize.category] || 0;
                if (prize.numbers && prize.numbers !== 'N/A') {
                    prize.numbers.split(',').forEach(numStr => {
                        const ticketNumber = numStr.trim().match(/\d+$/)?.[0];
                        if (ticketNumber) prizesMap.set(ticketNumber, { category: prize.category, amount: amount });
                    });
                }
            });
        }
        return prizesMap;
    }

    // Display prize results in customer entry view
    function displayPrizeResults() {
        const key = getOcrResultKey();
        if (!key) return;
        
        const ocrResult = localStorage.getItem(key);
        if (!ocrResult) {
            const prizeDisplayEl = document.getElementById('prize-results-display');
            if (prizeDisplayEl) {
                prizeDisplayEl.innerHTML = `<div class="no-results">No lottery results uploaded for ${entryDate.value} (${drawTimeSelect.value})</div>`;
            } else {
                console.warn('prize-results-display element not found; skipping display update.');
            }
            return;
        }
        
        const parsedResult = JSON.parse(ocrResult);
        const drawTimeLabels = { 'Morning': '1PM Upload', 'Noon': '6PM Upload', 'Evening': '8PM Upload' };
        const displayLabel = drawTimeLabels[drawTimeSelect.value] || drawTimeSelect.value;
        
        let prizeHTML = `
            <div class="prize-results-header">
                <h4>📋 Lottery Results - ${entryDate.value} (${displayLabel})</h4>
            </div>
            <div class="prize-results-table">
        `;
        
        if (parsedResult && parsedResult.results) {
            prizeHTML += `
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Prize Category</th>
                            <th>Winning Numbers</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            parsedResult.results.forEach(prize => {
                const categoryClass = getCategoryClass(prize.category);
                prizeHTML += `
                    <tr>
                        <td class="prize-category ${categoryClass}">${prize.category}</td>
                        <td class="winning-numbers">${prize.numbers || 'N/A'}</td>
                    </tr>
                `;
            });
            
            prizeHTML += `
                    </tbody>
                </table>
            `;
        } else {
            prizeHTML += '<div class="no-results">No valid results found in uploaded data</div>';
        }
        
        prizeHTML += '</div>';
        const prizeDisplayEl = document.getElementById('prize-results-display');
        if (prizeDisplayEl) {
            prizeDisplayEl.innerHTML = prizeHTML;
        } else {
            console.warn('prize-results-display element not found; skipping display update.');
        }
    }

    // --- Modal Functions ---
    function showPrizeCategoryModal(category) {
        prizeCategoryModalText.textContent = category;
        showModal(prizeCategoryModal);
    }

    function openSoldNumbersModal(index, data = tableData) {
        const rowData = data[index];
        if (!rowData || !rowData.soldNumbers) return;
        const winDetailsMap = new Map();
        (rowData.winningTickets || []).forEach(wt => winDetailsMap.set(wt.ticket, getCategoryClass(wt.category)));
        soldNumbersChipContainer.innerHTML = rowData.soldNumbers.map(soldNum => {
            let winnerClass = '';
            for (const [winner, categoryClass] of winDetailsMap.entries()) {
                if (soldNum.endsWith(winner)) { winnerClass = categoryClass; break; }
            }
            return `<span class="sold-chip ${winnerClass ? `winning-chip ${winnerClass}` : ''}">${getNumericDisplay(soldNum)}</span>`;
        }).join('');
        copyAllSoldBtn.onclick = () => navigator.clipboard.writeText(rowData.soldNumbers.join(', ')).then(() => alert('Copied!'));
        showModal(soldNumbersModal);
    }

    function openWinningNumbersModal(index, data = tableData) {
        const rowData = data[index];
        if (!rowData || !rowData.winningTickets || rowData.winningTickets.length === 0) return;
        winningNumbersChipContainer.innerHTML = rowData.winningTickets.map(wt => {
            const categoryClass = getCategoryClass(wt.category);
            return `<span class="sold-chip winning-chip winning-ticket-chip ${categoryClass}" data-ticket-category="${wt.category}">${wt.ticket}</span>`;
        }).join(' ');
        showModal(winningNumbersModal);
    }

    function openUnsoldNumbersModal(index, data = tableData) {
        const rowData = data[index];
        if (!rowData || !rowData.unsoldNumbersWithStatus) return;
        unsoldNumbersChipContainer.innerHTML = rowData.unsoldNumbersWithStatus.map(unsoldNum => {
            return `<span class="sold-chip ${!unsoldNum.isValid ? 'invalid-number' : ''}">${unsoldNum.number}</span>`;
        }).join('');
        showModal(unsoldNumbersModal);
    }

    // --- Core Logic ---
    function deleteSemRow(index) {
        if (!confirm('Are you sure you want to delete this SEM entry?')) return;
        tableData.splice(index, 1);
        renderTable();
        // Optionally, save the report after deletion if auto-save is desired
        // saveReport(entryDate.value, drawTimeSelect.value, tableData);
    }



    function deleteCustomer(customerName) {
        if (!confirm(`Are you sure you want to delete all entries for ${customerName}?`)) return;
        tableData = tableData.filter(row => row.name !== customerName);
        renderTable();
        // Optionally, save the report after deletion if auto-save is desired
        // saveReport(entryDate.value, drawTimeSelect.value, tableData);
    }

    function getTruncatedText(text, maxLength, index, linkClass) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return `${text.substring(0, maxLength)}... <span class="${linkClass}" data-index="${index}">(see more)</span>`;
    }

    function getGroupedData() {
        const groupedData = [];
        if (tableData.length === 0) {
            return groupedData;
        }

        let currentCustomerName = tableData[0].name;
        let currentCustomerRows = [];

        tableData.forEach(row => {
            if (row.name !== currentCustomerName) {
                groupedData.push({
                    customerName: currentCustomerName,
                    rows: currentCustomerRows,
                    summary: calculateCustomerSummary(currentCustomerRows)
                });
                currentCustomerName = row.name;
                currentCustomerRows = [];
            }
            currentCustomerRows.push(row);
        });

        groupedData.push({
            customerName: currentCustomerName,
            rows: currentCustomerRows,
            summary: calculateCustomerSummary(currentCustomerRows)
        });

        return groupedData;
    }

    function calculateCustomerSummary(rows) {
        const summary = {
            totalPurchase: 0,
            totalUnsold: 0,
            totalSold: 0,
            totalWinningTickets: 0,
            totalPWT: 0,
            totalVC: 0,
            totalSVC: 0,
        };

        rows.forEach(rowData => {
            let numberOfTickets = 0;
            const purchaseRanges = (rowData.purchaseRanges || '').split(',').map(r => r.trim()).filter(Boolean);
            for (const range of purchaseRanges) {
                const parts = range.split('-').map(p => p.trim());
                if (parts.length === 2) {
                    const parsedFrom = parseAlphanumericTicket(parts[0]);
                    const parsedTo = parseAlphanumericTicket(parts[1]);
                    const numericFrom = parsedFrom.numericPart;
                    const numericTo = parsedTo.numericPart;
                    if (!isNaN(numericFrom) && !isNaN(numericTo) && numericTo >= numericFrom) {
                        numberOfTickets += (numericTo - numericFrom + 1);
                    }
                } else if (parts.length === 1) {
                    numberOfTickets++;
                }
            }
            summary.totalPurchase += numberOfTickets * (parseInt(rowData.sem, 10) || 0);
            // Calculate unsold total: count of unsold tickets × SEM value
            const unsoldCount = (rowData.unsoldNumbers || []).length;
            const semValue = parseInt(rowData.sem, 10) || 0;
            summary.totalUnsold += unsoldCount * semValue;
            
            // Calculate sold total: count of sold tickets × SEM value
            const soldCount = (rowData.soldNumbers || []).length;
            summary.totalSold += soldCount * semValue;
            summary.totalWinningTickets += (rowData.winningTickets || []).length;

            (rowData.pwtBreakdown || []).forEach(item => {
                const amount = parseInt(item.split(' ')[0].replace(/,/g, ''), 10) || 0;
                summary.totalPWT += amount;
            });
            (rowData.vcBreakdown || []).forEach(item => {
                const amount = parseInt(item.split(' ')[0].replace(/,/g, ''), 10) || 0;
                summary.totalVC += amount;
            });
            (rowData.svcBreakdown || []).forEach(item => {
                const amount = parseInt(item.split(' ')[0].replace(/,/g, ''), 10) || 0;
                summary.totalSVC += amount;
            });
        });

        return summary;
    }

    function renderTable() {
        customerTableBody.innerHTML = '';
        const groupedData = getGroupedData();
        let customerSerial = 0;

        groupedData.forEach(customerGroup => {
            customerSerial++;
            const customerRows = customerGroup.rows;
            const summary = customerGroup.summary;

            customerRows.forEach((rowData, rowIndex) => {
                const tr = document.createElement('tr');
                const globalIndex = tableData.indexOf(rowData);
                tr.dataset.index = globalIndex;
                
                let cellsHTML = '';
                if (rowIndex === 0) {
                    cellsHTML += `<td rowspan="${customerRows.length}">${customerSerial}</td>`;
                    cellsHTML += `<td rowspan="${customerRows.length}">
                                    ${customerGroup.customerName} 
                                    <div class="action-icons">
                                    <i class="fas fa-user-times delete-customer" data-customer-name="${customerGroup.customerName}" title="Delete all entries for ${customerGroup.customerName}"></i>
                                  </div>
                                  </td>`;
                }
                
                cellsHTML += `
                    <td>${rowData.sem}</td>
                    <td><input type="text" class="purchase-input" placeholder="e.g., 32180-32199,45630-43649" value="${rowData.purchaseRanges || ''}"></td>
                    <td>
                        <input type="text" class="unsold-input" placeholder="e.g., 2251,2252" value="${rowData.unsoldRaw || ''}" ${!rowData.purchaseRanges ? 'disabled' : ''}>
                        <div class="unsold-display">
                            ${rowData.unsoldNumbers && rowData.unsoldNumbers.length > 0 ? `${rowData.unsoldNumbers.length} unsold` : ''}
                            ${rowData.unsoldNumbersWithStatus && rowData.unsoldNumbersWithStatus.filter(n => !n.isValid).length > 0 ? ` <span class="invalid-number">(${rowData.unsoldNumbersWithStatus.filter(n => !n.isValid).length} invalid)</span>` : ''}
                            ${rowData.unsoldNumbers && rowData.unsoldNumbers.length > 2 ? ` <span class="unsold-more-link" data-index="${globalIndex}">... (see all)</span>` : ''}
                        </div>
                    </td>
                `;

                const soldRanges = rowData.soldRanges || [];
                let soldHTML = '';
                if (soldRanges.length > 0) {
                    const soldText = soldRanges.map(getNumericDisplay).join(', ');
                    soldHTML = `<div class="sold-preview">${getTruncatedText(soldText, 10, globalIndex, 'sold-more-link')}</div>`;
                }
                cellsHTML += `<td>${soldHTML}</td>`;

                const winningTickets = rowData.winningTickets || [];
                let winningHTML = '';
                if (winningTickets.length > 0) {
                    let previewHTML = winningTickets.slice(0, 2).map(wt => {
                        const categoryClass = getCategoryClass(wt.category);
                        return `<span class="sold-chip winning-chip winning-ticket-chip ${categoryClass}" data-ticket-category="${wt.category}">${wt.ticket}</span>`;
                    }).join(' ');
                    if (winningTickets.length > 2) previewHTML += ` <span class="winning-more-link" data-index="${globalIndex}">... (+${winningTickets.length - 2} more)</span>`;
                    winningHTML = `<div class="winning-preview">${previewHTML}</div>`;
                }
                cellsHTML += `<td>${winningHTML}</td>`;

                const pwtHTML = (rowData.pwtBreakdown || []).join('<br>');
                const vcHTML = (rowData.vcBreakdown || []).join('<br>');
                const svcHTML = (rowData.svcBreakdown || []).join('<br>');
                
                cellsHTML += `<td>${pwtHTML}</td><td>${vcHTML}</td><td>${svcHTML}</td>`;
                cellsHTML += `<td>
                                <div class="action-icons">
                                    <i class="fas fa-edit edit-sem-row" data-index="${globalIndex}" title="Edit this SEM entry"></i>
                                    <i class="fas fa-trash-alt delete-sem-row" data-index="${globalIndex}" title="Delete this SEM entry"></i>
                                </div>
                              </td>`;
                tr.innerHTML = cellsHTML;
                customerTableBody.appendChild(tr);
            });

            // Add summary row for the customer
            const summaryTr = document.createElement('tr');
            summaryTr.classList.add('summary-row');
            summaryTr.innerHTML = `
                <th colspan="2">Total</th>
                <th></th>
                <th>${summary.totalPurchase}</th>
                <th>${summary.totalUnsold}</th>
                <th>${summary.totalSold}</th>
                <th>${summary.totalWinningTickets}</th>
                <th>${summary.totalPWT.toLocaleString('en-IN')}</th>
                <th>${summary.totalVC.toLocaleString('en-IN')}</th>
                <th>${summary.totalSVC.toLocaleString('en-IN')}</th>
                <th></th>
            `;
            customerTableBody.appendChild(summaryTr);

            // Add customer separator line (except after the last customer)
            if (customerSerial < groupedData.length) {
                const separatorTr = document.createElement('tr');
                separatorTr.classList.add('customer-separator');
                separatorTr.innerHTML = `
                    <td colspan="11" style="height: 8px; background-color: #f8f9fa; border: none; padding: 0;"></td>
                `;
                customerTableBody.appendChild(separatorTr);
            }
        });
        
        // Render the overall total row
        renderSummaryRow();
    }

    function renderSummaryRow() {
        let totalPurchase = 0;
        let totalUnsold = 0;
        let totalSold = 0;
        let totalWinningTickets = 0;
        let totalPWT = 0;
        let totalVC = 0;
        let totalSVC = 0;

        tableData.forEach(rowData => {
            totalPurchase += (rowData.purchaseCount || 0);
            // Calculate unsold total: count of unsold tickets × SEM value
            const unsoldCount = (rowData.unsoldNumbers || []).length;
            const semValue = parseInt(rowData.sem, 10) || 0;
            totalUnsold += unsoldCount * semValue;
            
            // Calculate sold total: count of sold tickets × SEM value
            const soldCount = (rowData.soldNumbers || []).length;
            totalSold += soldCount * semValue;
            totalWinningTickets += (rowData.winningTickets || []).length;

            (rowData.pwtBreakdown || []).forEach(item => {
                const amount = parseInt(item.split(' ')[0].replace(/,/g, ''), 10) || 0;
                totalPWT += amount;
            });
            (rowData.vcBreakdown || []).forEach(item => {
                const amount = parseInt(item.split(' ')[0].replace(/,/g, ''), 10) || 0;
                totalVC += amount;
            });
            (rowData.svcBreakdown || []).forEach(item => {
                const amount = parseInt(item.split(' ')[0].replace(/,/g, ''), 10) || 0;
                totalSVC += amount;
            });
        });

        let summaryRow = document.querySelector('#customer-table tfoot');
        if (!summaryRow) {
            const tfoot = document.createElement('tfoot');
            document.getElementById('customer-table').appendChild(tfoot);
            summaryRow = tfoot;
        }

        summaryRow.innerHTML = `
            <tr>
                <th colspan="2">Total</th>
                <th></th>
                <th>${totalPurchase}</th>
                <th>${totalUnsold}</th>
                <th>${totalSold}</th>
                <th>${totalWinningTickets}</th>
                <th>${totalPWT.toLocaleString('en-IN')}</th>
                <th>${totalVC.toLocaleString('en-IN')}</th>
                <th>${totalSVC.toLocaleString('en-IN')}</th>
                <th></th>
            </tr>
        `;
    }

    // Auto-complete unsold input based on purchase ranges
    function autoCompleteUnsoldInput(input) {
        const row = input.closest('tr');
        const purchaseInput = row.querySelector('.purchase-input');
        const purchaseRanges = purchaseInput.value;
        
        if (!purchaseRanges) return;
        
        let inputValue = input.value;
        let lastEntry = inputValue.split(',').pop().trim();
        
        // Check if last entry is exactly 2 digits
        if (lastEntry.length === 2 && /^\d{2}$/.test(lastEntry)) {
            // Extract all possible ticket numbers from purchase ranges
            const allTickets = extractTicketsFromRanges(purchaseRanges);
            
            // Find matching tickets that end with these 2 digits
            const matchingTickets = allTickets.filter(ticket => ticket.slice(-2) === lastEntry);
            if (matchingTickets.length === 0) return;

            // current entries (excluding empty trailing)
            let entries = inputValue.split(',').map(e => e.trim()).filter(e => e !== '');
            // remove the 2-digit partial entry
            entries.pop();

            let chosen = null;
            if (matchingTickets.length === 1) {
                chosen = matchingTickets[0];
            } else {
                // Ask user to choose from matching tickets
                const options = matchingTickets.map((t, idx) => `${idx+1}. ${t}`).join('\n');
                const choice = prompt(`Multiple matches found for suffix "${lastEntry}". Choose one by number:\n${options}`);
                const idx = parseInt(choice, 10);
                if (!isNaN(idx) && idx >= 1 && idx <= matchingTickets.length) {
                    chosen = matchingTickets[idx - 1];
                } else {
                    // if invalid choice, do nothing
                    return;
                }
            }

            // Avoid duplicate unsold entries: if chosen already exists, try to pick another match not already present
            if (entries.includes(chosen)) {
                const alt = matchingTickets.find(t => !entries.includes(t));
                if (alt) chosen = alt;
                else {
                    alert('No matching tickets available that are not already entered as unsold.');
                    return;
                }
            }

            entries.push(chosen);
            input.value = entries.join(',') + ',';
            // Position cursor at the end (after the comma)
            setTimeout(() => {
                input.setSelectionRange(input.value.length, input.value.length);
            }, 0);
        }
    }
    
    // Extract all individual ticket numbers from purchase ranges
    function extractTicketsFromRanges(purchaseRanges) {
        const tickets = [];
        const ranges = purchaseRanges.split(',').map(r => r.trim()).filter(Boolean);
        
        ranges.forEach(range => {
            if (range.includes('-')) {
                const parts = range.split('-');
                if (parts.length === 2) {
                    const start = parts[0].trim();
                    const end = parts[1].trim();
                    
                    if (start.length === end.length) {
                        const prefix = start.replace(/\d+$/, '');
                        const suffix = start.match(/\D*$/)?.[0] || '';
                        const startNum = parseInt(start.replace(/\D/g, ''), 10);
                        const endNum = parseInt(end.replace(/\D/g, ''), 10);
                        const padding = start.replace(/\D/g, '').length;
                        
                        if (!isNaN(startNum) && !isNaN(endNum) && endNum >= startNum) {
                            for (let i = startNum; i <= endNum; i++) {
                                const ticketNum = prefix + String(i).padStart(padding, '0') + suffix;
                                tickets.push(ticketNum);
                            }
                        }
                    }
                }
            } else if (range) {
                tickets.push(range);
            }
        });
        
        return tickets;
    }

    // Auto-format purchase input: add hyphens and commas
    function formatPurchaseInput(input) {
        const cursorPosition = input.selectionStart;
        let value = input.value.replace(/[^0-9,-]/g, ''); // Keep only digits, commas, and hyphens
        
        // Split by commas to handle each range separately
        let ranges = value.split(',');
        let formattedRanges = [];
        
        for (let i = 0; i < ranges.length; i++) {
            let range = ranges[i];
            
            // If range already has hyphen, check if it's complete
            if (range.includes('-')) {
                let parts = range.split('-');
                let firstPart = parts[0] || '';
                let secondPart = parts[1] || '';
                
                // Check if we have a complete range (both parts have 5 digits) and extra digits
                if (firstPart.length === 5 && secondPart.length >= 5) {
                    if (secondPart.length === 5) {
                        // Perfect range, keep as is
                        formattedRanges.push(firstPart + '-' + secondPart);
                    } else if (secondPart.length > 5) {
                        // Range is complete + extra digits, split them
                        let completeRange = firstPart + '-' + secondPart.substring(0, 5);
                        let extraDigits = secondPart.substring(5);
                        formattedRanges.push(completeRange);
                        
                        // Handle extra digits as new range
                        if (extraDigits.length === 5 && i === ranges.length - 1) {
                            formattedRanges.push(extraDigits + '-');
                        } else if (extraDigits.length >= 10) {
                            // Split extra digits into ranges
                            for (let j = 0; j < extraDigits.length; j += 10) {
                                let chunk = extraDigits.substring(j, j + 10);
                                if (chunk.length === 10) {
                                    formattedRanges.push(chunk.substring(0, 5) + '-' + chunk.substring(5));
                                } else if (chunk.length === 5 && i === ranges.length - 1) {
                                    formattedRanges.push(chunk + '-');
                                } else if (chunk.length > 0) {
                                    formattedRanges.push(chunk);
                                }
                            }
                        } else {
                            formattedRanges.push(extraDigits);
                        }
                    }
                } else {
                    // Incomplete range, keep as is
                    formattedRanges.push(range);
                }
            } else {
                // Handle consecutive digits without hyphen
                if (range.length === 5 && i === ranges.length - 1) {
                    formattedRanges.push(range + '-');
                } else if (range.length === 10) {
                    formattedRanges.push(range.substring(0, 5) + '-' + range.substring(5));
                    if (i === ranges.length - 1) {
                        formattedRanges.push(''); // This will add comma
                    }
                } else if (range.length > 10) {
                    // Split into multiple ranges
                    for (let j = 0; j < range.length; j += 10) {
                        let chunk = range.substring(j, j + 10);
                        if (chunk.length === 10) {
                            formattedRanges.push(chunk.substring(0, 5) + '-' + chunk.substring(5));
                        } else if (chunk.length === 5 && j + 10 >= range.length && i === ranges.length - 1) {
                            formattedRanges.push(chunk + '-');
                        } else if (chunk.length > 0) {
                            formattedRanges.push(chunk);
                        }
                    }
                    if (i === ranges.length - 1 && range.length % 10 === 0) {
                        formattedRanges.push(''); // This will add comma
                    }
                } else {
                    formattedRanges.push(range);
                }
            }
        }
        
        // Join ranges with commas and remove empty trailing range if present
        let formattedValue = formattedRanges.join(',').replace(/,$/, '');
        
        // Update input value
        input.value = formattedValue;
        
        // Adjust cursor position
        const lengthDifference = formattedValue.length - value.length;
        const newCursorPosition = Math.max(0, cursorPosition + lengthDifference);
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    function updateRowData(index) {
        const rowData = tableData[index];
        if (!rowData) return;

        const purchaseSet = new Set();
        const purchaseRanges = (rowData.purchaseRanges || '').split(',').map(r => r.trim()).filter(Boolean);
        let numberOfTickets = 0;
        
        for (const range of purchaseRanges) {
            const parts = range.split('-').map(p => p.trim());
            if (parts.length === 2) {
                const parsedFrom = parseAlphanumericTicket(parts[0]);
                const parsedTo = parseAlphanumericTicket(parts[1]);
                const numericFrom = parsedFrom.numericPart;
                const numericTo = parsedTo.numericPart;
                const commonPrefix = parsedFrom.prefix;
                const commonSuffix = parsedFrom.suffix;
                const commonPadding = Math.max(parsedFrom.padding, parsedTo.padding);

                if (!isNaN(numericFrom) && !isNaN(numericTo) && numericTo >= numericFrom) {
                    numberOfTickets += (numericTo - numericFrom + 1);
                    for (let i = numericFrom; i <= numericTo; i++) {
                        purchaseSet.add(formatAlphanumericTicket(commonPrefix, i, commonPadding, commonSuffix));
                    }
                }
            } else if (parts.length === 1) {
                numberOfTickets++;
                purchaseSet.add(parts[0]);
            }
        }

        rowData.purchaseCount = numberOfTickets * (parseInt(rowData.sem, 10) || 0);


        if (purchaseSet.size === 0) {
            rowData.soldRanges = []; rowData.soldNumbers = []; rowData.winningTickets = [];
            rowData.pwtBreakdown = []; rowData.vcBreakdown = []; rowData.svcBreakdown = [];
            rowData.unsoldValidatedHTML = rowData.unsoldRaw || '';
            renderTable();
            return;
        }

        const shorthandUnsold = (rowData.unsoldRaw || '').split(',').map(n => n.trim()).filter(Boolean);
        // Remove duplicates while preserving order
        const uniqueUnsold = [...new Set(shorthandUnsold)];

        // If user entered duplicates, try to replace duplicates with other tickets from purchaseSet
        const purchaseArray = Array.from(purchaseSet);
        let finalUnsold = [...uniqueUnsold];
        let needed = shorthandUnsold.length - uniqueUnsold.length;
        let pi = 0;
        while (needed > 0 && pi < purchaseArray.length) {
            const candidate = purchaseArray[pi++];
            if (!finalUnsold.includes(candidate)) {
                finalUnsold.push(candidate);
                needed--;
            }
        }

        rowData.unsoldNumbers = finalUnsold;

        const unsoldNumbersWithStatus = rowData.unsoldNumbers.map(num => ({
            number: num,
            isValid: purchaseSet.has(num)
        }));
        rowData.unsoldNumbersWithStatus = unsoldNumbersWithStatus;

        const validUnsoldNumbers = new Set(rowData.unsoldNumbers.filter(num => purchaseSet.has(num)));

        rowData.soldNumbers = Array.from(purchaseSet).filter(num => !validUnsoldNumbers.has(num));
        rowData.soldRanges = compressNumberList(rowData.soldNumbers);

        const winningPrizesMap = getWinningPrizesMap();
        let pwtBreakdown = [];
        let vcBreakdown = [];
        let svcBreakdown = [];
        const winningTicketDetails = [];

        if (winningPrizesMap && winningPrizesMap.size > 0) {
            const sem = parseInt(rowData.sem, 10) || 0;
            rowData.soldNumbers.forEach(soldNum => {
                for (const [winner, prizeDetails] of winningPrizesMap.entries()) {
                    if (soldNum.endsWith(winner)) {
                        winningTicketDetails.push({ ticket: winner, category: prizeDetails.category });
                        const categoryClass = getCategoryClass(prizeDetails.category);
                        
                        const pwtWinAmount = (PWT_AMOUNTS[prizeDetails.category] || 0) * sem;
                        pwtBreakdown.push(`${pwtWinAmount.toLocaleString('en-IN')} <span class="pwt-winner-info ${categoryClass}">(${prizeDetails.category}: ${winner})</span>`);

                        const vcAmount = VC_AMOUNTS[prizeDetails.category] || 0;
                        if (vcAmount > 0) {
                            const vcWinAmount = vcAmount * sem;
                            vcBreakdown.push(`${vcWinAmount.toLocaleString('en-IN')} <span class="pwt-winner-info ${categoryClass}">(${prizeDetails.category}: ${winner})</span>`);
                        }

                        const svcAmount = SVC_AMOUNTS[prizeDetails.category] || 0;
                        if (svcAmount > 0) {
                            const svcWinAmount = svcAmount * sem;
                            svcBreakdown.push(`${svcWinAmount.toLocaleString('en-IN')} <span class="pwt-winner-info ${categoryClass}">(${prizeDetails.category}: ${winner})</span>`);
                        }
                    }
                }
            });
        }
        const uniqueWinners = new Map();
        winningTicketDetails.forEach(d => { if (!uniqueWinners.has(d.ticket)) uniqueWinners.set(d.ticket, d.category); });
        rowData.winningTickets = Array.from(uniqueWinners.entries()).map(([ticket, category]) => ({ ticket, category }));
        
        rowData.pwtBreakdown = pwtBreakdown;
        rowData.vcBreakdown = vcBreakdown;
        rowData.svcBreakdown = svcBreakdown;

        renderTable();
    }

    function addNewRow(name, sem) {
        tableData.push({ name, sem });
        currentCustomer = { name, sem };
        renderTable();
    }

    // --- Report Functions ---
    function saveReport(date, drawTime, data) {
        // Use provided parameters or get current values
        const reportDate = date || currentEntryDate || entryDate.value || new Date().toISOString().slice(0, 10);
        const reportDrawTime = drawTime || currentDrawTime || drawTimeSelect.value;
        const reportData = data || tableData;

        console.log('saveReport called with:', { date, drawTime, dataLength: data?.length });
        console.log('Using values:', { reportDate, reportDrawTime, reportDataLength: reportData.length });

        if (!reportDate) {
            alert('Please select a date before saving.');
            return;
        }

        if (!reportDrawTime || reportDrawTime === 'Unknown') {
            alert('Please select a draw time before saving.');
            return;
        }

        if (reportData.length === 0) {
            alert('No customer data to save.');
            return;
        }

        // Save the full report
        const reportKey = getReportKey(reportDate, reportDrawTime);
        console.log('Saving with key:', reportKey);
        localStorage.setItem(reportKey, JSON.stringify(reportData));

        // Update the daily customer list
        const dailyCustomersKey = getDailyCustomersKey(reportDate);
        const existingCustomersRaw = localStorage.getItem(dailyCustomersKey);
        const existingCustomers = existingCustomersRaw ? JSON.parse(existingCustomersRaw) : [];
        
        // Map: customerName -> Set of SEMs
        const customerSemMap = new Map();
        existingCustomers.forEach(customer => {
            if (!customerSemMap.has(customer.name)) {
                customerSemMap.set(customer.name, new Set());
            }
            customerSemMap.get(customer.name).add(customer.sem);
        });

        reportData.forEach(row => {
            if (!customerSemMap.has(row.name)) {
                customerSemMap.set(row.name, new Set());
            }
            customerSemMap.get(row.name).add(row.sem);
        });

        // Convert map back to array of {name, sem} objects, one for each unique name-sem pair
        const updatedDailyCustomers = [];
        customerSemMap.forEach((sems, name) => {
            sems.forEach(sem => {
                updatedDailyCustomers.push({ name: name, sem: sem });
            });
        });

        localStorage.setItem(dailyCustomersKey, JSON.stringify(updatedDailyCustomers));

        alert(`Customer data for ${reportDate} (${reportDrawTime}) saved successfully!\nCustomers: ${reportData.length}\nKey: ${reportKey}`);
        loadAndRenderReportCards(reportDate);
    }

    function loadData(date, drawTime) {
        const reportKey = getReportKey(date, drawTime);
        const savedData = localStorage.getItem(reportKey);

        if (savedData) {
            tableData = JSON.parse(savedData);
        } else {
            // No saved report for this date/drawTime — load most recent saved report as draft if available
            const reportKeys = Object.keys(localStorage).filter(k => k.startsWith('customerReports_'));
            if (reportKeys.length > 0) {
                reportKeys.sort().reverse();
                const latestKey = reportKeys[0];
                const latestRaw = localStorage.getItem(latestKey);
                try {
                    const latestData = JSON.parse(latestRaw);
                    // Use latest report entries as draft for new date/drawTime
                    tableData = Array.isArray(latestData) ? latestData.map(r => ({ ...r })) : [];
                } catch (err) {
                    console.warn('Failed to parse latest report for draft load:', err);
                    tableData = [];
                }
            } else {
                tableData = [];
            }
        }

        tableData.forEach((_, index) => updateRowData(index));
        renderTable();
    }

    function loadAndRenderReportCards(dateFilter) {
        // Default to selected entry date if no filter provided
        dateFilter = dateFilter || (entryDate ? entryDate.value : null);
        if (!reportCardsContainer) {
            console.warn('loadAndRenderReportCards called but reportCardsContainer is missing on this page.');
            return;
        }

        reportCardsContainer.innerHTML = '';
        let reportKeys = Object.keys(localStorage).filter(key => key.startsWith('customerReports_'));

        console.log('loadAndRenderReportCards - found reportKeys:', reportKeys);

        if (dateFilter) {
            reportKeys = reportKeys.filter(key => {
                const { date } = parseReportKey(key);
                return date === dateFilter;
            });
        }

        reportKeys.sort().reverse();

        if (reportKeys.length === 0) {
            reportCardsContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray-color);">No saved reports for this date.</p>';
            return;
        }

        reportKeys.forEach(key => {
            const { date, drawTime } = parseReportKey(key);
            if (date && drawTime) {
                const card = document.createElement('div');
                card.classList.add('report-card');
                card.dataset.reportKey = key;
                card.innerHTML = `<h3>${date}</h3><p>${drawTime}</p>`;
                reportCardsContainer.appendChild(card);
            }
        });
    }

    function openReportDetailModal(reportKey) {
        const savedData = localStorage.getItem(reportKey);
        if (!savedData) {
            alert('Report data not found.');
            return;
        }
        const data = JSON.parse(savedData);
        const { date, drawTime } = parseReportKey(reportKey);
        reportDateDisplay.textContent = `${date} (${drawTime})`;

        const customerNames = [...new Set(data.map(item => item.name))];
        customerListContainer.innerHTML = '';
        customerNames.forEach(name => {
            const item = document.createElement('div');
            item.classList.add('customer-list-item');
            item.innerHTML = `
                <span>${name}</span>
                <i class="fas fa-share-alt share-customer-report" data-customer-name="${name}" data-report-key="${reportKey}"></i>
            `;
            item.dataset.customerName = name;
            item.dataset.reportKey = reportKey;
            customerListContainer.appendChild(item);
        });

        if (downloadReportBtn) downloadReportBtn.dataset.reportKey = reportKey;
        showModal(reportDetailModal);
    }

    function shareCustomerReportAsImage(customerName, reportKey) {
        const savedData = localStorage.getItem(reportKey);
        if (!savedData) return;

        const allData = JSON.parse(savedData);
        const customerData = allData.filter(item => item.name === customerName);
        const { date, drawTime } = parseReportKey(reportKey);
        const summary = calculateReportSummary(allData);

const customerSummary = calculateCustomerSummary(customerData);
        const reportContent = `
            <html>
                <head>
                    <title>Details for ${customerName} on ${date}</title>
                    <style>
                        body { font-family: sans-serif; }
                        table { width: 100%; border-collapse: collapse; font-size: 12pt; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
                        th { background-color: #f2f2f2; }
                        .col-pwt, .col-vc, .col-svc { width: 15%; }
                        .col-winning { width: 25%; }
                    </style>
                </head>
                <body>
                    <h2>Report for ${customerName}</h2>
                    <h3>Date: ${date} (${drawTime})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>SEM</th>
                                <th>Purchase</th>
                                <th class="col-winning">Winning Tickets</th>
                                <th class="col-pwt">PWT</th>
                                <th class="col-vc">VC</th>
                                <th class="col-svc">SVC</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customerData.map(row => `
                                <tr>
                                    <td>${row.sem}</td>
                                    <td>${row.purchaseRanges || ''}</td>
                                    <td class="col-winning">${formatWinningTicketsForPopup(row.winningTickets)}</td>
                                    <td class="col-pwt">${(row.pwtBreakdown || []).join('<br>')}</td>
                                    <td class="col-vc">${(row.vcBreakdown || []).join('<br>')}</td>
                                    <td class="col-svc">${(row.svcBreakdown || []).join('<br>')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th>Total</th>
                                <th>${customerSummary.totalPurchase}</th>
                                <th>${customerSummary.totalWinningTickets}</th>
                                <th>${customerSummary.totalPWT.toLocaleString('en-IN')}</th>
                                <th>${customerSummary.totalVC.toLocaleString('en-IN')}</th>
                                <th>${customerSummary.totalSVC.toLocaleString('en-IN')}</th>
                            </tr>
                        </tfoot>
                    </table>
                </body>
            </html>
        `;
        
        const reportContainer = document.createElement('div');
        reportContainer.style.width = '1191px';
        reportContainer.style.height = '842px';
        reportContainer.innerHTML = reportContent;
        document.body.appendChild(reportContainer);

        html2canvas(reportContainer).then(canvas => {
            document.body.removeChild(reportContainer);
            canvas.toBlob(blob => {
                const file = new File([blob], `report-${customerName}-${date}.png`, { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: `Report for ${customerName}`,
                        text: `Here is the report for ${customerName} on ${date}.`,
                    })
                    .catch(error => console.error('Error sharing:', error));
                } else {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(file);
                    link.download = `report-${customerName}-${date}.png`;
                    link.click();
                }
            }, 'image/png');
        });
    }

    function openCustomerDetailPopup(customerName, reportKey) {
        const savedData = localStorage.getItem(reportKey);
        if (!savedData) return;

        const allData = JSON.parse(savedData);
        const customerData = allData.filter(item => item.name === customerName);
        const { date, drawTime } = parseReportKey(reportKey);
        const summary = calculateReportSummary(allData);

const customerSummary = calculateCustomerSummary(customerData);
        const popupContent = `
            <html>
                <head>
                    <title>Details for ${customerName} on ${date}</title>
                    <style>
                        @page {
                            size: A3 landscape;
                            margin: 20px;
                        }
                        body { 
                            font-family: sans-serif; 
                            -webkit-print-color-adjust: exact; /* Chrome, Safari */
                            color-adjust: exact; /* Firefox */
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            font-size: 12pt;
                        }
                        th, td { 
                            border: 1px solid #ddd; 
                            padding: 8px; 
                            text-align: left; 
                            vertical-align: top;
                        }
                        th { 
                            background-color: #f2f2f2; 
                        }
                        .col-pwt, .col-vc, .col-svc { width: 15%; }
                        .col-winning { width: 25%; }
                    </style>
                </head>
                <body>
                    <h2>Report for ${customerName}</h2>
                    <h3>Date: ${date} (${drawTime})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>SEM</th>
                                <th>Purchase</th>
                                <th class="col-winning">Winning Tickets</th>
                                <th class="col-pwt">PWT</th>
                                <th class="col-vc">VC</th>
                                <th class="col-svc">SVC</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customerData.map(row => `
                                <tr>
                                    <td>${row.sem}</td>
                                    <td>${row.purchaseRanges || ''}</td>
                                    <td class="col-winning">${formatWinningTicketsForPopup(row.winningTickets)}</td>
                                    <td class="col-pwt">${(row.pwtBreakdown || []).join('<br>')}</td>
                                    <td class="col-vc">${(row.vcBreakdown || []).join('<br>')}</td>
                                    <td class="col-svc">${(row.svcBreakdown || []).join('<br>')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th>Total</th>
                                <th>${customerSummary.totalPurchase}</th>
                                <th>${customerSummary.totalWinningTickets}</th>
                                <th>${customerSummary.totalPWT.toLocaleString('en-IN')}</th>
                                <th>${customerSummary.totalVC.toLocaleString('en-IN')}</th>
                                <th>${customerSummary.totalSVC.toLocaleString('en-IN')}</th>
                            </tr>
                        </tfoot>
                    </table>
                </body>
            </html>
        `;

        const popup = window.open('', '_blank', 'width=1191,height=842');
        popup.document.write(popupContent);
        popup.document.close();

    }

    async function downloadAllCustomersPdf(reportKey) {
        const savedData = localStorage.getItem(reportKey);
        if (!savedData) return alert('Report data not found.');

        const allData = JSON.parse(savedData);
        const { date, drawTime } = parseReportKey(reportKey);
        const customerNames = [...new Set(allData.map(r => r.name))];

        const jspdfObj = window.jspdf || window.jsPDF || window.jspdf;
        const jsPDFClass = (jspdfObj && jspdfObj.jsPDF) ? jspdfObj.jsPDF : (window.jsPDF || null);
        if (!jsPDFClass) {
            alert('PDF library not loaded.');
            return;
        }

        const pdf = new jsPDFClass('l', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // helper: split purchase ranges into lines of 3 items for better PDF layout
        function formatPurchaseForPdf(purchaseRanges) {
            if (!purchaseRanges) return '';
            const parts = String(purchaseRanges).split(',').map(s => s.trim()).filter(Boolean);
            if (parts.length === 0) return '';
            const chunks = [];
            for (let i = 0; i < parts.length; i += 3) {
                chunks.push(parts.slice(i, i + 3).join(','));
            }
            return chunks.join('<br>');
        }

        // Remaining vertical space on current page (in PDF pts)
        let remainingHeight = pageHeight;
        let isFirstPage = true;

        for (let i = 0; i < customerNames.length; i++) {
            const name = customerNames[i];
            const rows = allData.filter(r => r.name === name);
            const customerSummary = calculateCustomerSummary(rows);

            const html = `
                <div style="font-family: sans-serif; width:1191px; padding:20px; background:white;">
                    <style>
                        .pdf-table { width:100%; border-collapse:collapse; font-size:12pt; table-layout: fixed; }
                        .pdf-table th, .pdf-table td { border:1px solid #ddd; padding:8px; text-align:left; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
                        .col-sem { width:8%; }
                        .col-purchase { width:34%; }
                        .col-winning { width:30%; }
                        .col-pwt { width:9%; }
                        .col-vc { width:9%; }
                        .col-svc { width:10%; }
                    </style>
                    <h3>Customer: ${name}</h3>
                    <table class="pdf-table">
                        <thead>
                            <tr>
                                <th class="col-sem">SEM</th>
                                <th class="col-purchase">Purchase</th>
                                <th class="col-winning">Winning Tickets</th>
                                <th class="col-pwt">PWT</th>
                                <th class="col-vc">VC</th>
                                <th class="col-svc">SVC</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    <td class="col-sem">${row.sem}</td>
                                    <td class="col-purchase">${formatPurchaseForPdf(row.purchaseRanges)}</td>
                                    <td class="col-winning">${formatWinningTicketsForPopup(row.winningTickets)}</td>
                                    <td class="col-pwt">${(row.pwtBreakdown || []).join('<br>')}</td>
                                    <td class="col-vc">${(row.vcBreakdown || []).join('<br>')}</td>
                                    <td class="col-svc">${(row.svcBreakdown || []).join('<br>')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th class="col-sem">Total</th>
                                <th class="col-purchase">${customerSummary.totalPurchase}</th>
                                <th class="col-winning">${customerSummary.totalWinningTickets}</th>
                                <th class="col-pwt">${customerSummary.totalPWT.toLocaleString('en-IN')}</th>
                                <th class="col-vc">${customerSummary.totalVC.toLocaleString('en-IN')}</th>
                                <th class="col-svc">${customerSummary.totalSVC.toLocaleString('en-IN')}</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>`;

            const container = document.createElement('div');
            container.style.width = '1191px';
            container.style.padding = '20px';
            container.style.background = 'white';
            container.style.position = 'fixed';
            container.style.left = '-20000px'; // keep off-screen
            container.innerHTML = html;
            document.body.appendChild(container);

            try {
                const canvas = await html2canvas(container, { scale: 1 });
                // use JPEG output at reduced quality to reduce PDF size
                const imgData = canvas.toDataURL('image/jpeg', 0.75);
                const imgWidthPdf = pageWidth;
                const imgHeightPdf = canvas.height * pageWidth / canvas.width;

                // If customer block is taller than a single page, always start on a fresh page
                if (imgHeightPdf > pageHeight) {
                    if (remainingHeight !== pageHeight) {
                        pdf.addPage();
                    }

                    // Split the tall image across multiple pages
                    let heightLeft = imgHeightPdf;
                    let position = 0;
                    const consumedOnLastPage = imgHeightPdf % pageHeight;

                    while (heightLeft > 0) {
                        pdf.addImage(imgData, 'JPEG', 0, position, imgWidthPdf, imgHeightPdf);
                        heightLeft -= pageHeight;
                        position -= pageHeight;
                        if (heightLeft > 0) pdf.addPage();
                    }

                    // compute remaining space on last page
                    const consumed = consumedOnLastPage === 0 ? pageHeight : consumedOnLastPage;
                    remainingHeight = pageHeight - consumed;
                    if (remainingHeight < 0) remainingHeight = 0;
                    isFirstPage = false;
                } else {
                    // Customer block fits within single page
                    if (imgHeightPdf <= remainingHeight) {
                        // place on current page at y = pageHeight - remainingHeight
                        const yPos = pageHeight - remainingHeight;
                        pdf.addImage(imgData, 'JPEG', 0, yPos, imgWidthPdf, imgHeightPdf);
                        remainingHeight -= imgHeightPdf;
                    } else {
                        // move to next page and place at top
                        pdf.addPage();
                        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthPdf, imgHeightPdf);
                        remainingHeight = pageHeight - imgHeightPdf;
                    }
                    isFirstPage = false;
                }
            } catch (err) {
                console.error('Error rendering customer to canvas:', err);
            } finally {
                document.body.removeChild(container);
            }
        }

        pdf.save(`all-customers-${date}-${drawTime}.pdf`);
    }

    // --- Event Handlers ---
    addCustomerBtn.addEventListener('click', () => {
        const name = prompt('Enter customer name:');
        if (name && name.trim()) {
            const semTypes = ['5', '10', '15', '20'];
            semTypes.forEach(sem => {
                addNewRow(name.trim(), sem);
            });
        }
    });
    searchUnsoldBtn.addEventListener('click', () => {
        searchCustomerNameInput.value = '';
        searchUnsoldNumbersInput.value = '';
        searchUnsoldResultsContainer.innerHTML = '';
        showModal(searchUnsoldModal);
    });
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', (e) => hideModal(e.target.closest('.modal'))));
    
    
    submitAllDataBtn.addEventListener('click', () => {
        const date = entryDate.value;
        const drawTime = drawTimeSelect.value;
        if (!date) {
            alert('Please select a date before submitting data.');
            return;
        }
        saveReport(date, drawTime, tableData);
    });

    submitSearchUnsoldBtn.addEventListener('click', () => {
        const customerName = searchCustomerNameInput.value.trim().toLowerCase();
        const searchNumbersRaw = searchUnsoldNumbersInput.value.trim();
        const searchNumbers = searchNumbersRaw.split(',').map(n => n.trim()).filter(Boolean);

        searchUnsoldResultsContainer.innerHTML = '';

        if (!customerName && searchNumbers.length === 0) {
            searchUnsoldResultsContainer.innerHTML = '<p>Please enter a customer name or ticket number(s) to search.</p>';
            return;
        }

        let resultsFound = false;

        if (customerName && searchNumbers.length === 0) {
            // Search by customer name only
            const customerData = tableData.filter(row => row.name.toLowerCase() === customerName);
            if (customerData.length > 0) {
                resultsFound = true;
                const customerResultDiv = document.createElement('div');
                customerResultDiv.classList.add('search-result-item');
                
                let html = `<h4>${customerData[0].name}</h4>`;

                const allUnsold = customerData.flatMap(row => row.unsoldNumbers || []);
                const allSold = customerData.flatMap(row => row.soldNumbers || []);
                const allWinning = customerData.flatMap(row => row.winningTickets || []);

                if (allUnsold.length > 0) {
                    html += `<p>Unsold Tickets:</p><div class="sold-chip-container">${allUnsold.map(n => `<span class="sold-chip">${n}</span>`).join('')}</div>`;
                }
                if (allSold.length > 0) {
                    html += `<p>Sold Tickets:</p><div class="sold-chip-container">${allSold.map(n => `<span class="sold-chip">${getNumericDisplay(n)}</span>`).join('')}</div>`;
                }
                if (allWinning.length > 0) {
                    html += `<p>Winning Tickets:</p><div class="sold-chip-container">${allWinning.map(wt => `<span class="sold-chip winning-chip ${getCategoryClass(wt.category)}">${wt.ticket}</span>`).join(' ')}</div>`;
                }

                if (allUnsold.length === 0 && allSold.length === 0) {
                    html += '<p>No tickets found for this customer.</p>';
                }

                customerResultDiv.innerHTML = html;
                searchUnsoldResultsContainer.appendChild(customerResultDiv);
            }
        } else if (searchNumbers.length > 0) {
            // Search by ticket number(s)
            searchNumbers.forEach(number => {
                let foundInPurchase = false;
                tableData.forEach(rowData => {
                    const purchaseSet = new Set();
                    const purchaseRanges = (rowData.purchaseRanges || '').split(',').map(r => r.trim()).filter(Boolean);
                    for (const range of purchaseRanges) {
                        const parts = range.split('-').map(p => p.trim());
                        if (parts.length === 2) {
                            const parsedFrom = parseAlphanumericTicket(parts[0]);
                            const parsedTo = parseAlphanumericTicket(parts[1]);
                            const numericFrom = parsedFrom.numericPart;
                            const numericTo = parsedTo.numericPart;
                            if (!isNaN(numericFrom) && !isNaN(numericTo) && numericTo >= numericFrom) {
                                for (let i = numericFrom; i <= numericTo; i++) {
                                    purchaseSet.add(formatAlphanumericTicket(parsedFrom.prefix, i, parsedFrom.padding, parsedFrom.suffix));
                                }
                            }
                        } else if (parts.length === 1) {
                            purchaseSet.add(parts[0]);
                        }
                    }

                    if (purchaseSet.has(number)) {
                        foundInPurchase = true;
                        resultsFound = true;
                        let status = 'Sold';
                        if ((rowData.unsoldNumbers || []).includes(number)) {
                            status = 'Unsold';
                        }
                        
                        let winningInfo = '';
                        const winningTicket = (rowData.winningTickets || []).find(wt => number.endsWith(wt.ticket));
                        if (winningTicket) {
                            winningInfo = ` - <span class="winning-chip ${getCategoryClass(winningTicket.category)}">Winning Ticket (${winningTicket.category})</span>`;
                        }

                        const ticketResultDiv = document.createElement('div');
                        ticketResultDiv.classList.add('search-result-item');
                        ticketResultDiv.innerHTML = `
                            <h4>Ticket: ${number}</h4>
                            <p>Customer: ${rowData.name} (SEM: ${rowData.sem})</p>
                            <p>Status: ${status}${winningInfo}</p>
                        `;
                        searchUnsoldResultsContainer.appendChild(ticketResultDiv);
                    }
                });
                if (!foundInPurchase) {
                     const ticketResultDiv = document.createElement('div');
                        ticketResultDiv.classList.add('search-result-item');
                        ticketResultDiv.innerHTML = `<h4>Ticket: ${number}</h4><p>Not found in any purchase.</p>`;
                        searchUnsoldResultsContainer.appendChild(ticketResultDiv);
                }
            });
        }

        if (!resultsFound && !(customerName && searchNumbers.length === 0)) {
            searchUnsoldResultsContainer.innerHTML = '<p>No matching entries found.</p>';
        }
    });



    // Add input event listener for real-time formatting of purchase input
    customerTableBody.addEventListener('input', (e) => {
        const target = e.target;
        if (target.classList.contains('purchase-input')) {
            formatPurchaseInput(target);
        }
        // Auto-complete unsold input based on purchase ranges
        if (target.classList.contains('unsold-input')) {
            autoCompleteUnsoldInput(target);
        }
    });

    customerTableBody.addEventListener('change', (e) => {
        const target = e.target;
        const tr = target.closest('tr');
        if (!tr) return;
        const rowIndex = parseInt(tr.dataset.index, 10);
        const rowData = tableData[rowIndex];
        if (!rowData) return;
        if (target.classList.contains('purchase-input')) rowData.purchaseRanges = target.value;
        if (target.classList.contains('unsold-input')) rowData.unsoldRaw = target.value;
        updateRowData(rowIndex);
    });

    customerTableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('sold-more-link')) openSoldNumbersModal(target.dataset.index);
        if (target.classList.contains('unsold-more-link')) openUnsoldNumbersModal(target.dataset.index);
        if (target.classList.contains('winning-more-link')) openWinningNumbersModal(target.dataset.index);
        if (target.classList.contains('winning-ticket-chip')) showPrizeCategoryModal(target.dataset.ticketCategory);
        if (target.classList.contains('delete-sem-row')) deleteSemRow(parseInt(target.dataset.index, 10));
        if (target.classList.contains('delete-customer')) deleteCustomer(target.dataset.customerName);
        if (target.classList.contains('edit-sem-row')) {
            const rowIndex = parseInt(target.dataset.index, 10);
            const rowData = tableData[rowIndex];
            if (rowData) {
                editCustomerNameInput.value = rowData.name;
                editSemTypeSelect.value = rowData.sem;
                editPurchaseInput.value = rowData.purchaseRanges || '';
                editUnsoldInput.value = rowData.unsoldRaw || '';
                updateCustomerBtn.dataset.rowIndex = rowIndex;
                showModal(editCustomerModal);
            }
        }
    });

    winningNumbersChipContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('winning-ticket-chip')) showPrizeCategoryModal(e.target.dataset.ticketCategory);
    });

    reportCardsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.report-card');
        if (card) {
            openReportDetailModal(card.dataset.reportKey);
        }
    });

    customerListContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('share-customer-report')) {
            e.stopPropagation();
            const customerName = target.dataset.customerName;
            const reportKey = target.dataset.reportKey;
            shareCustomerReportAsImage(customerName, reportKey);
        } else {
            const item = e.target.closest('.customer-list-item');
            if (item) {
                const customerName = item.dataset.customerName;
                const reportKey = item.dataset.reportKey;
                openCustomerDetailPopup(customerName, reportKey);
            }
        }
    });

    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', () => {
            const key = downloadReportBtn.dataset.reportKey;
            if (!key) return alert('Please open a report card first.');
            downloadAllCustomersPdf(key);
        });
    }

    if (clearReportsBtn) {
        clearReportsBtn.addEventListener('click', () => {
            const date = entryDate.value || currentEntryDate || new Date().toISOString().slice(0,10);
            if (!date) return alert('Please select a date first.');
            if (!confirm(`Delete all saved reports for ${date}? This will remove all draw times for this date.`)) return;
            const prefix = `customerReports_${date}_`;
            const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith(prefix));
            keysToRemove.forEach(k => localStorage.removeItem(k));
            // Remove daily customers list for the date as well
            const dailyKey = getDailyCustomersKey(date);
            if (localStorage.getItem(dailyKey)) localStorage.removeItem(dailyKey);
            loadAndRenderReportCards(date);
            alert(`Removed ${keysToRemove.length} report(s) for ${date}.`);
        });
    }

    entryDate.addEventListener('change', () => {
        const oldKey = getReportKey(currentEntryDate, currentDrawTime);
        if (tableData.length > 0) {
            localStorage.setItem(oldKey, JSON.stringify(tableData));
        }
        currentEntryDate = entryDate.value;
        loadData(entryDate.value, drawTimeSelect.value);
        loadAndRenderReportCards(entryDate.value);
        displayPrizeResults(); // Update prize results when date changes
    });

    drawTimeSelect.addEventListener('change', () => {
        const oldKey = getReportKey(entryDate.value, currentDrawTime);
        if (tableData.length > 0) {
            localStorage.setItem(oldKey, JSON.stringify(tableData));
        }
        currentDrawTime = drawTimeSelect.value;
        loadData(entryDate.value, drawTimeSelect.value);
        displayPrizeResults(); // Update prize results when draw time changes
    });

    viewResultBtn.addEventListener('click', () => {
        const key = getOcrResultKey();
        if (!key) return alert('Please select a date and draw time.');
        const ocrResult = localStorage.getItem(key);
        if (!ocrResult) return alert('No prize result found for the selected date and draw time.');
        const data = JSON.parse(ocrResult);
        prizeResultTitle.textContent = `Prize Result for ${data.date} (${drawTimeSelect.options[drawTimeSelect.selectedIndex].text})`;
        prizeResultTableBody.innerHTML = '';
        data.results.forEach(prize => {
            const tr = document.createElement('tr');
            const categoryClass = getCategoryClass(prize.category);
            if (categoryClass) {
                tr.classList.add(categoryClass);
            }
            tr.innerHTML = `<td>${prize.category}</td><td>${prize.numbers}</td>`;
            prizeResultTableBody.appendChild(tr);
        });
        showModal(prizeResultModal);
    });

    updateCustomerBtn.addEventListener('click', () => {
        const rowIndex = parseInt(updateCustomerBtn.dataset.rowIndex, 10);
        const newName = editCustomerNameInput.value.trim();
        const newSem = editSemTypeSelect.value;
        const newPurchase = editPurchaseInput.value.trim();
        const newUnsold = editUnsoldInput.value.trim();

        if (!newName) {
            alert('Please enter a customer name.');
            return;
        }

        if (rowIndex >= 0 && rowIndex < tableData.length) {
            const rowData = tableData[rowIndex];
            rowData.name = newName;
            rowData.sem = newSem;
            rowData.purchaseRanges = newPurchase;
            rowData.unsoldRaw = newUnsold;
            
            hideModal(editCustomerModal);
            updateRowData(rowIndex);
        }
    });
    
    // --- Initial Setup ---
    setCurrentDate();
    currentEntryDate = entryDate.value;
    currentDrawTime = drawTimeSelect.value;
    
    // Load saved data first, then render
    loadData(currentEntryDate, currentDrawTime);
    displayPrizeResults(); // Initialize prize results display
    // Show saved report cards for the current date on initial load
    loadAndRenderReportCards(currentEntryDate);
});