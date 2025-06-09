document.addEventListener('DOMContentLoaded', () => {
    // --- Stock Data and Configuration ---
    const stockDataKey = 'uthkrishtamFashionStock';
    const transactionLogKey = 'uthkrishtamFashionTransactions'; // For graph data
    const LOW_STOCK_THRESHOLD = 10; // Define the threshold for low stock

    // Define colors for each Kurti Type
    const kurtiColors = {
        'AppleCut': ['Black', 'White', 'Yellow', 'Rama', 'Pink', 'Blue', 'Cream', 'Orange'],
        'AK Cotton': ['Pink', 'Maroon', 'Black', 'White', 'Green'],
        'Print': ['Multicolor'],
        'Sleevless': ['Black', 'White', 'Yellow', 'Rama', 'Pink', 'Blue', 'Cream', 'Orange']
    };

    // Define Kurti Types for dynamic card generation and filters
    const kurtiTypes = ['AppleCut', 'AK Cotton', 'Print', 'Sleevless'];
    // Define Sizes for dynamic filter population
    const kurtiSizes = ['S', 'M', 'L', 'XL', 'XXL'];

    // --- DOM Elements ---
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');

    // Home Page Elements
    const stockSummaryGrid = document.getElementById('stock-summary-grid');
    const totalPiecesOverallSpan = document.getElementById('total-pieces-overall');
    const stockAlertSection = document.getElementById('stock-alert-section');
    const currentStockTableBody = document.querySelector('#current-stock-table tbody');
    // Removed chart instances as charts are no longer present
    // let piecesAddedChartInstance;
    // let piecesRemovedChartInstance;

    // Filter Elements for Detailed Stock View
    const filterTypeSelect = document.getElementById('filter-type');
    const filterSizeSelect = document.getElementById('filter-size');
    const filterColorSelect = document.getElementById('filter-color');


    // Add Cutting Form Elements
    const addCuttingForm = document.getElementById('add-cutting-form');
    const addTypeSelect = document.getElementById('add-type');
    const addColorSelect = document.getElementById('add-color');
    const addPiecesInput = document.getElementById('add-pieces');

    // Remove Cutting Form Elements
    const removeCuttingForm = document.getElementById('remove-cutting-form');
    const removeTypeSelect = document.getElementById('remove-type');
    const removeColorSelect = document.getElementById('remove-color');
    const removePiecesInput = document.getElementById('remove-pieces');

    // --- Initial Load & Data Management ---

    /**
     * Retrieves stock data from localStorage.
     * @returns {Object} The stock data object.
     */
    function getStockData() {
        return JSON.parse(localStorage.getItem(stockDataKey)) || {};
    }

    /**
     * Saves stock data to localStorage.
     * @param {Object} data - The stock data object to save.
     */
    function setStockData(data) {
        localStorage.setItem(stockDataKey, JSON.stringify(data));
    }

    /**
     * Retrieves transaction log data from localStorage.
     * @returns {Object} The transaction log object with 'added' and 'removed' arrays.
     */
    function getTransactionLog() {
        return JSON.parse(localStorage.getItem(transactionLogKey)) || { added: [], removed: [] };
    }

    /**
     * Saves transaction log data to localStorage.
     * @param {Object} log - The transaction log object to save.
     */
    function setTransactionLog(log) {
        localStorage.setItem(transactionLogKey, JSON.stringify(log));
    }

    // --- Navigation Logic ---
    /**
     * Displays the requested page and updates navigation button styles.
     * @param {string} pageId - The ID of the page section to display (e.g., 'home-page').
     */
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active'); // Hide all pages
        });
        document.getElementById(pageId).classList.add('active'); // Show the target page

        navButtons.forEach(button => {
            // Check if the button's data-page matches the current pageId
            if (button.dataset.page === pageId.replace('-page', '')) {
                button.classList.add('active-nav');
            } else {
                button.classList.remove('active-nav');
            }
        });

        // Update home page content when home page is activated (charts no longer relevant)
        if (pageId === 'home-page') {
            updateHomePage();
        }
    }

    // Attach event listeners to navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = `${button.dataset.page}-page`; // Construct page ID from data-page attribute
            showPage(pageId);
        });
    });

    // --- Home Page Updates ---
    /**
     * Updates all dynamic content on the home page, including stock cards,
     * total pieces, low stock alerts, and charts.
     */
    function updateHomePage() {
        const stock = getStockData();
        let overallTotalPieces = 0;
        const lowStockItems = [];
        const outOfStockItems = [];

        // Get current filter selections
        const selectedFilterType = filterTypeSelect.value;
        const selectedFilterSize = filterSizeSelect.value;
        const selectedFilterColor = filterColorSelect.value;

        stockSummaryGrid.innerHTML = ''; // Clear previous cards
        currentStockTableBody.innerHTML = ''; // Clear previous table rows

        // --- Generate Stock Category Cards ---
        kurtiTypes.forEach(type => {
            let typeTotal = 0;
            // Calculate total for the current Kurti Type
            if (stock[type]) {
                for (const size in stock[type]) {
                    for (const color in stock[type][size]) {
                        typeTotal += stock[type][size][color];
                    }
                }
            }
            overallTotalPieces += typeTotal; // Add to overall total

            // Create the card element
            const card = document.createElement('div');
            card.classList.add('stock-category-card');
            card.innerHTML = `
                <h3>${type}</h3>
                <p>Total Pieces:</p>
                <span class="total-pieces">${typeTotal}</span>
                <div class="mini-graph-container">
                    <div class="mini-graph-fill" style="width: ${Math.min(100, typeTotal)}%;"></div>
                </div>
                <div class="mini-graph-label">Current Level</div>
            `;
            // The mini-graph fill is a simple percentage based on the quantity itself.
            // For a more advanced "comparison", you'd need a max capacity per type.

            stockSummaryGrid.appendChild(card);
        });

        totalPiecesOverallSpan.textContent = overallTotalPieces;

        // --- Populate Detailed Stock Table and Check for Low/Out of Stock ---
        // Also collect unique sizes and colors for filter dropdowns
        const uniqueSizesInStock = new Set();
        const uniqueColorsInStock = new Set();


        for (const type in stock) {
            // Apply filter: only process if selectedFilterType is 'all' or matches the current type
            if (selectedFilterType === 'all' || type === selectedFilterType) {
                for (const size in stock[type]) {
                    uniqueSizesInStock.add(size); // Add size to unique list

                    // Apply size filter
                    if (selectedFilterSize === 'all' || size === selectedFilterSize) {
                        const sortedColors = Object.keys(stock[type][size]).sort();
                        sortedColors.forEach(color => {
                            uniqueColorsInStock.add(color); // Add color to unique list

                            // Apply color filter
                            if (selectedFilterColor === 'all' || color === selectedFilterColor) {
                                const quantity = stock[type][size][color];
                                const row = currentStockTableBody.insertRow();
                                row.insertCell().textContent = type;
                                row.insertCell().textContent = size;
                                row.insertCell().textContent = color;
                                row.insertCell().textContent = quantity;

                                const statusCell = row.insertCell();
                                if (quantity === 0) {
                                    statusCell.textContent = 'Out of Stock';
                                    statusCell.classList.add('status-out');
                                    outOfStockItems.push(`${type} (${size}, ${color})`);
                                } else if (quantity <= LOW_STOCK_THRESHOLD) {
                                    statusCell.textContent = 'Low Stock';
                                    statusCell.classList.add('status-low');
                                    lowStockItems.push(`${type} (${size}, ${color}): ${quantity} pieces`);
                                } else {
                                    statusCell.textContent = 'In Stock';
                                    statusCell.classList.add('status-ok');
                                }
                            }
                        });
                    }
                }
            }
        }

        // Update Size and Color filter dropdowns dynamically
        updateFilterDropdown(filterSizeSelect, Array.from(uniqueSizesInStock).sort(), 'Show All Sizes');
        updateFilterDropdown(filterColorSelect, Array.from(uniqueColorsInStock).sort(), 'Show All Colors');

        // Restore previously selected values for filters after updates
        filterTypeSelect.value = selectedFilterType;
        filterSizeSelect.value = selectedFilterSize;
        filterColorSelect.value = selectedFilterColor;


        // --- Display Stock Alerts ---
        stockAlertSection.innerHTML = ''; // Clear previous alerts
        let alertContent = '';
        if (outOfStockItems.length > 0) {
            alertContent += `
                <p><strong>🚨 Out of Stock:</strong></p>
                <ul>
                    ${outOfStockItems.map(item => `<li class="out-of-stock">${item}</li>`).join('')}
                </ul>
            `;
        }
        if (lowStockItems.length > 0) {
            alertContent += `
                <p><strong>⚠️ Low Stock (below ${LOW_STOCK_THRESHOLD} pieces):</strong></p>
                <ul>
                    ${lowStockItems.map(item => `<li class="low-stock">${item}</li>`).join('')}
                </ul>
            `;
        }

        if (alertContent) {
            stockAlertSection.innerHTML = alertContent;
            stockAlertSection.style.display = 'block';
        } else {
            stockAlertSection.style.display = 'none';
        }

        // Charts are removed, so no updateCharts() call needed
        // updateCharts();
    }

    // Helper to populate filter dropdowns generically
    function updateFilterDropdown(selectElement, optionsArray, defaultText) {
        const currentValue = selectElement.value; // Store current selection
        selectElement.innerHTML = `<option value="all">${defaultText}</option>`;
        optionsArray.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            selectElement.appendChild(option);
        });
        // Restore selection if it still exists in the new options
        if (Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
            selectElement.value = currentValue;
        } else {
            selectElement.value = 'all'; // Default to 'all' if current value is no longer valid
        }
    }


    // Event listeners for the filter dropdowns
    filterTypeSelect.addEventListener('change', updateHomePage);
    filterSizeSelect.addEventListener('change', updateHomePage);
    filterColorSelect.addEventListener('change', updateHomePage);


    // --- Chart.js Integration (Removed as charts are no longer displayed) ---
    /*
    function updateCharts() {
        const transactionLog = getTransactionLog();
        const addedData = transactionLog.added;
        const removedData = transactionLog.removed;

        // Aggregate data by date
        const aggregatedAdded = {};
        addedData.forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString();
            aggregatedAdded[date] = (aggregatedAdded[date] || 0) + item.pieces;
        });

        const aggregatedRemoved = {};
        removedData.forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString();
            aggregatedRemoved[date] = (aggregatedRemoved[date] || 0) + item.pieces;
        });

        // Get all unique dates and sort them
        const allDates = [...new Set([...Object.keys(aggregatedAdded), ...Object.keys(aggregatedRemoved)])].sort((a, b) => new Date(a) - new Date(b));

        const chartAddedValues = allDates.map(date => aggregatedAdded[date] || 0);
        const chartRemovedValues = allDates.map(date => aggregatedRemoved[date] || 0);

        // Chart for Pieces Added
        if (piecesAddedChartInstance) {
            piecesAddedChartInstance.destroy();
        }
        piecesAddedChartInstance = new Chart(document.getElementById('piecesAddedChart'), {
            type: 'line',
            data: {
                labels: allDates,
                datasets: [{
                    label: 'Pieces Added',
                    data: chartAddedValues,
                    borderColor: 'rgba(0, 123, 255, 0.8)',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(0, 123, 255, 1)',
                    pointBorderColor: 'rgba(255, 255, 255, 0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Pieces',
                            color: varToRgb('--dark-gray')
                        },
                        ticks: {
                            color: varToRgb('--dark-gray')
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: varToRgb('--dark-gray')
                        },
                        ticks: {
                            color: varToRgb('--dark-gray')
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: varToRgb('--dark-gray')
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff'
                    }
                }
            }
        });

        // Chart for Pieces Removed
        if (piecesRemovedChartInstance) {
            piecesRemovedChartInstance.destroy();
        }
        piecesRemovedChartInstance = new Chart(document.getElementById('piecesRemovedChart'), {
            type: 'line',
            data: {
                labels: allDates,
                datasets: [{
                    label: 'Pieces Removed',
                    data: chartRemovedValues,
                    borderColor: 'rgba(220, 53, 69, 0.8)',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(220, 53, 69, 1)',
                    pointBorderColor: 'rgba(255, 255, 255, 0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Pieces',
                            color: varToRgb('--dark-gray')
                        },
                        ticks: {
                            color: varToRgb('--dark-gray')
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: varToRgb('--dark-gray')
                        },
                        ticks: {
                            color: varToRgb('--dark-gray')
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: varToRgb('--dark-gray')
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff'
                    }
                }
            }
        });
    }
    */
    /**
     * Helper function to convert a CSS variable color to RGBA format for Chart.js.
     * Kept as it might be used by other parts of the code for dynamic color handling
     * (e.g., if you decide to add other visualizations later).
     * @param {string} cssVar - The CSS variable name (e.g., '--primary-blue').
     * @param {string} alpha - The alpha transparency value (0-1).
     * @returns {string} The RGBA color string.
     */
    function varToRgb(cssVar, alpha = '1') {
        const style = getComputedStyle(document.body);
        let color = style.getPropertyValue(cssVar).trim();

        // If it's a hex color, convert it to RGB first
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        // If it's already rgb(x, y, z), just add alpha
        else if (color.startsWith('rgb(')) {
            return `rgba(${color.substring(4, color.length - 1)}, ${alpha})`;
        }
        // Fallback for named colors or other formats (Chart.js can often handle them, but RGBA is safest)
        return color;
    }


    // --- Dynamic Color Dropdown (Add/Remove Forms) ---
    /**
     * Populates the color dropdown based on the selected Kurti Type.
     * @param {HTMLSelectElement} typeSelect - The Kurti Type select element.
     * @param {HTMLSelectElement} colorSelect - The Color select element to update.
     */
    function updateFormColorDropdown(typeSelect, colorSelect) {
        const selectedType = typeSelect.value;
        const colors = kurtiColors[selectedType] || [];

        colorSelect.innerHTML = '<option value="">Select Color</option>'; // Reset dropdown
        colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            colorSelect.appendChild(option);
        });
        colorSelect.disabled = colors.length === 0; // Disable if no colors available
    }

    // Attach event listeners for dynamic color dropdown updates for forms
    addTypeSelect.addEventListener('change', () => updateFormColorDropdown(addTypeSelect, addColorSelect));
    removeTypeSelect.addEventListener('change', () => updateFormColorDropdown(removeTypeSelect, removeColorSelect));

    // --- Add Cutting Logic ---
    addCuttingForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        // Get form values
        const type = addTypeSelect.value;
        const size = document.getElementById('add-size').value;
        const color = addColorSelect.value;
        const pieces = parseInt(addPiecesInput.value, 10);

        // Basic validation
        if (!type || !size || !color || isNaN(pieces) || pieces <= 0) {
            alert('Please fill in all fields correctly and ensure "Total Number of Pieces" is a positive number.');
            return;
        }

        const stock = getStockData(); // Get current stock
        // Initialize nested objects if they don't exist
        if (!stock[type]) stock[type] = {};
        if (!stock[type][size]) stock[type][size] = {};
        // Add pieces to existing quantity or set new quantity
        stock[type][size][color] = (stock[type][size][color] || 0) + pieces;

        setStockData(stock); // Save updated stock

        // Update transaction log for 'added' items (even if charts are removed, log might be useful for future features)
        const transactionLog = getTransactionLog();
        transactionLog.added.push({
            type, size, color, pieces,
            timestamp: new Date().toISOString() // Store timestamp for charting
        });
        setTransactionLog(transactionLog);

        alert(`${pieces} pieces of ${color} ${type} (${size}) added to stock successfully.`);
        addCuttingForm.reset(); // Reset form fields
        updateFormColorDropdown(addTypeSelect, addColorSelect); // Reset color dropdown after type reset
        updateHomePage(); // Refresh home page dashboard
    });

    // --- Remove Cutting Logic ---
    removeCuttingForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        // Get form values
        const type = removeTypeSelect.value;
        const size = document.getElementById('remove-size').value;
        const color = removeColorSelect.value;
        const piecesToRemove = parseInt(removePiecesInput.value, 10);

        // Basic validation
        if (!type || !size || !color || isNaN(piecesToRemove) || piecesToRemove <= 0) {
            alert('Please fill in all fields correctly and ensure "Pieces to Remove" is a positive number.');
            return;
        }

        const stock = getStockData(); // Get current stock
        // Get current quantity, default to 0 if item doesn't exist
        const currentQuantity = (stock[type] && stock[type][size] && stock[type][size][color]) || 0;

        // Check if sufficient stock is available for removal
        if (piecesToRemove > currentQuantity) {
            alert(`Error: Not enough stock. Only ${currentQuantity} pieces of ${color} ${type} (${size}) are available.`);
            return;
        }

        // Update stock quantity
        stock[type][size][color] -= piecesToRemove;

        // Clean up stock data if quantity becomes zero or less
        if (stock[type][size][color] <= 0) { // Use <= 0 to handle potential negative from error
            delete stock[type][size][color]; // Remove the color entry
            if (Object.keys(stock[type][size]).length === 0) {
                delete stock[type][size]; // Remove size entry if no colors left
            }
            if (Object.keys(stock[type]).length === 0) {
                delete stock[type]; // Remove type entry if no sizes left
            }
        }

        setStockData(stock); // Save updated stock

        // Update transaction log for 'removed' items
        const transactionLog = getTransactionLog();
        transactionLog.removed.push({
            type, size, color, pieces: piecesToRemove,
            timestamp: new Date().toISOString()
        });
        setTransactionLog(transactionLog);

        alert(`${piecesToRemove} pieces of ${color} ${type} (${size}) removed from stock successfully.`);
        removeCuttingForm.reset(); // Reset form fields
        updateFormColorDropdown(removeTypeSelect, removeColorSelect); // Reset color dropdown
        updateHomePage(); // Refresh home page dashboard
    });


    // --- Initialize Application ---
    showPage('home-page'); // Start on the home page when the app loads
    updateHomePage(); // Initial population of home page data
});
