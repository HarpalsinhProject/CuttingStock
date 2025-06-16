document.addEventListener('DOMContentLoaded', () => {
    // --- Stock Data and Configuration ---
    const stockDataKey = 'uthkrishtamFashionStock';
    const LOW_STOCK_THRESHOLD = 2; // Define the threshold for low stock in BUNDLES

    // Define colors for each Kurti Type
    const kurtiColors = {
        'AppleCut': ['Black', 'White', 'Yellow', 'Rama', 'Pink', 'Blue', 'Cream', 'Orange'],
        'AK Cotton': ['Pink', 'Maroon', 'Black', 'White', 'Green'],
    };

    // Define Kurti Types for dynamic card generation and forms
    const kurtiTypes = ['AppleCut', 'AK Cotton'];
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

    // Filter Elements for Detailed Stock View
    const filterTypeSelect = document.getElementById('filter-type');
    const filterSizeSelect = document.getElementById('filter-size');
    const filterColorSelect = document.getElementById('filter-color');


    // Add Cutting Form Elements
    const addCuttingForm = document.getElementById('add-cutting-form');
    const addTypeOptionsContainer = document.getElementById('add-type-options');
    const addTypeInput = document.getElementById('add-type');
    const addColorOptionsContainer = document.getElementById('add-color-options');
    const addColorInput = document.getElementById('add-color-input');
    const addSizesOptionsContainer = document.getElementById('add-size-options');
    const addSizesInput = document.getElementById('add-size-input');
    const addBundlesInput = document.getElementById('add-pieces');

    // Remove Cutting Form Elements
    const removeCuttingForm = document.getElementById('remove-cutting-form');
    const removeTypeOptionsContainer = document.getElementById('remove-type-options');
    const removeTypeInput = document.getElementById('remove-type');
    const removeColorOptionsContainer = document.getElementById('remove-color-options');
    const removeColorInput = document.getElementById('remove-color-input');
    const removeSizesOptionsContainer = document.getElementById('remove-size-options');
    const removeSizesInput = document.getElementById('remove-size-input');
    const removeBundlesInput = document.getElementById('remove-pieces');


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

        // Update content based on active page
        if (pageId === 'home-page') {
            updateHomePage();
        }

        // For other pages, ensure forms are reset and options are rendered
        if (pageId === 'add-cutting-page') {
            addCuttingForm.reset();
            renderKurtiTypeOptions(addTypeOptionsContainer, addTypeInput,
                                addColorOptionsContainer, addColorInput,
                                addSizesOptionsContainer, addSizesInput,
                                kurtiTypes, kurtiColors, kurtiSizes);
        }
        if (pageId === 'remove-cutting-page') {
            removeCuttingForm.reset();
            renderKurtiTypeOptions(removeTypeOptionsContainer, removeTypeInput,
                                removeColorOptionsContainer, removeColorInput,
                                removeSizesOptionsContainer, removeSizesInput,
                                kurtiTypes, kurtiColors, kurtiSizes);
        }
    }

    // Attach event listeners to navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = `${button.dataset.page}-page`;
            showPage(pageId);
        });
    });

    // --- Home Page Updates ---
    /**
     * Updates all dynamic content on the home page, including stock cards,
     * total bundles, low stock alerts.
     */
    function updateHomePage() {
        const stock = getStockData();
        let overallTotalBundles = 0;
        const lowStockItems = [];
        const outOfStockItems = [];

        // Ensure filter type dropdown is populated with allowed types
        updateFilterDropdown(filterTypeSelect, kurtiTypes, 'Show All Types');

        // Get current filter selections (after potentially updating dropdown)
        const selectedFilterType = filterTypeSelect.value;
        const selectedFilterSize = filterSizeSelect.value;
        const selectedFilterColor = filterColorSelect.value;

        stockSummaryGrid.innerHTML = ''; // Clear previous cards
        currentStockTableBody.innerHTML = ''; // Clear previous table rows

        // --- Generate Stock Category Cards ---
        kurtiTypes.forEach(type => {
            let typeTotalBundles = 0;
            // Calculate total for the current Kurti Type
            if (stock[type]) {
                for (const size in stock[type]) {
                    for (const color in stock[type][size]) {
                        typeTotalBundles += stock[type][size][color];
                    }
                }
            }
            overallTotalBundles += typeTotalBundles; // Add to overall total

            // Create the card element
            const card = document.createElement('div');
            card.classList.add('stock-category-card');
            card.innerHTML = `
                <h3>${type}</h3>
                <p>Total Bundles:</p>
                <span class="total-pieces">${typeTotalBundles}</span>
                <div class="mini-graph-container">
                    <div class="mini-graph-fill" style="width: ${Math.min(100, typeTotalBundles)}%;"></div>
                </div>
                <div class="mini-graph-label">Current Level</div>
            `;
            stockSummaryGrid.appendChild(card);
        });

        totalPiecesOverallSpan.textContent = overallTotalBundles;

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
                                row.insertCell().textContent = quantity; // Now represents bundles

                                const statusCell = row.insertCell();
                                if (quantity === 0) {
                                    statusCell.textContent = 'Out of Stock';
                                    statusCell.classList.add('status-out');
                                    outOfStockItems.push(`${type} (${size}, ${color})`);
                                } else if (quantity <= LOW_STOCK_THRESHOLD) {
                                    statusCell.textContent = 'Low Stock';
                                    statusCell.classList.add('status-low');
                                    lowStockItems.push(`${type} (${size}, ${color}): ${quantity} bundles`);
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
                <p><strong>⚠️ Low Stock (below ${LOW_STOCK_THRESHOLD} bundles):</strong></p>
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


    // --- Generic Option Renderer (for Color and Size) ---
    /**
     * Renders an array of options as clickable boxes in a container.
     * @param {HTMLElement} containerElement - The div where options will be rendered.
     * @param {HTMLInputElement} hiddenInputElement - The hidden input to store the selected value.
     * @param {Array<string>} optionsArray - An array of options to display.
     * @param {string} [initialSelectedValue=''] - The value to initially select.
     */
    function renderOptionsAsBoxes(containerElement, hiddenInputElement, optionsArray, initialSelectedValue = '') {
        containerElement.innerHTML = ''; // Clear existing options
        if (optionsArray.length === 0) {
            hiddenInputElement.value = ''; // Clear hidden input if no options
            return;
        }

        let selectedOptionDiv = null;

        optionsArray.forEach((optionValue) => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('kurti-type-option'); // Reuse same styling
            optionDiv.textContent = optionValue;
            optionDiv.dataset.value = optionValue; // Store the value in a data attribute

            optionDiv.addEventListener('click', () => {
                // Remove 'selected' class from all siblings
                Array.from(containerElement.children).forEach(child => {
                    child.classList.remove('selected');
                });
                // Add 'selected' class to the clicked option
                optionDiv.classList.add('selected');
                // Update the hidden input's value
                hiddenInputElement.value = optionValue;
            });

            containerElement.appendChild(optionDiv);

            if (optionValue === initialSelectedValue) {
                selectedOptionDiv = optionDiv;
            }
        });

        // Programmatically click the initial selected option if found, otherwise select the first one
        if (selectedOptionDiv) {
            selectedOptionDiv.click();
        } else if (optionsArray.length > 0) {
            containerElement.firstElementChild.click();
        } else {
            hiddenInputElement.value = ''; // Ensure hidden input is empty if no options
        }
    }

    // --- Dynamic Type, Color, and Size rendering for Forms ---
    /**
     * Renders the color options as boxes based on the selected Kurti Type.
     * @param {HTMLInputElement} typeHiddenInput - The hidden input element that holds the selected Kurti Type.
     * @param {HTMLElement} colorOptionsContainer - The div where color options will be rendered.
     * @param {HTMLInputElement} colorHiddenInput - The hidden input to store the selected color.
     */
    function renderFormColorOptions(typeHiddenInput, colorOptionsContainer, colorHiddenInput) {
        const selectedType = typeHiddenInput.value;
        const colors = kurtiColors[selectedType] || [];
        renderOptionsAsBoxes(colorOptionsContainer, colorHiddenInput, colors, ''); // Render colors, no initial pre-selection needed here
    }

    /**
     * Renders clickable Kurti Type options in a given container, and triggers rendering of colors and sizes.
     * @param {HTMLElement} typeOptionsContainer - The div where type options will be rendered.
     * @param {HTMLInputElement} typeHiddenInput - The hidden input to store the selected type.
     * @param {HTMLElement} colorOptionsContainer - The div where color options will be rendered.
     * @param {HTMLInputElement} colorHiddenInput - The hidden input to store the selected color.
     * @param {HTMLElement} sizeOptionsContainer - The div where size options will be rendered.
     * @param {HTMLInputElement} sizeHiddenInput - The hidden input to store the selected size.
     * @param {Array<string>} types - An array of kurti types to display.
     * @param {Object} colorsMap - Map of kurti types to their colors.
     * @param {Array<string>} sizesArray - An array of sizes to display.
     */
    function renderKurtiTypeOptions(typeOptionsContainer, typeHiddenInput,
                                  colorOptionsContainer, colorHiddenInput,
                                  sizeOptionsContainer, sizeHiddenInput,
                                  types, colorsMap, sizesArray) {
        typeOptionsContainer.innerHTML = ''; // Clear existing options
        types.forEach((type, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('kurti-type-option');
            optionDiv.textContent = type;
            optionDiv.dataset.type = type;

            optionDiv.addEventListener('click', () => {
                Array.from(typeOptionsContainer.children).forEach(child => {
                    child.classList.remove('selected');
                });
                optionDiv.classList.add('selected');
                typeHiddenInput.value = type;

                // Render colors based on selected type
                renderFormColorOptions(typeHiddenInput, colorOptionsContainer, colorHiddenInput);
                // Render sizes (always the same set, but ensure it's rendered and first one selected)
                renderOptionsAsBoxes(sizeOptionsContainer, sizeHiddenInput, sizesArray, '');
            });

            typeOptionsContainer.appendChild(optionDiv);

            // Automatically select the first option when rendering the type options initially
            if (index === 0) {
                optionDiv.click();
            }
        });
    }

    // --- Add Cutting Logic ---
    addCuttingForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        // Get form values from hidden inputs
        const type = addTypeInput.value;
        const color = addColorInput.value;
        const size = addSizesInput.value;
        const bundles = parseInt(addBundlesInput.value, 10);

        // Basic validation
        if (!type || !size || !color || isNaN(bundles) || bundles <= 0) {
            alert('Please select a Type, Color, Size, and enter a positive number for Bundles.');
            return;
        }

        const stock = getStockData(); // Get current stock
        // Initialize nested objects if they don't exist
        if (!stock[type]) stock[type] = {};
        if (!stock[type][size]) stock[type][size] = {};
        // Add bundles to existing quantity or set new quantity
        stock[type][size][color] = (stock[type][size][color] || 0) + bundles;

        setStockData(stock); // Save updated stock

        alert(`${bundles} bundles of ${color} ${type} (${size}) added to stock successfully.`);
        addCuttingForm.reset(); // Reset form fields
        // After reset, re-render and re-select the first type, which cascades to color and size
        renderKurtiTypeOptions(addTypeOptionsContainer, addTypeInput,
                            addColorOptionsContainer, addColorInput,
                            addSizesOptionsContainer, addSizesInput,
                            kurtiTypes, kurtiColors, kurtiSizes);
        updateHomePage(); // Refresh home page dashboard
    });

    // --- Remove Cutting Logic ---
    removeCuttingForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        // Get form values from hidden inputs
        const type = removeTypeInput.value;
        const color = removeColorInput.value;
        const size = removeSizesInput.value;
        const bundlesToRemove = parseInt(removeBundlesInput.value, 10);

        // Basic validation
        if (!type || !size || !color || isNaN(bundlesToRemove) || bundlesToRemove <= 0) {
            alert('Please select a Type, Color, Size, and enter a positive number for Bundles to Remove.');
            return;
        }

        const stock = getStockData(); // Get current stock
        // Get current quantity, default to 0 if item doesn't exist
        const currentQuantity = (stock[type] && stock[type][size] && stock[type][size][color]) || 0;

        // Check if sufficient stock is available for removal
        if (bundlesToRemove > currentQuantity) {
            alert(`Error: Not enough stock. Only ${currentQuantity} bundles of ${color} ${type} (${size}) are available.`);
            return;
        }

        // Update stock quantity
        stock[type][size][color] -= bundlesToRemove;

        // Clean up stock data if quantity becomes zero or less
        if (stock[type][size][color] <= 0) {
            delete stock[type][size][color]; // Remove the color entry
            if (Object.keys(stock[type][size]).length === 0) {
                delete stock[type][size]; // Remove size entry if no colors left
            }
            if (Object.keys(stock[type]).length === 0) {
                delete stock[type]; // Remove type entry if no sizes left
            }
        }

        setStockData(stock); // Save updated stock

        alert(`${bundlesToRemove} bundles of ${color} ${type} (${size}) removed from stock successfully.`);
        removeCuttingForm.reset(); // Reset form fields
        // After reset, re-render and re-select the first type, which cascades to color and size
        renderKurtiTypeOptions(removeTypeOptionsContainer, removeTypeInput,
                            removeColorOptionsContainer, removeColorInput,
                            removeSizesOptionsContainer, removeSizesInput,
                            kurtiTypes, kurtiColors, kurtiSizes);
        updateHomePage(); // Refresh home page dashboard
    });

    // --- Initialize Application ---
    showPage('home-page'); // Start on the home page when the app loads
    updateHomePage(); // Initial population of home page data
});
